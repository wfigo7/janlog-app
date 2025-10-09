# Janlog アプリビルド手順

このドキュメントでは、Janlogアプリをビルドして実機にインストールする手順を説明します。

## 前提条件

### 1. Expoアカウントの作成
まだアカウントがない場合は、[Expo公式サイト](https://expo.dev/)でアカウントを作成してください。

### 2. EAS CLIのインストール
```bash
npm install -g eas-cli
```

### 3. Expoにログイン
```bash
npx expo login
```
または
```bash
eas login
```

## 初回セットアップ

### プロジェクトの初期化
```bash
cd frontend
eas project:init
```

このコマンドを実行すると、Expoプロジェクトが作成され、`app.json`に`extra.eas.projectId`が追加されます。

## ビルド方法

### Android APKビルド（開発用）

開発用ビルドは、デバッグ機能が有効で、開発中のテストに適しています。

```bash
cd frontend
eas build --platform android --profile development
```

### Android APKビルド（配布用）

配布用ビルドは、最適化されたAPKで、他の人に配布する際に使用します。

```bash
cd frontend
eas build --platform android --profile preview
```

### ビルドの進行状況確認

ビルドはクラウド上で実行されます。進行状況は以下で確認できます：
- コマンドラインに表示されるURL
- [Expo Dashboard](https://expo.dev/)

ビルド完了まで、初回は15〜30分、2回目以降は5〜15分程度かかります。

## インストール方法

### 方法1: QRコードでダウンロード（推奨）

1. ビルド完了後、QRコードが表示されます
2. Android端末のカメラアプリでQRコードをスキャン
3. ブラウザが開き、APKダウンロードページが表示されます
4. 「Download」をタップしてAPKをダウンロード
5. ダウンロード完了後、APKファイルをタップしてインストール

### 方法2: URLで直接ダウンロード

1. ビルド完了後に表示されるURLをコピー
2. Android端末のブラウザでURLを開く
3. APKをダウンロードしてインストール

### 方法3: Expo Dashboardからダウンロード

1. [Expo Dashboard](https://expo.dev/)にアクセス
2. プロジェクトを選択
3. 「Builds」タブを開く
4. 該当のビルドを選択
5. 「Download」ボタンからAPKをダウンロード

## インストール時の注意事項

### 「提供元不明のアプリ」警告について

APKを直接インストールする場合、Androidの設定で「提供元不明のアプリのインストール」を許可する必要があります。

1. APKをタップしてインストールを試みる
2. 「この提供元のアプリをインストールすることはできません」と表示される
3. 「設定」をタップ
4. 「この提供元を許可」をONにする
5. 戻ってインストールを続行

## ビルドプロファイルの説明

### development
- **用途**: 開発中のテスト
- **特徴**: デバッグ機能フル、サイズ大きい
- **配布**: 不向き

### preview
- **用途**: テスト配布、友人への共有
- **特徴**: デバッグ機能一部、サイズ中程度
- **配布**: 適している

### production
- **用途**: 本番リリース（将来用）
- **特徴**: 最適化済み、サイズ小さい
- **配布**: Google Play Store用

## トラブルシューティング

### ビルドが失敗する場合

1. **依存関係のエラー**
   ```bash
   cd frontend
   npm install
   ```

2. **EAS CLIのバージョンが古い**
   ```bash
   npm install -g eas-cli@latest
   ```

3. **認証エラー**
   ```bash
   eas logout
   eas login
   ```

4. **Buffer モジュールエラー**
   
   `react-native-svg`や`react-native-chart-kit`使用時に以下のエラーが発生する場合：
   ```
   Error: Unable to resolve module buffer from .../react-native-svg/src/utils/fetchData.ts
   ```
   
   **解決方法**: 
   - `buffer`パッケージがインストールされていることを確認
   - `metro.config.js`でbufferエイリアスが設定されていることを確認
   - `app/_layout.tsx`でグローバルBufferポリフィルが設定されていることを確認
   
   **設定内容**:
   ```javascript
   // metro.config.js
   const { getDefaultConfig } = require('expo/metro-config');
   const config = getDefaultConfig(__dirname);
   config.resolver.alias = {
     ...config.resolver.alias,
     buffer: 'buffer',
   };
   ```
   
   ```typescript
   // app/_layout.tsx (最上部)
   import { Buffer } from 'buffer';
   global.Buffer = Buffer;
   ```

### インストールできない場合

1. **ストレージ容量不足**: 空き容量を確保してください
2. **古いバージョンが残っている**: 既存のJanlogアプリをアンインストールしてから再インストール
3. **Android バージョンが古い**: Android 5.0以上が必要です

## 更新方法

アプリを更新する場合：

1. `app.json`の`version`と`android.versionCode`を更新
   ```json
   {
     "expo": {
       "version": "1.0.1",
       "android": {
         "versionCode": 2
       }
     }
   }
   ```

2. 再度ビルドを実行
   ```bash
   eas build --platform android --profile preview
   ```

3. 新しいAPKをダウンロードしてインストール（上書きインストール）

## コスト

- **EAS Build**: 月30ビルドまで無料
- **APK配布**: 完全無料
- **ストレージ**: Expo Dashboardに保存（無料枠あり）

## 技術的な詳細

### Node.js Polyfills

このアプリでは、React Native環境でNode.jsモジュールを使用するため、以下のpolyfillを設定しています：

- **buffer**: `react-native-svg`が内部で使用するNode.jsの`Buffer`クラス
- **url**: URLパースのためのpolyfill（`react-native-url-polyfill`）
- **crypto**: 暗号化機能のためのpolyfill（`react-native-get-random-values`）

### Metro Bundler設定

`metro.config.js`では以下の設定を行っています：

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Node.js polyfills
config.resolver.alias = {
  ...config.resolver.alias,
  buffer: 'buffer',
};

// プラットフォームサポート
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
```

### グローバルPolyfill

`app/_layout.tsx`でランタイム時にグローバルオブジェクトを設定：

```typescript
// Buffer polyfill for react-native-svg
import { Buffer } from 'buffer';
global.Buffer = Buffer;
```

これにより、`react-native-chart-kit` → `react-native-svg` → `buffer`の依存関係チェーンが正常に動作します。

## 参考リンク

- [Expo EAS Build公式ドキュメント](https://docs.expo.dev/build/introduction/)
- [Android APKビルド](https://docs.expo.dev/build-reference/apk/)
- [Expo Dashboard](https://expo.dev/)
- [Metro Configuration](https://docs.expo.dev/guides/customizing-metro/)
- [React Native Polyfills](https://github.com/facebook/react-native/tree/main/packages/polyfills)
