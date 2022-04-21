package com.example.clouding_with_you

import android.content.Intent
import android.os.Build
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import androidx.annotation.RequiresApi

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val btnNewPoint : Button = findViewById(R.id.btnNewPoint)
        val btnCity : Button = findViewById(R.id.btnCity)
        val btnSetting : Button = findViewById(R.id.btnSetting)
        val btnDetail : Button = findViewById(R.id.btnDetail)

        btnNewPoint.setOnClickListener {
            intent = Intent(this, NewPoint::class.java)
            startActivity(intent)
        }

        btnCity.setOnClickListener {
            intent = Intent(this, RegisterCity::class.java)
            startActivity(intent)
        }

        btnSetting.setOnClickListener {
            intent = Intent(this, SettingsActivity::class.java)
            startActivity(intent)
        }

        btnDetail.setOnClickListener {
            intent = Intent(this, Detail::class.java)
            startActivity(intent)
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    override fun onStart() {
        super.onStart()

        val intent = Intent(this,GetttingWeatherInformationService::class.java)
        startForegroundService(intent)

    }
}