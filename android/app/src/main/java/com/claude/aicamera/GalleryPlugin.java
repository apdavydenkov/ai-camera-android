package com.claude.aicamera;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "Gallery")
public class GalleryPlugin extends Plugin {

    private static final String ALBUM = "AI Camera";

    @PluginMethod
    public void save(PluginCall call) {
        String dataUrl = call.getString("dataUrl");
        if (dataUrl == null) { call.reject("dataUrl is required"); return; }

        try {
            int comma = dataUrl.indexOf(',');
            String b64 = comma >= 0 ? dataUrl.substring(comma + 1) : dataUrl;
            byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
            String name = "IMG_" + System.currentTimeMillis() + ".jpg";
            String filePath;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = getContext().getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.Images.Media.DISPLAY_NAME, name);
                values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
                values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/" + ALBUM);
                values.put(MediaStore.Images.Media.IS_PENDING, 1);

                Uri uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                if (uri == null) { call.reject("Failed to create MediaStore entry"); return; }

                try (OutputStream os = resolver.openOutputStream(uri)) {
                    os.write(bytes);
                }

                values.clear();
                values.put(MediaStore.Images.Media.IS_PENDING, 0);
                resolver.update(uri, values, null, null);

                filePath = uri.toString();
            } else {
                File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), ALBUM);
                if (!dir.exists()) dir.mkdirs();
                File file = new File(dir, name);
                try (FileOutputStream os = new FileOutputStream(file)) {
                    os.write(bytes);
                }
                Intent scan = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE);
                scan.setData(Uri.fromFile(file));
                getContext().sendBroadcast(scan);
                filePath = file.getAbsolutePath();
            }

            JSObject ret = new JSObject();
            ret.put("filePath", filePath);
            ret.put("name", name);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("save failed: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void open(PluginCall call) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setType("image/*");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("ok", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("open failed: " + e.getMessage(), e);
        }
    }
}
