# テスト実行スクリプト

このプロジェクトには、フロントエンド、バックエンド、インフラのテストを簡単に実行できるスクリプトが用意されています。

## 使用方法

### Linux/macOS/Windows (Bash)

```bash
# 実行権限を付与（初回のみ - Linux/macOSのみ）
chmod +x test.sh

# 全てのテストを実行
./test.sh

# 特定のコンポーネントのテストのみ実行
./test.sh frontend
./test.sh backend
./test.sh infra

# 複数のコンポーネントを指定
./test.sh frontend backend

# ヘルプを表示
./test.sh --help
```

**注意**: Windows環境では Git Bash を使用してください。PowerShellでは動作しません。

## 各コンポーネントのテスト内容

### フロントエンド (`frontend`)
- **テストフレームワーク**: Jest + React Native Testing Library
- **対象**: React Native/Expoコンポーネント、ユーティリティ関数
- **実行内容**:
  - 依存関係の自動インストール（必要に応じて）
  - TypeScript型チェック (`npm run type-check`)
  - ESLint (`npm run lint`)
  - Jestテストの実行 (`npm test`)
  - コンポーネントの単体テスト
  - ユーティリティ関数のテスト

### バックエンド (`backend`)
- **テストフレームワーク**: pytest
- **対象**: FastAPI アプリケーション、サービス、モデル
- **実行内容**:
  - 仮想環境の自動作成・アクティベート
  - 依存関係の自動インストール
  - pytestによる単体テスト・統合テスト
  - API エンドポイントのテスト
  - ビジネスロジックのテスト

### インフラ (`infra`)
- **テストフレームワーク**: CDK構文チェック + Jest（設定されている場合）
- **対象**: AWS CDK スタック、構成
- **実行内容**:
  - 依存関係の自動インストール
  - TypeScript型チェック (`npm run type-check`)
  - ESLint (`npm run lint`)
  - CDKテスト (`npm test`) または CDK構文チェック (`npm run synth:local`, `npm run synth:dev`)

## 前提条件

### 共通
- Node.js (v22以上推奨)
- npm または yarn

### バックエンド
- Python 3.12以上
- pip

### インフラ
- AWS CDK CLI
- AWS CLI（設定済み）

## トラブルシューティング

### 権限エラー (Linux/macOS)
```bash
chmod +x test.sh
```

### 依存関係エラー
各コンポーネントのディレクトリで手動で依存関係をインストール：

```bash
# フロントエンド
cd frontend && npm install

# バックエンド
cd backend && pip install -r requirements.txt

# インフラ
cd infra && npm install
```

### 仮想環境エラー (バックエンド)
手動で仮想環境を作成：

```bash
cd backend
python -m venv venv

# Linux/macOS
source venv/bin/activate

# Windows (Git Bash)
source venv/Scripts/activate

# Windows (PowerShell)
venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

**注意**: test.shスクリプトは自動でクロスプラットフォーム対応の仮想環境アクティベートを行います。

## CI/CD での使用

GitHub Actions などの CI/CD パイプラインでも使用できます：

```yaml
# .github/workflows/test.yml の例
- name: Run all tests
  run: ./test.sh

- name: Run frontend tests only
  run: ./test.sh frontend
```

## カスタマイズ

スクリプトは必要に応じてカスタマイズできます：

- テスト対象の追加
- 環境変数の設定
- 追加のチェック処理
- 通知機能の追加

詳細は `test.sh`ファイルを参照してください。