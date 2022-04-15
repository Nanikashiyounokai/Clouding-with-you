package com.example.clouding_with_you

import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.core.app.ActivityCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices

class NewPoint : AppCompatActivity() {
    lateinit var fusedLocationProviderClient: FusedLocationProviderClient

    @SuppressLint("VisibleForTests")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_new_point)

        val etCityName : EditText = findViewById(R.id.etCityName)
        val etLat : EditText = findViewById(R.id.etLat)
        val etLng : EditText = findViewById(R.id.etLng)
        val btnMap : Button = findViewById(R.id.btnMap)
        val btnRegister : Button = findViewById(R.id.btnRegister)
        val btnCurrentLocation : Button = findViewById(R.id.btnCurrentLocation)

        btnRegister.setOnClickListener {
            if (etCityName.text.toString() == "" || etLat.text.toString() == "" || etLng.text.toString() == ""){
                AlertDialog.Builder(this)
                    .setTitle("ERROR!!")
                    .setMessage("全ての項目を入力")
                    .setPositiveButton("OK",null)
                    .show()
            }else{
                AlertDialog.Builder(this)
                    .setTitle("地点登録完了")
                    .setMessage("新規地点登録が完了しました")
                    .setPositiveButton("登録地点を見る") { _, _ ->
                        val intent = Intent(this, RegisterCity::class.java)

                        intent.putExtra("Register_CityName", etCityName.text.toString())
                        intent.putExtra("Register_Lat", etLat.text.toString())
                        intent.putExtra("Register_Lng", etLng.text.toString())

                        startActivity(intent)
                        finish()
                    }
                    .setNegativeButton("タイトルに戻る"){ _, _ ->
                        val intent = Intent(this, MainActivity::class.java)

//                        intent.putExtra("Register_CityName", etCityName.text.toString())
//                        intent.putExtra("Register_Lat", etLat.text.toString())
//                        intent.putExtra("Register_Lng", etLng.text.toString())
//                        登録地点に送れない

                        startActivity(intent)
                        finish()
                    }
                    .show()
            }
        }
        btnMap.setOnClickListener {
            val intent = Intent(this, SearchMap::class.java)
            startActivity(intent)
        }

//        setContentView(R.layout.activity_main)
        fusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(this)

        btnCurrentLocation.setOnClickListener {
            fetchLocation()
        }
    }

    private fun fetchLocation() {
        val task = fusedLocationProviderClient.lastLocation

        if(ActivityCompat.checkSelfPermission(this,android.Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED && ActivityCompat
                .checkSelfPermission(this,android.Manifest.permission.ACCESS_COARSE_LOCATION)
            != PackageManager.PERMISSION_GRANTED
        ){
            ActivityCompat.requestPermissions(this, arrayOf(android.Manifest.permission.ACCESS_FINE_LOCATION),101)
            return
        }
        task.addOnSuccessListener {
            val etLat : EditText = findViewById(R.id.etLat)
            val etLng : EditText = findViewById(R.id.etLng)

            if(it !=null){
                etLat.setText(it.latitude.toString(), TextView.BufferType.EDITABLE)
                etLng.setText(it.longitude.toString(), TextView.BufferType.EDITABLE)
            }
        }
    }

}