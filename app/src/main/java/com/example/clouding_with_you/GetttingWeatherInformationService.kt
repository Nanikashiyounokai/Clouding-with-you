package com.example.clouding_with_you

import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import kotlinx.coroutines.*
import org.json.JSONException
import org.json.JSONObject
import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.net.URL
import java.util.*
import kotlin.concurrent.schedule

class GetttingWeatherInformationService : Service() {

    companion object {
        const val CHANNEL_ID = "1111"
    }

    override fun onBind(p0: Intent?): IBinder? {
        return null
    }

    @SuppressLint("UnspecifiedImmutableFlag")
    @RequiresApi(Build.VERSION_CODES.O)
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i("Service", "onStartCommand called")

        //1．通知領域タップで戻ってくる先のActivity
        val openIntent = Intent(this, MainActivity::class.java).let {
            PendingIntent.getActivity(this, 0, it, 0)
        }

        //2．通知チャネル登録
        val channelId = CHANNEL_ID
        val channelName = "TestService Channel"
        val channel = NotificationChannel(
            channelId, channelName,
            NotificationManager.IMPORTANCE_DEFAULT
        )
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(channel)

        //3．ブロードキャストレシーバーをPendingIntent化
        val sendIntent = Intent(this, GetttingWeatherInformationReceiver::class.java).apply {
            action = Intent.ACTION_SEND
        }
        val sendPendingIntent = PendingIntent.getBroadcast(this, 0, sendIntent, 0)
        //4．通知の作成（ここでPendingIntentを通知領域に渡す）
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("曇を観測中")
            .setContentText("終了する場合はこちらから行って下さい。")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(openIntent)
            .addAction(R.drawable.ic_launcher_foreground, "実行終了", sendPendingIntent)
            .build()

        //5．フォアグラウンド開始。
        startForeground(2222, notification)

        val notificationInterval: TimerTask.() -> Unit = {
            gettingWeatherInformation()
        }
        Timer().schedule(0, 1800000, notificationInterval)

        return START_STICKY
    }

    override fun stopService(name: Intent?): Boolean {
        return super.stopService(name)
    }

    private fun gettingWeatherInformation() {

//        Howcangのお天気アプリに似た機能を以下に記述
        val apiKey = "f88bde919fb0a4b898de3a29d6f0c421"
        val mainURL = "https://api.openweathermap.org/data/2.5/weather?lang=ja"

        val weatherUrl = "$mainURL&q=tokyo&appid=$apiKey"
        weatherTask(weatherUrl)
    }

    private fun weatherTask(weatherUrl:String) {
        GlobalScope.launch(Dispatchers.Main,CoroutineStart.DEFAULT){
            val result = weatherBackgroundTask(weatherUrl)
            weatherJsonTask(result)
        }
    }

    private suspend fun weatherBackgroundTask(weatherUrl:String):String{
        val response = withContext(Dispatchers.IO){
            var httpResult = ""
            try {
                val urlObj = URL(weatherUrl)
                val br = BufferedReader(InputStreamReader(urlObj.openStream()))
                httpResult = br.readText()

            }catch (e: IOException){
                e.printStackTrace()
            }catch (e: JSONException){
                e.printStackTrace()
            }
            return@withContext httpResult
        }
        return response
    }

    private  fun weatherJsonTask(result:String) {
        val jsonObj = JSONObject(result)

        val weatherJSONArray = jsonObj.getJSONArray("weather")
        val weatherJson = weatherJSONArray.getJSONObject(0)
        val weather = weatherJson.getString("description")

        var notificationId = 0
//                以下通知に関する記述
        val CHANNEL_ID = "channel_id"
        val channel_name = "channel_name"
        val channel_description = "channel_description "

            ///APIレベルに応じてチャネルを作成
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = channel_name
            val descriptionText = channel_description
            val importance = NotificationManager.IMPORTANCE_DEFAULT
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
            }
                /// チャネルを登録
            val notificationManager: NotificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }

            /// 通知の中身
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_background)    /// 表示されるアイコン
            .setContentTitle("東京の上空")                  /// 通知タイトル
            .setContentText("今の天気は${weather}です")           /// 通知コンテンツ
            .setPriority(NotificationCompat.PRIORITY_MAX)   /// 通知の優先度

            /// ボタンを押して通知を表示
        with(NotificationManagerCompat.from(this)) {
            notify(notificationId, builder.build())
            notificationId += 1
        }


//        var notificationId = 0   /// notificationID
//        if(weather == "薄い雲"||
//            weather == "雲"||
//            weather == "曇りがち"||
//            weather == "厚い雲") {
//
//            //        以下通知に関する記述
//            val CHANNEL_ID = "channel_id"
//            val channel_name = "channel_name"
//            val channel_description = "channel_description "
//
//            ///APIレベルに応じてチャネルを作成
//            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//                val name = channel_name
//                val descriptionText = channel_description
//                val importance = NotificationManager.IMPORTANCE_DEFAULT
//                val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
//                    description = descriptionText
//                }
//                /// チャネルを登録
//                val notificationManager: NotificationManager =
//                    getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
//                notificationManager.createNotificationChannel(channel)
//            }
//
//            /// 通知の中身
//            val builder = NotificationCompat.Builder(this, CHANNEL_ID)
//                .setSmallIcon(R.drawable.ic_launcher_background)    /// 表示されるアイコン
//                .setContentTitle("東京の上空")                  /// 通知タイトル
//                .setContentText("今から曇るよ")           /// 通知コンテンツ
//                .setPriority(NotificationCompat.PRIORITY_MAX)   /// 通知の優先度
//
//            /// ボタンを押して通知を表示
//            with(NotificationManagerCompat.from(this)) {
//                notify(notificationId, builder.build())
//                notificationId += 1
//            }
//        }
    }
}
