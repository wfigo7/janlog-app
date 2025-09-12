# 技術スタック

## アーキテクチャ決定記録（ADR）準拠

### フロントエンド
- **フレームワーク**: Expo (React Native)
- **プラットフォーム**: クロスプラットフォームモバイル（Android/iOS）
- **言語**: TypeScript
- **ナビゲーション**: React Navigation（タブナビゲーション）
- **状態管理**: React Hooks + Context API
- **認証**: Cognito SDK

### バックエンド（ADR-0001）
- **フレームワーク**: FastAPI
- **ランタイム**: AWS Lambda + Lambda Web Adapter (LWA)
- **言語**: Python（型ヒント使用）
- **API**: RESTful API（OpenAPI 3.0.3仕様準拠）
- **API Gateway**: HTTP API（プロキシ統合）

### データベース（ADR-0002）
- **プライマリ**: Amazon DynamoDB（オンデマンド課金）
- **設計**: シングルテーブル設計（コスト最適化）
- **アクセスパターン**: GSI活用による効率的なクエリ

### 認証（ADR-0003, ADR-0005）
- **サービス**: Amazon Cognito User Pool
- **方式**: メール+パスワード
- **招待**: AdminCreateUser API使用
- **認可**: JWT Authorizer
- **環境分離**: 
  - local: 静的JWT（`mock-issuer`）
  - development: Cognito User Pool（ap-northeast-1_XBTxTbEZF）
  - production: Cognito User Pool（将来実装）

### インフラ
- **IaC**: AWS CDK
- **クラウドプロバイダー**: AWS
- **デプロイ**: GitHub Actions CI/CD
- **コスト制約**: 月額1,500円以内
- **環境分離**: 
  - local: S3スタックのみ
  - development: S3 + Cognito + API Gateway
  - production: S3 + Cognito + API Gateway（将来）

## 開発コマンド

### フロントエンド（Expo）
```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npx expo start

# Android向けビルド
npx expo build:android

# iOS向けビルド
npx expo build:ios
```

### バックエンド（FastAPI）
```bash
# 依存関係インストール
pip install -r requirements.txt

# ローカル実行（local環境）
uvicorn main:app --reload

# 静的JWT生成（local環境用）
python scripts/generate_mock_jwt.py

# テスト実行
pytest

# デプロイ
cdk deploy
```

### インフラ（CDK）
```bash
# CDK依存関係インストール
npm install

# CDK初期化（初回のみ）
cdk bootstrap

# 環境別スタックデプロイ
cdk deploy --context environment=local      # local環境
cdk deploy --context environment=development # development環境
cdk deploy --context environment=production  # production環境

# 環境別スタック削除
cdk destroy --context environment=local

# 環境別構文チェック
cdk synth --context environment=local
```

## データモデル設計

### DynamoDBシングルテーブル
```
PK: USER#{userId}
SK: MATCH#{matchId} | RULESET#{rulesetId} | PROFILE
```

### 主要エンティティ
- **MATCH**: 対局データ（日時、モード、順位、スコア等）
- **RULESET**: ルールセット（ウマ、オカ設定）
- **PROFILE**: ユーザープロフィール

## API設計原則
- OpenAPI仕様書が単一ソース
- RESTful設計
- JWT認証必須（一部エンドポイント除く）
- エラーハンドリング統一

## 非機能要件
- **コスト**: 月1,500円以内
- **利用者数**: 数人
- **レイテンシ**: 数百ms程度まで許容
- **運用**: GitHub Actions自動デプロイ