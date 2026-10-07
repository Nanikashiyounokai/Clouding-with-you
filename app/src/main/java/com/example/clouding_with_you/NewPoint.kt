package com.example.clouding_with_you

import android.annotation.SuppressLint
import android.content.Context
import android.content.DialogInterface
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Bundle
import android.view.MotionEvent
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import io.realm.Realm
import io.realm.kotlin.createObject
import io.realm.kotlin.where
import kotlin.math.round

@Suppress("DEPRECATION") // overridePendingTransition は API 34 で非推奨だが動作する
class NewPoint : AppCompatActivity() {

    private lateinit var realm: Realm

    //    位置情報を得るための変数
    private lateinit var fusedLocationProviderClient: FusedLocationProviderClient

    // 同じ findViewById を onCreate / fetchLocation / savePoint の 3 箇所で書いていたのでまとめた
    private lateinit var etCityName: EditText
    private lateinit var etLat: EditText
    private lateinit var etLng: EditText
    private var focusView: TextView? = null

    private companion object {
        const val REQUEST_LOCATION_PERMISSION = 101
        const val MAX_POINTS = 10
    }

    //    Activityの生成
    @SuppressLint("VisibleForTests")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_new_point)

        realm = Realm.getDefaultInstance()

//        変数の定義
        etCityName = findViewById(R.id.etCityName)
        etLat = findViewById(R.id.etLat)
        etLng = findViewById(R.id.etLng)
        focusView = findViewById(R.id.focusView)
        val btnMap: Button = findViewById(R.id.btnMap)
        val btnRegister: Button = findViewById(R.id.btnRegister)
        val btnCurrentLocation: Button = findViewById(R.id.btnCurrentLocation)
        val btnhome: ImageButton = findViewById(R.id.homeButtonNewCity)

        //intentされてきた変数の取得
        applyIntentExtras(intent)

//        新規登録ボタンを押した時の処理
        btnRegister.setOnClickListener { validateAndSave() }

//        地図から参照を押した時の処理
        btnMap.setOnClickListener {
            val mapIntent = Intent(this, SearchMap::class.java)
                .putExtra("CITYNAME_KEY", etCityName.text.toString())
            startActivity(mapIntent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

//        現在地を参照するために必要なやつ
        fusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(this)
        btnCurrentLocation.setOnClickListener { fetchLocation() }

//        入力欄からフォーカスが外れたらキーボードをしまう（3 箇所同じだったのでまとめた）
        val hideKeyboardOnFocusLost = View.OnFocusChangeListener { v, hasFocus ->
            if (!hasFocus) {
                val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                imm.hideSoftInputFromWindow(v.windowToken, 0)
            }
        }
        etCityName.onFocusChangeListener = hideKeyboardOnFocusLost
        etLat.onFocusChangeListener = hideKeyboardOnFocusLost
        etLng.onFocusChangeListener = hideKeyboardOnFocusLost

        btnhome.setOnClickListener { backToTitle() }
    }

    // SearchMap から CLEAR_TOP | SINGLE_TOP で戻ってきたときは
    // onCreate ではなくこちらが呼ばれる
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        applyIntentExtras(intent)
    }

    private fun applyIntentExtras(source: Intent) {
        source.getStringExtra("Decision_Lat")?.let { etLat.setText(it) }
        source.getStringExtra("Decision_Lng")?.let { etLng.setText(it) }
        source.getStringExtra("RECITYNAME_KEY")?.let { etCityName.setText(it) }
    }

