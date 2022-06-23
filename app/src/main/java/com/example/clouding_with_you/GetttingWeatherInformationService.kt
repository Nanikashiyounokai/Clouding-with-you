package com.example.clouding_with_you

import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.os.IBinder
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import io.realm.Realm
import io.realm.kotlin.where
import kotlinx.coroutines.*
import org.json.JSONException
import org.json.JSONObject
import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.net.URL
import java.util.*
import kotlin.concurrent.schedule
import kotlin.math.roundToInt

//アプリを落としても表示画面外で動き続けるための処理（フォアグラウンド処理）
class GetttingWeatherInformationService : Service() {

    private lateinit var realm: Realm

    //    クラス内に作成されるSingletonがcompanion object
//    クラス内のインスタンスがただ1つだけ存在する状態にしたいのがSingleton
//    つまりここで何をやってるかはよくわからない
    companion object {
        const val CHANNEL_ID = "1111"
    }

    //    他のActivityがサービスにバインドするときにbindService()を呼び出した際の処理
//    この「バインド」ってのはよくわからないが今回は特に必要なさそう、？
//    ただ今回はバインドを許可してないらしい
//    かと言って、下のonBindの部分を削除するとAndroidStudioに怒られます
    override fun onBind(p0: Intent?): IBinder? {
        return null
    }

    //    他のActivityがサービスの開始をリクエストした際の処理
    @SuppressLint("UnspecifiedImmutableFlag")
    @RequiresApi(Build.VERSION_CODES.O)
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {

        //1．常時通知されている通知領域をタップした時に戻ってくる先のActivity
        val openIntent = Intent(this, MainActivity::class.java).let {
            PendingIntent.getActivity(this, 0, it, 0)
        }

        //2．通知チャネル登録
        val channelId = CHANNEL_ID
        val channelName = "TestService Channel"
        val audioAttributes = AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
            .build()
        val uri = Uri.parse("android.resource://$packageName/${R.raw.notification_sound_2}")
        val channel = NotificationChannel(channelId, channelName, NotificationManager.IMPORTANCE_DEFAULT).apply {
            description = "雲の常時観測のお知らせ"
            setSound(uri,audioAttributes)
        }
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(channel)

        //3．ブロードキャストレシーバーをPendingIntent化
//    ブロードキャストとは端末がアプリ向けに発信している様々なメッセージや情報を発信すること
//    ブロードキャストレシーバーとは自分で情報（インテント）を発信（ブロードキャスト）して受信すること
//    PendingIntent化とはintentを予約して指定したタイミングで発行すること
        val sendIntent = Intent(this, GetttingWeatherInformationReceiver::class.java).apply {
            action = Intent.ACTION_SEND
        }
        val sendPendingIntent = PendingIntent.getBroadcast(this, 0, sendIntent, 0)

        //4．通知の作成（ここでPendingIntentを通知領域に渡す）
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.notification_icon)
            .setContentTitle("曇を観測中")
            .setContentText("現在の状況の確認はこの通知をタップ")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(openIntent)
            .addAction(R.drawable.notification_icon, "観測の終了はこちら", sendPendingIntent)
            .build()

        //5．フォアグラウンド開始。
        startForeground(2222, notification)

//        データベースから緯度経度参照
//        緯度経度を入力として曇を通知

//    繰り返し通知するための時間設定（現在はServiceが開始してから30分ごと）
        val notificationInterval: TimerTask.() -> Unit = {
            realm = Realm.getDefaultInstance()
            val points = realm.where<Point>().findAll()
            //DBのpointそれぞれでAPIを叩く
            for(point in points) {
                //APIキーを含むURLを入力して天気の情報を受け取る関数
                val id: Long = point.id
                gettingWeatherInformation(id)
            }
//            APIキーを含むURLを入力して天気の情報を受け取る関数
            //gettingWeatherInformation()
        }
        Timer().schedule(0, 1800000, notificationInterval)

//    システムがサービスを強制終了した場合に、サービスをどのように続行するかを示す
//    これは「強制終了した場合、サービスを再作成しonStartCommand() を呼び出すが、最後のインテントは再配信しない。
//    コマンドは実行しないが、無期限に動作し、ジョブを待機するメディア プレーヤー（または同様のサービス）に適している。」
//    とAndroid デベロッパーが言ってました
        return START_STICKY
    }

    //    サービスの終了（GetttingWeatherInformationReceiver.ktで呼び出してる）
    override fun stopService(name: Intent?): Boolean {
        return super.stopService(name)
    }



