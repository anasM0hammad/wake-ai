import { LocalNotifications } from '@capacitor/local-notifications';
import { getNextAlarmDate } from '../../utils/timeUtils';
import { getSettings } from '../storage/settingsStorage';
import {
  isNativeAlarmAvailable,
  scheduleNativeAlarm,
  cancelNativeAlarm
} from './nativeAlarm';

// MUST match AlarmNotificationHelper.FALLBACK_CHANNEL_ID in Java.
// This channel is created natively (with STREAM_ALARM sound + CATEGORY_ALARM)
// in WakeAIAlarmPlugin.schedule() via AlarmNotificationHelper.ensureFallbackChannel().
// Using the fallback channel ensures that even if the app is killed and only
// Capacitor's LocalNotification fires, the notification plays on STREAM_ALARM.
const ALARM_CHANNEL_ID = 'wakeai_alarm_fallback_channel';

let notificationListenerRegistered = false;
let onAlarmTriggerCallback = null;

export async function setupNotificationChannel() {
  // The alarm notification channel is created natively by
  // AlarmNotificationHelper.ensureFallbackChannel() (called from
  // WakeAIAlarmPlugin.schedule()). This ensures the channel uses
  // STREAM_ALARM audio attributes, which Capacitor's JS createChannel
  // API doesn't support. We still call createChannel here as a fallback
  // for the rare case where the native schedule hasn't been called yet.
  try {
    await LocalNotifications.createChannel({
      id: ALARM_CHANNEL_ID,
      name: 'WakeAI Alarm (Fallback)',
      description: 'Backup alarm notification when main service is delayed',
      importance: 5, // Max importance
      visibility: 1, // Public
      // Use resource name WITHOUT extension — Capacitor resolves from res/raw/
      sound: 'gentle',
      vibration: true,
      lights: true,
      lightColor: '#FF0000'
    });
    return true;
  } catch (error) {
    console.error('Failed to create notification channel:', error);
    return false;
  }
}

export function setOnAlarmTrigger(callback) {
  onAlarmTriggerCallback = callback;
}

export async function setupNotificationListeners() {
  if (notificationListenerRegistered) {
    return;
  }

  try {
    // Listen for notification actions (when user taps notification)
    await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      const alarmData = notification.notification.extra;
      if (onAlarmTriggerCallback && alarmData) {
        onAlarmTriggerCallback(alarmData);
      }
    });

    // Listen for notification received (when notification fires)
    await LocalNotifications.addListener('localNotificationReceived', (notification) => {
      const alarmData = notification.extra;
      if (onAlarmTriggerCallback && alarmData) {
        onAlarmTriggerCallback(alarmData);
      }
    });

    notificationListenerRegistered = true;
  } catch (error) {
    console.error('Failed to setup notification listeners:', error);
  }
}

export async function removeNotificationListeners() {
  try {
    await LocalNotifications.removeAllListeners();
    notificationListenerRegistered = false;
  } catch (error) {
    console.error('Failed to remove notification listeners:', error);
  }
}

export async function scheduleAlarm(alarm) {
  if (!alarm || !alarm.id || !alarm.time) {
    console.error('Invalid alarm data');
    return false;
  }

  try {
    // Cancel any existing alarm first
    await cancelAlarm(alarm.id);

    const alarmDate = getNextAlarmDate(alarm.time, alarm.lastFiredDate || null);
    const triggerAt = alarmDate.getTime();

    // Get user's selected tone from settings (default to 'gentle')
    const settings = getSettings();
    const toneName = settings.alarmTone || 'gentle';

    // On Android: schedule native AlarmManager as the PRIMARY path.
    // This is Doze-exempt, survives app kill, plays audio on STREAM_ALARM.
    // Wrapped in its own try/catch so failure doesn't block the backup path.
    if (isNativeAlarmAvailable()) {
      try {
        await scheduleNativeAlarm({
          alarmId: alarm.id,
          time: alarm.time,
          tone: toneName,
          vibration: settings.vibrationEnabled !== false,
          triggerAt
        });
        console.log('[AlarmScheduler] Native alarm scheduled for', alarmDate.toLocaleString());
      } catch (nativeErr) {
        console.error('[AlarmScheduler] Native alarm scheduling failed:', nativeErr);
      }
    }

    // ALWAYS schedule LocalNotifications as backup — even on Android.
    // If native fires first the notification is harmless. If native fails,
    // this + the JS timer (AlarmMonitor) are the safety net.
    const notificationId = hashStringToInt(alarm.id);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: 'WakeAI Alarm',
          body: `Time to wake up! (${alarm.time})`,
          schedule: {
            at: alarmDate,
            allowWhileIdle: true
          },
          channelId: ALARM_CHANNEL_ID,
          // Sound is null — AlarmService handles audio on STREAM_ALARM.
          // Capacitor expects resource name without extension (e.g. "gentle"),
          // but we intentionally set null because the native service manages audio.
          sound: null,
          actionTypeId: 'ALARM_ACTION',
          extra: {
            alarmId: alarm.id,
            time: alarm.time,
            difficulty: alarm.difficulty,
            tone: toneName,
            vibration: settings.vibrationEnabled !== false,
            type: 'alarm'
          },
          ongoing: true,
          autoCancel: false
        }
      ]
    });

    console.log('[AlarmScheduler] Notification backup scheduled for', alarmDate.toLocaleString());
    return true;
  } catch (error) {
    console.error('Failed to schedule alarm:', error);
    return false;
  }
}

export async function cancelAlarm(alarmId) {
  if (!alarmId) {
    return false;
  }

  // Cancel each path independently — one failing must not block the other
  try {
    await cancelNativeAlarm();
  } catch (err) {
    console.warn('Failed to cancel native alarm:', err);
  }

  try {
    const notificationId = hashStringToInt(alarmId);
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }]
    });
  } catch (err) {
    console.warn('Failed to cancel notification:', err);
  }

  return true;
}

export async function getScheduledAlarms() {
  try {
    const pending = await LocalNotifications.getPending();
    return pending.notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      scheduledAt: notification.schedule?.at,
      extra: notification.extra
    }));
  } catch (error) {
    console.error('Failed to get scheduled alarms:', error);
    return [];
  }
}

// Convert string ID to integer for notification ID
function hashStringToInt(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash | 0; // Convert to 32-bit signed integer
  }
  // Ensure positive non-zero value for notification ID
  const result = Math.abs(hash);
  return result === 0 ? 1 : result;
}

export default {
  setupNotificationChannel,
  setupNotificationListeners,
  removeNotificationListeners,
  setOnAlarmTrigger,
  scheduleAlarm,
  cancelAlarm,
  getScheduledAlarms
};
