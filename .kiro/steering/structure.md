# プロジェクト構造

## ディレクトリ構成（モノレポ）

```
/
├── spec/           # API仕様書と設計ドキュメント
│   ├── openapi.yaml    # OpenAPI 3.0.3仕様書
│   ├── context.md      # プロジェクトコンテキスト
│   └── adr/           # アーキテクチャ決定記録
├── frontend/       # Expo React Nativeアプリ
├── backend/        # FastAPI Lambdaアプリケーション
├── infra/          # AWS CDKインフラコード
├── shared/         # 共通型定義とユーティリティ
└── .kiro/          # Kiro AI設定
    ├── specs/      # 機能別仕様書
    └── steering/   # ステアリングファイル
```

## フォルダ規約

### `/spec`
- API仕様書とプロジェクトドキュメントを集約
- OpenAPI仕様がフロントエンド・バックエンド間の契約
- コンテキストドキュメントでビジネス要件を説明
- ADRでアーキテクチャ決定を記録

### `/frontend`
- Expo React Nativeアプリケーション
- TypeScript使用（型安全性のため）
- React Native・Expoベストプラクティスに従う
- 共通コンポーネントとユーティリティ

### `/backend`
- AWS Lambda用FastAPIアプリケーション
- Python（型ヒント使用）
- Lambda Web Adapter (LWA)でHTTP処理
- DynamoDBシングルテーブル設計

### `/infra`
- AWS CDKによるInfrastructure as Code
- TypeScript/Python CDK構成
- 環境別設定
- コスト最適化されたリソース定義

### `/shared`
- 共通TypeScript型定義・インターフェース
- 共通ビジネスロジック
- APIクライアント定義
- フロントエンド・バックエンド共通ユーティリティ

## ファイル命名規則
- ディレクトリ・ファイルはkebab-case使用
- TypeScriptファイルは`.ts`または`.tsx`拡張子
- Pythonファイルはsnake_case規約
- 設定ファイルはルートまたは適切な設定ディレクトリ

## インポート規約
- ローカルモジュールは相対インポート
- 共通ユーティリティは絶対インポート
- インポートグループ化：外部ライブラリ、内部モジュール、相対インポート

## 重要な設計原則
- ADR-0004に基づくモノレポ構成
- `/spec`ディレクトリでの仕様集約
- Kiroツールのデフォルト探索に対応