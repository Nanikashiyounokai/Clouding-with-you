package com.example.clouding_with_you

import android.content.Intent
import android.os.Bundle
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity

class Detail : AppCompatActivity() {

//    lateinit var mAdView : AdView

    //    Activityの生成
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_detail)
        val btnhome : ImageButton = findViewById(R.id.homeButtonDetail)

//        MobileAds.initialize(this) {}
//
//        mAdView = findViewById(R.id.adView)
//        val adRequest = AdRequest.Builder().build()
//        mAdView.loadAd(adRequest)

        btnhome.setOnClickListener {
            intent = Intent(this, MainActivity::class.java)
            startActivity(intent)
            finish()
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }
    }

    override fun finish() {
        super.finish()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
}