package com.example.clouding_with_you

import android.content.Intent
import android.media.MediaPlayer
import android.os.Build
import android.os.Bundle
import android.widget.ImageButton
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity


class MainActivity : AppCompatActivity() {

//    lateinit var mAdView : AdView
    private lateinit var mp:MediaPlayer

//    Activityの生成
    @RequiresApi(Build.VERSION_CODES.O)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

//        MobileAds.initialize(this) {}
//
//        mAdView = findViewById(R.id.adView)
//        val adRequest = AdRequest.Builder().build()
//        mAdView.loadAd(adRequest)


//    変数宣言
        val btnNewPoint : ImageButton = findViewById(R.id.btnNewPoint)
        val btnCity : ImageButton = findViewById(R.id.btnCity)
        val btnDetail : ImageButton = findViewById(R.id.btnDetail)

    //    グランドエスケープっぽい曲を流す
        mp = MediaPlayer.create(this,R.raw.grand_escapo2)
        mp.isLooping = true
        mp.start()

//    「新規地点登録」を押した時
        btnNewPoint.setOnClickListener {

//          "NewPoint.kt"に画面遷移
            intent = Intent(this, NewPoint::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

//    「登録地点」を押した時
        btnCity.setOnClickListener {

//          "RegisterCity.kt"に画面遷移
            intent = Intent(this, RegisterCity::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

//    「詳細」を押した時
        btnDetail.setOnClickListener {

//          "Detail.kt"に画面遷移
            intent = Intent(this, Detail::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

//    アプリを落としても表示画面外で動き続けるための処理（フォアグラウンド処理）
//    フォアグラウンド処理（アプリ）の実行命令（"GetttingWeatherInformationService.kt"に遷移）
        val intentService = Intent(this,GetttingWeatherInformationService::class.java)
        startForegroundService(intentService)

    }

    override fun onDestroy() {
        super.onDestroy()
        mp.stop()
        mp.release()
    }

    override fun finish() {
        super.finish()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }

}