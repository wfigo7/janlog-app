# 統合設計書

## 概要

Janlogは、個人の麻雀成績を記録・管理するモバイルアプリです。このドキュメントは、プロジェクト全体の実装設計を統合管理する「正」の仕様書です。

システム全体のアーキテクチャ、技術スタック、ADRについては `architecture.md` を参照してください。

## コンポーネントとインターフェース

### フロントエンドコンポーネント

#### 画面構成

1. **認証画面**
   - ログイン画面
   - パスワード変更画面（初回/通常共通）

2. **メイン画面（タブナビゲーション）**
   - 統計画面（トップ画面）
   - 履歴画面
   - 対局登録画面
   - ルール管理画面

3. **プロフィール画面**
   - ユーザー情報表示
   - パスワード変更オプション
   - ログアウト

#### コンポーネント設計

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── ChangePasswordScreen.tsx
│   ├── stats/
│   │   ├── StatsScreen.tsx
│   │   └── StatsCard.tsx
│   ├── history/
│   │   ├── HistoryScreen.tsx
│   │   ├── MatchList.tsx
│   │   └── MatchDetail.tsx
│   ├── match/
│   │   ├── MatchRegistrationScreen.tsx
│   │   ├── EntryMethodSelector.tsx
│   │   ├── RuleSelector.tsx
│   │   ├── MatchDatePicker.tsx
│   │   └── PointCalculationDisplay.tsx
│   ├── admin/
│   │   ├── RuleManagementScreen.tsx
│   │   └── RuleForm.tsx
│   └── common/
│       ├── DatePicker.tsx
│       ├── LoadingSpinner.tsx
│       ├── ErrorMessage.tsx
│       └── HeaderGameModeSelector.tsx
├── contexts/
│   └── GameModeContext.tsx
├── services/
│   ├── api.ts
│   ├── auth.ts
│   └── storage.ts
├── types/
│   ├── match.ts
│   ├── stats.ts
│   ├── rule.ts
│   └── user.ts
└── utils/
    ├── calculations.ts
    └── validation.ts
```

### バックエンドAPI設計

#### エンドポイント構成

```
/api/v1/
├── auth/
│   ├── POST /invite          # Cognito招待（管理者のみ）
│   └── GET  /me              # ユーザー情報取得
├── matches/
│   ├── GET    /              # 対局一覧取得
│   ├── POST   /              # 対局登録
│   ├── PUT    /{matchId}     # 対局更新
│   └── DELETE /{matchId}     # 対局削除
├── stats/
│   └── GET /summary          # 成績サマリ取得
└── rulesets/
    ├── GET    /              # ルールセット一覧取得（グローバル+個人）
    ├── POST   /              # ルールセット作成
    ├── PUT    /{rulesetId}   # ルールセット更新
    ├── DELETE /{rulesetId}   # ルールセット削除
    ├── POST /calculate       # ポイント計算（プレビュー用）
    ├── GET  /templates       # ルールテンプレート一覧取得
    └── GET  /rule-options    # ルール選択肢一覧取得（UI用）