//    入力内容を確認してから登録する。
//    以前は toDouble() をそのまま呼んでいたので、
//    「あ」や「1.2.3」のような数値でない入力で NumberFormatException になって落ちていた。
    private fun validateAndSave() {
        val name = etCityName.text.toString().trim()
        val latText = etLat.text.toString().trim()
        val lngText = etLng.text.toString().trim()

        if (name.isEmpty() || latText.isEmpty() || lngText.isEmpty()) {
            showAlert("ERROR!!", "全ての項目を入力")
            return
        }

        val lat = latText.toDoubleOrNull()
        if (lat == null || lat <= -90.0 || lat >= 90.0) {
            showAlert("ERROR!!", "緯度は-90度から90度の範囲で入力してください")
            return
        }

        val lng = lngText.toDoubleOrNull()
        if (lng == null || lng <= -180.0 || lng >= 180.0) {
            showAlert("ERROR!!", "経度は-180度から180度の範囲で入力してください")
            return
        }

        savePoint(name, lat, lng)
    }

    //新規地点をDBに登録するための関数
    private fun savePoint(name: String, lat: Double, lng: Double) {
        val count = realm.where<Point>().findAll().size

        if (count >= MAX_POINTS) {
            showNextActionDialog(
                title = "登録できるのは最大で${MAX_POINTS}地点です",
                message = "必要のない登録地点を削除してください"
            )
            return
        }

        realm.executeTransaction { db ->
            val nextId = (db.where<Point>().max("id")?.toLong() ?: 0L) + 1L
            val point = db.createObject<Point>(nextId)
            point.point_name = name
            point.lat = lat
            point.lon = lng
            // 1 件目は自動的に祈願中にする
            point.active = if (count == 0) "True" else "False"
        }

        showNextActionDialog(
            title = "地点登録完了",
            // 以前は setMessage を 2 回呼んでいて、1 つ目が上書きで消えていた
            message = "「登録地点」から祈願中を選択すると曇り状況を通知してくれます"
        )
    }

//    現在地を参照するための関数
    private fun fetchLocation() {
//        スマホの位置情報へアクセスするための権限の確認
        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED &&
            ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION)
            != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(android.Manifest.permission.ACCESS_FINE_LOCATION),
                REQUEST_LOCATION_PERMISSION
            )
            return
        }

        fusedLocationProviderClient.lastLocation.addOnSuccessListener { location ->
            // lastLocation は位置情報がまだ無いと null を返す。
            // 以前は null チェックより先に it.latitude を読んでいたので、
            // 「現在地から参照」で落ちることがあった。
            if (location == null) {
                showAlert("現在地を取得できませんでした", "位置情報をオンにしてしばらく待ってから、もう一度お試しください")
                return@addOnSuccessListener
            }
            etLat.setText(round4(location.latitude).toString(), TextView.BufferType.EDITABLE)
            etLng.setText(round4(location.longitude).toString(), TextView.BufferType.EDITABLE)
        }
    }

    // 小数第 4 位で丸める
    private fun round4(value: Double): Double = round(value * 10000) / 10000

    // 同じ「ダイアログを出してボタンを黒くする」処理が 5 箇所あったのでまとめた
    private fun showAlert(title: String, message: String) {
        val dialog = AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton("OK", null)
            .show()
        dialog.getButton(DialogInterface.BUTTON_POSITIVE).setTextColor(Color.BLACK)
    }

    private fun showNextActionDialog(title: String, message: String) {
        val dialog = AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton("登録地点を見る") { _, _ ->
                startActivity(Intent(this, RegisterCity::class.java))
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                finish()
            }
            .setNegativeButton("タイトルに戻る") { _, _ -> backToTitle() }
            .show()
        dialog.getButton(DialogInterface.BUTTON_POSITIVE).setTextColor(Color.BLACK)
        dialog.getButton(DialogInterface.BUTTON_NEGATIVE).setTextColor(Color.BLACK)
    }

    //    画面のどこかを触ったら入力欄からフォーカスを外してキーボードをしまう
    override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
        // 以前は毎タッチ findViewById していて、View が無いと落ちる書き方だった
        focusView?.requestFocus()
        return super.dispatchTouchEvent(ev)
    }

    override fun onDestroy() {
        realm.close()
        super.onDestroy()
    }

    override fun finish() {
        super.finish()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
}
