# 対局種別フィールド追加 - 設計書

## 概要

対局データに「対局種別（matchType）」フィールドを追加し、フリー雀荘、セット麻雀、競技麻雀を区別できるようにします。このフィールドは統計・履歴画面でのフィルタリングに利用され、ユーザーが種別ごとに成績を分析できるようにします。

## アーキテクチャ

### システム構成

```
┌─────────────────┐
│   Frontend      │
│  (React Native) │
│                 │
│  - 対局登録画面  │
│  - 対局編集画面  │
│  - 履歴画面      │
│  - 統計画面      │
└────────┬────────┘
         │ HTTP/REST
         │ (matchType: "free" | "set" | "competition" | null)
         │
┌────────▼────────┐
│   Backend       │
│   (FastAPI)     │
│                 │
│  - バリデーション│
│  - フィルタリング│
└────────┬────────┘
         │ boto3
         │
┌────────▼────────┐
│   DynamoDB      │
│                 │
│  Match Item:    │
│  - matchType    │
│    (String)     │
└─────────────────┘
```

### データフロー

1. **対局登録フロー**
   ```
   ユーザー → ボタン選択 → matchType設定 → バリデーション → API送信 → DynamoDB保存
   ```

2. **フィルタリングフロー**
   ```
   ユーザー → フィルタ選択 → クエリパラメータ → バックエンドフィルタ → 結果表示
   ```

## コンポーネントとインターフェース

### フロントエンド

#### 1. 対局種別選択コンポーネント

**ファイル**: `frontend/src/components/match/MatchTypeSelector.tsx`

```typescript
interface MatchTypeSelectorProps {
  value: MatchType | null;
  onChange: (matchType: MatchType | null) => void;
  disabled?: boolean;
}

type MatchType = 'free' | 'set' | 'competition';

const MatchTypeSelector: React.FC<MatchTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const handlePress = (type: MatchType) => {
    // 同じボタンを再度タップした場合は選択解除
    onChange(value === type ? null : type);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>対局種別（任意）</Text>
      <View style={styles.buttonGroup}>
        <Button
          title="フリー"
          selected={value === 'free'}
          onPress={() => handlePress('free')}
          disabled={disabled}
        />
        <Button
          title="セット"
          selected={value === 'set'}
          onPress={() => handlePress('set')}
          disabled={disabled}
        />
        <Button
          title="競技"
          selected={value === 'competition'}
          onPress={() => handlePress('competition')}
          disabled={disabled}
        />
      </View>
    </View>
  );
};
```

**配置場所**: ルールセット選択フィールドの下、会場選択フィールドの上

**デザインパターン**: 順位選択ボタンや入力方式選択ボタンと同じスタイルを使用

#### 2. 対局種別フィルタコンポーネント

**ファイル**: `frontend/src/components/common/MatchTypeFilter.tsx`

```typescript
// 注: 実際の実装ではFilterBarコンポーネントに統合されています

type MatchTypeFilterValue = 'free' | 'set' | 'competition';

// FilterBarコンポーネント内で対局種別フィルタを提供
// - 「すべての対局種別」: matchType指定なし（全ての対局を含む）
// - 「フリー」: matchType = 'free'
// - 「セット」: matchType = 'set'
// - 「競技」: matchType = 'competition'
```

**配置場所**: 期間フィルタとゲームモードフィルタと並んで配置

#### 3. 対局種別バッジコンポーネント

**ファイル**: `frontend/src/components/common/MatchTypeBadge.tsx`

```typescript
interface MatchTypeBadgeProps {
  matchType: MatchType | null;
}

const MatchTypeBadge: React.FC<MatchTypeBadgeProps> = ({ matchType }) => {
  if (!matchType) return null;

  const labels = {
    free: 'フリー',
    set: 'セット',
    competition: '競技'
  };

  const colors = {
    free: '#4CAF50',
    set: '#2196F3',
    competition: '#FF9800'
  };

  return (
    <View style={[styles.badge, { backgroundColor: colors[matchType] }]}>
      <Text style={styles.text}>{labels[matchType]}</Text>
    </View>
  );
};
```

