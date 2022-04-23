package com.example.clouding_with_you

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class GetttingWeatherInformationReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val targetIntent = Intent(context, GetttingWeatherInformationService::class.java)
        context.stopService(targetIntent)
    }
}