```

#### ポイント計算ロジック

**基本計算式：**
```
最終ポイント = (素点 - 基準点) / 1000 + ウマ + オカ
```

**ウマとオカの概念：**
- **ウマ**: 順位間の点数差（整数、例：「10-30」= [+30, +10, -10, -30]）
- **オカ**: トップ者が総取りするボーナスポイント（整数、通常は (基準点-開始点)×人数）
- 最終ポイントは1000点単位で計算し、小数点第1位まで表示

**ウマ計算方式：**
- **useFloatingUma=false**: 固定ウマ配列を使用（Mリーグ、フリー雀荘など）
- **useFloatingUma=true**: 浮き人数（基準点以上の人数）によってウマが変動（日本プロ麻雀連盟）

**将来拡張（浮きウマルール）:**
- 浮き人数を計算: 基準点以上の素点を持つ人数をカウント
- useFloatingUma=trueの場合、umaMatrixから該当する浮き人数のウマ配列を取得
- useFloatingUma=falseの場合、標準のuma配列を使用

**ルール管理API拡張:**
- **GET /rulesets/templates**: よく使われるルールセットのテンプレート一覧
  - Mリーグルール、フリー雀荘標準ルール、競技麻雀ルールなど
- **GET /rulesets/rule-options**: UI用のルール選択肢一覧
  - 戦略ルール、進行ルール、追加ルールの選択肢とデフォルト値

**Mリーグルール（4人麻雀）の具体例：**
- ルール: 25000点持ち30000点返し、ウマ「10-30」（ワンスリー）、オカ+20
- オカ計算: (30000-25000)×4人 / 1000 = +20

**計算例1（4人麻雀）:**
1位: 素点45100点 → (45100-30000)/1000 + 30 + 20 = 15.1 + 30 + 20 = +65.1pt
2位: 素点32400点 → (32400-30000)/1000 + 10 + 0 = 2.4 + 10 + 0 = +12.4pt
3位: 素点14700点 → (14700-30000)/1000 + (-10) + 0 = -15.3 + (-10) + 0 = -25.3pt
4位: 素点7800点 → (7800-30000)/1000 + (-30) + 0 = -22.2 + (-30) + 0 = -52.2pt
※点数合計: 100000点、ポイント合計: 0pt

**計算例2（3人麻雀）:**
- ルール: 35000点持ち40000点返し、ウマ「20」、オカ+15
- オカ計算: (40000-35000)×3人 / 1000 = +15
- ウマ配列: [+20, 0, -20]

1位: 素点52300点 → (52300-40000)/1000 + 20 + 15 = 12.3 + 20 + 15 = +47.3pt
2位: 素点38900点 → (38900-40000)/1000 + 0 + 0 = -1.1 + 0 + 0 = -1.1pt
3位: 素点13800点 → (13800-40000)/1000 + (-20) + 0 = -26.2 + (-20) + 0 = -46.2pt
※点数合計: 105000点、ポイント合計: 0pt

**計算例3（仮ポイント方式）:**
- ルール: Mリーグルール（25000点持ち30000点返し、ウマ「10-30」、オカ+20）
- 仮素点: 開始点25000 + 増減値を使用

1位: 仮素点40000点(25000+15000) → (40000-30000)/1000 + 30 + 20 = 10.0 + 30 + 20 = +60.0pt
2位: 仮素点30000点(25000+5000) → (30000-30000)/1000 + 10 + 0 = 0.0 + 10 + 0 = +10.0pt
3位: 仮素点20000点(25000-5000) → (20000-30000)/1000 + (-10) + 0 = -10.0 + (-10) + 0 = -20.0pt
4位: 仮素点10000点(25000-15000) → (10000-30000)/1000 + (-30) + 0 = -20.0 + (-30) + 0 = -50.0pt
※仮点数合計: 100000点、ポイント合計: 0pt

#### サービス層設計

```
backend/
├── app/
│   ├── main.py               # FastAPI + LWA アプリケーション
│   ├── models/
│   │   ├── match.py
│   │   ├── ruleset.py
│   │   ├── user.py
│   │   └── stats.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── match_service.py
│   │   ├── ruleset_service.py
│   │   ├── stats_service.py
│   │   └── cognito_service.py
│   ├── repositories/
│   │   └── dynamodb_repository.py  # シングルテーブル用リポジトリ
│   ├── utils/
│   │   ├── calculations.py
│   │   ├── validators.py
│   │   ├── decorators.py
│   │   └── dynamodb_utils.py
│   └── config/
│       └── settings.py
├── requirements.txt
└── lambda_function.py        # LWA エントリーポイント
```


## データモデル

### DynamoDBシングルテーブル設計

ADR-0002に基づき、シングルテーブル設計を採用します。

#### メインテーブル（janlog-table-{environment}）

```
| PK (Partition Key) | SK (Sort Key)       | エンティティタイプ   |
| ------------------ | ------------------- | -------------------- |
| USER#{userId}      | MATCH#{matchId}     | 対局データ           |
| USER#{userId}      | RULESET#{rulesetId} | ルールセット         |
| USER#{userId}      | VENUE#{venueId}     | 会場データ           |
| USER#{userId}      | PROFILE             | ユーザープロフィール |
```

#### 対局データ（MATCH）

```
PK: USER#{userId}
SK: MATCH#{matchId}
Attributes:
- entityType: "MATCH"
- date (ISO datetime) # 実際の対局日（ユーザー選択日付+00:00:00時刻、必須）
- gameMode (three | four)
- entryMethod (rank_plus_points | rank_plus_raw | provisional_rank_only)
- rulesetId (ルールセットID)
- rank (1-4)
- finalPoints (number, nullable) # 小数点第1位まで（例：+50.0, +11.2）
- rawScore (integer, nullable)
- chipCount (integer, nullable)
- venueId (string, nullable)
- memo (string, nullable)
- createdAt (ISO datetime) # データ作成日時（システム自動設定）
- updatedAt (ISO datetime) # データ更新日時（システム自動設定）
```

#### 会場データ（VENUE）

```
PK: USER#{userId}
SK: VENUE#{venueId}
Attributes:
- entityType: "VENUE"
- venueId (string) # UUID
- venueName (string) # 表示名（例：「雀荘A」「友人宅」）
- usageCount (number) # 使用回数（ソート用）
- lastUsedAt (ISO datetime) # 最終使用日時
- createdAt (ISO datetime) # データ作成日時（システム自動設定）
- updatedAt (ISO datetime) # データ更新日時（システム自動設定）
```

#### 入力バリデーションルール

**対局日（date）:**
- 形式: ISO 8601形式（例: 2024-03-15T00:00:00+09:00）
- 範囲: 過去5年以内〜現在日付まで
- 必須項目
- 未来の日付は選択不可
- 5年以上前の日付は選択不可
- 時刻は自動で00:00:00に設定

**順位（rank）:**
- 範囲: 1〜3（3人麻雀）、1〜4（4人麻雀）
- 必須項目

**素点（rawScore）:**
- 範囲: -999900〜999900
- 単位: 100点単位（下2桁は00固定）
- 例: 45000, -18000, 32100（有効）/ 4500, 123（無効）
- 入力方式が`rank_plus_raw`の場合に必須

**最終ポイント（finalPoints）:**
- 範囲: -999.9〜999.9
- 精度: 小数点第1位まで
- 例: +25.0, -15.5, 100.0（有効）/ 1000.0, -1500.5（無効）
- 入力方式が`rank_plus_points`の場合に必須

**入力方式（entryMethod）:**
- `rank_plus_points`: 順位+最終ポイント直接入力
- `rank_plus_raw`: 順位+素点入力（自動ポイント計算）
- `provisional_rank_only`: 順位のみ（仮ポイント計算）

#### 仮ポイント入力方式（provisional_rank_only）の詳細設計

**概要:**
順位のみを入力し、固定の仮素点を使用してポイント計算を行う方式。素点を忘れた場合や、大まかな成績記録に使用する。

**仮素点の計算方式:**
### 4人麻雀
- 1位: 開始点 + 15000点
- 2位: 開始点 + 5000点  
- 3位: 開始点 - 5000点
- 4位: 開始点 - 15000点
### 3人麻雀
- 1位: 開始点 + 15000点
- 2位: 開始点 + 0点
- 3位: 開始点 - 15000点

**設計原則:**
- ゲームモード（3人麻雀/4人麻雀）に応じた同じ増減値を使用
- ルールセットの開始点に応じて適切な仮素点を計算
- バックエンドとフロントエンドで同じ計算ロジックを使用

**計算フロー:**
1. ユーザーが順位のみを入力
2. システムが選択されたルールセットの開始点を取得
3. 順位に対応する増減値を開始点に加算して仮素点を計算
4. 選択されたルールセット（ウマ・オカ）を使用してポイント計算
5. 計算結果を「仮ポイント」として表示
6. 仮計算であることを明示する警告メッセージを表示

**UI表示:**
- 入力方式選択: 「順位のみ」
- セクションタイトル: 「順位のみ入力」
- 説明文: 「順位のみで仮のポイントを計算します。開始点からの増減: 1位(+15000), 2位(+5000), 3位(-5000), 4位(-15000)」
  - 3人麻雀の場合は説明を合わせて変更
- 計算結果タイトル: 「計算結果（順位のみ）」
- 警告メッセージ: 「※ これは仮の計算結果です。実際の素点とは異なる場合があります。」

**バックエンド実装:**
- `PointCalculator.calculate_provisional_points()` メソッドで開始点からの増減値を使用
- 対局作成時に `_calculate_provisional_score()` で自動計算
- 計算結果に `isProvisional: true` フラグを設定

**フロントエンド実装:**
- `calculateProvisionalPointsAutomatically()` 関数で開始点からの増減
- 順位入力時の自動計算（300msデバウンス）
- 計算結果の詳細表示（仮素点、基本計算、ウマ、オカ）

**バリデーション:**
- 順位の範囲チェック（1-3位または1-4位）
- ルールセット選択必須
- 無効な順位では計算を実行しない

**エラーハンドリング:**
- 計算API呼び出し失敗時は結果を非表示
- ルールセット未選択時は計算を実行しない
- 入力方式変更時は計算結果をクリア

#### ルールセットデータ（RULESET）

```
PK: USER#{userId} | GLOBAL
SK: RULESET#{rulesetId}
Attributes:
- entityType: "RULESET"
- ruleName (string)
- gameMode (three | four)

