# 浮きウマルール機能 設計書

## 概要

浮きウマルール機能は、既存のルールセット管理機能とポイント計算機能を拡張し、浮き人数（基準点以上の素点を持つプレイヤー数）に応じて変動するウマを実装します。

本設計は、spec/design/floating-uma-rule.mdの最終設計方針に基づき、既存のcore設計との整合性を保ちながら実装します。

## アーキテクチャ

### システム構成

```
フロントエンド（React Native）
├── ルール作成・編集画面
│   └── 浮きウマ設定UI
├── 対局登録画面
│   └── 浮き人数入力UI
└── ルール詳細画面
    └── 浮きウマ表示UI

バックエンド（FastAPI）
├── ルールセットAPI
│   ├── 浮きウマバリデーション
│   └── 浮きウマ保存・取得
└── ポイント計算API
    └── 浮きウマ計算ロジック

データストア（DynamoDB）
└── Rulesetエンティティ
    ├── useFloatingUma
    └── umaMatrix
```

## データモデル

### Rulesetエンティティ拡張

既存のRulesetエンティティに以下のフィールドを追加します：

```typescript
interface Ruleset {
  // 既存フィールド
  rulesetId: string;
  ruleName: string;
  gameMode: 'three' | 'four';
  startingPoints: number;
  basePoints: number;
  uma: number[];
  oka: number;
  useChips: boolean;
  // ... その他既存フィールド
  
  // 新規追加フィールド
  useFloatingUma: boolean;           // 浮きウマ使用フラグ（デフォルト: false）
  umaMatrix?: FloatingUmaMatrix;     // 浮き人数別ウマ表（useFloatingUma=trueの場合に使用）
}

// FloatingUmaMatrix型定義
type FloatingUmaMatrix = {
  '0': number[];  // 浮き0人（開始点<基準点の場合のみ使用）
  '1': number[];  // 浮き1人
  '2': number[];  // 浮き2人
  '3': number[];  // 浮き3人
  '4': number[];  // 浮き4人（開始点=基準点の場合のみ使用）
};
```

### DynamoDBデータ構造

```
PK: USER#{userId} | GLOBAL
SK: RULESET#{rulesetId}
Attributes:
  - useFloatingUma: boolean
  - umaMatrix: {
      "0": [0, 0, 0, 0],
      "1": [20, -5, -5, -10],
      "2": [15, 5, -5, -15],
      "3": [10, 5, -5, -10],
      "4": [0, 0, 0, 0]
    }
```

### Matchエンティティ拡張

対局データに浮き人数を記録するフィールドを追加します：

```typescript
interface Match {
  // 既存フィールド
  matchId: string;
  date: string;
  gameMode: 'three' | 'four';
  entryMethod: 'rank_plus_points' | 'rank_plus_raw' | 'provisional_rank_only';
  rulesetId: string;
  rank: number;
  finalPoints?: number;
  rawScore?: number;
  // ... その他既存フィールド
  
  // 新規追加フィールド
  floatingCount?: number;  // 浮き人数（浮きウマルール使用時のみ記録）
}
```

## コンポーネント設計

### フロントエンド

#### 1. FloatingUmaToggle コンポーネント

**ファイル**: `frontend/src/components/rules/FloatingUmaToggle.tsx`

**責務**: 浮きウマ使用フラグのON/OFF切り替え

**Props**:
```typescript
interface FloatingUmaToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}
```

#### 2. FloatingUmaMatrixInput コンポーネント

**ファイル**: `frontend/src/components/rules/FloatingUmaMatrixInput.tsx`

**責務**: 浮き人数別ウマ表の入力UI

**Props**:
```typescript
interface FloatingUmaMatrixInputProps {
  gameMode: 'three' | 'four';
  startingPoints: number;
  basePoints: number;
  value: FloatingUmaMatrix;
  onChange: (value: FloatingUmaMatrix) => void;
  errors?: Record<string, string>;
}
```

**UI設計**:
- 開始点と基準点の関係から使用する浮き人数を判定
- 使用しない浮き人数の入力欄はグレーアウトまたは非表示
- 各浮き人数のラベルを明確に表示（例：「浮き1人」「浮き2人」）
- 各ウマ配列の入力欄を横並びで表示（1位、2位、3位、4位）

#### 3. FloatingCountInput コンポーネント

**ファイル**: `frontend/src/components/match/FloatingCountInput.tsx`

**責務**: 対局登録時の浮き人数入力UI

