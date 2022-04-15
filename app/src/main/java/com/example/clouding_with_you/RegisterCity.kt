package com.example.dontennkinokoapp

import android.annotation.SuppressLint
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.ListView
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import com.example.clouding_with_you.R

class RegisterCity : AppCompatActivity() {
    @SuppressLint("SetTextI18n")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register_city)

        val cityName = intent.getStringExtra("Register_CityName")
        val cityLng = intent.getStringExtra("Register_Lng")
        val cityLat = intent.getStringExtra("Register_Lat")

        val tvNothing: TextView = findViewById(R.id.tvNothing)
        val lvRegisterCity: ListView = findViewById(R.id.lvRegisterCity)

        val adapter = ArrayAdapter<String>(
            this,
            android.R.layout.simple_expandable_list_item_1,
            mutableListOf()
        )

        lvRegisterCity.adapter = adapter
        val cityNameReg = cityName.toString()
        adapter.add(cityNameReg)

        lvRegisterCity.emptyView = tvNothing

        lvRegisterCity.setOnItemClickListener { _, _, i, _ ->
            AlertDialog.Builder(this)
                .setTitle("「$cityName」の詳細")
                .setMessage("緯度：$cityLat 経度：$cityLng")
                .setPositiveButton("戻る", null)
                .setNegativeButton("削除") { _, _ ->
                    adapter.remove(adapter.getItem(i))
                    adapter.notifyDataSetChanged()
                }
                .show()
        }
    }
}