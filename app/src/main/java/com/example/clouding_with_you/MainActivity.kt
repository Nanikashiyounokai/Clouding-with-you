package com.example.clouding_with_you

import android.content.Intent
import android.os.Build
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import androidx.annotation.RequiresApi

class MainActivity : AppCompatActivity() {

//    Activityの生成
    @RequiresApi(Build.VERSION_CODES.O)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

//    変数宣言
        val btnNewPoint : Button = findViewById(R.id.btnNewPoint)
        val btnCity : Button = findViewById(R.id.btnCity)
        val btnSetting : Button = findViewById(R.id.btnSetting)
        val btnDetail : Button = findViewById(R.id.btnDetail)

//    「新規地点登録」を押した時
        btnNewPoint.setOnClickListener {

//          "NewPoint.kt"に画面遷移
            intent = Intent(this, NewPoint::class.java)
            startActivity(intent)
        }

//    「登録地点」を押した時
        btnCity.setOnClickListener {

//          "RegisterCity.kt"に画面遷移
            intent = Intent(this, RegisterCity::class.java)
            startActivity(intent)
        }

//    「設定」を押した時
        btnSetting.setOnClickListener {

//          "SettingActivity.kt"に画面遷移
            intent = Intent(this, SettingsActivity::class.java)
            startActivity(intent)
        }

//    「詳細」を押した時
        btnDetail.setOnClickListener {

//          "Detail.kt"に画面遷移
            intent = Intent(this, Detail::class.java)
            startActivity(intent)
        }

//    アプリを落としても表示画面外で動き続けるための処理（フォアグラウンド処理）
//    フォアグラウンド処理（アプリ）の実行命令（"GetttingWeatherInformationService.kt"に遷移）
        val intentService = Intent(this,GetttingWeatherInformationService::class.java)
        startForegroundService(intentService)
    }

}