# ADR-0005: 環境分離戦略

## 状況
開発環境と本番環境で認証基盤やデータストアを分離する必要がある。また、ローカル開発での効率性と本番環境での安全性を両立する必要がある。

## 決定

### 環境構成
- **local**: 開発者のローカル環境（静的JWT認証）
- **development**: 開発・テスト・MVP公開環境（実際のCognito認証）
- **production**: 本番環境（将来実装、設計のみ準備）

### 認証方式
- **local**: 静的JWT注入モード（開発効率と本番互換性のバランス）
- **development/production**: Cognito User Pool JWT認証

### リソース命名規則
- 統一規則: `janlog-{resource}-{environment}`
- 環境名は略称を使わず `local`, `development`, `production` で統一

### デプロイ戦略
- 当面: mainブランチ → development環境（GitHub Actions自動デプロイ）
- 将来: mainブランチ → production環境（承認付きデプロイ）

詳細な設定マトリクスは [環境仕様マトリクス](/spec/env-matrix.md) を参照。

## 根拠
- **本番データ汚染防止**: 環境分離により本番データの安全性を確保
- **開発効率**: local環境での静的JWT使用により認証フローをスキップしつつ本番互換性を維持
- **MVP戦略**: development環境を実際のユーザー公開に使用し、production環境は必要時に構築
- **運用負荷軽減**: 統一された命名規則とデプロイ戦略により運用を簡素化

## 影響
- CDKスタックの環境別分離が必要
- バックエンド・フロントエンドの環境設定管理が必要
- GitHub Actionsでの環境別デプロイ設定が必要