# ポイント計算関連ルール
- startingPoints (number) # 開始点（例：25000）
- basePoints (number) # 基準点（例：30000）
- useFloatingUma (boolean) # 浮きウマを使用するかどうか（false=固定ウマ、true=浮き人数別ウマ）
- uma (array of numbers) # 標準ウマ配列（整数）3人:[+20, 0, -20] 4人:[+30, +10, -10, -30]
- umaMatrix (object, nullable) # 浮き人数別ウマ表（useFloatingUma=trueの場合に使用）
- oka (number) # オカポイント（整数、1位が総取り、通常+20 or +15）
- useChips (boolean) # チップを使用するかどうか（true=チップあり、false=チップなし、デフォルト: false）

# 基本ルール（卓につく前に確認する重要ルール）
- basicRules (object, nullable) # 戦略に影響する基本ルール（例：赤牌、喰いタンなど）

# 進行ルール（卓で進行中に気になる細かいルール）
- gameplayRules (object, nullable) # ゲーム進行の細かいルール（例：途中流局、ダブロンなど）

# 追加ルール（その他の細かい設定）
- additionalRules (array of objects, nullable) # 自由設定可能な追加ルール

**データ拡張の考慮事項：**
- 各ルールオブジェクトはnullable設計
- 既存データは各ルールフィールドがnullまたは空オブジェクト
- 将来の項目追加時は、既存データに影響なし（デフォルト値で補完）
- アプリケーション側でnullチェックとデフォルト値設定を実装

- memo (string, nullable) # 任意メモ（例：「○○店ルール」）
- isGlobal (boolean) # 管理者作成の全員共通ルール
- createdBy (userId) # 作成者ID
- createdAt (ISO datetime)
- updatedAt (ISO datetime)
```

**umaMatrix構造例（将来拡張用）:**
```json
{
  "0": [0, 0, 0, 0],      // 浮き0人
  "1": [12, -1, -3, -8],  // 浮き1人
  "2": [8, 4, -4, -8],    // 浮き2人
  "3": [8, 3, 1, -12],    // 浮き3人
  "4": [0, 0, 0, 0]       // 浮き4人
}
```

**ルール階層の考え方:**
1. **ポイント計算ルール**: 成績に直接影響（ウマ、オカ、基準点など）
2. **戦略ルール**: 打ち方に大きく影響（赤牌、喰いタン、後付けなど）
3. **進行ルール**: ゲーム進行の詳細（途中流局、ダブロンなど）
4. **追加ルール**: その他の自由設定項目

#### ユーザープロフィール（PROFILE）

```
PK: USER#{userId}
SK: PROFILE
Attributes:
- entityType: "PROFILE"
- email (string)
- displayName (string)
- role (user | admin)
- invitedBy (userId, nullable)
- createdAt (ISO datetime)
- lastLoginAt (ISO datetime)
```

#### GSI設計

**GSI1: MATCH_BY_USER_DATE**
```
PK: USER#{userId}#MATCH
SK: date
- 期間指定での対局取得に使用
```

**GSI2: MATCH_BY_USER_MODE_DATE（将来拡張）**
```
PK: USER#{userId}#MATCH#{gameMode}
SK: date
- 3人麻雀・4人麻雀の高速フィルタリングに使用
```

### TypeScript型定義

```typescript
// DynamoDBエンティティ基底型
interface BaseEntity {
  PK: string;
  SK: string;
  entityType: string;
  createdAt: string;
  updatedAt: string;
}

