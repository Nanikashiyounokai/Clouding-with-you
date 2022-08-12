package com.example.clouding_with_you
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import io.realm.OrderedRealmCollection
import io.realm.RealmRecyclerViewAdapter
import android.annotation.SuppressLint
import android.widget.RadioButton
import io.realm.Realm
import io.realm.kotlin.where

class PointAdapter(data: OrderedRealmCollection<Point>) :
        RealmRecyclerViewAdapter<Point, PointAdapter.ViewHolder>(data, true) {

    private var listener: ((Long?) -> Unit)? = null


    private var checkPosition = -1

    fun setOnItemClickListenner(listener:(Long?) -> Unit) {
        this.listener = listener
    }

    init {
        setHasStableIds(true)
    }

    class ViewHolder(cell: View) : RecyclerView.ViewHolder(cell) {
        val point_name: TextView = cell.findViewById(R.id.tvPointTitle)
        val lonlat: TextView = cell.findViewById(R.id.tvLonLat)
        val radio_button: RadioButton = cell.findViewById(R.id.radio_button)
        val tv_check: TextView = cell.findViewById(R.id.tv_check)
    }

    //ここでは「rv_detail.xml」のレイアウトを適用させている
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        val view = inflater.inflate(R.layout.rv_detail, parent, false)
        return ViewHolder(view)
    }

    //ここでは「Point.kt」(データベース)から項目を取得している。
    @SuppressLint("SetTextI18n", "NotifyDataSetChanged")
    override fun onBindViewHolder(holder: PointAdapter.ViewHolder, @SuppressLint("RecyclerView") position: Int) {
        val point: Point? = getItem(position)
        holder.point_name.text = point?.point_name
        holder.lonlat.text = "緯度："+point?.lat.toString() +"　経度："+ point?.lon.toString()

        // セルに使用しているビューがタップされたときのイベント
        holder.itemView.setOnClickListener {
            listener?.invoke(point?.id)
        }

        if(point?.active.equals("True")) {
            holder.radio_button.isChecked = true
            holder.tv_check.visibility = View.VISIBLE
        }
        else {
            holder.radio_button.isChecked = false
            holder.tv_check.visibility = View.GONE
        }

        //ラジオボタンが更新された時、「notifyDataSetChanged()」で全データを更新
        holder.radio_button.setOnClickListener {
            if(point?.active == "False") {
                Realm.getDefaultInstance().executeTransaction {
                    val truePoint =
                        Realm.getDefaultInstance().where<Point>().equalTo("active", "True")
                            ?.findFirst()
                    truePoint?.active = "False"
                    point?.active = "True"
                }
            }else{
                Realm.getDefaultInstance().executeTransaction {
                    point?.active = "False"
                }
            }
            notifyDataSetChanged()
        }
    }

    override fun getItemId(position: Int): Long {
        return getItem(position)?.id ?: 0
    }
}