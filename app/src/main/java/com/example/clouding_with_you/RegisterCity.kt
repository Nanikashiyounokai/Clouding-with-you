package com.example.clouding_with_you

import android.content.DialogInterface
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.DividerItemDecoration
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import io.realm.Realm
import io.realm.kotlin.where

@Suppress("DEPRECATION") // overridePendingTransition は API 34 で非推奨だが動作する
class RegisterCity : AppCompatActivity() {

    private lateinit var realm: Realm //db関係
    private lateinit var rvRegisterCity: RecyclerView
    private lateinit var tvNothing: TextView

    //    Activityの生成
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register_city)

        realm = Realm.getDefaultInstance() //db関係　Realmデータベースを使用する準備

        //変数の定義
        val btnNewPointFronReg: Button = findViewById(R.id.btnNewPointFronReg)
        val btnhome: ImageButton = findViewById(R.id.homeButtonReg)
        rvRegisterCity = findViewById(R.id.rvRegisterCity)
        tvNothing = findViewById(R.id.tvNothing)

//      「新規地点登録画面へ移動」を押した時の処理
        btnNewPointFronReg.setOnClickListener {
            startActivity(Intent(this, NewPoint::class.java))
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        }

        btnhome.setOnClickListener { backToTitle() }

        //RecyclerViewにアダプターとレイアウトマネージャーを設定する
        rvRegisterCity.layoutManager = LinearLayoutManager(this)
        val adapter = PointAdapter(realm.where<Point>().findAll())
        rvRegisterCity.adapter = adapter

        // 区切り線。向きを知るためだけに LayoutManager をもう 1 つ作る必要はない
        rvRegisterCity.addItemDecoration(
            DividerItemDecoration(this, LinearLayoutManager.VERTICAL)
        )

        // 件数が変わったら「登録地点なし」の表示を切り替える。
        // 以前は onCreate で数えるだけ（しかもアダプター設定前にも 1 回呼んでいた）だったので、
        // 最後の 1 件を削除しても案内文が出ないままだった。
        adapter.registerAdapterDataObserver(object : RecyclerView.AdapterDataObserver() {
            override fun onChanged() = updateEmptyView()
            override fun onItemRangeInserted(positionStart: Int, itemCount: Int) = updateEmptyView()
            override fun onItemRangeRemoved(positionStart: Int, itemCount: Int) = updateEmptyView()
        })
        updateEmptyView()

        //登録地点の枠内をクリックしたときの処理
        adapter.setOnItemClickListener listener@{ id ->
            if (id == null) return@listener
            val point = realm.where<Point>().equalTo("id", id).findFirst() ?: return@listener

            val dialog = AlertDialog.Builder(this)
                .setTitle("「${point.point_name}」の詳細")
                .setMessage("緯度：${point.lat} 経度：${point.lon}")
                .setPositiveButton("戻る", null)
//                    「削除」を押した時の処理
                .setNegativeButton("削除") { _, _ ->
                    realm.executeTransaction { point.deleteFromRealm() }
                }
                .show()

            // ボタンの文字色を変更する
            dialog.getButton(DialogInterface.BUTTON_POSITIVE).setTextColor(Color.BLACK)
            dialog.getButton(DialogInterface.BUTTON_NEGATIVE).setTextColor(Color.BLACK)
        }
    }

    //listが空かどうか判断
    private fun updateEmptyView() {
        val count = rvRegisterCity.adapter?.itemCount ?: 0
        tvNothing.visibility = if (count > 0) View.GONE else View.VISIBLE
    }

    override fun finish() {
        super.finish()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }

    //db関係
    override fun onDestroy() {
        realm.close()
        super.onDestroy()
    }
}
