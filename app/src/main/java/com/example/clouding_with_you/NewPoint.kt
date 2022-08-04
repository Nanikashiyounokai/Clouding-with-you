package com.example.clouding_with_you

import android.annotation.SuppressLint
import android.content.Context
import android.content.DialogInterface
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Bundle
import android.view.MotionEvent
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import com.example.clouding_with_you.databinding.ActivityNewPointBinding
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import io.realm.Realm
import io.realm.kotlin.where
import io.realm.kotlin.createObject

class NewPoint : AppCompatActivity() {

//    lateinit var mAdView : AdView

    //変数の取得は「binding」を用いる(浦部)
    private var _binding: ActivityNewPointBinding? = null
    private val binding get() = _binding!!

    private lateinit var realm: Realm

//    位置情報を得るための変数
    private lateinit var fusedLocationProviderClient: FusedLocationProviderClient
//    全体で使う変数の定義
//    private val etCityName : EditText = findViewById(R.id.etCityName)
//    private val etLat : EditText = findViewById(R.id.etLat)
//    private val etLng : EditText = findViewById(R.id.etLng)

    //    Activityの生成
    @SuppressLint("VisibleForTests")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_new_point)

        realm = Realm.getDefaultInstance()

//        MobileAds.initialize(this) {}

        //mAdView = findViewById(R.id.adView)
        //val adRequest = AdRequest.Builder().build()
        //mAdView.loadAd(adRequest)

        //intentされてきた変数の所得
        val decisionLng = intent.getStringExtra("Decision_Lng")
        val decisionLat = intent.getStringExtra("Decision_Lat")
        val reCityName = intent.getStringExtra("RECITYNAME_KEY")

//        変数の定義
        val etCityName : EditText = findViewById(R.id.etCityName)
        val etLat : EditText = findViewById(R.id.etLat)
        val etLng : EditText = findViewById(R.id.etLng)
        val btnMap : Button = findViewById(R.id.btnMap)
        val btnRegister : Button = findViewById(R.id.btnRegister)
        val btnCurrentLocation : Button = findViewById(R.id.btnCurrentLocation)
        val btnhome : ImageButton = findViewById(R.id.homeButtonNewCity)

        if(decisionLng != null && decisionLat != null){
            etLat.setText(decisionLat)
            etLng.setText(decisionLng)
        }
        if(reCityName != null ){
            etCityName.setText(reCityName)
        }

//        新規登録ボタンを押した時の処理
        btnRegister.setOnClickListener {

//            新規地点登録を押せるかどうか、入力状況から条件分岐
            if (etCityName.text.toString() == "" || etLat.text.toString() == "" || etLng.text.toString() == ""){

//                全てが入力されていない場合の表示
                val alertDialog1 = AlertDialog.Builder(this)
                    .setTitle("ERROR!!")
                    .setMessage("全ての項目を入力")
                    .setPositiveButton("OK",null)
                    .show()


                // OKボタンのインスタンスを取得する
                val positiveButton = alertDialog1.getButton(DialogInterface.BUTTON_POSITIVE)
                // OKボタンの色を変更する
                positiveButton.setTextColor(Color.BLACK)

            }else{

//                緯度の範囲を確認
                if(etLat.text.toString().toDouble() <= -90.0 || 90.0 <= etLat.text.toString().toDouble()){

//                    緯度が不適切な値の時の表示
                    val alertDialog2 = AlertDialog.Builder(this)
                        .setTitle("ERROR!!")
                        .setMessage("緯度は-90度から90度の範囲で入力してください")
                        .setPositiveButton("OK",null)
                        .show()

                    // OKボタンのインスタンスを取得する
                    val positiveButton = alertDialog2.getButton(DialogInterface.BUTTON_POSITIVE)
                    // OKボタンの色を変更する
                    positiveButton.setTextColor(Color.BLACK)

                }else{
//                    経度の範囲の確認
                    if(etLng.text.toString().toDouble() <= -180.0 || 180.0 <= etLng.text.toString().toDouble()){

//                    経度が不適切な値の時の表示
                        val alertDialog3 = AlertDialog.Builder(this)
                            .setTitle("ERROR!!")
                            .setMessage("経度は-180度から180度の範囲で入力してください")
                            .setPositiveButton("OK",null)
                            .show()

                        // OKボタンのインスタンスを取得する
                        val positiveButton = alertDialog3.getButton(DialogInterface.BUTTON_POSITIVE)
                        // OKボタンの色を変更する
                        positiveButton.setTextColor(Color.BLACK)

                    }else{
                        //ここからDB登録
                        // 「新規地点登録ボタン」が押されたら、「savePoint」メソッドを実行
                        savePoint()
                    }
                }
            }
        }

//        地図から参照を押した他時の処理
        btnMap.setOnClickListener {

//            "SearchMap.kt"への画面遷移
            val intent = Intent(this, SearchMap::class.java)

            //textは受け渡す変数
            val text = etCityName.text.toString()
            //intent変数をつなげる(第一引数はキー，第二引数は渡したい変数)

            intent.putExtra("CITYNAME_KEY",text)
            startActivity(intent)

            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

//        現在地を参照するために必要なやつ（権限ではない、よくわからない）
        fusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(this)

//        現在地を参照を押した時
        btnCurrentLocation.setOnClickListener {

//            fetchLocation関数の実行
            fetchLocation()
        }

//        入力中にキーボードをしまいたい（よくわからん、未完）
        etCityName.setOnFocusChangeListener { v, hasFocus ->
            if (!hasFocus) {
                val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                imm.hideSoftInputFromWindow(v.windowToken, 0)
            }
        }
        etLat.setOnFocusChangeListener { v, hasFocus ->
            if (!hasFocus) {
                val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                imm.hideSoftInputFromWindow(v.windowToken, 0)
            }
        }
        etLng.setOnFocusChangeListener { v, hasFocus ->
            if (!hasFocus) {
                val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
                imm.hideSoftInputFromWindow(v.windowToken, 0)
            }
        }

        btnhome.setOnClickListener {
            intent = Intent(this, MainActivity::class.java)
            startActivity(intent)
            finish()
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }
    }

