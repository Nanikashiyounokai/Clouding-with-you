package com.example.clouding_with_you

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.ImageButton
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat

class Detail : AppCompatActivity() {

    //    Activityの生成
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_detail)
        val btnHome : ImageButton = findViewById(R.id.homeButtonDetail)
        val imageView : ImageView = findViewById(R.id.imageView)
        val url = "https://skart-inc.jimdofree.com/"

        btnHome.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java) // 別のActivityへ遷移する場合、intentを再宣言
            startActivity(intent)
            finish()
            // 新しいラッパー関数を使用 (Android 14 以降で非推奨が解除)
            // または ActivityCompat.finishAfterTransition(this) で対応
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

        imageView.setOnClickListener {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            startActivity(intent)
        }
    }

    override fun finish() {
        super.finish()
        // 新しいラッパー関数を使用 (Android 14 以降で非推奨が解除)
        // または ActivityCompat.finishAfterTransition(this) で対応
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
}