// Match型
interface Match extends BaseEntity {
  entityType: 'MATCH';
  PK: `USER#${string}`;
  SK: `MATCH#${string}`;
  matchId: string;
  date: string;
  gameMode: 'three' | 'four';
  entryMethod: 'rank_plus_points' | 'rank_plus_raw' | 'provisional_rank_only';
  rulesetId: string;
  rank: number;
  finalPoints?: number;
  rawScore?: number;
  chipCount?: number;
  venueId?: string;
  memo?: string;
}

// 基本ルール型（将来拡張用）
interface BasicRules {
  [key: string]: any; // 柔軟な拡張に対応（例：redTiles, openTanyao等）
}

// 進行ルール型（将来拡張用）
interface GameplayRules {
  [key: string]: any; // 柔軟な拡張に対応（例：abortiveDraw, doubleRon等）
}

// 追加ルール項目型
interface AdditionalRule {
  name: string; // ルール名
  value: string; // 設定値
  enabled: boolean; // 有効/無効
}

// Ruleset型
interface Ruleset extends BaseEntity {
  entityType: 'RULESET';
  PK: `USER#${string}` | 'GLOBAL';
  SK: `RULESET#${string}`;
  rulesetId: string;
  ruleName: string;
  gameMode: 'three' | 'four';
  
  // ポイント計算関連
  startingPoints: number; // 開始点（例：25000）
  basePoints: number; // 基準点（例：30000）
  useFloatingUma: boolean; // 浮きウマを使用するかどうか
  uma: number[]; // 標準ウマ配列（整数）3人:[+20, 0, -20] 4人:[+30, +10, -10, -30]
  umaMatrix?: Record<string, number[]>; // 浮き人数別ウマ表（useFloatingUma=trueの場合に使用）
  oka: number; // オカポイント（整数、1位が総取り、通常+20 or +15）
  useChips: boolean; // チップを使用するかどうか（true=チップあり、false=チップなし、デフォルト: false）
  
  // 階層化されたルール（将来拡張用）
  basicRules?: BasicRules; // 基本ルール（卓につく前に確認する重要ルール）
  gameplayRules?: GameplayRules; // 進行ルール（卓で進行中に気になる細かいルール）
  additionalRules?: AdditionalRule[]; // 追加ルール（その他の細かい設定）
  
  memo?: string; // 任意メモ
  isGlobal: boolean; // 管理者作成の全員共通ルール
  createdBy: string; // 作成者ID
}

// Venue型
interface Venue extends BaseEntity {
  entityType: 'VENUE';
  PK: `USER#${string}`;
  SK: `VENUE#${string}`;
  venueId: string;
  venueName: string;
  usageCount: number;
  lastUsedAt: string;
}

// UserProfile型
interface UserProfile extends BaseEntity {
  entityType: 'PROFILE';
  PK: `USER#${string}`;
  SK: 'PROFILE';
  userId: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  invitedBy?: string;
  lastLoginAt?: string;
}

// StatsSummary型（既存OpenAPIに準拠）
interface StatsSummary {
  count: number;
  avgRank: number;
  topRate: number;
  lastRate: number;
  totalPoints: number;
  chipTotal?: number; // チップありルールでの対局がある場合のみ表示
}
```

## エラーハンドリング

### エラー分類

1. **認証エラー**
   - 401 Unauthorized: トークン無効・期限切れ
   - 403 Forbidden: 権限不足（管理者機能アクセス）

2. **バリデーションエラー**
   - 400 Bad Request: 入力データ不正
   - 422 Unprocessable Entity: ビジネスルール違反

**具体的なバリデーションエラー:**
- 対局日エラー: 「対局日を選択してください」
- 未来日エラー: 「未来の日付は選択できません」
- 過去日エラー: 「5年以上前の日付は選択できません」
- 順位エラー: 「1〜3位で入力してください」（3人麻雀の場合）
- 素点エラー: 「6桁までの数値を入力してください（下2桁は00）」
- 最終ポイントエラー: 「3桁までの数値を入力してください」
- 必須項目エラー: 「ルールを選択してください」
- 計算エラー: 「ポイントが計算されていません。順位と素点を正しく入力してください」

3. **リソースエラー**
   - 404 Not Found: リソース未存在
   - 409 Conflict: データ競合

4. **システムエラー**
   - 500 Internal Server Error: サーバー内部エラー
   - 503 Service Unavailable: 外部サービス利用不可

### エラーレスポンス形式

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}
```

## テスト戦略

### フロントエンドテスト

1. **単体テスト**
   - Jest + React Native Testing Library
   - コンポーネントのレンダリング・イベント処理
   - ユーティリティ関数のロジック

2. **統合テスト**
   - API通信のモック
   - 画面遷移フロー

### バックエンドテスト

1. **単体テスト**
   - pytest
   - サービス層・リポジトリ層のロジック
   - ポイント計算ロジック