**配置場所**: 履歴画面でルール名の近くに表示

#### 4. 型定義の拡張

**ファイル**: `frontend/src/types/match.ts`

```typescript
export type MatchType = 'free' | 'set' | 'competition';

export interface Match {
  matchId: string;
  date: string;
  gameMode: 'three' | 'four';
  entryMethod: 'rank_plus_points' | 'rank_plus_raw' | 'provisional_rank_only';
  rulesetId: string | null;
  rulesetName: string | null;
  matchType: MatchType | null;  // 新規追加
  rank: number;
  finalPoints: number | null;
  rawScore: number | null;
  chipCount: number | null;
  floatingCount: number | null;
  venueId: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MatchInput {
  date: string;
  gameMode: 'three' | 'four';
  entryMethod: 'rank_plus_points' | 'rank_plus_raw' | 'provisional_rank_only';
  rulesetId: string | null;
  matchType: MatchType | null;  // 新規追加
  rank: number;
  finalPoints?: number | null;
  rawScore?: number | null;
  chipCount?: number | null;
  floatingCount?: number | null;
  venueId?: string | null;
  memo?: string | null;
}
```

### バックエンド

#### 1. データモデルの拡張

**ファイル**: `backend/app/models/match.py`

```python
from typing import Literal, Optional
from pydantic import BaseModel, Field

MatchType = Literal["free", "set", "competition"]

class Match(BaseModel):
    """対局データモデル"""
    match_id: str = Field(alias="matchId")
    date: str
    game_mode: Literal["three", "four"] = Field(alias="gameMode")
    entry_method: Literal["rank_plus_points", "rank_plus_raw", "provisional_rank_only"] = Field(alias="entryMethod")
    ruleset_id: Optional[str] = Field(None, alias="rulesetId")
    ruleset_name: Optional[str] = Field(None, alias="rulesetName")
    match_type: Optional[MatchType] = Field(None, alias="matchType")  # 新規追加
    rank: int
    final_points: Optional[float] = Field(None, alias="finalPoints")
    raw_score: Optional[int] = Field(None, alias="rawScore")
    chip_count: Optional[int] = Field(None, alias="chipCount")
    floating_count: Optional[int] = Field(None, alias="floatingCount")
    venue_id: Optional[str] = Field(None, alias="venueId")
    memo: Optional[str] = None
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")

    class Config:
        populate_by_name = True

class MatchInput(BaseModel):
    """対局入力データモデル"""
    date: str
    game_mode: Literal["three", "four"] = Field(alias="gameMode")
    entry_method: Literal["rank_plus_points", "rank_plus_raw", "provisional_rank_only"] = Field(alias="entryMethod")
    ruleset_id: Optional[str] = Field(None, alias="rulesetId")
    match_type: Optional[MatchType] = Field(None, alias="matchType")  # 新規追加
    rank: int
    final_points: Optional[float] = Field(None, alias="finalPoints")
    raw_score: Optional[int] = Field(None, alias="rawScore")
    chip_count: Optional[int] = Field(None, alias="chipCount")
    floating_count: Optional[int] = Field(None, alias="floatingCount")
    venue_id: Optional[str] = Field(None, alias="venueId")
    memo: Optional[str] = None

    class Config:
        populate_by_name = True
```

#### 2. バリデーションロジック

**ファイル**: `backend/app/validators/match_validator.py`

```python
from typing import Optional, Literal

MatchType = Literal["free", "set", "competition"]

def validate_match_type(match_type: Optional[MatchType]) -> None:
    """対局種別のバリデーション"""
    if match_type is None:
        return  # null値は許容
    
    valid_types = ["free", "set", "competition"]
    if match_type not in valid_types:
        raise ValueError(
            f"対局種別が不正です。有効な値: {', '.join(valid_types)}"
        )
```

#### 3. リポジトリの拡張

**ファイル**: `backend/app/repositories/match_repository.py`