//    各ライフサイクル内で使う関数の定義

    //    APIキーを含むURLを入力して天気の情報を受け取る関数
    private fun gettingWeatherInformation(id: Long) {
        val point = realm.where<Point>().equalTo("id", id)?.findFirst()
        val city_name: String = point?.point_name.toString()
//    APIキーを含むURLの定義
        val apiKey = "f88bde919fb0a4b898de3a29d6f0c421"
        //val lon = 139.77 //経度を代入（仮に東京を代入）
        //val lat = 35.68  //緯度を代入（仮に東京を代入）
        val lon: Double = point?.lon.toString().toDouble()
        val lat: Double = point?.lat.toString().toDouble()
        val mapDisplay = "lat=${lat}&lon=${lon}"
        val weatherUrl = "https://api.openweathermap.org/data/2.5/onecall?$mapDisplay&units=metric&lang=ja&appid=$apiKey"
        //val mainURL = "https://api.openweathermap.org/data/2.5/weather?lang=ja"
        //val weatherUrl = "$mainURL&q=tokyo&appid=$apiKey"

//    最終的なURLの全貌
//    https://api.openweathermap.org/data/2.5/onecall?lat=30.489772&lon=-99.771335&units=metric&lang=ja&appid=f88bde919fb0a4b898de3a29d6f0c421

//    weatherTask関数にURLを入力(さらに、ポイント名も渡す)
        weatherTask(weatherUrl, city_name)
    }

    //    URLの検索及び、検索した結果の処理の関数（コルーチンを始める）
    private fun weatherTask(weatherUrl:String, city_name: String) {

        GlobalScope.launch(Dispatchers.Main,CoroutineStart.DEFAULT){

//            入力されたURLの検索
            val result = weatherBackgroundTask(weatherUrl)

//            weatherJsonTask関数で、URLを検索した結果のJSON形式のデータを処理
            weatherJsonTask(result, city_name)
        }
    }

    //    入力されたURLの検索
    private suspend fun weatherBackgroundTask(weatherUrl:String):String{

//        入力されたURLの検索
        val response = withContext(Dispatchers.IO){
            var httpResult = ""

//            とりあえず入力されたURLを検索してみる
            try {
                val urlObj = URL(weatherUrl)
                val br = BufferedReader(InputStreamReader(urlObj.openStream()))
                httpResult = br.readText()

//            検索できなかった時の処理
            }catch (e: IOException){
                e.printStackTrace()
            }catch (e: JSONException){
                e.printStackTrace()
            }

//            "response"に"httpResult"を返す
            return@withContext httpResult
        }

//        "weatherBackgroundTask"の戻り値に"response"(＝"httpResult")を返す
        return response
    }

    //    天気の情報が入ったJSON形式のデータの処理及びその内容を通知する関数
    @SuppressLint("UnspecifiedImmutableFlag")
    private  fun weatherJsonTask(result:String, city_name: String) {

//    変数の定義
        val jsonObj = JSONObject(result)

        //現在の雲量を取得
        val weatherNowJSONObject = jsonObj.getJSONObject("current")
        val nowClouds = weatherNowJSONObject.getInt("clouds")

        //未来の雲量を取得
        val weatherFutureJSONArray = jsonObj.getJSONArray("hourly")
        val weatherFutureJSONObject = weatherFutureJSONArray.getJSONObject(1)
        val futureClouds = weatherFutureJSONObject.getInt("clouds")

        //何分後かを計算
        val nowTime = weatherNowJSONObject.getInt("dt")
        val futureTime = weatherFutureJSONObject.getInt("dt")
        val minute: Int = (futureTime - nowTime) / 60
//    val minute: Int = (50 - 10) / 60

//    JSONデータから"cityName"と"weather"の取り出し
//        val weatherJSONArray = jsonObj.getJSONArray("weather")
//        val weatherJson = weatherJSONArray.getJSONObject(0)
//        val weather = weatherJson.getString("description")
//        val cityName = jsonObj.getString("name")

//        //曇り率計算（全て少数型で計算）
//        val cloudingRate:Double = (futureClouds.toDouble()-nowClouds.toDouble())/minute.toDouble()
//        //曇り率に応じてメッセージを分岐(1.0は仮代入)
//        if (cloudingRate >= 1.0){
//           val message = "ねぇ、今から曇るよ"
//        }else if (nowClouds <= 75){
//           val message = "ねぇ、この空が曇ってほしいと思う？"
//        }else if (nowClouds > 75){
//           val message = "青空よりも俺は曇天がいい！天気なんて曇ったままでいいんだ！"
//        }

//    通知をするための準備
        var notificationId = 0
        val CHANNEL_ID = "channel_id"

//    APIレベルに応じた通知チャンネルの作成（よくわかってない）
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val audioAttributes2 = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                .build()
            val uri2 = Uri.parse("android.resource://$packageName/${R.raw.notification_sound}")
            val importance = NotificationManager.IMPORTANCE_DEFAULT
            val channel = NotificationChannel(CHANNEL_ID, "雲量通知", importance).apply {
                description = "雲量の通知"
                setSound(uri2,audioAttributes2)
            }
            /// チャネルを登録
            val notificationManager: NotificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }

