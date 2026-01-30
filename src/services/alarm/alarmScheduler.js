import { LocalNotifications } from '@capacitor/local-notifications';
import { getNextAlarmDate } from '../../utils/timeUtils';
import { SNOOZE_DURATION_MINUTES } from '../../utils/constants';

const ALARM_CHANNEL_ID = 'wakeai-alarm-channel';
const ALARM_CHANNEL_NAME = 'WakeAI Alarms';

let notificationListenerRegistered = false;
let onAlarmTriggerCallback = null;

export async function setupNotificationChannel() {
  try {
    await LocalNotifications.createChannel({
      id: ALARM_CHANNEL_ID,
      name: ALARM_CHANNEL_NAME,
      description: 'Alarm notifications for WakeAI',
      importance: 5, // Max importance
      visibility: 1, // Public
      sound: 'alarm_sound.wav',
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

export async function scheduleAlarm(alarm) {
  if (!alarm || !alarm.id || !alarm.time) {
    console.error('Invalid alarm data');
    return false;
  }

  try {
    // Cancel any existing notification for this alarm
    await cancelAlarm(alarm.id);

    const alarmDate = getNextAlarmDate(alarm.time, alarm.days || []);
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
          sound: 'alarm_sound.wav',
          actionTypeId: 'ALARM_ACTION',
          extra: {
            alarmId: alarm.id,
            time: alarm.time,
            difficulty: alarm.difficulty,
            type: 'alarm'
          },
          ongoing: true,
          autoCancel: false
        }
      ]
    });

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

  try {
    const notificationId = hashStringToInt(alarmId);
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }]
    });
    return true;
  } catch (error) {
    console.error('Failed to cancel alarm:', error);
    return false;
  }
}

export async function rescheduleAllAlarms(alarms) {
  try {
    // Cancel all existing notifications
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map(n => ({ id: n.id }))
      });
    }

    // Schedule enabled alarms
    const enabledAlarms = alarms.filter(alarm => alarm.enabled);
    const results = await Promise.all(
      enabledAlarms.map(alarm => scheduleAlarm(alarm))
    );

    return results.every(result => result);
  } catch (error) {
    console.error('Failed to reschedule alarms:', error);
    return false;
  }
}

export async function scheduleSnooze(originalAlarmId, minutes = SNOOZE_DURATION_MINUTES) {
  try {
    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000);
    const snoozeId = hashStringToInt(`snooze-${originalAlarmId}-${Date.now()}`);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: snoozeId,
          title: 'WakeAI - Snooze Ended',
          body: 'Time to wake up! Your snooze is over.',
          schedule: {
            at: snoozeTime,
            allowWhileIdle: true
          },
          channelId: ALARM_CHANNEL_ID,
          sound: 'alarm_sound.wav',
          extra: {
            alarmId: originalAlarmId,
            type: 'snooze'
          },
          ongoing: true,
          autoCancel: false
        }
      ]
    });

    return { success: true, snoozeTime };
  } catch (error) {
    console.error('Failed to schedule snooze:', error);
    return { success: false, error: error.message };
  }
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

export async function cancelAllSnoozes() {
  try {
    const pending = await LocalNotifications.getPending();
    const snoozeNotifications = pending.notifications.filter(
      n => n.extra?.type === 'snooze'
    );

    if (snoozeNotifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: snoozeNotifications.map(n => ({ id: n.id }))
      });
    }
    return true;
  } catch (error) {
    console.error('Failed to cancel snoozes:', error);
    return false;
  }
}

// Convert string ID to integer for notification ID
function hashStringToInt(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export default {
  setupNotificationChannel,
  setupNotificationListeners,
  setOnAlarmTrigger,
  scheduleAlarm,
  cancelAlarm,
  rescheduleAllAlarms,
  scheduleSnooze,
  getScheduledAlarms,
  cancelAllSnoozes
};