2. **統合テスト**
   - FastAPI TestClient
   - エンドポイントの動作確認
   - DynamoDB Local使用

3. **E2Eテスト**
   - 認証フローの確認
   - 対局登録〜統計表示の一連の流れ

### テストデータ管理

- DynamoDB Local使用
- テスト用ルールデータの準備
- モックユーザーデータの作成

## ユーザーエクスペリエンス（UX）設計

### 対局登録画面のUX

#### 対局日選択
- デフォルトで現在日付を設定
- タップで日付選択ピッカーを表示
- 日付のみ選択（時刻は自動で00:00:00に設定）
- 未来日付や5年以上前の日付は選択不可
- 選択された日付を分かりやすい形式で表示（例：2024年3月15日）

#### 入力方式選択
- 3つの入力方式を明確に区別
- 選択した方式に応じて動的にUIを変更
- 初心者向け（順位+最終ポイント）から上級者向け（順位+素点）まで対応

#### リアルタイムバリデーション
- 入力中に即座にエラー表示（500msデバウンス）
- エラー箇所の視覚的ハイライト（オレンジ色の枠線）
- 項目下に具体的なエラーメッセージ表示

#### 自動ポイント計算
- 素点入力方式では自動でポイント計算を実行
- 仮ポイント方式では順位入力時に開始点からの増減値で仮ポイント計算を実行
- 計算過程の詳細表示（素点、基準点、ウマ、オカ、最終ポイント）
- 仮ポイント方式では仮素点も表示
- 計算式の表示で透明性を確保

#### 仮ポイント入力方式のUX
- 「順位のみ」という分かりやすい表現を使用
- 選択時に開始点からの増減値を明示（1位:+15000、2位:+5000、3位:-5000、4位:-15000）
  - 3人麻雀の場合は合わせて変更
- 順位入力時の即座な仮ポイント計算（300msデバウンス）
- 計算結果に「仮ポイント」と明記
- 仮計算であることの警告メッセージを表示
- 実際の素点との違いを明確に伝達

#### エラーハンドリング
- 統一されたエラーメッセージ「入力エラーがあります」
- エラー箇所への自動スクロール機能
- 画面上部にオレンジ色の警告通知表示
- 成功時は緑色の完了通知表示

#### アクセシビリティ・UI統一方針
- **プレースホルダーテキストの色統一**: 全ての入力フィールドで`placeholderTextColor="#999"`を使用
- 十分なコントラスト比の確保
- タッチターゲットサイズの最適化
- 入力フィールドの一貫したスタイリング

### 会場選択のUX

#### コンボボックス形式のUI
- **初期表示**: プルダウンボタン + 「会場を選択...」プレースホルダー
- **既存選択**: プルダウンから即座に選択（1タップ）
- **新規入力**: 「新しい会場を入力...」選択 → テキスト入力フィールド表示
- **保存後**: 次回から選択肢に追加（使用回数順でソート）

#### UI構成例
```
┌─────────────────────────────┐
│ 会場                        │
├─────────────────────────────┤
│ ▼ 会場を選択...             │  ← プルダウンボタン
└─────────────────────────────┘

↓ タップすると

┌─────────────────────────────┐
│ 雀荘サンマ                  │  ← 既存会場1（使用回数順）
│ 友人宅                      │  ← 既存会場2
│ 雀荘四麻                    │  ← 既存会場3
├─────────────────────────────┤
│ ＋ 新しい会場を入力...       │  ← 新規入力オプション
└─────────────────────────────┘
```

#### 重複チェックロジック
- 入力された会場名を正規化（trim、小文字変換）
- 既存会場名と完全一致チェック
- 一致する場合：既存会場を使用、使用回数+1
- 一致しない場合：新規会場マスタを自動作成

### 通知システム
- 成功通知: 緑色（#4CAF50）
- 警告通知: オレンジ色（#FF9800）
- 3秒間の自動消去
- 画面上部の固定位置表示

## 実装上の考慮事項

### セキュリティ

- 入力検証: フロントエンド・バックエンド両方で実施
- JWT トークン管理: Secure Storageに保存、リフレッシュトークンで自動更新
- 権限管理: 管理者機能へのアクセス制御、ユーザー自身のデータのみアクセス可能

詳細は `architecture.md` のセキュリティアーキテクチャを参照してください。

### パフォーマンス

- フロントエンド: React.memo使用、不要な再レンダリング防止、キャッシュ戦略
- バックエンド: DynamoDB最適化、Lambda最適化
- ネットワーク: レスポンスサイズ最小化、適切なキャッシュ戦略

詳細は `architecture.md` のパフォーマンスセクションを参照してください。

## チップ管理のルールセット統合

### 概要

チップの有無は重要なルール要素であるため、個別の対局データではなくルールセットで管理します。これにより、ルール選択時に自動的にチップ入力欄の表示/非表示が制御され、一貫性のあるUXを提供します。

### 設計変更点

#### ルールセットデータ拡張
- `useChips: boolean` フィールドを追加
- デフォルト値: `false`（チップなし）

#### 対局登録画面の動的制御
1. **ルール選択時の処理**
   - 選択されたルールの`useChips`フラグを確認
   - `useChips=true`: チップ入力欄を表示
   - `useChips=false`: チップ入力欄を非表示

2. **バリデーション**
   - チップなしルールの場合、`chipCount`は常に`null`または`0`
   - チップありルールの場合、`chipCount`は任意入力

