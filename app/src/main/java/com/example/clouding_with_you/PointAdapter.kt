package com.example.clouding_with_you
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import io.realm.OrderedRealmCollection
import io.realm.RealmRecyclerViewAdapter
import android.R
import android.annotation.SuppressLint


class PointAdapter(data: OrderedRealmCollection<Point>) :
        RealmRecyclerViewAdapter<Point, PointAdapter.ViewHolder>(data, true) {

    private var listener: ((Long?) -> Unit)? = null

    fun setOnItemClickListenner(listener:(Long?) -> Unit) {
        this.listener = listener
    }

    init {
        setHasStableIds(true)
    }

    class ViewHolder(cell: View) : RecyclerView.ViewHolder(cell) {
        val point_name: TextView = cell.findViewById(R.id.text1)
        val lonlat: TextView = cell.findViewById(R.id.text2)
    }

    //ここでは「simple_list_item_2」という元々用意されているレイアウトを適用させている
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PointAdapter.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        val view = inflater.inflate(android.R.layout.simple_list_item_2, parent, false)
        return ViewHolder(view)
    }

    //ここでは「Point.kt」(データベース)から項目を取得している。
    @SuppressLint("SetTextI18n")
    override fun onBindViewHolder(holder: PointAdapter.ViewHolder, position: Int) {
        val point: Point? = getItem(position)
        holder.point_name.text = point?.point_name
        holder.lonlat.text = "緯度："+point?.lat.toString() +"　経度："+ point?.lon.toString()

        holder.itemView.setOnClickListener {
            listener?.invoke(point?.id)
        }
    }

    override fun getItemId(position: Int): Long {
        return getItem(position)?.id ?: 0
    }


}