**Props**:
```typescript
interface FloatingCountInputProps {
  value?: number;
  onChange: (value: number) => void;
  min: number;  // 最小値（0または1）
  max: number;  // 最大値（3または4）
  playerFloating?: boolean;  // 自身の浮き判定結果
  disabled?: boolean;
  error?: string;
}
```

**UI設計**:
- 数値入力フィールドまたはピッカー形式
- 自身の浮き判定結果を表示（「自身は浮き」「自身は沈み」）
- 有効範囲外の入力を防止

#### 4. FloatingUmaDisplay コンポーネント

**ファイル**: `frontend/src/components/rules/FloatingUmaDisplay.tsx`

**責務**: ルール詳細画面での浮きウマ表示

**Props**:
```typescript
interface FloatingUmaDisplayProps {
  useFloatingUma: boolean;
  uma: number[];
  umaMatrix?: FloatingUmaMatrix;
  gameMode: 'three' | 'four';
  startingPoints: number;
  basePoints: number;
}
```

### バックエンド

#### 1. FloatingUmaValidator クラス

**ファイル**: `backend/app/utils/floating_uma_validator.py`

**責務**: 浮きウマ設定のバリデーション

**メソッド**:
```python
class FloatingUmaValidator:
    @staticmethod
    def validate_uma_matrix(
        uma_matrix: Dict[str, List[int]],
        game_mode: str,
        starting_points: int,
        base_points: int
    ) -> List[str]:
        """浮き人数別ウマ表のバリデーション"""
        pass
    
    @staticmethod
    def validate_uma_array(
        uma_array: List[int],
        game_mode: str
    ) -> List[str]:
        """個別ウマ配列のバリデーション"""
        pass
    
    @staticmethod
    def get_valid_floating_counts(
        starting_points: int,
        base_points: int,
        game_mode: str
    ) -> Tuple[int, int]:
        """有効な浮き人数の範囲を取得"""
        pass
```

#### 2. FloatingUmaCalculator クラス

**ファイル**: `backend/app/utils/floating_uma_calculator.py`

**責務**: 浮きウマを使用したポイント計算

**メソッド**:
```python
class FloatingUmaCalculator:
    @staticmethod
    def calculate_points(
        raw_score: int,
        rank: int,
        floating_count: int,
        ruleset: Ruleset
    ) -> float:
        """浮きウマを使用したポイント計算"""
        pass
    
    @staticmethod
    def get_uma_for_floating_count(
        floating_count: int,
        uma_matrix: Dict[str, List[int]]
    ) -> List[int]:
        """浮き人数に対応するウマ配列を取得"""
        pass
    
    @staticmethod
    def is_player_floating(
        raw_score: int,
        base_points: int
    ) -> bool:
        """プレイヤーの浮き判定"""
        pass
```

## API設計

### 既存APIの拡張

#### POST /rulesets

**リクエストボディ拡張**:
```json
{
  "ruleName": "日本プロ麻雀連盟ルール",
  "gameMode": "four",
  "startingPoints": 30000,
  "basePoints": 30000,
  "useFloatingUma": true,
  "umaMatrix": {
    "0": [0, 0, 0, 0],
    "1": [12, -1, -3, -8],
    "2": [8, 4, -4, -8],
    "3": [8, 3, 1, -12],
    "4": [0, 0, 0, 0]
  },
  "uma": [30, 10, -10, -30],
  "oka": 0,
  "useChips": false
}
```

**バリデーション**:
- useFloatingUma=trueの場合、umaMatrixは必須
- umaMatrixの各配列は要素数が正しいこと（3人麻雀: 3要素、4人麻雀: 4要素）
- umaMatrixの各配列の合計が0であること
- 使用されない浮き人数のウマ配列は[0,0,0,0]であること

#### POST /rulesets/calculate

**リクエストボディ拡張**:
```json
{
  "rulesetId": "ruleset-uuid",
  "rank": 1,
  "rawScore": 45000,
  "floatingCount": 2
}
```

**レスポンス拡張**:
```json
{
  "finalPoints": 35.0,
  "breakdown": {
    "rawScore": 45000,
    "basePoints": 30000,
    "basicPoints": 15.0,
    "uma": 20.0,
    "oka": 0.0,
    "floatingCount": 2,
    "umaArray": [20, 10, -10, -20]
  }
}
```

#### POST /matches

**リクエストボディ拡張**:
```json
{
  "date": "2024-03-15T00:00:00+09:00",
  "gameMode": "four",
  "entryMethod": "rank_plus_raw",
  "rulesetId": "ruleset-uuid",
  "rank": 1,
  "rawScore": 45000,
  "floatingCount": 2
}
```

