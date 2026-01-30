import { useState, useEffect } from 'react';
import {
  checkNotificationPermission,
  requestNotificationPermission
} from '../../utils/permissions';

export default function PermissionRequest({ onNext, onBack }) {
  const [permissionStatus, setPermissionStatus] = useState('checking');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const status = await checkNotificationPermission();
    setPermissionStatus(status);
  };

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    const result = await requestNotificationPermission();
    setPermissionStatus(result);
    setIsRequesting(false);
  };

  const openSettings = () => {
    // On native, this would open app settings
    // For web, we show instructions
    window.open('app-settings://notification/com.wakeai.app', '_blank');
  };

  const isGranted = permissionStatus === 'granted';
  const isDenied = permissionStatus === 'denied';

  return (
    <div className="flex flex-col min-h-full px-6 py-8">
      <div className="flex-1">
        <div className="mb-8 text-center">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
            isGranted ? 'bg-green-100' : isDenied ? 'bg-red-100' : 'bg-indigo-100'
          }`}>
            {isGranted ? (
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : isDenied ? (
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {isGranted ? 'Notifications Enabled!' : 'Enable Notifications'}
          </h2>

          {isGranted ? (
            <p className="text-gray-600 max-w-sm mx-auto">
              Your alarms will ring even when the app is in the background.
            </p>
          ) : isDenied ? (
            <p className="text-gray-600 max-w-sm mx-auto">
              Notifications are blocked. You'll need to enable them in your device settings for alarms to work properly.
            </p>
          ) : (
            <p className="text-gray-600 max-w-sm mx-auto">
              WakeAI needs notification permission to wake you up, even when your phone is locked.
            </p>
          )}
        </div>

        {!isGranted && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="font-semibold text-amber-800 mb-1">Why is this important?</h4>
                <p className="text-sm text-amber-700">
                  Without notifications, your alarm won't sound when your screen is off. This is essential for the app to work.
                </p>
              </div>
            </div>
          </div>
        )}

        {isDenied && (
          <button
            onClick={openSettings}
            className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Open Settings
          </button>
        )}
      </div>

      <div className="space-y-3 pt-6">
        {!isGranted && !isDenied && (
          <button
            onClick={handleRequestPermission}
            disabled={isRequesting || permissionStatus === 'checking'}
            className="w-full py-4 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting ? 'Requesting...' : 'Allow Notifications'}
          </button>
        )}

        {isGranted && (
          <button
            onClick={onNext}
            className="w-full py-4 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
          >
            Continue
          </button>
        )}

        {isDenied && (
          <button
            onClick={onNext}
            className="w-full py-4 px-6 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
          >
            Continue Anyway
          </button>
        )}

        <button
          onClick={onBack}
          className="w-full py-3 px-6 text-gray-600 font-medium hover:text-gray-900 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );
}
