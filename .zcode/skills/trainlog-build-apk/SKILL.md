---
name: trainlog-build-apk
description: 构建 TrainLog 安卓签名 release APK。当用户说"打包"、"构建安装包"、"出个 APK"、"重新打个包"时使用。涵盖工具链自检（JDK 21 / Android SDK 项目内自举）、web 构建、Capacitor 同步、Gradle 签名打包、产物分发全流程。
---

# TrainLog APK 打包流程

把当前 web 版 TrainLog 打成**签名 release APK** 并提供下载链接。全程约 3 分钟（工具链齐备时）。

## 前置事实（先记住，能少踩坑）

- 本项目 `android/` 整个目录被 `.gitignore` 忽略，**签名配置在 `android/app/build.gradle` 的 signingConfigs 块里（仅本机存在）**，keystore 在仓库根 `trainlog-release.keystore`（同样 gitignore）。若 `android/` 不存在（新克隆机器），先 `npx cap add android` 再按下文恢复签名块。
- **绝不要把 SDK 装到 `C:\Android`**——该目录普通权限写不进去，组件下载后落不了盘，Gradle 会一直报缺组件且无直观错误。
- `android/local.properties` 的 `sdk.dir` **必须用正斜杠**（`C:/train/.tooling/android-sdk`），反斜杠转义在 Git Bash 的 printf 下会坏，报"文件名、目录名或卷标语法不正确"。
- Gradle 必须有 `JAVA_HOME`，且指向 JDK 21（Gradle 8.14 + AGP 8.13 要求）。
- 产物签名指纹应为 `0b124970…`（SHA-256 `0b1249705f44afa319c0e98e67b7102aa3ac44cb31e255a35233ff7939e5a901`），与历史版本一致才能覆盖安装。

## 第 0 步：工具链自检（只在缺失时做）

检查 `.tooling/` 下是否有 JDK 和 SDK：

```bash
ls /c/train/.tooling/jdk-*/bin/java.exe        # JDK 21
ls /c/train/.tooling/android-sdk/platforms     # 应有 android-36
```

若缺失，自举工具链（下载约 330 MB，几分钟）：

```bash
mkdir -p /c/train/.tooling
cd /c/train/.tooling
curl -sL -o jdk21.zip "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse"
curl -sL -o cmdtools.zip "https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip"
unzip -q jdk21.zip
mkdir -p android-sdk/cmdline-tools
unzip -q cmdtools.zip -d ctt && cp -r ctt/cmdline-tools android-sdk/cmdline-tools/latest

export JAVA_HOME="C:/train/.tooling/jdk-21.0.12.1+1"   # 按实际解压出的目录名
yes | android-sdk/cmdline-tools/latest/bin/sdkmanager.bat --licenses
yes | android-sdk/cmdline-tools/latest/bin/sdkmanager.bat "platforms;android-36" "build-tools;35.0.0" "platform-tools"
```

**验证组件真的落盘了**：`ls android-sdk/` 必须看到 `build-tools`、`platforms`、`platform-tools`、`licenses` 四个目录都在，缺一个都会在 Gradle 阶段炸。

## 第 1 步：构建 web 并同步

```bash
cd /c/train
npm run build && npx cap sync android
```

## 第 2 步：确认 local.properties 与签名

```bash
echo "sdk.dir=C:/train/.tooling/android-sdk" > android/local.properties
```

确认 `android/app/build.gradle` 的 `android {}` 块内含 signingConfigs（storeFile 指向 `../../trainlog-release.keystore`，密码本机自持，缺失时问用户要）。发新版时顺手把 `versionCode` +1。

## 第 3 步：Gradle 打包

```bash
cd /c/train/android
cmd //c "set JAVA_HOME=C:\train\.tooling\jdk-21.0.12.1+1&& gradlew.bat assembleRelease --no-daemon"
```

产物：`android/app/build/outputs/apk/release/app-release.apk`（约 3 MB）。

## 第 4 步：验签

```bash
export JAVA_HOME="C:/train/.tooling/jdk-21.0.12.1+1"
export PATH="/c/train/.tooling/android-sdk/build-tools/35.0.0:$PATH"
apksigner.bat verify --print-certs app/build/outputs/apk/release/app-release.apk | head -2
```

SHA-256 指纹必须是 `0b124970…`（上文完整值）。

## 第 5 步：分发

```bash
cp android/app/build/outputs/apk/release/app-release.apk dist-apk/trainlog-apk/trainlog.apk   # 项目惯例位置
cp android/app/build/outputs/apk/release/app-release.apk dist/trainlog.apk                   # 供 preview 服务器下载
```

**警告：绝不把 APK 放进 `public/`**——vite 会把 public/ 打进下一次构建产物，APK 套 APK 体积滚雪球（实测 3.2MB→6.2MB）。

下载链接走 preview 服务器（服务 dist/，gitignored 无污染）：

```bash
(npm run preview -- --port 4173 > /tmp/preview.log 2>&1 &)
curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/trainlog.apk   # 确认 200 再交付
```

交付链接：`http://localhost:4173/trainlog.apk`
