$ErrorActionPreference = "Stop"

$JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:JAVA_HOME = $JAVA_HOME
$env:PATH = "$JAVA_HOME\bin;$env:PATH"

$SDK_DIR = "C:\Users\yoqub\AppData\Local\Android\Sdk"
$BUILD_TOOLS = "$SDK_DIR\build-tools\36.0.0"
$ANDROID_JAR = "$SDK_DIR\platforms\android-35\android.jar"

$APP_DIR = "C:\Users\yoqub\OneDrive\Desktop\Obsidian\Green Processing\android-app"
$BUILD_DIR = "$APP_DIR\build"

if (Test-Path $BUILD_DIR) {
    Remove-Item -Recurse -Force $BUILD_DIR
}
New-Item -ItemType Directory -Force -Path "$BUILD_DIR\compiled_res" | Out-Null
New-Item -ItemType Directory -Force -Path "$BUILD_DIR\gen" | Out-Null
New-Item -ItemType Directory -Force -Path "$BUILD_DIR\classes" | Out-Null
New-Item -ItemType Directory -Force -Path "$BUILD_DIR\dex" | Out-Null

Write-Host "1. Compiling resources with aapt2..."
& "$BUILD_TOOLS\aapt2.exe" compile --dir "$APP_DIR\res" -o "$BUILD_DIR\compiled_res\resources.zip"

Write-Host "2. Linking resources and generating R.java..."
& "$BUILD_TOOLS\aapt2.exe" link `
    -o "$BUILD_DIR\unaligned.apk" `
    -I "$ANDROID_JAR" `
    --manifest "$APP_DIR\AndroidManifest.xml" `
    --java "$BUILD_DIR\gen" `
    "$BUILD_DIR\compiled_res\resources.zip"

Write-Host "3. Compiling Java sources with javac..."
$javaFiles = Get-ChildItem -Path "$APP_DIR\src", "$BUILD_DIR\gen" -Recurse -Filter "*.java" | ForEach-Object { $_.FullName }
& "$JAVA_HOME\bin\javac.exe" -source 11 -target 11 -encoding UTF-8 -cp "$ANDROID_JAR" -d "$BUILD_DIR\classes" $javaFiles

Write-Host "4. Converting classes to DEX with d8..."
$classFiles = Get-ChildItem -Path "$BUILD_DIR\classes" -Recurse -Filter "*.class" | ForEach-Object { $_.FullName }
& "$BUILD_TOOLS\d8.bat" --lib "$ANDROID_JAR" --min-api 24 --output "$BUILD_DIR\dex" $classFiles

Write-Host "5. Packaging classes.dex into APK..."
& "$JAVA_HOME\bin\jar.exe" uf "$BUILD_DIR\unaligned.apk" -C "$BUILD_DIR\dex" classes.dex

Write-Host "6. Aligning APK with zipalign..."
& "$BUILD_TOOLS\zipalign.exe" -f -p 4 "$BUILD_DIR\unaligned.apk" "$BUILD_DIR\aligned.apk"

Write-Host "7. Signing APK with apksigner..."
$KEYSTORE = "$APP_DIR\release-key.jks"
if (-not (Test-Path $KEYSTORE)) {
    & "$JAVA_HOME\bin\keytool.exe" -genkeypair `
        -v -keystore $KEYSTORE `
        -alias greenprocessing `
        -keyalg RSA -keysize 2048 -validity 10000 `
        -storepass "green2026" -keypass "green2026" `
        -dname "CN=Green Processing ERP, OU=IT, O=Green Processing LLC, L=Tashkent, ST=Tashkent, C=UZ"
}

$FINAL_APK = "$APP_DIR\Green Processing ERP.apk"
& "$BUILD_TOOLS\apksigner.bat" sign `
    --ks $KEYSTORE `
    --ks-key-alias greenprocessing `
    --ks-pass pass:green2026 `
    --key-pass pass:green2026 `
    --v1-signing-enabled true `
    --v2-signing-enabled true `
    --v3-signing-enabled true `
    --out $FINAL_APK `
    "$BUILD_DIR\aligned.apk"

Write-Host "8. Verifying APK signature..."
& "$BUILD_TOOLS\apksigner.bat" verify --verbose $FINAL_APK

Copy-Item $FINAL_APK -Destination "C:\Users\yoqub\OneDrive\Desktop\Green Processing ERP.apk" -Force
Write-Host "SUCCESS! APK built and copied to Desktop."
