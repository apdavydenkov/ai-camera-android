package com.claude.aicamera;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GalleryOpenerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
