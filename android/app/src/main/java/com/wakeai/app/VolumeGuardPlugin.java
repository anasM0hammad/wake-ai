package com.wakeai.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Simple Capacitor plugin that locks/unlocks volume button interception.
 * When locked, physical volume buttons are blocked so users cannot
 * mute the alarm.
 */
@CapacitorPlugin(name = "VolumeGuard")
public class VolumeGuardPlugin extends Plugin {

    /** Static flag read by MainActivity.dispatchKeyEvent() */
    static volatile boolean locked = false;

    @PluginMethod()
    public void lock(PluginCall call) {
        locked = true;
        call.resolve();
    }

    @PluginMethod()
    public void unlock(PluginCall call) {
        locked = false;
        call.resolve();
    }
}
