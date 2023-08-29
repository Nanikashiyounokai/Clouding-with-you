package com.example.clouding_with_you

import android.annotation.SuppressLint
import android.content.DialogInterface
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.DividerItemDecoration
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import io.realm.Realm
import io.realm.kotlin.where

class RegisterCity : AppCompatActivity() {

    private lateinit var realm: Realm //db関係

//    lateinit var mAdView : AdView

    //    Activityの生成(新)
    @SuppressLint("SetTextI18n")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register_city)
        checkEmptyOfList()

        realm = Realm.getDefaultInstance() //db関係　Realmデータベースを使用する準備

//        MobileAds.initialize(this) {}
//
//        mAdView = findViewById(R.id.adView)
//        val adRequest = AdRequest.Builder().build()
//        mAdView.loadAd(adRequest)

        //変数の定義
        val btnNewPointFronReg : Button = findViewById(R.id.btnNewPointFronReg)

        val rvRegisterCity : RecyclerView = findViewById(R.id.rvRegisterCity)

        val btnhome : ImageButton = findViewById(R.id.homeButtonReg)


//      「新規地点登録画面へ移動」を押した時の処理
        btnNewPointFronReg.setOnClickListener {
//            "NewPoint.kt"に画面遷移
            intent = Intent(this, NewPoint::class.java)
            startActivity(intent)
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }
        
        
        btnhome.setOnClickListener {
            intent = Intent(this, MainActivity::class.java)
            startActivity(intent)
            finish()
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

        //RecyclerViewにアダプターとレイアウトマネージャーを設定する
        rvRegisterCity.layoutManager = LinearLayoutManager(this)
        val points = realm.where<Point>().findAll()
        val adapter = PointAdapter(points)
        rvRegisterCity.adapter = adapter

        val dividerItemDecoration = DividerItemDecoration(this, LinearLayoutManager(this).getOrientation())
        rvRegisterCity.addItemDecoration(dividerItemDecoration)

        checkEmptyOfList()


        //登録地点の枠内をクリックしたときの処理
        adapter.setOnItemClickListenner { id ->
            val point = realm.where<Point>().equalTo("id", id)?.findFirst()
            val point_name = point?.point_name
            val lon = point?.lon
            val lat = point?.lat
            id?.let {
                val alertDialog5 = AlertDialog.Builder(this)
                .setTitle("「$point_name」の詳細")
                .setMessage("緯度：$lon 経度：$lat")
                .setPositiveButton("戻る", null)
//                    「削除」を押した時の処理
                .setNegativeButton("削除"
                ) { _, _ ->
                    realm.executeTransaction {
                        point?.deleteFromRealm()
                    }
                }
                    .show()

                // OKボタンのインスタンスを取得する
                val positiveButton = alertDialog5.getButton(DialogInterface.BUTTON_POSITIVE)
                // OKボタンの色を変更する
                positiveButton.setTextColor(Color.BLACK)

                // OKボタンのインスタンスを取得する
                val negativeButton = alertDialog5.getButton(DialogInterface.BUTTON_NEGATIVE)
                // OKボタンの色を変更する
                negativeButton.setTextColor(Color.BLACK)

            }

        }

    }

    //listが空かどうか判断
    private fun checkEmptyOfList() {
        val rvRegisterCity : RecyclerView = findViewById(R.id.rvRegisterCity)
        val tvNothing: TextView = findViewById(R.id.tvNothing)
        val count = rvRegisterCity.adapter?.itemCount ?: 0
        if(count > 0)
            tvNothing.visibility = View.GONE    // 空でない
        else
            tvNothing.visibility = View.VISIBLE  // 空である           

    }

    override fun finish() {
        super.finish()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }


    //db関係
    override fun onDestroy() {
        super.onDestroy()
        realm.close()
    }
}

