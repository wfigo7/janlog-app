# 手動テストスクリプト

このディレクトリには、APIの手動テスト用スクリプトが含まれています。

## 前提条件

1. APIサーバーが起動していること
   ```bash
   cd backend
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
   ```

2. 環境変数が設定されていること（`.env.local`ファイル）

## ディレクトリ構造

```
manual_tests/
├── README.md              # このファイル
├── test_api.py           # 基本APIテスト
└── match/                # 対局記録関連テスト
    ├── test_match_api.py        # 基本的な対局API操作
    ├── test_match_validation.py # バリデーション機能テスト
    └── test_match_crud.py       # 完全なCRUD操作テスト
```

## テストスクリプト

### 基本APIテスト
```bash
python manual_tests/test_api.py
```
- ヘルスチェックエンドポイント
- ルートエンドポイント

### 対局記録APIテスト
```bash
python manual_tests/match/test_match_api.py
```
- 対局登録
- 対局一覧取得
- 特定対局取得
- フィルター付き対局一覧取得

### バリデーションテスト
```bash
python manual_tests/match/test_match_validation.py
```
- 必須フィールドのバリデーション
- 順位の範囲チェック
- 入力方式に応じた必須フィールドチェック
- 正常データでの登録確認

### CRUD操作テスト
```bash
python manual_tests/match/test_match_crud.py
```
- 対局の作成・取得・更新・削除
- 存在しないリソースへのアクセステスト

## 全テスト実行

```bash
# backendディレクトリから実行

# 基本テスト
python manual_tests/test_api.py

# 対局記録関連テスト
python manual_tests/match/test_match_api.py
python manual_tests/match/test_match_validation.py
python manual_tests/match/test_match_crud.py
```

## 注意事項

- これらのテストは実際のDynamoDBに対してデータを作成・削除します
- テスト実行前にデータのバックアップを取ることを推奨します
- 開発環境でのみ実行してください