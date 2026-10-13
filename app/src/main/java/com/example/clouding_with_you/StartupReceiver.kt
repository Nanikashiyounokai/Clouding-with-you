package com.example.clouding_with_you

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class StartupReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        intent?.let {
            if (it.action == Intent.ACTION_BOOT_COMPLETED) {
                // Android 15 以降、BOOT_COMPLETED から dataSync のフォアグラウンドサービスを
                // 起動することは禁止され、ForegroundServiceStartNotAllowedException になる。
                // 再起動のたびにクラッシュとして記録されるので、受け止めて何もしない。
                // （見張りは次にアプリを開いたときに再開する）
                try {
                    context?.startForegroundService(
                        Intent(context, GetttingWeatherInformationService::class.java)
                    )
                } catch (e: IllegalStateException) {
                    e.printStackTrace()
                }
            }
        }
    }
}