```python
from typing import Optional, List, Literal

MatchTypeFilter = Literal["free", "set", "competition"]

class MatchRepository:
    def get_matches(
        self,
        user_id: str,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        mode: Optional[Literal["three", "four"]] = None,
        match_type: Optional[MatchTypeFilter] = None  # 新規追加
    ) -> List[Match]:
        """対局一覧を取得（フィルタ対応）"""
        # DynamoDB Query実行
        # ...
        
        # match_typeフィルタリング
        if match_type:
            # 特定のmatchType値の対局のみ（free/set/competition）
            matches = [m for m in matches if m.match_type == match_type]
        
        return matches
    
    def create_match(self, user_id: str, match_input: MatchInput) -> Match:
        """対局を作成"""
        # バリデーション
        validate_match_type(match_input.match_type)
        
        # DynamoDB Item作成
        item = {
            "PK": f"USER#{user_id}",
            "SK": f"MATCH#{match_id}",
            "date": match_input.date,
            "gameMode": match_input.game_mode,
            "entryMethod": match_input.entry_method,
            "rulesetId": match_input.ruleset_id,
            "rank": match_input.rank,
            # ...
        }
        
        # matchTypeがnullでない場合のみ保存
        if match_input.match_type is not None:
            item["matchType"] = match_input.match_type
        
        # DynamoDB PutItem実行
        # ...
        
        return Match(**item)
```

#### 4. APIエンドポイントの拡張

**ファイル**: `backend/app/routers/matches.py`

```python
from typing import Optional, Literal
from fastapi import APIRouter, Query

router = APIRouter()

@router.get("/matches")
async def get_matches(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    mode: Optional[Literal["three", "four"]] = None,
    match_type: Optional[Literal["all", "free", "set", "competition", "null"]] = Query("all", alias="matchType")  # 新規追加
):
    """対局一覧を取得"""
    user_id = get_current_user_id()
    matches = match_repository.get_matches(
        user_id=user_id,
        from_date=from_date,
        to_date=to_date,
        mode=mode,
        match_type=match_type
    )
    return matches

@router.post("/matches")
async def create_match(match_input: MatchInput):
    """対局を登録"""
    user_id = get_current_user_id()
    match = match_repository.create_match(user_id, match_input)
    return match
```

**ファイル**: `backend/app/routers/stats.py`

```python
@router.get("/stats/summary")
async def get_stats_summary(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    mode: Literal["three", "four"] = Query("four"),
    match_type: Optional[Literal["all", "free", "set", "competition", "null"]] = Query("all", alias="matchType")  # 新規追加
):
    """成績サマリを取得"""
    user_id = get_current_user_id()
    
    # 対局データ取得（match_typeフィルタ適用）
    matches = match_repository.get_matches(
        user_id=user_id,
        from_date=from_date,
        to_date=to_date,
        mode=mode,
        match_type=match_type
    )
    
    # 統計計算
    stats = calculate_stats(matches)
    return stats
```

### データベース

#### DynamoDBスキーマ拡張

**テーブル**: `janlog-matches-{environment}`

**Item構造**:
```json
{
  "PK": "USER#user-001",
  "SK": "MATCH#match-001",
  "date": "2025-01-15T00:00:00Z",
  "gameMode": "four",
  "entryMethod": "rank_plus_points",
  "rulesetId": "ruleset-001",
  "rulesetName": "東風戦",
  "matchType": "free",  // 新規追加（null許容）
  "rank": 1,
  "finalPoints": 50.0,
  "venueId": "venue-001",
  "memo": "調子良かった",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

**注意事項**:
- `matchType`がnullの場合、DynamoDBにはAttributeを保存しない（DynamoDBのベストプラクティス）
- 既存データには`matchType` Attributeが存在しないため、読み込み時にnullとして扱う

## API仕様の拡張

### OpenAPI仕様の変更

**ファイル**: `spec/openapi.yaml`

```yaml
components:
  schemas:
    Match:
      type: object
      required: [matchId, date, gameMode, entryMethod, rank]
      properties:
        matchId: { type: string }
        date: { type: string, format: date-time }
        gameMode: { type: string, enum: [three, four] }
        entryMethod: { type: string, enum: [rank_plus_points, rank_plus_raw, provisional_rank_only] }
        rulesetId: { type: string, nullable: true }
        rulesetName: { type: string, nullable: true }
        matchType:  # 新規追加
          type: string
          enum: [free, set, competition]
          nullable: true
          description: "対局種別（フリー/セット/競技）"
        rank: { type: integer, minimum: 1, maximum: 4 }
        finalPoints: { type: number, nullable: true }
        rawScore: { type: integer, nullable: true }
        chipCount: { type: integer, nullable: true }
        floatingCount: { type: integer, nullable: true }
        venueId: { type: string, nullable: true }
        memo: { type: string, nullable: true }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }

