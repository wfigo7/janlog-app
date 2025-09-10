# Janlog Shared

フロントエンド・バックエンド間で共有される型定義とユーティリティ

## 概要

Janlog Sharedは、TypeScript型定義、共通ビジネスロジック、ユーティリティ関数を提供するパッケージです。

## 主要機能

- API型定義（OpenAPI仕様から生成）
- 共通バリデーション関数
- 日付・時刻ユーティリティ
- 麻雀スコア計算ロジック
- 定数定義

## 技術スタック

- **言語**: TypeScript
- **ビルド**: tsc (TypeScript Compiler)
- **テスト**: Jest
- **型生成**: OpenAPI Generator

## 開発環境セットアップ

### インストール

```bash
# プロジェクトルートから
npm install

# または直接このディレクトリで
cd shared
npm install
```

### ビルド

```bash
# プロジェクトルートから
npm run build:shared

# または直接このディレクトリで
cd shared
npm run build
```

### テスト実行

```bash
# プロジェクトルートから
npm run test:shared

# または直接このディレクトリで
cd shared
npm test
```

## 使用方法

### フロントエンドでの使用

```typescript
import { Match, GameMode, calculateScore } from '@janlog/shared';

const match: Match = {
  matchId: 'match-001',
  gameMode: GameMode.FOUR,
  // ...
};

const score = calculateScore(match);
```

### バックエンドでの使用

```python
# Python側では型定義のみ参照
# 実装はPydanticモデルで行う
```

## ディレクトリ構造

```
shared/
├── src/
│   ├── types/          # 型定義
│   │   ├── api.ts      # API関連型
│   │   ├── match.ts    # 対局関連型
│   │   └── user.ts     # ユーザー関連型
│   ├── utils/          # ユーティリティ関数
│   │   ├── date.ts     # 日付処理
│   │   ├── score.ts    # スコア計算
│   │   └── validation.ts # バリデーション
│   ├── constants/      # 定数定義
│   │   ├── game.ts     # ゲーム関連定数
│   │   └── rules.ts    # ルール関連定数
│   └── index.ts        # エクスポート
├── dist/               # ビルド出力
└── __tests__/          # テストファイル
```

## 型生成

OpenAPI仕様から型定義を自動生成：

```bash
# API型定義の生成
npm run generate:types
```

## パッケージ公開

```bash
# バージョンアップ
npm version patch|minor|major

# ビルド
npm run build

# 公開（npmレジストリまたはプライベートレジストリ）
npm publish
```

## 関連ドキュメント

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)