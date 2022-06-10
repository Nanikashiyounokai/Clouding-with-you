package com.example.clouding_with_you

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import androidx.fragment.app.Fragment


class HelpFragment : Fragment() {

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout for this fragment
        return inflater.inflate(R.layout.fragment_help, container, false)

    }

    companion object {
        @JvmStatic
        fun newInstance() = HelpFragment()
    }


    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
//        val btnhelp = view.findViewById<Button>(R.id.btnhelp)
        val buttonprev = view.findViewById<ImageButton>(R.id.btnback)

//        btnhelp.visibility = View.VISIBLE

        buttonprev.setOnClickListener {
            fragmentManager?.beginTransaction()?.remove(this)?.commit()

        }
    }
}