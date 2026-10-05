package com.starlight.azeroth_solo

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import android.provider.Settings
import androidx.core.content.FileProvider
import com.google.android.gms.auth.api.identity.AuthorizationRequest
import com.google.android.gms.auth.api.identity.ClearTokenRequest
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.Scope
import java.util.concurrent.Executors

// The Flutter host for the game. The game (JS in the WebView) talks to Dart, Dart talks to these channels.
class MainActivity : FlutterActivity() {
    // v9.6.1 removed the optional AI chat pack; free the model file an older version may have copied in (hundreds of MB)
    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        Executors.newSingleThreadExecutor().execute { try { File(filesDir, "models").deleteRecursively() } catch (_: Exception) {} }
    }

    // ---- in-app updater (v9.3): downloads a release APK from this game's GitHub repo and opens the installer
    private val updWorker = Executors.newSingleThreadExecutor()
    @Volatile private var updState = "idle"; @Volatile private var updDone = 0L; @Volatile private var updTotal = 0L; @Volatile private var updError: String? = null
    private fun updFile(): File = File(File(cacheDir, "updates").apply { mkdirs() }, "AzerothSolo-update.apk")
    // the repo is moving from azeroth-solo to realm-of-loner (v10); GitHub serves the old name as a redirect, so both are trusted
    private val repoPrefixes = listOf("https://github.com/faizal97/azeroth-solo", "https://github.com/faizal97/realm-of-loner")
    // the only pages outside the repo the game may open: its Discord and the two tip pages
    private val outsideLinks = setOf("https://discord.gg/6xaVaXukeT", "https://ko-fi.com/starlighthvn", "https://sociabuzz.com/starlighthvn/tribe")
    private fun ownRepo(url: String) = repoPrefixes.any { url == it || url.startsWith("$it/") }
    private fun ownApk(url: String) = repoPrefixes.any { url.startsWith("$it/releases/download/") } && url.endsWith(".apk")
    private fun startDownload(url: String) {
        updState = "running"; updDone = 0; updTotal = 0; updError = null
        updWorker.execute {
            try {
                var u = URL(url); var conn: HttpURLConnection
                var hops = 0
                while (true) { // follow GitHub's redirect to its asset host
                    conn = u.openConnection() as HttpURLConnection
                    conn.instanceFollowRedirects = false; conn.connectTimeout = 15000; conn.readTimeout = 30000
                    val code = conn.responseCode
                    if (code in 300..399 && hops++ < 5) { u = URL(u, conn.getHeaderField("Location")); conn.disconnect(); continue }
                    if (code != 200) throw Exception("HTTP $code")
                    break
                }
                updTotal = conn.contentLengthLong
                val tmp = File(updFile().path + ".part")
                conn.inputStream.use { input -> tmp.outputStream().use { out ->
                    val buf = ByteArray(64 * 1024)
                    while (true) { val n = input.read(buf); if (n < 0) break; out.write(buf, 0, n); updDone += n }
                } }
                if (updTotal > 0 && updDone != updTotal) throw Exception("download incomplete")
                updFile().delete(); tmp.renameTo(updFile())
                updState = "done"
            } catch (e: Exception) { updError = e.message ?: e.toString(); updState = "error" }
        }
    }
    private fun canInstall(): Boolean = Build.VERSION.SDK_INT < Build.VERSION_CODES.O || packageManager.canRequestPackageInstalls()

    // ---- save files (v9.7.1): share a save through Android's share sheet, or pick one to load
    private var pendingPick: MethodChannel.Result? = null
    private val pickRequest = 4712
    private fun savesDir(): File = File(cacheDir, "saves").apply { mkdirs() }

    @Deprecated("Deprecated in Java")
    // ---- cloud save (v10.1): Google Play services' authorisation client gives the game a Drive token for its hidden
    // app-data folder only (drive.appdata). No sign-in library and no server: Android keeps the grant and renews
    // the token itself, so backups work in the background. The JS side is CLOUD.appAuth in cloud.js.
    private val cloudScope = Scope("https://www.googleapis.com/auth/drive.appdata")
    private val cloudRequest = 4713
    private var pendingCloud: MethodChannel.Result? = null
    // "openid" (who is this, no email) is the only other scope the page may ask for: Firebase needs it. The page asks
    // for one or both (#46: Friends and cloud save in one window); anything else is ignored, and none means Drive
    private fun cloudToken(interactive: Boolean, result: MethodChannel.Result, asked: List<String>? = null) {
        val scopes = mutableListOf<Scope>()
        if (asked?.contains("openid") == true) scopes.add(Scope("openid"))
        if (asked == null || asked.contains(cloudScope.scopeUri) || scopes.isEmpty()) scopes.add(cloudScope)
        val req = AuthorizationRequest.builder().setRequestedScopes(scopes).build()
        Identity.getAuthorizationClient(this).authorize(req)
            .addOnSuccessListener { r ->
                val token = r.accessToken
                if (!r.hasResolution() && token != null) { result.success(token); return@addOnSuccessListener }
                // the player has to choose an account or allow access: only from a tap, never in the background
                val pi = r.pendingIntent
                if (!interactive || pi == null) { result.error("auth", "The Google sign-in has run out. Reconnect to carry on.", null); return@addOnSuccessListener }
                if (pendingCloud != null) { result.error("busy", "Google sign-in is already open", null); return@addOnSuccessListener }
                pendingCloud = result
                try { startIntentSenderForResult(pi.intentSender, cloudRequest, null, 0, 0, 0) }
                catch (e: Exception) { pendingCloud = null; result.error("auth", e.message ?: "Could not open Google sign-in", null) }
            }
            .addOnFailureListener { e -> result.error("auth", e.message ?: e.toString(), null) }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == cloudRequest) {
            val res = pendingCloud ?: return
            pendingCloud = null
            if (resultCode != Activity.RESULT_OK) { res.error("cancelled", "Sign-in was cancelled.", null); return }
            try {
                val token = Identity.getAuthorizationClient(this).getAuthorizationResultFromIntent(data).accessToken
                if (token == null) res.error("denied", "Cloud save needs the Google Drive permission. Try again and allow it.", null) else res.success(token)
            } catch (e: ApiException) { res.error("auth", e.message ?: "Google did not sign you in.", null) }
            return
        }
        if (requestCode != pickRequest) return
        val res = pendingPick ?: return
        pendingPick = null
        val uri: Uri? = data?.data
        if (resultCode != Activity.RESULT_OK || uri == null) { res.success(null); return }
        updWorker.execute {
            try {
                val bytes = contentResolver.openInputStream(uri).use { it!!.readBytes() }
                if (bytes.size > 8 * 1024 * 1024) throw Exception("That file is too big to be a save")
                val text = String(bytes, Charsets.UTF_8)
                runOnUiThread { res.success(text) }
            } catch (e: Exception) { runOnUiThread { res.error("read", e.message ?: e.toString(), null) } }
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "azsolo/file").setMethodCallHandler { call, result ->
            when (call.method) {
                "share" -> {
                    val name = (call.argument<String>("name") ?: "save.azsave").replace(Regex("[^A-Za-z0-9._-]"), "_")
                    val text = call.argument<String>("text") ?: ""
                    try {
                        savesDir().listFiles()?.forEach { it.delete() } // only the latest shared save is kept
                        val f = File(savesDir(), name); f.writeText(text)
                        val uri = FileProvider.getUriForFile(this, "$packageName.updates", f)
                        val send = Intent(Intent.ACTION_SEND).apply {
                            type = "application/octet-stream"
                            putExtra(Intent.EXTRA_STREAM, uri)
                            putExtra(Intent.EXTRA_SUBJECT, name)
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        }
                        startActivity(Intent.createChooser(send, "Share your save"))
                        result.success(true)
                    } catch (e: Exception) { result.error("share", e.message ?: e.toString(), null) }
                }
                "pick" -> {
                    if (pendingPick != null) { result.error("busy", "A file picker is already open", null); return@setMethodCallHandler }
                    pendingPick = result
                    val pick = Intent(Intent.ACTION_OPEN_DOCUMENT).apply { addCategory(Intent.CATEGORY_OPENABLE); type = "*/*" }
                    startActivityForResult(pick, pickRequest)
                }
                else -> result.notImplemented()
            }
        }
        // the WebView's mode (#99): "hybrid" (the default) or "texture", kept in a small file so the same phone can compare
        // both; lib/main.dart reads it when the app starts, and the page's hidden switch changes it for the next start
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "azsolo/view").setMethodCallHandler { call, result ->
            val f = File(filesDir, "webview_mode")
            when (call.method) {
                "getMode" -> result.success(try { if (f.exists() && f.readText().trim() == "texture") "texture" else "hybrid" } catch (_: Exception) { "hybrid" })
                "setMode" -> {
                    val m = call.argument<String>("mode")
                    if (m != "hybrid" && m != "texture") result.error("bad_mode", "hybrid or texture", null)
                    else { try { f.writeText(m); result.success(true) } catch (e: Exception) { result.error("write", e.message, null) } }
                }
                else -> result.notImplemented()
            }
        }
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "azsolo/cloud").setMethodCallHandler { call, result ->
            when (call.method) {
                "available" -> result.success(GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(this) == ConnectionResult.SUCCESS)
                "token" -> cloudToken(call.argument<Boolean>("interactive") == true, result, call.argument<List<String>>("scopes"))
                // an expired or refused token leaves Android's cache, so the next "token" fetches a fresh one
                "clear" -> {
                    val t = call.argument<String>("token")
                    if (t.isNullOrEmpty()) { result.success(true); return@setMethodCallHandler }
                    Identity.getAuthorizationClient(this).clearToken(ClearTokenRequest.builder().setToken(t).build())
                        .addOnSuccessListener { result.success(true) }.addOnFailureListener { result.success(false) }
                }
                else -> result.notImplemented()
            }
        }
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "azsolo/update").setMethodCallHandler { call, result ->
            when (call.method) {
                "appVersion" -> {
                    val pi = packageManager.getPackageInfo(packageName, 0)
                    result.success(mapOf("name" to pi.versionName, "code" to (if (Build.VERSION.SDK_INT >= 28) pi.longVersionCode else @Suppress("DEPRECATION") pi.versionCode.toLong())))
                }
                "download" -> {
                    val url = call.argument<String>("url") ?: ""
                    if (!ownApk(url)) { result.error("bad_url", "Only this game's GitHub release APKs can be downloaded", null); return@setMethodCallHandler }
                    if (updState == "running") { result.success(true); return@setMethodCallHandler }
                    startDownload(url); result.success(true)
                }
                "progress" -> result.success(mapOf("state" to updState, "done" to updDone, "total" to updTotal, "error" to updError))
                "canInstall" -> result.success(canInstall())
                "askInstallPermission" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:$packageName")))
                    result.success(true)
                }
                "install" -> {
                    val f = updFile()
                    if (!f.exists()) { result.error("missing", "The update has not been downloaded", null); return@setMethodCallHandler }
                    if (!canInstall()) { result.error("need_permission", "Allow Azeroth Solo to install apps first", null); return@setMethodCallHandler }
                    val uri = FileProvider.getUriForFile(this, "$packageName.updates", f)
                    startActivity(Intent(Intent.ACTION_VIEW).apply { setDataAndType(uri, "application/vnd.android.package-archive"); addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK) })
                    result.success(true)
                }
                "openUrl" -> {
                    val url = call.argument<String>("url") ?: ""
                    // only this game's own pages: its GitHub repo, its web pages (privacy), its Discord invite and its tip pages
                    if (ownRepo(url) || url in outsideLinks || url.startsWith("https://faizal97.github.io/realm-of-loner/")) startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    result.success(true)
                }
                else -> result.notImplemented()
            }
        }
    }
}
