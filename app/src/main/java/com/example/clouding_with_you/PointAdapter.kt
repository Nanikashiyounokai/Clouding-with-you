package com.example.clouding_with_you

import android.annotation.SuppressLint
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.RadioButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import io.realm.OrderedRealmCollection
import io.realm.Realm
import io.realm.RealmRecyclerViewAdapter
import io.realm.kotlin.where

class PointAdapter(data: OrderedRealmCollection<Point>) :
    RealmRecyclerViewAdapter<Point, PointAdapter.ViewHolder>(data, true) {

    private var listener: ((Long?) -> Unit)? = null

    fun setOnItemClickListener(listener: (Long?) -> Unit) {
        this.listener = listener
    }

    init {
        setHasStableIds(true)
    }

    class ViewHolder(cell: View) : RecyclerView.ViewHolder(cell) {
        val pointName: TextView = cell.findViewById(R.id.tvPointTitle)
        val lonLat: TextView = cell.findViewById(R.id.tvLonLat)
        val radioButton: RadioButton = cell.findViewById(R.id.radio_button)
        val tvCheck: TextView = cell.findViewById(R.id.tv_check)
    }

    //ここでは「rv_detail.xml」のレイアウトを適用させている
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.rv_detail, parent, false)
        return ViewHolder(view)
    }

    //ここでは「Point.kt」(データベース)から項目を取得している。
    @SuppressLint("SetTextI18n")
    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        // 削除直後などに null が返ることがあるので、その場合は何も描かない
        val point = getItem(position) ?: return

        holder.pointName.text = point.point_name
        holder.lonLat.text = "緯度：${point.lat}　経度：${point.lon}"

        // セルに使用しているビューがタップされたときのイベント
        holder.itemView.setOnClickListener { listener?.invoke(point.id) }

        // equals("True") ではなく == で比較する
        val isActive = point.active == "True"
        holder.radioButton.isChecked = isActive
        holder.tvCheck.visibility = if (isActive) View.VISIBLE else View.GONE

        holder.radioButton.setOnClickListener {
            // Realm.getDefaultInstance() は呼ぶたびに参照カウントが増える。
            // 以前は 1 回のタップで最大 3 個開いて 1 つも閉じていなかった。
            // use {} で必ず閉じる。
            Realm.getDefaultInstance().use { realm ->
                realm.executeTransaction { db ->
                    if (point.active == "True") {
                        // 祈願中を解除する
                        point.active = "False"
                    } else {
                        // 祈願中は 1 地点だけなので、今の祈願中を解除してから付け替える
                        db.where<Point>().equalTo("active", "True").findFirst()?.active = "False"
                        point.active = "True"
                    }
                }
            }
            // RealmRecyclerViewAdapter(data, autoUpdate = true) なので
            // notifyDataSetChanged() を呼ばなくても一覧は自動で更新される
        }
    }

    override fun getItemId(position: Int): Long = getItem(position)?.id ?: 0
}
