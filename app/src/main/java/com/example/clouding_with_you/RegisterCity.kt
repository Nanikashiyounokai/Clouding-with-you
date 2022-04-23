package com.example.clouding_with_you

import android.annotation.SuppressLint
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.ListView
import android.widget.TextView
import androidx.appcompat.app.AlertDialog

class RegisterCity : AppCompatActivity() {

    //    Activityの生成
    @SuppressLint("SetTextI18n")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register_city)

//        intentされてきた変数の所得
        val cityName = intent.getStringExtra("Register_CityName")
        val cityLng = intent.getStringExtra("Register_Lng")
        val cityLat = intent.getStringExtra("Register_Lat")

//        変数の定義
        val tvNothing: TextView = findViewById(R.id.tvNothing)
        val lvRegisterCity: ListView = findViewById(R.id.lvRegisterCity)

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
    }
}