paths:
  /matches:
    get:
      summary: 対局一覧を取得
      parameters:
        - in: query
          name: from
          schema: { type: string, format: date }
        - in: query
          name: to
          schema: { type: string, format: date }
        - in: query
          name: mode
          schema: { type: string, enum: [three, four] }
        - in: query
          name: matchType  # 新規追加
          schema:
            type: string
            enum: [all, free, set, competition, null]
            default: all
          description: "対局種別フィルタ"

  /stats/summary:
    get:
      summary: 成績サマリを取得
      parameters:
        - in: query
          name: from
          schema: { type: string, format: date }
        - in: query
          name: to
          schema: { type: string, format: date }
        - in: query
          name: mode
          schema: { type: string, enum: [three, four], default: four }
        - in: query
          name: matchType  # 新規追加
          schema:
            type: string
            enum: [all, free, set, competition, null]
            default: all
          description: "対局種別フィルタ"
```

## エラーハンドリング

### バリデーションエラー

**エラーコード**: `400 Bad Request`

**エラーレスポンス**:
```json
{
  "detail": "対局種別が不正です。有効な値: free, set, competition"
}
```

### フロントエンドエラー表示

```typescript
const validateMatchType = (matchType: MatchType | null): string | null => {
  if (matchType === null) {
    return null;  // null値は許容
  }
  
  const validTypes: MatchType[] = ['free', 'set', 'competition'];
  if (!validTypes.includes(matchType)) {
    return '対局種別が不正です';
  }
  
  return null;
};
```

## テスト戦略

### フロントエンドテスト

#### 1. MatchTypeSelectorコンポーネントテスト

```typescript
describe('MatchTypeSelector', () => {
  it('should render three buttons', () => {
    const { getByText } = render(
      <MatchTypeSelector value={null} onChange={jest.fn()} />
    );
    expect(getByText('フリー')).toBeTruthy();
    expect(getByText('セット')).toBeTruthy();
    expect(getByText('競技')).toBeTruthy();
  });

  it('should call onChange with selected type', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <MatchTypeSelector value={null} onChange={onChange} />
    );
    fireEvent.press(getByText('フリー'));
    expect(onChange).toHaveBeenCalledWith('free');
  });

  it('should deselect when pressing selected button', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <MatchTypeSelector value="free" onChange={onChange} />
    );
    fireEvent.press(getByText('フリー'));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
```

#### 2. MatchTypeFilterコンポーネントテスト

```typescript
// 注: 実際の実装ではFilterBarコンポーネントに統合されているため、
// 個別のMatchTypeFilterコンポーネントのテストは不要です。
// FilterBarコンポーネントのテストで対局種別フィルタの動作を検証します。
```

### バックエンドテスト

#### 1. バリデーションテスト

```python
def test_validate_match_type_valid():
    """有効な対局種別のバリデーション"""
    validate_match_type("free")
    validate_match_type("set")
    validate_match_type("competition")
    validate_match_type(None)  # null値は許容

def test_validate_match_type_invalid():
    """無効な対局種別のバリデーション"""
    with pytest.raises(ValueError):
        validate_match_type("invalid")