**バリデーション**:
- 浮きウマルール使用時、entryMethodが"rank_plus_points"以外の場合はfloatingCountが必須
- floatingCountは有効範囲内であること

## ビジネスロジック

### 浮き人数の判定ロジック

```python
def get_valid_floating_range(starting_points: int, base_points: int, game_mode: str) -> Tuple[int, int]:
    """
    有効な浮き人数の範囲を取得
    
    Returns:
        (min_count, max_count): 最小浮き人数と最大浮き人数
    """
    player_count = 3 if game_mode == 'three' else 4
    
    if starting_points == base_points:
        # 開始点=基準点: 全員原点は「全員浮き」とみなす
        return (1, player_count)
    elif starting_points < base_points:
        # 開始点<基準点: 全員沈みはあり、全員浮きは存在しない
        return (0, player_count - 1)
    else:
        # 開始点>基準点: 理論上ありえないが、エラーとして扱う
        raise ValueError("開始点は基準点以下である必要があります")
```

### ポイント計算ロジック

```python
def calculate_floating_uma_points(
    raw_score: int,
    rank: int,
    floating_count: int,
    ruleset: Ruleset
) -> float:
    """
    浮きウマを使用したポイント計算
    
    計算式: (素点 - 基準点) / 1000 + ウマ[順位-1] + オカ
    """
    # 基本計算
    basic_points = (raw_score - ruleset.basePoints) / 1000
    
    # 浮き人数に対応するウマ配列を取得
    uma_array = ruleset.umaMatrix[str(floating_count)]
    uma_points = uma_array[rank - 1]
    
    # オカ（1位のみ）
    oka_points = ruleset.oka if rank == 1 else 0
    
    # 最終ポイント
    final_points = basic_points + uma_points + oka_points
    
    return round(final_points, 1)
```

### 自身の浮き判定ロジック

```python
def is_player_floating(raw_score: int, base_points: int) -> bool:
    """
    プレイヤーの浮き判定
    
    Args:
        raw_score: 素点
        base_points: 基準点
    
    Returns:
        True: 浮き、False: 沈み
    """
    return raw_score >= base_points
```

## UI/UXフロー

### ルールセット作成・編集フロー

1. ユーザーがルール作成画面にアクセス
2. 基本情報（ルール名、ゲームモード、開始点、基準点）を入力
3. 「浮きウマを使用する」トグルをON
4. 浮き人数別ウマ表が表示される
5. 開始点と基準点の関係から使用する浮き人数が自動判定される
6. 使用しない浮き人数の入力欄はグレーアウト
7. 各浮き人数のウマ配列を入力
8. バリデーションエラーがあれば表示
9. 保存ボタンをタップ
10. ルールセットが保存される

### 対局登録フロー（順位+素点）

1. ユーザーが対局登録画面にアクセス
2. 浮きウマルールを選択
3. 入力方式「順位+素点」を選択
4. 順位と素点を入力
5. 素点から自身の浮き判定が自動実行される
6. 「自身は浮き」または「自身は沈み」と表示される
7. 浮き人数入力欄が表示される
8. ユーザーが浮き人数を手動入力
9. ポイント計算APIを呼び出し
10. 計算結果が表示される（浮き人数とウマ配列も表示）
11. 保存ボタンをタップ
12. 対局データが保存される

### 対局登録フロー（順位のみ）

1. ユーザーが対局登録画面にアクセス
2. 浮きウマルールを選択
3. 入力方式「順位のみ」を選択
4. 順位を入力
5. 浮き人数入力欄が表示される
6. ユーザーが浮き人数を手動入力
7. 仮素点を使用してポイント計算APIを呼び出し
8. 計算結果が表示される（浮き人数とウマ配列も表示）
9. 保存ボタンをタップ
10. 対局データが保存される

### 対局登録フロー（順位+最終ポイント）

1. ユーザーが対局登録画面にアクセス
2. 浮きウマルールを選択
3. 入力方式「順位+最終ポイント」を選択
4. 順位と最終ポイントを入力
5. 浮き人数入力欄は非表示
6. 保存ボタンをタップ
7. 対局データが保存される（floatingCountはnull）

## バリデーション

### フロントエンドバリデーション

1. **浮き人数別ウマ配列**
   - 各配列の要素数が正しいこと
   - 各配列の合計が0であること
   - 数値のみ入力可能

