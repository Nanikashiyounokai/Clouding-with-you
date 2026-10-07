package com.example.clouding_with_you

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import com.example.clouding_with_you.databinding.ActivitySearchMapBinding
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import kotlin.math.round

@Suppress("DEPRECATION") // overridePendingTransition は API 34 で非推奨だが動作する
class SearchMap : AppCompatActivity(), OnMapReadyCallback {

    private lateinit var binding: ActivitySearchMapBinding

    private var marker: Marker? = null
    private var lat = 35.6809591
    private var lng = 139.7673068

    //    Activityの生成
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivitySearchMapBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // 地図の準備ができたら onMapReady が呼ばれる
        val mapFragment = supportFragmentManager.findFragmentById(R.id.map) as SupportMapFragment
        mapFragment.getMapAsync(this)
    }

    override fun onMapReady(googleMap: GoogleMap) {
        //ボタンの非表示
        binding.btnDecision.visibility = View.INVISIBLE

        //1)東京を表示
        val locationNow = LatLng(lat, lng)
        marker = googleMap.addMarker(MarkerOptions().position(locationNow).title("東京駅"))

        googleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(locationNow, 10f)) //2)zoom表示
        googleMap.uiSettings.isZoomControlsEnabled = true //3)拡大・縮小ボタン表示

        //クリックしたところにマーカー追加
        googleMap.setOnMapClickListener { position ->
            // addMarker() は失敗すると null を返す。!! だとその時点で落ちる
            marker?.isVisible = false
            lat = position.latitude
            lng = position.longitude
            marker = googleMap.addMarker(
                MarkerOptions().position(LatLng(lat, lng)).title("新規登録地点")
            )
            //ボタンの表示
            binding.btnDecision.visibility = View.VISIBLE
        }

        val cityName = intent.getStringExtra("CITYNAME_KEY")

        binding.btnDecision.setOnClickListener {
            //"NewPoint.kt"に戻る。
            // CLEAR_TOP | SINGLE_TOP を付けないと NewPoint がもう 1 つ積み上がり、
            // 戻るボタンで同じ画面を何度も通ることになる
            val intent = Intent(this, NewPoint::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                .putExtra("Decision_Lat", round4(lat).toString())
                .putExtra("Decision_Lng", round4(lng).toString())
                .putExtra("RECITYNAME_KEY", cityName)
            startActivity(intent)
            finish()
        }
    }

    // 小数第 4 位で丸める
    private fun round4(value: Double): Double = round(value * 10000) / 10000

    override fun finish() {
        super.finish()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
}