//    天気の通知をタップした時に画面遷移するための準備
        val openIntent = Intent(this, MainActivity::class.java).let {
            PendingIntent.getActivity(this, 0, it, 0)
        }

//    天気の通知の詳細をみるために"RegisterCity"に画面遷移するための準備（よくわからない、未実装）
//        val activityIntent = Intent(this, RegisterCity::class.java).apply {
//            action = Intent.ACTION_SEND
//        }
//        val RegisterCityIntent = PendingIntent.getBroadcast(this, 0, activityIntent, 0)

//    通知の詳細
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.notification_icon)  /// 表示されるアイコン
            .setContentTitle("${city_name}の上空")                     /// 通知タイトル（仮に東京を代入）
            .setContentText("現在の雲量は${nowClouds},${minute}分後の雲量は${futureClouds},")  /// 通知コンテンツ
            //.setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_MAX)    /// 通知の優先度
            .setContentIntent(openIntent)                    /// 天気の通知をタップした時に画面遷移
//            .addAction(R.drawable.ic_launcher_foreground, "詳細確認", RegisterCityIntent)
        /// この通知にボタンを追加する
//            .setAutoCancel(true)                           /// 何らかで画面遷移した時にこの通知を消す

//    通知のビルド
        with(NotificationManagerCompat.from(this)) {
            notify(notificationId, builder.build())
            notificationId += 1
        }


//    以下曇の時に通知が出るように条件分岐した場合のコード

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

        //        val openIntent = Intent(this, MainActivity::class.java).let {
        //            PendingIntent.getActivity(this, 0, it, 0)
        //        }

        //        val activityIntent = Intent(this, RegisterCity::class.java).apply {
        //            action = Intent.ACTION_SEND
        //        }
        //        val RegisterCityIntent = PendingIntent.getBroadcast(this, 0, activityIntent, 0)

//
//            /// 通知の中身
//            val builder = NotificationCompat.Builder(this, CHANNEL_ID)
//                .setSmallIcon(R.drawable.ic_launcher_background)    /// 表示されるアイコン
//                .setContentTitle("東京の上空")                  /// 通知タイトル
//                .setContentText("今から曇るよ")           /// 通知コンテンツ
//                .setPriority(NotificationCompat.PRIORITY_MAX)   /// 通知の優先度
//                .setContentIntent(openIntent)
//                .addAction(R.drawable.ic_launcher_foreground, "詳細確認", RegisterCityIntent)
//                 .setAutoCancel(true)
//
//            /// ボタンを押して通知を表示
//            with(NotificationManagerCompat.from(this)) {
//                notify(notificationId, builder.build())
//                notificationId += 1
//            }
//        }

    }
    override fun onDestroy() {
        super.onDestroy()
        realm.close()
    }
}