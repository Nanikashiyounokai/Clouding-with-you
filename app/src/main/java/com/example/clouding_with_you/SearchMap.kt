package com.example.clouding_with_you

//アイコンカラー
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import com.example.clouding_with_you.databinding.ActivitySearchMapBinding
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions

class SearchMap : AppCompatActivity(), OnMapReadyCallback {

    private lateinit var mMap: GoogleMap
    private lateinit var binding: ActivitySearchMapBinding

    //    Activityの生成
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivitySearchMapBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        val mapFragment = supportFragmentManager
            .findFragmentById(R.id.map) as SupportMapFragment
        mapFragment.getMapAsync(this)
    }

    /**
     * Manipulates the map once available.
     * This callback is triggered when the map is ready to be used.
     * This is where we can add markers or lines, add listeners or move the camera. In this case,
     * we just add a marker near Sydney, Australia.
     * If Google Play services is not installed on the device, the user will be prompted to install
     * it inside the SupportMapFragment. This method will only be triggered once the user has
     * installed Google Play services and returned to the app.
     */
    override fun onMapReady(googleMap: GoogleMap) {
        mMap = googleMap
        //ボタンの非表示
        val btnDecision : Button = findViewById(R.id.btnDecision)
        btnDecision.visibility = View.INVISIBLE

        var lat = 35.6809591
        var lng = 139.7673068
        //1)東京を表示
        val locationNow = LatLng(lat, lng)
        //クリック関数の中で書き換えるのでvar
        var marker = mMap.addMarker(MarkerOptions()
            .position(locationNow)
            .title("東京駅"))

        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(locationNow,10f)) //2)zoom表示
        mMap.uiSettings.isZoomControlsEnabled =true //3)拡大・縮小ボタン表示

        //クリックしたところにマーカー追加
        mMap.setOnMapClickListener(object :GoogleMap.OnMapClickListener{
            override fun onMapClick(p0: LatLng) {
                marker!!.setVisible(false)
                lat = p0.latitude
                lng = p0.longitude
                val location = LatLng(lat,lng)
                marker = mMap.addMarker(MarkerOptions().position(location).title("新規登録地点"))
                //ボタンの表示
                btnDecision.visibility = View.VISIBLE
            }
        })

        btnDecision.setOnClickListener {
            val decisionLat = (Math.round(lat * 10000)).toDouble()/10000
            val decisionLng = (Math.round(lng * 10000)).toDouble()/10000

            //"NewPoint.kt"に画面遷移
            val intent = Intent(this, NewPoint::class.java)
            //NewPointに緯度経度を渡す。
            intent.putExtra("Decision_Lat", decisionLat.toString())
            intent.putExtra("Decision_Lng", decisionLng.toString())
            startActivity(intent)
            finish()
        }


    }
    override fun finish() {
        super.finish()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }

}