#### 統計画面の表示制御
1. **チップ合計の表示条件**
   - 対象期間内にチップありルールでの対局が1件以上存在する場合のみ表示
   - 全てチップなしルールの対局の場合は非表示

2. **計算ロジック**
   - チップありルールの対局のみを対象にチップ合計を計算
   - チップなしルールの対局は計算から除外

### 実装上の考慮事項

#### データマイグレーション
- 既存ルールセットに`useChips: false`をデフォルト設定
- 新規作成時は明示的にチップ有無を選択（デフォルトはチップなし）

#### UI/UX設計
- ルール作成・編集画面にチップ有無のトグルスイッチを追加
- 対局登録画面でルール変更時の即座なUI更新
- チップ入力欄の表示/非表示アニメーション

#### API設計
- ルールセット取得時に`useChips`フラグを含める
- 対局登録時のバリデーションでチップ有無を確認
- 統計計算時にルールセットのチップ設定を考慮

---

## 関連ドキュメント

- **アーキテクチャ**: `.kiro/specs/core/architecture.md` - システム全体構成、技術スタック、ADR
- **要件**: `.kiro/specs/core/requirements.md` - 統合要件書
- **OpenAPI仕様**: `/spec/openapi.yaml` - API詳細仕様
- **環境分離戦略**: `/spec/adr/ADR-0005-environment-strategy.md`
- **環境マトリクス**: `/spec/env-matrix.md`


## グローバルゲームモード選択機能

### 概要

アプリ全体で共有されるグローバルなゲームモード選択機能を実装します。現在、各画面で独立して管理されているゲームモード状態を、React Contextを使用したグローバル状態管理に移行し、ヘッダー右側に配置されたセグメントコントロール形式のUIで切り替えられるようにします。

### アーキテクチャ

#### コンポーネント構成

```
App
├── GameModeProvider (Context Provider)
│   └── Tab Navigation
│       ├── Stats Screen (統計)
│       │   └── Header with HeaderGameModeSelector
│       ├── History Screen (履歴)
│       │   └── Header with HeaderGameModeSelector
│       ├── Register Screen (登録)
│       │   └── Header with HeaderGameModeSelector
│       ├── Rules Screen (ルール管理)
│       │   └── Header with HeaderGameModeSelector
│       └── Profile Screen (プロフィール)
│           └── Header without HeaderGameModeSelector
```

#### データフロー

```
User Action (ヘッダーのHeaderGameModeSelector)
    ↓
GameModeContext.setGameMode()
    ↓
AsyncStorage.setItem() (永続化)
    ↓
Context State Update
    ↓
各画面のuseGameMode()フックが新しい値を受け取る
    ↓
useEffect()でデータ再取得・フォーム初期化
```

### コンポーネント詳細

#### GameModeContext

**ファイル**: `frontend/src/contexts/GameModeContext.tsx`

グローバルなゲームモード状態を管理するReact Context。AsyncStorageを使用して永続化し、アプリ再起動後も状態を復元します。

```typescript
interface GameModeContextType {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => Promise<void>;
  isLoading: boolean;
}

const GAME_MODE_STORAGE_KEY = '@janlog:gameMode';
const DEFAULT_GAME_MODE: GameMode = 'four';
```

#### HeaderGameModeSelector

**ファイル**: `frontend/src/components/common/HeaderGameModeSelector.tsx`

ヘッダー右側に配置される丸みのあるセグメントコントロール形式のゲームモード切り替えUI。

**UI設計:**
- iOS標準のUISegmentedControlに似た洗練されたデザイン
- アニメーション背景インジケーター（青い丸みのある背景）
- React Native Animated APIを使用した250msのスムーズなトランジション
- 各ゲームモードオプションを個別にタップ可能

**スタイリング:**
- コンテナ背景: `#E5E5EA`（iOS標準のグレー）
- アクティブインジケーター: `#007AFF`（アプリ統一の青色）
- アクティブテキスト: `#FFFFFF`（白）
- 非アクティブテキスト: `#8E8E93`（グレー）
- セグメント幅: 64px（各セグメント）
- セグメント高さ: 32px
- フォントサイズ: 13px
- ボーダーラディウス: 外側10px、内側7px

#### Tab Layout統合

**ファイル**: `frontend/app/(tabs)/_layout.tsx`

各タブ画面のヘッダーにHeaderGameModeSelectorを条件付きで表示。

```typescript
const screensWithGameMode = ['index', 'history', 'register', 'rules'];

const getHeaderRight = (routeName: string) => {
  if (screensWithGameMode.includes(routeName)) {
    return () => <HeaderGameModeSelector />;
  }
  return undefined;
};
```

### 各画面の統合

#### StatsScreen（統計画面）

- ローカルなgameMode状態管理を削除
- `useGameMode()`フックを使用
- `useEffect`でgameModeの変更を監視してデータ再取得
- フィルター状態をリセット

#### HistoryScreen（履歴画面）

- ローカルなgameMode状態管理を削除
- `useGameMode()`フックを使用
- `useEffect`でgameModeの変更を監視してデータ再取得
- ページネーション状態をリセット

#### MatchRegistrationScreen（対局登録画面）

- `useMatchForm`フック内でグローバルなgameModeを参照
- ゲームモード切り替え時にフォームを初期化
- ルールセット選択をクリア

#### MatchEditScreen（対局編集画面）

- 編集画面でゲームモードを読み取り専用で表示
- グローバルなgameMode変更の影響を受けないようにする
- 既存データのgameModeを維持

#### RulesScreen（ルール管理画面）

