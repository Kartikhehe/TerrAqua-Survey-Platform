package com.terraqua.gis;

import android.os.Bundle;
import android.graphics.Color;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.graphics.Insets;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Set status bar color to black
        getWindow().setStatusBarColor(Color.BLACK);
        
        // Enable drawing behind system bars
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        
        // Apply window insets to WebView to prevent overlay
        View rootView = findViewById(android.R.id.content);
        if (rootView != null) {
            ViewCompat.setOnApplyWindowInsetsListener(rootView, (v, insets) -> {
                Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
                
                // Apply padding to the root view to account for system bars
                v.setPadding(
                    systemBars.left,
                    systemBars.top,
                    systemBars.right,
                    systemBars.bottom
                );
                
                return WindowInsetsCompat.CONSUMED;
            });
            
            // Request to apply insets
            ViewCompat.requestApplyInsets(rootView);
        }
    }
}
