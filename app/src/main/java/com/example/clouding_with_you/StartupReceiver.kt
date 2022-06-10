package com.example.clouding_with_you

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.annotation.RequiresApi

class StartupReceiver : BroadcastReceiver() {
    @RequiresApi(Build.VERSION_CODES.O)
    override fun onReceive(context: Context?, intent: Intent?) {
        // 端末起動時にServiceを起動
        Intent(context, GetttingWeatherInformationService::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context?.startForegroundService(this)
        }
    }
}