2. **浮き人数**
   - 有効範囲内であること
   - 数値のみ入力可能
   - 浮きウマルール使用時は必須（順位+最終ポイント以外）

### バックエンドバリデーション

1. **ルールセット保存時**
   - useFloatingUma=trueの場合、umaMatrixは必須
   - umaMatrixの各配列の要素数が正しいこと
   - umaMatrixの各配列の合計が0であること
   - 使用されない浮き人数のウマ配列は[0,0,0,0]であること

2. **対局登録時**
   - 浮きウマルール使用時、entryMethodが"rank_plus_points"以外の場合はfloatingCountが必須
   - floatingCountは有効範囲内であること

## エラーハンドリング

### エラーメッセージ

1. **ウマ配列要素数エラー**
   - 「ウマ配列は3要素（3人麻雀）または4要素（4人麻雀）である必要があります」

2. **ウマ配列合計エラー**
   - 「ウマ配列の合計は0である必要があります」

3. **浮き人数範囲エラー**
   - 「浮き人数は0〜3（または1〜4）の範囲で入力してください」

4. **浮き人数必須エラー**
   - 「浮き人数を入力してください」

5. **umaMatrix必須エラー**
   - 「浮きウマを使用する場合、浮き人数別ウマ表は必須です」

## データマイグレーション

### 既存データの互換性

既存のルールセットには`useFloatingUma`と`umaMatrix`フィールドが存在しないため、以下の対応を行います：

1. **読み込み時の処理**
   - `useFloatingUma`が未定義の場合、`false`として扱う
   - `umaMatrix`が未定義の場合、`null`として扱う

2. **計算時の処理**
   - `useFloatingUma=false`または未定義の場合、標準ウマ配列（`uma`）を使用

3. **表示時の処理**
   - `useFloatingUma=false`または未定義の場合、「標準ウマ」と表示
   - `useFloatingUma=true`の場合、「浮きウマ」と表示

### 既存対局データの互換性

既存の対局データには`floatingCount`フィールドが存在しないため、以下の対応を行います：

1. **表示時の処理**
   - `floatingCount`が未定義の場合、「記録なし」と表示
   - 統計計算には影響しない

## テスト戦略

### 単体テスト

1. **FloatingUmaValidator**
   - ウマ配列の要素数検証
   - ウマ配列の合計値検証
   - 有効な浮き人数範囲の取得

2. **FloatingUmaCalculator**
   - 浮きウマを使用したポイント計算
   - 浮き人数に対応するウマ配列の取得
   - プレイヤーの浮き判定

### 統合テスト

1. **ルールセットAPI**
   - 浮きウマルールの作成
   - 浮きウマルールの更新
   - 浮きウマルールの取得
   - バリデーションエラーの確認

2. **ポイント計算API**
   - 浮きウマを使用したポイント計算
   - 各浮き人数でのポイント計算
   - エラーケースの確認

3. **対局登録API**
   - 浮きウマルールでの対局登録
   - 浮き人数の保存
   - バリデーションエラーの確認

### E2Eテスト

1. **ルールセット作成フロー**
   - 浮きウマルールの作成
   - 浮き人数別ウマ表の入力
   - 保存と確認

2. **対局登録フロー**
   - 浮きウマルールでの対局登録（順位+素点）
   - 浮きウマルールでの対局登録（順位のみ）
   - 浮きウマルールでの対局登録（順位+最終ポイント）

## パフォーマンス考慮事項

1. **umaMatrixのサイズ**
   - 5キー × 4要素 = 20個の数値
   - データサイズは小さく、パフォーマンスへの影響は無視できる

2. **計算処理**
   - 浮きウマ計算は単純な配列アクセスと算術演算のみ
   - 既存のポイント計算と同等のパフォーマンス

3. **バリデーション**
   - ウマ配列の合計値計算は軽量
   - リアルタイムバリデーションでもパフォーマンス問題なし

## セキュリティ考慮事項

1. **入力検証**
   - フロントエンドとバックエンドの両方でバリデーション実施
   - 数値型の厳密なチェック
   - 範囲外の値の拒否

2. **権限チェック**
   - グローバルルールの浮きウマ設定は管理者のみ
   - 個人ルールは所有者のみ編集可能

## 関連ドキュメント

- **設計方針**: `/spec/design/floating-uma-rule.md`
- **Core要件**: `.kiro/specs/core/requirements.md`
- **Core設計**: `.kiro/specs/core/design.md`
- **OpenAPI仕様**: `/spec/openapi.yaml`
