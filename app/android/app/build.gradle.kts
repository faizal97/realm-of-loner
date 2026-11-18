import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// The release key lives outside the repo: ~/.config/realm-of-loner/key.properties (storeFile, storePassword,
// keyAlias, keyPassword). Without it a release build stops: a debug-signed APK of this package could never update.
val keyProps = Properties().apply {
    val f = file(System.getProperty("user.home") + "/.config/realm-of-loner/key.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    namespace = "com.starlighthvn.realmofloner"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        // registered in the Android Developer Console (2026-11-10) with the release key below; was com.starlight.azeroth_solo
        applicationId = "com.starlighthvn.realmofloner"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            if (keyProps.getProperty("storeFile") != null) {
                storeFile = file(keyProps.getProperty("storeFile"))
                storePassword = keyProps.getProperty("storePassword")
                keyAlias = keyProps.getProperty("keyAlias")
                keyPassword = keyProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}

// only a release package needs the key; debug builds (emulator) keep the debug key
tasks.matching { it.name == "packageRelease" }.configureEach {
    doFirst { if (keyProps.getProperty("storeFile") == null) throw GradleException("No release key: fill in ~/.config/realm-of-loner/key.properties") }
}

flutter {
    source = "../.."
}

dependencies {
    // FileProvider, for handing a downloaded update to the system installer
    implementation("androidx.core:core-ktx:1.13.1")
    // cloud save: Google's authorisation client, for a Drive token limited to the game's hidden app folder
    implementation("com.google.android.gms:play-services-auth:22.0.0")
}
