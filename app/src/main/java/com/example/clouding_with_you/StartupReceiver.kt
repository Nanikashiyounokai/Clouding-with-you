package com.example.clouding_with_you

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class StartupReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        intent?.let {
            if (it.action == Intent.ACTION_BOOT_COMPLETED) {
                Intent(context, GetttingWeatherInformationService::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    context?.startForegroundService(this)
                }
            }
        }
    }
}