- `useGameMode()`フックを使用
- `useEffect`でgameMode変更時にルール一覧を再取得
- グローバルルールと個人ルールをgameModeでフィルタリング

#### ルール登録・編集画面

- 新規登録時はヘッダーのグローバルなゲームモードを使用
- 編集時はフォームの先頭に読み取り専用のゲームモードを表示
- 編集時はグローバルなgameMode変更の影響を受けないようにする

### 永続化

- AsyncStorageキー: `@janlog:gameMode`
- デフォルト値: `'four'`（4人麻雀）
- 初期化時にAsyncStorageから読み込み
- ゲームモード変更時にAsyncStorageに保存

### エラーハンドリング

- AsyncStorage読み込み失敗: デフォルト値（'four'）を使用し、エラーログを出力
- AsyncStorage書き込み失敗: エラーをthrowし、呼び出し元でハンドリング
- Context未初期化エラー: `useGameMode()`をProvider外で使用した場合、明確なエラーメッセージをthrow

### パフォーマンス最適化

- Context更新の最小化: gameModeの変更時のみContextを更新
- AsyncStorage操作の非同期化: UI操作をブロックしない
- useEffect依存配列の適切な設定: 不要な再レンダリングを防ぐ
- Animated APIのネイティブドライバー使用: `useNativeDriver: true`でパフォーマンス最適化

## 認証とパスワード管理

### 招待フロー

#### Cognitoカスタムメールテンプレート

管理者がCognito管理画面でユーザーを作成すると、カスタマイズされた招待メールが自動送信されます。

**実装方法:**
- テンプレートファイルを外部化（`infra/templates/cognito-invitation-email-{environment}.txt`）
- CDKで環境別テンプレートを読み込み
- 改行を`<br>`に変換してHTML対応

**テンプレート内容:**
- ユーザー名と一時パスワード（Cognitoプレースホルダー: `{username}`, `{####}`）
- アプリへのアクセス方法（環境別）
- 初回ログイン手順

### 初回ログインフロー

#### NEW_PASSWORD_REQUIRED Challenge対応

```typescript
// 1. ログイン試行
const result = await authService.login(credentials);

// 2. Challenge検出
if (result.challengeName === 'NEW_PASSWORD_REQUIRED') {
  // 3. パスワード変更画面へ遷移
  navigation.navigate('ChangePassword', {
    isInitialSetup: true,
    session: result.session,
    username: credentials.email,
  });
}
```

#### ChangePasswordScreen

初回パスワード変更と通常のパスワード変更の両方に対応する共通画面。

**Props:**
```typescript
interface ChangePasswordScreenProps {
  route: {
    params?: {
      isInitialSetup?: boolean;  // 初回モードフラグ
      session?: string;           // Cognito Challenge session
      username?: string;          // ユーザー名
    };
  };
}
```

**機能:**
- パスワードポリシー表示（8文字以上、大文字・小文字・数字を含む）
- リアルタイムバリデーション
- パスワード表示/非表示トグル
- 初回モード: 新しいパスワードのみ入力
- 通常モード: 現在のパスワード + 新しいパスワード入力

### AuthService拡張

#### 新規メソッド

```typescript
/**
 * NEW_PASSWORD_REQUIRED Challengeに応答
 */
async respondToNewPasswordChallenge(params: {
  username: string;
  newPassword: string;
  session: string;
}): Promise<User>

/**
 * 認証Challengeを検出・処理
 */
handleAuthChallenge(response: InitiateAuthCommandOutput): {
  challengeName: ChallengeNameType | null;
  session: string | null;
  username: string;
}
```

#### 既存メソッドの修正

```typescript
/**
 * ログイン（Challenge対応）
 * @returns User（通常ログイン）またはAuthChallenge（Challenge発生時）
 */
async login(credentials: LoginCredentials): Promise<User | AuthChallenge>
```

### AuthContext拡張

#### State拡張

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  authChallenge: AuthChallenge | null;  // 新規追加
}
```

#### 新規メソッド

```typescript
interface AuthContextValue {
  // 既存メソッド
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (credentials: ChangePasswordCredentials) => Promise<void>;
  
  // 新規追加
  respondToChallenge: (newPassword: string) => Promise<void>;
  clearChallenge: () => void;
}
```

### 通常のパスワード変更

#### ProfileScreen統合

```typescript
<TouchableOpacity
  onPress={() => navigation.navigate('ChangePassword', {
    isInitialSetup: false,
  })}
>
  <Text>パスワード変更</Text>
</TouchableOpacity>
```

#### パスワード変更フロー

1. ユーザーがProfileScreenでパスワード変更を選択
2. ChangePasswordScreenに遷移（`isInitialSetup: false`）
3. 現在のパスワード、新しいパスワード、確認パスワードを入力
4. `ChangePasswordCommand`でCognitoに送信
5. 成功時、ログイン状態を維持したままProfileScreenに戻る

### エラーハンドリング

#### 初回パスワード変更エラー

- `InvalidPasswordException`: パスワードポリシー違反の詳細を表示
- `NotAuthorizedException`: セッション期限切れ、再ログインを促す
- `TooManyRequestsException`: リクエスト過多、待機を促す

#### 通常パスワード変更エラー

- `NotAuthorizedException`: 現在のパスワードが間違っている
- `InvalidPasswordException`: 新しいパスワードがポリシー違反
- `LimitExceededException`: 変更回数制限に達した

#### バリデーションエラー

- パスワード不一致: 新しいパスワードと確認パスワードが一致しない
- パスワードポリシー違反: クライアント側で事前チェック
- 空フィールド: 必須項目の入力漏れ

### 環境別動作

- **local環境**: 静的JWT認証、パスワード変更フローをスキップ
- **development環境**: 実際のCognito認証、NEW_PASSWORD_REQUIRED Challenge対応
- **production環境**: 実際のCognito認証、NEW_PASSWORD_REQUIRED Challenge対応

## ルール管理機能

### 画面構成

ルール管理画面は、タブナビゲーションの4番目のタブとして追加されます。

```
タブナビゲーション
├── 統計タブ
├── 履歴タブ
├── 対局登録タブ
└── ルールタブ ★新規
    └── ルール管理画面
        ├── グローバルルールセクション（管理者のみ）
        └── 個人ルールセクション
