package uz.greenprocessing.erp;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

public class MainActivity extends Activity {

    private static final String APP_URL = "https://green-processing.vercel.app";
    private static final String CHANNEL_ID = "gp_erp_notifications";
    private static final int FILE_CHOOSER_REQUEST_CODE = 1001;
    private static final int PERMISSION_REQUEST_CODE = 1002;

    private WebView webView;
    private ProgressBar progressBar;
    private ValueCallback<Uri[]> filePathCallback;
    private int lastBadgeCount = 0;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configure dark status and navigation bars (#070C16)
        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#070C16"));
        window.setNavigationBarColor(Color.parseColor("#070C16"));

        createNotificationChannel();
        requestNeededPermissions();

        // Root layout
        FrameLayout rootLayout = new FrameLayout(this);
        rootLayout.setBackgroundColor(Color.parseColor("#070C16"));
        rootLayout.setFitsSystemWindows(true);

        // WebView setup
        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#070C16"));
        FrameLayout.LayoutParams webParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        );
        webView.setLayoutParams(webParams);

        // Top loading indicator
        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                6,
                Gravity.TOP
        );
        progressBar.setLayoutParams(progressParams);
        progressBar.setMax(100);
        progressBar.setVisibility(View.GONE);

        rootLayout.addView(webView);
        rootLayout.addView(progressBar);
        setContentView(rootLayout);

        // Configure WebSettings
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        String defaultUA = settings.getUserAgentString();
        settings.setUserAgentString(defaultUA + " GreenProcessingAndroid/1.0");

        // Enable persistent cookies for session auth
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // Add JS Bridge for notifications & badges
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        // WebViewClient
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                if (url.startsWith("https://green-processing.vercel.app") || url.startsWith("http://localhost")) {
                    return false;
                }
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, request.getUrl());
                    startActivity(intent);
                } catch (Exception ignored) {
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                CookieManager.getInstance().flush();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showOfflinePage();
                }
            }
        });

        // WebChromeClient for file uploads, camera QR scanner, and progress bar
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        request.grant(request.getResources());
                    }
                });
            }

            @Override
            public boolean onShowFileChooser(
                    WebView webView,
                    ValueCallback<Uri[]> filePathCallback,
                    FileChooserParams fileChooserParams
            ) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                String[] mimeTypes = {"image/*", "application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"};
                intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);

                try {
                    startActivityForResult(Intent.createChooser(intent, "Fayl yoki rasmni tanlang"), FILE_CHOOSER_REQUEST_CODE);
                } catch (Exception e) {
                    MainActivity.this.filePathCallback = null;
                    return false;
                }
                return true;
            }
        });

        // Handle file downloads (Excel, PDF reports)
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    intent.setData(Uri.parse(url));
                    startActivity(intent);
                } catch (Exception ignored) {
                }
            }
        });

        if (savedInstanceState == null) {
            webView.clearCache(true);
            webView.loadUrl(APP_URL);
        }
    }

    private void showOfflinePage() {
        String offlineHtml = "<!DOCTYPE html><html><head><meta charset='utf-8'>"
                + "<meta name='viewport' content='width=device-width,initial-scale=1'>"
                + "<style>"
                + "body{margin:0;background:#070C16;color:#F8FAFC;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;padding:24px;box-sizing:border-box;}"
                + ".card{background:#0F172A;border:1px solid #1E293B;border-radius:24px;padding:32px 24px;max-width:360px;width:100%;box-shadow:0 20px 40px rgba(0,0,0,0.5);}"
                + ".icon{width:64px;height:64px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:30px;}"
                + "h2{margin:0 0 8px;font-size:20px;font-weight:800;}"
                + "p{margin:0 0 24px;font-size:14px;color:#94A3B8;line-height:1.5;}"
                + "button{background:#059669;color:#fff;border:none;border-radius:14px;padding:14px 24px;font-size:15px;font-weight:700;width:100%;cursor:pointer;}"
                + "</style></head><body>"
                + "<div class='card'>"
                + "<div class='icon'>📡</div>"
                + "<h2>Internet aloqasi yo'q</h2>"
                + "<p>Green Processing ERP tizimiga ulanish uchun internet tarmog'ingizni tekshiring.</p>"
                + "<button onclick=\"window.location.href='" + APP_URL + "'\">Qayta ulanish</button>"
                + "</div></body></html>";
        webView.loadDataWithBaseURL(null, offlineHtml, "text/html", "UTF-8", null);
    }

    private void requestNeededPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (Build.VERSION.SDK_INT >= 33) {
                if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
                        || checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{
                            Manifest.permission.POST_NOTIFICATIONS,
                            Manifest.permission.CAMERA
                    }, PERMISSION_REQUEST_CODE);
                }
            } else {
                if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{Manifest.permission.CAMERA}, PERMISSION_REQUEST_CODE);
                }
            }
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Green Processing Xabarnomalar",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Chat va muhim korxona bildirishnomalari");
            channel.setShowBadge(true);
            channel.enableLights(true);
            channel.setLightColor(Color.RED);
            channel.enableVibration(true);
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void showNativeNotification(String title, String body, int count) {
        try {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, flags);

            Notification.Builder builder;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                builder = new Notification.Builder(this, CHANNEL_ID);
            } else {
                builder = new Notification.Builder(this);
                builder.setPriority(Notification.PRIORITY_HIGH);
                builder.setDefaults(Notification.DEFAULT_ALL);
            }

            builder.setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title != null ? title : "Green Processing ERP")
                    .setContentText(body != null ? body : "Yangi xabar keldi")
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent)
                    .setNumber(Math.max(1, count));

            manager.notify(101, builder.build());
        } catch (Exception ignored) {
        }
    }

    public class AndroidBridge {
        @JavascriptInterface
        public void setBadge(final int count) {
            if (count == 0 && lastBadgeCount > 0) {
                NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (manager != null) {
                    manager.cancel(101);
                }
            }
            lastBadgeCount = count;
        }

        @JavascriptInterface
        public void notify(final String title, final String body) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    showNativeNotification(title, body, Math.max(1, lastBadgeCount));
                }
            });
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (filePathCallback == null) return;
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                String dataString = data.getDataString();
                if (dataString != null) {
                    results = new Uri[]{Uri.parse(dataString)};
                }
            }
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView != null && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
