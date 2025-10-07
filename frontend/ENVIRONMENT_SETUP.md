# フロントエンド環境設定ガイド

## 環境別設定

### Local環境（ローカル開発）
- **API URL**: `http://localhost:8080`
- **認証**: モック認証（静的JWT）
- **起動コマンド**: `npm run start:local` または `npm start`

```bash
# ローカル開発サーバーを起動
npm start

# Android用
npm run android:local

# iOS用
npm run ios:local
```

### Development環境（AWS開発環境）
- **API URL**: `https://p9ujawfcfd.execute-api.ap-northeast-1.amazonaws.com`
- **認証**: Cognito認証（User Pool: `ap-northeast-1_XBTxTbEZF`）
- **起動コマンド**: `npm run start:dev`

```bash
# 開発環境に接続してExpoを起動
npm run start:dev

# Android用
npm run android:dev

# iOS用
npm run ios:dev
```

### Production環境（本番環境）
- **API URL**: 未設定（将来実装）
- **認証**: Cognito認証（本番用User Pool）
- **起動コマンド**: `npm run start:prod`

## 環境変数ファイル

### `.env.local`
ローカル開発用の設定。バックエンドは `http://localhost:8080` で起動している必要があります。

```env
EXPO_PUBLIC_ENV=local
EXPO_PUBLIC_AUTH_MODE=mock
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
EXPO_PUBLIC_MOCK_JWT=<静的JWT>
```

### `.env.development`
AWS開発環境用の設定。API GatewayとCognitoに接続します。

```env
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_AUTH_MODE=cognito
EXPO_PUBLIC_API_BASE_URL=https://p9ujawfcfd.execute-api.ap-northeast-1.amazonaws.com
EXPO_PUBLIC_COGNITO_USER_POOL_ID=ap-northeast-1_XBTxTbEZF
EXPO_PUBLIC_COGNITO_CLIENT_ID=4u37654rhubjei088dj85clscq
EXPO_PUBLIC_COGNITO_REGION=ap-northeast-1
```

## 環境の切り替え方法

### 方法1: スクリプトを使用（推奨）
```bash
# ローカル環境
npm run start:local

# 開発環境
npm run start:dev

# 本番環境
npm run start:prod
```

### 方法2: 環境変数を直接指定
```bash
# ローカル環境
EXPO_PUBLIC_ENV=local expo start

# 開発環境
EXPO_PUBLIC_ENV=development expo start
```

## 認証について

### Local環境（モック認証）
- 任意のメールアドレスとパスワードでログイン可能
- 静的JWTトークンを使用
- ユーザーID: `test-user-001`

### Development環境（Cognito認証）
- Cognito User Poolに登録されたユーザーのみログイン可能
- 管理者による招待が必要
- 実際のJWTトークンを使用

## トラブルシューティング

### API接続エラー
1. 環境変数が正しく設定されているか確認
2. バックエンドサーバーが起動しているか確認（Local環境の場合）
3. API Gateway URLが正しいか確認（Development環境の場合）

### 認証エラー
1. 環境変数の`EXPO_PUBLIC_AUTH_MODE`を確認
2. Cognito設定が正しいか確認（Development環境の場合）
3. 静的JWTが設定されているか確認（Local環境の場合）

### 環境変数が反映されない
1. Expoサーバーを再起動
2. キャッシュをクリア: `expo start -c`
3. 環境変数ファイル名を確認（`.env.local`, `.env.development`）

## 現在の設定状況

✅ Local環境: 設定完了
✅ Development環境: 設定完了（API Gateway URL更新済み）
⏳ Production環境: 未実装

## 次のステップ

1. Development環境でExpoを起動: `npm run start:dev`
2. API Gateway疎通確認
3. 認証フローのテスト
4. 対局登録・取得のテスト
