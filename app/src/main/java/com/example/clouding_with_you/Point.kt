package com.example.clouding_with_you

import io.realm.RealmObject
import io.realm.annotations.PrimaryKey

open class Point: RealmObject() {
    @PrimaryKey
    var id: Long = 0
    var point_name: String = ""
    var active: String = ""
    var lon: Double = 0.0
    var lat: Double = 0.0
}