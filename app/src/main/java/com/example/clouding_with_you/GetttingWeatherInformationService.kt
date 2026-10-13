package com.example.clouding_with_you

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.PendingIntent.FLAG_IMMUTABLE
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
import android.media.AudioAttributes
import android.net.Uri
import android.os.IBinder
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import io.realm.Realm
import io.realm.kotlin.where
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONException
import org.json.JSONObject
import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.net.URL
import java.util.Timer
import java.util.TimerTask
import kotlin.concurrent.schedule

//アプリを落としても表示画面外で動き続けるための処理（フォアグラウンド処理）
@Suppress("NAME_SHADOWING")
class GetttingWeatherInformationService : Service() {

    //    onStartCommand は START_STICKY やアプリ起動のたびに何度でも呼ばれる。
    //    Timer を毎回作ると通知が多重に飛ぶので、1本だけ持って作り直す。
    private var notificationTimer: Timer? = null

    //    サービスが死んだら通信も止まるようにする
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    //    クラス内に作成されるSingletonがcompanion object
//    クラス内のインスタンスがただ1つだけ存在する状態にしたいのがSingleton
//    つまりここで何をやってるかはよくわからない
    companion object {
        const val CHANNEL_ID = "1111"

        // 曇り通知は常に同じ ID で上書きする（通知欄を埋め尽くさないため）
        private const val NOTIFY_ID_CLOUDING = 3333
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
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {

        //1．常時通知されている通知領域をタップした時に戻ってくる先のActivity
        val openIntent = Intent(this, MainActivity::class.java).let {
            PendingIntent.getActivity(this, 0, it, FLAG_IMMUTABLE)
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
        val sendPendingIntent = PendingIntent.getBroadcast(this, 0, sendIntent, FLAG_IMMUTABLE)

        // Realm は開いたら必ず閉じる。以前はここと Timer の中で開きっぱなしだった
        val message: String = Realm.getDefaultInstance().use { realm ->
            val point = realm.where<Point>().equalTo("active", "True").findFirst()
            if (point != null) "${point.point_name}で祈願中" else "地点登録をしてください。"
        }

        //4．通知の作成（ここでPendingIntentを通知領域に渡す）
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.notification_icon)
            .setContentTitle(message)
            .setContentText("この通知をタップしてアプリを起動")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(openIntent)
            // このボタンの行き先は GetttingWeatherInformationReceiver で、中身はサービスの停止。
            // 以前は「アプリ起動」と書いてあり、押すとアプリが開かずに見張りだけ止まっていた。
            // アプリを開くのは通知本体のタップ（setContentIntent）で足りるので、ボタンは実際の動作に合わせる。
            .addAction(R.drawable.notification_icon, "観測を停止", sendPendingIntent)
            .build()

        //5．フォアグラウンド開始。
        startForeground(2222, notification, FOREGROUND_SERVICE_TYPE_DATA_SYNC)

//        データベースから緯度経度参照
//        緯度経度を入力として曇を通知

//    繰り返し通知するための時間設定（現在はServiceが開始してから30分ごと）
        val notificationInterval: TimerTask.() -> Unit = {
            // Timer は別スレッドなので Realm もこのスレッドで開き直す必要がある。
            // 以前は毎回開くだけで閉じていなかった
            val activeId: Long? = Realm.getDefaultInstance().use { realm ->
                realm.where<Point>().equalTo("active", "True").findFirst()?.id
            }
            if (activeId != null) {
                gettingWeatherInformation(activeId)
            }
        }

        //Timer().schedule(0, 1800000, notificationInterval)
        //    前回の Timer が生きていれば必ず止めてから張り直す
        notificationTimer?.cancel()
        notificationTimer = Timer().apply { schedule(0, 600000, notificationInterval) }

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

    //    Android 15 以降、dataSync のフォアグラウンドサービスは 24 時間あたり計 6 時間で
    //    タイムアウトする。ここで自分から止めないと ANR / 強制終了になる。
    override fun onTimeout(startId: Int) {
        stopSelf()
    }

//    各ライフサイクル内で使う関数の定義

    //    APIキーを含むURLを入力して天気の情報を受け取る関数
    private fun gettingWeatherInformation(id: Long) {
        // 地点が削除された直後などは null になる。
        // 以前はそのまま進んで "null".toDouble() で NumberFormatException になっていた
        val snapshot = Realm.getDefaultInstance().use { realm ->
            realm.where<Point>().equalTo("id", id).findFirst()
                // Double をわざわざ文字列にしてから戻していたので、そのまま使う
                ?.let { Triple(it.point_name, it.lat, it.lon) }
        } ?: return
        val (city_name, lat, lon) = snapshot
//    APIキーを含むURLの定義
        val apiKey = "f88bde919fb0a4b898de3a29d6f0c421"
        val mapDisplay = "lat=${lat}&lon=${lon}"
        val weatherUrl = "https://api.openweathermap.org/data/3.0/onecall?$mapDisplay&units=metric&lang=ja&appid=$apiKey"
        //val mainURL = "https://api.openweathermap.org/data/2.5/weather?lang=ja"
        //val weatherUrl = "$mainURL&q=tokyo&appid=$apiKey"

//    最終的なURLの全貌
//    https://api.openweathermap.org/data/2.5/onecall?lat=30.489772&lon=-99.771335&units=metric&lang=ja&appid=f88bde919fb0a4b898de3a29d6f0c421

//    weatherTask関数にURLを入力(さらに、ポイント名も渡す)
        weatherTask(weatherUrl, city_name)
    }

    //    URLの検索及び、検索した結果の処理の関数（コルーチンを始める）
    //    GlobalScope だとサービスを止めても通信が走り続けるので、
    //    サービスと寿命を合わせたスコープを使う（onDestroy で cancel）
    private fun weatherTask(weatherUrl: String, city_name: String) {
        serviceScope.launch {

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
    private fun weatherJsonTask(result: String, city_name: String) {

        // 通信に失敗すると空文字が返ってくる。
        // 以前はそのまま JSONObject("") に渡していて JSONException で落ちていた。
        // API がエラーを返したとき（キー切れ・プラン外など）も同じ経路で落ちる。
        val cloudingRate: Double = try {
            val jsonObj = JSONObject(result)

            //現在の雲量を取得
            val weatherNowJSONObject = jsonObj.getJSONObject("current")
            val nowClouds = weatherNowJSONObject.getInt("clouds")

            //未来の雲量を取得
            val weatherFutureJSONArray = jsonObj.getJSONArray("hourly")
            val weatherFutureJSONObject = weatherFutureJSONArray.getJSONObject(1)
            val futureClouds = weatherFutureJSONObject.getInt("clouds")

            //何分後かを計算
            val minute = (weatherFutureJSONObject.getInt("dt") - weatherNowJSONObject.getInt("dt")) / 60
            if (minute == 0) return
            //曇り率計算（全て少数型で計算）
            (futureClouds - nowClouds).toDouble() / minute
        } catch (e: JSONException) {
            e.printStackTrace()
            return
        }

        if (cloudingRate < 0.3) return

//    通知をするための準備
        val notifyChannelId = "channel_id"

//    APIレベルに応じた通知チャンネルの作成
        val audioAttributes2 = AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
            .build()
        val uri2 = Uri.parse("android.resource://$packageName/${R.raw.notification_sound}")
        val channel = NotificationChannel(
            notifyChannelId, "雲量通知", NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "雲量の通知"
            setSound(uri2, audioAttributes2)
        }
        /// チャネルを登録
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.createNotificationChannel(channel)

//    天気の通知をタップした時に画面遷移するための準備
        val openIntent = Intent(this, MainActivity::class.java).let {
            PendingIntent.getActivity(this, 0, it, FLAG_IMMUTABLE)
        }

//    天気の通知の詳細をみるために"RegisterCity"に画面遷移するための準備（よくわからない、未実装）
//        val activityIntent = Intent(this, RegisterCity::class.java).apply {
//            action = Intent.ACTION_SEND
//        }
//        val RegisterCityIntent = PendingIntent.getBroadcast(this, 0, activityIntent, 0)

//    通知の詳細
        val builder = NotificationCompat.Builder(this, notifyChannelId)
            .setSmallIcon(R.drawable.notification_icon)  /// 表示されるアイコン
            .setContentTitle("${city_name}の上空")                     /// 通知タイトル（仮に東京を代入）
            .setContentText("ねぇ、今から曇るよ")  /// 通知コンテンツ
            //.setContentText("テスト,${cloudingRate},${nowClouds},${futureClouds}")  /// 通知コンテンツ
            //.setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_MAX)    /// 通知の優先度
            .setContentIntent(openIntent)                    /// 天気の通知をタップした時に画面遷移
//            .addAction(R.drawable.ic_launcher_foreground, "詳細確認", RegisterCityIntent)
        /// この通知にボタンを追加する
//            .setAutoCancel(true)                           /// 何らかで画面遷移した時にこの通知を消す

//    通知のビルド
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            // 通知が許可されていないときは設定画面へ誘導する。
            // Service から startActivity するには FLAG_ACTIVITY_NEW_TASK が必須で、
            // 無いと AndroidRuntimeException で落ちていた。
            if (notificationManager.getNotificationChannel(notifyChannelId)?.importance
                == NotificationManager.IMPORTANCE_NONE
            ) {
                val settingsIntent = Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                    .putExtra(Settings.EXTRA_CHANNEL_ID, notifyChannelId)
                startActivity(settingsIntent)
            }
            return
        }

        // 以前はローカル変数を 0 で作って通知後に +1 していたが、
        // 関数を抜けると消えるので毎回 0 のまま＝通知が毎回上書きされていた
        NotificationManagerCompat.from(this).notify(NOTIFY_ID_CLOUDING, builder.build())
    }

    //    Timer と Realm を後始末する。Timer を止めないと停止後もタイマーが動き続ける
    override fun onDestroy() {
        notificationTimer?.cancel()
        notificationTimer = null
        serviceScope.cancel()
        super.onDestroy()
    }
}