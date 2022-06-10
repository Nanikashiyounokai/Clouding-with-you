package com.example.clouding_with_you

import android.app.Application
import io.realm.Realm
import io.realm.RealmConfiguration

class MyCWYApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        Realm.init(this)
        val config = RealmConfiguration.Builder()
            .allowQueriesOnUiThread(true)
            .allowWritesOnUiThread(true)
            .build()
        Realm.setDefaultConfiguration(config)
    }
}