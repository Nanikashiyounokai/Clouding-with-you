package com.example.dontennkinokoapp

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import com.example.clouding_with_you.*

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
}