package com.example.clouding_with_you

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.ListView
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.MobileAds

class RegisterCity : AppCompatActivity() {

    lateinit var mAdView : AdView

    //    Activityの生成
    @SuppressLint("SetTextI18n")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register_city)

        MobileAds.initialize(this) {}

        mAdView = findViewById(R.id.adView)
        val adRequest = AdRequest.Builder().build()
        mAdView.loadAd(adRequest)

//        intentされてきた変数の所得
        val cityName = intent.getStringExtra("Register_CityName")
        val cityLng = intent.getStringExtra("Register_Lng")
        val cityLat = intent.getStringExtra("Register_Lat")

//        変数の定義
        val tvNothing: TextView = findViewById(R.id.tvNothing)
        val lvRegisterCity: ListView = findViewById(R.id.lvRegisterCity)
        val btnNewPointFronReg : Button = findViewById(R.id.btnNewPointFronReg)

//        Listを表示するためのadapterの定義
        val adapter = ArrayAdapter<String>(
            this,
            android.R.layout.simple_expandable_list_item_1,
            mutableListOf()
        )
        lvRegisterCity.adapter = adapter

//        adapterにintentされてきた都市名を加える
        val cityNameReg = cityName.toString()
        adapter.add(cityNameReg)

//        リストに何もなければ「登録地点はありません」と表示
        lvRegisterCity.emptyView = tvNothing

//        リストの項目を押した時の処理
        lvRegisterCity.setOnItemClickListener { _, _, i, _ ->

//            押された項目の詳細と削除
            AlertDialog.Builder(this)
                .setTitle("「$cityName」の詳細")
                .setMessage("緯度：$cityLat 経度：$cityLng")
                .setPositiveButton("戻る", null)
//                    「削除」を押した時の処理
                .setNegativeButton("削除") { _, _ ->
//                    押した項目をListから削除（データベースからではないことに注意）
                    adapter.remove(adapter.getItem(i))
                    adapter.notifyDataSetChanged()
                }
                .show()
        }

//        「新規地点登録画面へ移動」を押した時の処理
        btnNewPointFronReg.setOnClickListener {

//            "NewPoint.kt"に画面遷移
            intent = Intent(this, NewPoint::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }
    }

    override fun finish() {
        super.finish()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
}