```

### コンポーネント構成

```
frontend/
├── app/
│   ├── (tabs)/
│   │   └── rules.tsx                  # ルール管理画面（タブ）
│   └── rules/
│       ├── create.tsx                 # ルール作成画面
│       └── [rulesetId].tsx            # ルール編集画面
├── src/
│   ├── components/
│   │   └── rules/
│   │       ├── RuleList.tsx           # ルール一覧コンポーネント
│   │       ├── RuleCard.tsx           # ルールカード（1件表示）
│   │       ├── RuleFormComponent.tsx  # ルールフォーム共通コンポーネント
│   │       └── RuleFormScreen.tsx     # ルールフォーム画面
│   ├── hooks/
│   │   └── useRuleForm.ts             # ルールフォーム用カスタムフック
│   └── services/
│       └── rulesetService.ts          # ルールAPI呼び出しサービス
```

### データモデル

#### Ruleset（ルールセット）

```typescript
interface Ruleset {
  rulesetId: string;           // ルールセットID（UUID）
  ruleName: string;            // ルール名
  gameMode: 'three' | 'four';  // ゲームモード
  startingPoints: number;      // 開始点
  basePoints: number;          // 基準点
  useFloatingUma: boolean;     // 浮きウマ使用フラグ
  uma: number[];               // ウマ配列
  umaMatrix?: Record<string, number[]>; // 浮き人数別ウマ表（オプション）
  oka: number;                 // オカポイント
  useChips: boolean;           // チップ使用フラグ
  memo?: string;               // メモ
  isGlobal: boolean;           // グローバルルールフラグ
  createdBy: string;           // 作成者ID
  createdAt: string;           // 作成日時（ISO 8601）
  updatedAt: string;           // 更新日時（ISO 8601）
}
```

#### DynamoDBデータ構造

**グローバルルール:**
```
PK: GLOBAL
SK: RULESET#{rulesetId}
entityType: RULESET
```

**個人ルール:**
```
PK: USER#{userId}
SK: RULESET#{rulesetId}
entityType: RULESET
```

### API設計

#### エンドポイント

- `GET /rulesets` - ルール一覧取得（グローバル+個人）
- `GET /rulesets/{rulesetId}` - 特定ルール取得
- `POST /rulesets` - ルール作成
- `PUT /rulesets/{rulesetId}` - ルール更新
- `DELETE /rulesets/{rulesetId}` - ルール削除

#### 権限チェック

**POST /rulesets:**
- グローバルルール（isGlobal=true）の作成は管理者のみ
- 個人ルール（isGlobal=false）は全ユーザーが作成可能

**PUT /rulesets/{rulesetId}:**
- グローバルルールの更新は管理者のみ
- 個人ルールは所有者のみ更新可能

**DELETE /rulesets/{rulesetId}:**
- グローバルルールの削除は管理者のみ
- 個人ルールは所有者のみ削除可能

### UI/UX設計

#### ルール一覧画面

- カード形式で1件ずつ表示
- グローバルルールには「公式」バッジを表示
- 個人ルール→グローバルルールの順番で表示
- 同じタイプ内ではルール名の昇順でソート

#### ルール作成・編集フォーム

- ゲームモード選択時に適切な入力欄を表示
- 開始点・基準点入力時にウマを自動提案
  - 3人麻雀: [+20, 0, -20]
  - 4人麻雀（25000点持ち30000点返し）: [+30, +10, -10, -30]
  - 4人麻雀（その他）: [+20, +10, -10, -20]
- オカは自動計算: (基準点 - 開始点) × 人数 / 1000

#### 削除確認ダイアログ

- 削除前に確認ダイアログを表示
- 「既存の対局データには影響しません」と明記
- CustomAlertコンポーネントを使用

### 対局登録画面との連携

#### ルール選択UI

- 個人ルール→グローバルルールの順番で表示
- グローバルルールには「公式」バッジを表示
- ルール作成後、画面にフォーカスが戻った時に自動的にルール一覧を更新（useFocusEffect使用）

### セキュリティ考慮事項

#### フロントエンド

- ユーザーロールに応じた表示制御
- グローバルルールの編集・削除ボタンは管理者のみ表示

#### バックエンド

- 全てのAPIエンドポイントで権限チェックを実施
- グローバルルールの操作は管理者のみ許可
- 個人ルールは所有者のみ編集・削除可能
- 権限エラーは403 Forbiddenで返す

### ルール変更の影響範囲

- ルール変更・削除は既存の対局データに影響を与えない
- 対局データはrulesetIdのみを保持し、ルール内容は保持しない
- ルールが削除された場合、対局詳細画面では「削除されたルール」と表示
- ユーザーは柔軟にルール設定を変更できる
