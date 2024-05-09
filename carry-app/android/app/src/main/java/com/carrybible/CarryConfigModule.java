package com.carrybible;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.google.gson.Gson;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class CarryConfigModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;

    CarryConfigModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "CarryConfig";
    }

    @Override
    public Map<String, Object> getConstants() {
        try {
            InputStream is = reactContext.getAssets().open("config.json");
            int size = is.available();
            byte[] buffer = new byte[size];
            is.read(buffer);
            is.close();
            String rawConfig = new String(buffer, StandardCharsets.UTF_8);

            return new Gson().fromJson(rawConfig, HashMap.class);
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }
}