```

#### 2. リポジトリテスト

```python
def test_create_match_with_match_type():
    """対局種別付き対局の作成"""
    match_input = MatchInput(
        date="2025-01-15T00:00:00Z",
        game_mode="four",
        entry_method="rank_plus_points",
        ruleset_id="ruleset-001",
        match_type="free",
        rank=1,
        final_points=50.0
    )
    match = match_repository.create_match("user-001", match_input)
    assert match.match_type == "free"

def test_create_match_without_match_type():
    """対局種別なし対局の作成"""
    match_input = MatchInput(
        date="2025-01-15T00:00:00Z",
        game_mode="four",
        entry_method="rank_plus_points",
        ruleset_id="ruleset-001",
        match_type=None,
        rank=1,
        final_points=50.0
    )
    match = match_repository.create_match("user-001", match_input)
    assert match.match_type is None

def test_get_matches_filter_by_match_type():
    """対局種別フィルタリング"""
    matches = match_repository.get_matches(
        user_id="user-001",
        match_type="free"
    )
    assert all(m.match_type == "free" for m in matches)
```

#### 3. APIエンドポイントテスト

```python
def test_create_match_with_match_type(client):
    """対局種別付き対局登録API"""
    response = client.post("/matches", json={
        "date": "2025-01-15T00:00:00Z",
        "gameMode": "four",
        "entryMethod": "rank_plus_points",
        "rulesetId": "ruleset-001",
        "matchType": "free",
        "rank": 1,
        "finalPoints": 50.0
    })
    assert response.status_code == 201
    assert response.json()["matchType"] == "free"

def test_get_matches_with_match_type_filter(client):
    """対局種別フィルタAPI"""
    response = client.get("/matches?matchType=free")
    assert response.status_code == 200
    matches = response.json()
    assert all(m["matchType"] == "free" for m in matches if m["matchType"])
```

## マイグレーション戦略

### データマイグレーション不要

既存データには`matchType` Attributeが存在しないため、以下の方針で対応：

1. **読み込み時**: Attributeが存在しない場合は`null`として扱う
2. **書き込み時**: `null`の場合はAttributeを保存しない
3. **フィルタリング時**: `null`フィルタで既存データを表示可能

### 後方互換性

- 既存のAPIクライアントは`matchType`フィールドを無視できる
- 新しいAPIクライアントは`matchType`フィールドを利用できる
- 既存データ（matchType=null）は「すべての対局種別」フィルタで表示される

## パフォーマンス考慮事項

### DynamoDBクエリ最適化

- `matchType`フィルタはアプリケーション層で実行（GSI不要）
- 既存のGSI（MATCH_BY_USER_DATE、MATCH_BY_USER_MODE_DATE）を活用
- フィルタリング後のデータ量は少ないため、パフォーマンス影響は軽微

### フロントエンドキャッシュ

- 対局種別フィルタ選択状態をローカルストレージに保存
- 画面遷移時にフィルタ状態を復元

## セキュリティ考慮事項

### 入力バリデーション

- フロントエンドとバックエンドの両方でバリデーション実行
- enum型による型安全性の確保
- 不正な値の拒否

### 認可

- 対局種別フィールドは認証済みユーザーのみ利用可能
- 既存の認証・認可メカニズムを継承

## 実装の優先順位

### Phase 1: バックエンド実装
1. データモデル拡張
2. バリデーション実装
3. リポジトリ拡張
4. APIエンドポイント拡張
5. OpenAPI仕様更新

### Phase 2: フロントエンド実装
1. 型定義拡張
2. MatchTypeSelectorコンポーネント実装
3. 対局登録画面への統合
4. 対局編集画面への統合

### Phase 3: フィルタリング実装
1. MatchTypeFilterコンポーネント実装
2. 統計画面へのフィルタ追加
3. 履歴画面へのフィルタ追加
4. MatchTypeBadgeコンポーネント実装

### Phase 4: テスト・検証
1. ユニットテスト実装
2. 統合テスト実装
3. 既存データとの互換性検証
4. E2Eテスト実行

## 関連ドキュメント

- **要件書**: `.kiro/specs/features/match-category/requirements.md`
- **OpenAPI仕様**: `spec/openapi.yaml`
- **Core設計書**