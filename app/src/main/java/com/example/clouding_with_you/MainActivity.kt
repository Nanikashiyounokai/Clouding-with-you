package com.example.clouding_with_you

import android.content.Intent
import android.media.MediaPlayer
import android.os.Bundle
import android.widget.ImageButton
import androidx.appcompat.app.AppCompatActivity

@Suppress("DEPRECATION") // overridePendingTransition は API 34 で非推奨だが動作する
class MainActivity : AppCompatActivity() {

    // MediaPlayer.create() は音源の読み込みに失敗すると null を返す。
    // lateinit の非 null プロパティに代入すると、その時点で NPE になっていた。
    private var mp: MediaPlayer? = null

    //    Activityの生成
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

//    変数宣言
        val btnNewPoint: ImageButton = findViewById(R.id.btnNewPoint)
        val btnCity: ImageButton = findViewById(R.id.btnCity)
        val btnDetail: ImageButton = findViewById(R.id.btnDetail)

//    グランドエスケープっぽい曲を流す
        mp = MediaPlayer.create(this, R.raw.grand_escapo2)?.apply {
            isLooping = true
            start()
        }

//    各画面への遷移
        btnNewPoint.setOnClickListener { openScreen(NewPoint::class.java) }
        btnCity.setOnClickListener { openScreen(RegisterCity::class.java) }
        btnDetail.setOnClickListener { openScreen(Detail::class.java) }

//    アプリを落としても表示画面外で動き続けるための処理（フォアグラウンド処理）
        startForegroundService(Intent(this, GetttingWeatherInformationService::class.java))
    }

    // 遷移処理が 3 箇所同じだったのでまとめた。
    // 以前は Activity 自身の intent プロパティに代入していたが、
    // これは「この Activity が起動されたときの Intent」を壊すので、ローカルで作る。
    private fun openScreen(target: Class<*>) {
        startActivity(Intent(this, target))
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }

    override fun onDestroy() {
        mp?.release()
        mp = null
        super.onDestroy()
    }

    override fun finish() {
        super.finish()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
}
