package br.paradise.game;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.view.DisplayCutout;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONObject;

/** Aplicativo offline: somente os recursos incorporados são servidos ao WebView. */
public final class ParadiseActivity extends Activity {
    private static final String ORIGIN = "https://paradise.local/";
    private static final int IMPORT_SAVE = 41;
    private static final int EXPORT_SAVE = 42;
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingExport;
    private final int[] safeInsets = new int[4];

    @Override public void onCreate(Bundle bundle) {
        super.onCreate(bundle);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_FULLSCREEN);
        fullscreen();
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams attributes = getWindow().getAttributes();
            attributes.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(attributes);
        }
        webView = new WebView(this);
        webView.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 28) {
                DisplayCutout cutout = insets.getDisplayCutout();
                safeInsets[0] = cutout == null ? 0 : cutout.getSafeInsetTop();
                safeInsets[1] = cutout == null ? 0 : cutout.getSafeInsetRight();
                safeInsets[2] = cutout == null ? 0 : cutout.getSafeInsetBottom();
                safeInsets[3] = cutout == null ? 0 : cutout.getSafeInsetLeft();
                updateSafeInsets();
            }
            return insets;
        });
        webView.setBackgroundColor(0xff142f2c);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setUseWideViewPort(true);
        webView.getSettings().setLoadWithOverviewMode(true);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.addJavascriptInterface(new NativeBridge(), "ParadiseNative");
        webView.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) { updateSafeInsets(); }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !request.getUrl().toString().startsWith(ORIGIN);
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!"paradise.local".equals(uri.getHost()) || !"https".equals(uri.getScheme())) return denied();
                String path = uri.getPath();
                if (path == null || path.equals("/")) path = "/index.html";
                if (path.contains("..") || path.contains("\\")) return denied();
                try {
                    InputStream stream = getAssets().open(path.substring(1));
                    return new WebResourceResponse(mime(path), "UTF-8", 200, "OK", Collections.singletonMap("Cache-Control", "no-cache"), stream);
                } catch (Exception missing) { return denied(); }
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"application/json", "text/plain", "application/octet-stream"});
                try { startActivityForResult(intent, IMPORT_SAVE); }
                catch (Exception unavailable) { fileCallback.onReceiveValue(null); fileCallback = null; }
                return true;
            }
        });
        setContentView(webView);
        Matcher browser = Pattern.compile("Chrome/(\\d+)").matcher(webView.getSettings().getUserAgentString());
        if (browser.find() && Integer.parseInt(browser.group(1)) < 109) {
            new AlertDialog.Builder(this).setTitle("Atualize o Android System WebView")
                .setMessage("Paradise? precisa de uma versão recente do Android System WebView. Atualize esse componente para abrir o jogo.")
                .setPositiveButton("Fechar", (dialog, which) -> finish()).setCancelable(false).show();
        } else webView.loadUrl(ORIGIN + "index.html");
    }
    private static String mime(String path) {
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".js")) return "text/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".png")) return "image/png";
        if (path.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }
    private static WebResourceResponse denied() {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
    }
    private void updateSafeInsets() {
        if (webView == null) return;
        String[] sides = {"top", "right", "bottom", "left"};
        float density = getResources().getDisplayMetrics().density;
        StringBuilder script = new StringBuilder("if(document.documentElement){");
        for (int i = 0; i < 4; i++) {
            script.append("document.documentElement.style.setProperty('--native-safe-")
                .append(sides[i]).append("','").append(Math.ceil(safeInsets[i] / density)).append("px');");
        }
        webView.evaluateJavascript(script.append("}").toString(), null);
    }
    private void fullscreen() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
    private void fileResult(boolean ok) {
        if (webView != null) webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('paradise-file-result',{detail:{ok:" + ok + "}}))", null);
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == IMPORT_SAVE && fileCallback != null) {
            fileCallback.onReceiveValue(result == RESULT_OK && data != null && data.getData() != null ? new Uri[]{data.getData()} : null);
            fileCallback = null;
        } else if (request == EXPORT_SAVE) {
            if (result == RESULT_OK && data != null && data.getData() != null && pendingExport != null) {
                try (OutputStream out = getContentResolver().openOutputStream(data.getData(), "wt")) {
                    if (out == null) throw new IllegalStateException();
                    out.write(pendingExport.getBytes(StandardCharsets.UTF_8)); fileResult(true);
                } catch (Exception failure) { fileResult(false); }
            }
            pendingExport = null;
        }
    }
    @Override protected void onPause() {
        if (webView != null) { webView.evaluateJavascript("window.dispatchEvent(new Event('paradise-pause'))", null); webView.onPause(); }
        super.onPause();
    }
    @Override protected void onResume() { super.onResume(); if (webView != null) webView.onResume(); fullscreen(); }
    @Override public void onWindowFocusChanged(boolean focus) { super.onWindowFocusChanged(focus); if (focus) fullscreen(); }
    @Override public void onBackPressed() {
        if (webView == null) { finish(); return; }
        webView.evaluateJavascript("!window.paradise||window.paradise.view==='title'||window.paradise.state.phase==='finished'", title -> {
            if ("true".equals(title)) finish();
            else webView.evaluateJavascript("window.dispatchEvent(new Event('paradise-back'))", null);
        });
    }
    @Override protected void onDestroy() {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        if (webView != null) { webView.removeJavascriptInterface("ParadiseNative"); webView.destroy(); }
        super.onDestroy();
    }
    private final class NativeBridge {
        @JavascriptInterface public void fullscreen() { runOnUiThread(() -> ParadiseActivity.this.fullscreen()); }
        @JavascriptInterface public void exitGame() { runOnUiThread(() -> finish()); }
        @JavascriptInterface public void exportSave(String json) {
            try { if (json == null || json.length() > 8 * 1024 * 1024 || new JSONObject(json).optInt("version") != 1) return; }
            catch (Exception invalid) { return; }
            runOnUiThread(() -> {
                pendingExport = json;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE); intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, "Paradise-jornada.json");
                try { startActivityForResult(intent, EXPORT_SAVE); }
                catch (Exception unavailable) { pendingExport = null; fileResult(false); }
            });
        }
    }
}
