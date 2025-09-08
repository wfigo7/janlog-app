# ADR-0001: FastAPI on Lambda Web Adapter を採用する

## 日付
2025-09-08

## 背景
- 個人～少人数利用のMVP。月額コストは数百〜千円台に抑えたい。
- ローカル開発は FastAPI + uvicorn の快適さを活かしたい。
- 将来トラフィック増時に App Runner / ECS へ移行可能な柔軟性が欲しい。

## 決定
- バックエンドは FastAPI（ASGI）を Lambda Web Adapter (LWA) で実行し、API Gateway (HTTP API) からプロキシ統合で受ける。

## 代替案
- Lambda 関数（TS）直書き：ルーティング・構造化の拡大で保守が重くなる。
- App Runner + FastAPI：固定費が乗り、超低トラ時は割高。
- ECS Fargate + FastAPI：個人MVPにはオーバーキル（固定費・構成が重い）。

## トレードオフ
- コールドスタートは発生（数百ms〜）。必要ならプロビジョンド1で緩和可。
- WebSocketや常時接続は不得手（今回要件外）。

## 撤回条件
- 常時高RPSで Lambda 従量 > 常時稼働の固定費になる。
- 起動オーバーヘッドが UX 的に許容できなくなる（厳密SLAが必要）。
