package com.example.clouding_with_you

import android.annotation.SuppressLint
import android.content.DialogInterface
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.View.*
import android.view.ViewGroup
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.size
import androidx.recyclerview.widget.DividerItemDecoration
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.clouding_with_you.databinding.ActivityRegisterCityBinding
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.MobileAds
import com.google.android.material.snackbar.Snackbar
import io.realm.Realm
import io.realm.kotlin.where

class RegisterCity : AppCompatActivity() {

    private var _binding: ActivityRegisterCityBinding? = null
    private val binding get() = _binding!!
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



//        intentされてきた変数の所得
        //val cityName = intent.getStringExtra("Register_CityName")
        //val cityLng = intent.getStringExtra("Register_Lng")
        //val cityLat = intent.getStringExtra("Register_Lat")

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
                .setNegativeButton("削除",
                    DialogInterface.OnClickListener { dialog, id ->
                        realm.executeTransaction{
                            point?.deleteFromRealm()
                        }
                    })
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
        val count = rvRegisterCity.adapter?.let { it.itemCount }?: 0
        if(count > 0)
            tvNothing.visibility = View.GONE    // 空でない
        else
            tvNothing.visibility = View.VISIBLE  // 空である           

    }

    //    Activityの生成(旧)
//    @SuppressLint("SetTextI18n")
//    override fun onCreate(savedInstanceState: Bundle?) {
//        super.onCreate(savedInstanceState)
//        setContentView(R.layout.activity_register_city)
//
//        realm = Realm.getDefaultInstance() //db関係　Realmデータベースを使用する準備
//
//        MobileAds.initialize(this) {}
//
//        mAdView = findViewById(R.id.adView)
//        val adRequest = AdRequest.Builder().build()
//        mAdView.loadAd(adRequest)
//
////        intentされてきた変数の所得
//        val cityName = intent.getStringExtra("Register_CityName")
//        val cityLng = intent.getStringExtra("Register_Lng")
//        val cityLat = intent.getStringExtra("Register_Lat")
//
////        変数の定義
//        val tvNothing: TextView = findViewById(R.id.tvNothing)
//        //val lvRegisterCity: ListView = findViewById(R.id.lvRegisterCity)
//        val lvRegisterCity: ListView = findViewById(R.id.rvRegisterCity)
//        val btnNewPointFronReg : Button = findViewById(R.id.btnNewPointFronReg)
//
////        Listを表示するためのadapterの定義
//        val adapter = ArrayAdapter<String>(
//            this,
//            android.R.layout.simple_expandable_list_item_1,
//            mutableListOf()
//        )
//        lvRegisterCity.adapter = adapter
//
////        adapterにintentされてきた都市名を加える
//        val cityNameReg = cityName.toString()
//        adapter.add(cityNameReg)
//
////        リストに何もなければ「登録地点はありません」と表示
//        lvRegisterCity.emptyView = tvNothing
//
////        リストの項目を押した時の処理
//        lvRegisterCity.setOnItemClickListener { _, _, i, _ ->
//
////            押された項目の詳細と削除
//            AlertDialog.Builder(this)
//                .setTitle("「$cityName」の詳細")
//                .setMessage("緯度：$cityLat 経度：$cityLng")
//                .setPositiveButton("戻る", null)
////                    「削除」を押した時の処理
//                .setNegativeButton("削除") { _, _ ->
////                    押した項目をListから削除（データベースからではないことに注意）
//                    adapter.remove(adapter.getItem(i))
//                    adapter.notifyDataSetChanged()
//                }
//                .show()
//        }
//
////        「新規地点登録画面へ移動」を押した時の処理
//        btnNewPointFronReg.setOnClickListener {
//
////            "NewPoint.kt"に画面遷移
//            intent = Intent(this, NewPoint::class.java)
//            startActivity(intent)
//            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
//        }
//    }

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

