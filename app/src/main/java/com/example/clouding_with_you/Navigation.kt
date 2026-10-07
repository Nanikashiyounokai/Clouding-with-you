package com.example.clouding_with_you

import android.app.Activity
import android.content.Intent

/**
 * タイトル画面（MainActivity）へ戻る。
 *
 * 以前は各画面で `startActivity(MainActivity) + finish()` としていたが、
 * これはスタックに既にある MainActivity とは別に、もう 1 つ MainActivity を作ってしまう。
 * MainActivity は onCreate で BGM を鳴らすので、
 * ホームボタンを押すたびに BGM が重なって多重再生されていた。
 *
 * CLEAR_TOP | SINGLE_TOP を付けると、既存の MainActivity を再利用したうえで
 * その上に積まれている画面をまとめて閉じる。
 */
fun Activity.backToTitle() {
    val intent = Intent(this, MainActivity::class.java)
        .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    startActivity(intent)
    finish()
}
