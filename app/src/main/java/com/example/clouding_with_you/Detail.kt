package com.example.clouding_with_you

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

@Suppress("DEPRECATION") // overridePendingTransition は API 34 で非推奨だが動作する
class Detail : AppCompatActivity() {

    //    Activityの生成
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_detail)
        val btnHome: ImageButton = findViewById(R.id.homeButtonDetail)
        val imageView: ImageView = findViewById(R.id.imageView)
        val url = "https://skart-inc.jimdofree.com/"

        btnHome.setOnClickListener { backToTitle() }

        imageView.setOnClickListener {
            // ブラウザが無い端末では ActivityNotFoundException で落ちる
            try {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
            } catch (e: ActivityNotFoundException) {
                Toast.makeText(this, "ブラウザが見つかりませんでした", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun finish() {
        super.finish()
        // finish() の中で 1 回だけ呼ぶ。呼び出し側でも呼ぶと二重になる
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
}