//    現在地を参照するための関数
    private fun fetchLocation() {
        val task = fusedLocationProviderClient.lastLocation

//    「現在地から参照」 を押した時に出る不具合が改善できそうなコード
//        if (task == null){
//            fusedLocationProviderClient.requestLocationUpdates(
//                locationRequest,
//                locationCallback,
//                Looper.getMainLooper())
//        }

//        スマホへの位置情報へアクセスするための権限の確認
        if(ActivityCompat.checkSelfPermission(this,android.Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED && ActivityCompat
                .checkSelfPermission(this,android.Manifest.permission.ACCESS_COARSE_LOCATION)
            != PackageManager.PERMISSION_GRANTED
        ){
            ActivityCompat.requestPermissions(this, arrayOf(android.Manifest.permission.ACCESS_FINE_LOCATION),101)
            return
        }



//        緯度と経度の呼び出し及び入力
        task.addOnSuccessListener {

//            変数の定義
            val etLat : EditText = findViewById(R.id.etLat)
            val etLng : EditText = findViewById(R.id.etLng)

            val inputLat = (Math.round(it.latitude  * 10000)).toDouble()/10000
            val inputLng = (Math.round(it.longitude * 10000)).toDouble()/10000

//            経緯のEditTextに入力
            if(it !=null){
                etLat.setText(inputLat.toString(), TextView.BufferType.EDITABLE)
                etLng.setText(inputLng.toString(), TextView.BufferType.EDITABLE)
            }
        }
    }

    //新規地点をDBに登録するための関数
    private fun savePoint() {
        val etCityName : EditText = findViewById(R.id.etCityName)
        val etLat : EditText = findViewById(R.id.etLat)
        val etLng : EditText = findViewById(R.id.etLng)
        val count:Int = realm.where<Point>().findAll().size
        if(count == 10){
            val alertDialog4 = AlertDialog.Builder(this)
                .setTitle("登録できるのは最大で10地点です")
                .setMessage("必要のない登録地点を削除してください")
//                                「登録地点を見る」を押した時の処理
                .setPositiveButton("登録地点を見る") { _, _ ->

//                                "RegisterCity.kt"への画面遷移
                    val intent = Intent(this, RegisterCity::class.java)
                    startActivity(intent)
                    overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                    finish()
                }
//                                「タイトルに戻る」を押した時の処理
                .setNegativeButton("タイトルに戻る"){ _, _ ->

//                                "MainActivity.kt"への画面遷移
                    val intent = Intent(this, MainActivity::class.java)

//                                 今はないけど、データベースにも入力内容は送信したい
                    startActivity(intent)
                    overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                    finish()
                }
                .show()

            // OKボタンのインスタンスを取得する
            val positiveButton = alertDialog4.getButton(DialogInterface.BUTTON_POSITIVE)
            // OKボタンの色を変更する
            positiveButton.setTextColor(Color.BLACK)

            // OKボタンのインスタンスを取得する
            val negativeButton = alertDialog4.getButton(DialogInterface.BUTTON_NEGATIVE)
            // OKボタンの色を変更する
            negativeButton.setTextColor(Color.BLACK)

        }else{
            realm.executeTransaction {
                //                db: Realm ->
                val maxId = realm.where<Point>().max("id")
                val nextId = (maxId?.toLong() ?: 0L) + 1L
                val point = realm.createObject<Point>(nextId)
                point.point_name = etCityName.text.toString()
                point.lon = etLng.text.toString().toDouble()
                point.lat = etLat.text.toString().toDouble()
                if(count == 0){
                    point.active = "True"
                }else{
                    point.active = "False"
                }
            }

            val alertDialog4 = AlertDialog.Builder(this)
                .setTitle("地点登録完了")
                .setMessage("新規地点登録が完了しました")
                .setMessage("「登録地点」から祈願中を選択すると曇り状況を通知してくれます")
//                                「登録地点を見る」を押した時の処理
                .setPositiveButton("登録地点を見る") { _, _ ->

//                                "RegisterCity.kt"への画面遷移
                    val intent = Intent(this, RegisterCity::class.java)

                    startActivity(intent)
                    overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                    finish()
                }
//                                「タイトルに戻る」を押した時の処理
                .setNegativeButton("タイトルに戻る"){ _, _ ->

//                                "MainActivity.kt"への画面遷移
                    val intent = Intent(this, MainActivity::class.java)

//                                 今はないけど、データベースにも入力内容は送信したい
                    startActivity(intent)
                    overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                    finish()
                }
                .show()

            // OKボタンのインスタンスを取得する
            val positiveButton = alertDialog4.getButton(DialogInterface.BUTTON_POSITIVE)
            // OKボタンの色を変更する
            positiveButton.setTextColor(Color.BLACK)

            // OKボタンのインスタンスを取得する
            val negativeButton = alertDialog4.getButton(DialogInterface.BUTTON_NEGATIVE)
            // OKボタンの色を変更する
            negativeButton.setTextColor(Color.BLACK)
        }

    }

    //    キーボードをしまうための関数（よくわからん、未完）
    override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
        val focusView : TextView = findViewById(R.id.focusView)
        focusView.requestFocus()
        return super.dispatchTouchEvent(ev)
    }

    override fun onDestroy() {
        super.onDestroy()
        realm.close()
    }

    override fun finish() {
        super.finish()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }

}