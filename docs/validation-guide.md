# 対局データバリデーション 開発者ガイド

このドキュメントは、対局データバリデーション機能の使い方、新しいバリデーションルールの追加方法、トラブルシューティングについて説明します。

## 目次

1. [概要](#概要)
2. [基本的な使い方](#基本的な使い方)
3. [新しいバリデーションルールの追加](#新しいバリデーションルールの追加)
4. [テストの書き方](#テストの書き方)
5. [トラブルシューティング](#トラブルシューティング)
6. [ベストプラクティス](#ベストプラクティス)

---

## 概要

### バリデーションの目的

対局データバリデーション機能は、以下の目的で実装されています：

1. **データ整合性の保証**: 麻雀成績として論理的にありえない状態を検出
2. **ユーザー体験の向上**: 明確なエラーメッセージで修正方法を提示
3. **二重バリデーション**: フロントエンドとバックエンドで同等のチェック
4. **保守性**: バリデーションルールを一元管理し、テストで網羅

### アーキテクチャ

```
┌─────────────────────────────────────────┐
│  UI Layer (React Components)           │
│  - リアルタイムバリデーション表示      │
│  - エラーメッセージ表示                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Validation Layer (Frontend)           │
│  - MatchValidator クラス                │
│  - 単一項目バリデーション              │
│  - 複合バリデーション                  │
└─────────────────┬───────────────────────┘
                  │ API Request
┌─────────────────▼───────────────────────┐
│  API Layer (Backend)                    │
│  - Pydantic モデルバリデーション       │
│  - カスタムバリデーター                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Validation Layer (Backend)             │
│  - MatchValidator クラス                │
│  - 単一項目バリデーション              │
│  - 複合バリデーション                  │
└─────────────────────────────────────────┘
```

### 主要コンポーネント

**フロントエンド:**
- `frontend/src/types/validation.ts` - 型定義とエラーコード
- `frontend/src/utils/matchValidator.ts` - バリデーションロジック
- `frontend/src/hooks/useMatchForm.ts` - フォーム統合

**バックエンド:**
- `backend/app/utils/validation_types.py` - 型定義とエラーコード
- `backend/app/utils/match_validator.py` - バリデーションロジック
- `backend/app/models/match.py` - Pydanticモデル統合

---

## 基本的な使い方

### フロントエンドでの使用

#### 1. 包括的バリデーション

```typescript
import { MatchValidator } from '../utils/matchValidator';
import { Ruleset } from '../types/ruleset';

// バリデーション対象データ
const input = {
  date: '2024-01-15',
  gameMode: 'four' as const,
  entryMethod: 'rank_plus_raw' as const,
  rank: 1,
  rawScore: 30000,
  floatingCount: 2,
  ruleset: myRuleset,
};

// バリデーション実行
const result = MatchValidator.validate(input);

if (!result.isValid) {
  // エラーがある場合
  result.errors.forEach(error => {
    console.log(`${error.field}: ${error.message}`);
    console.log(`ヒント: ${error.hint}`);
  });
}
```

#### 2. 単一項目バリデーション

```typescript
// 日付のみバリデーション
const dateResult = MatchValidator.validateDate('2024-01-15');

// 順位のみバリデーション
const rankResult = MatchValidator.validateRank(1, 'four');

// 素点のみバリデーション
const rawScoreResult = MatchValidator.validateRawScore(30000);
```

#### 3. フォームでの使用（useMatchForm）

```typescript
import { useMatchForm } from '../hooks/useMatchForm';

function MatchForm() {
  const {
    formData,
    errors,
    handleChange,
    handleSubmit,
  } = useMatchForm({
    onSubmit: async (data) => {
      // 送信処理
    },
  });

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="date"
        value={formData.date}
        onChange={(e) => handleChange('date', e.target.value)}
      />
      {errors.date && (
        <div className="error">
          {errors.date.message}
          <div className="hint">{errors.date.hint}</div>
        </div>
      )}
      {/* 他のフィールド */}
    </form>
  );
}
```

### バックエンドでの使用

#### 1. Pydanticモデルでの自動バリデーション

```python
from app.models.match import MatchRequest

# Pydanticモデルでの自動バリデーション
try:
    match_request = MatchRequest(
        date="2024-01-15",
        gameMode="four",
        entryMethod="rank_plus_raw",
        rank=1,
        rawScore=30000,
        floatingCount=2,
        rulesetId="ruleset-001",
    )
except ValidationError as e:
    # バリデーションエラー
    print(e.errors())
```

#### 2. 手動バリデーション

```python
from app.utils.match_validator import MatchValidator
from app.models.ruleset import Ruleset

# バリデーション実行
result = MatchValidator.validate(
    date="2024-01-15",
    game_mode="four",
    entry_method="rank_plus_raw",
    rank=1,
    ruleset=my_ruleset,
    raw_score=30000,
    floating_count=2,
)

if not result.is_valid:
    # エラーがある場合
    for error in result.errors:
        print(f"{error.field}: {error.message}")
        print(f"ヒント: {error.hint}")
```

#### 3. APIエンドポイントでの使用

```python
from fastapi import HTTPException
from app.utils.match_validator import MatchValidator

@router.post("/matches")
async def create_match(match: MatchRequest):
    # 追加のバリデーション（必要に応じて）
    result = MatchValidator.validate(
        date=match.date,
        game_mode=match.gameMode,
        entry_method=match.entryMethod,
        rank=match.rank,
        ruleset=ruleset,
        final_points=match.finalPoints,
        raw_score=match.rawScore,
        floating_count=match.floatingCount,
    )
    
    if not result.is_valid:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "バリデーションエラーが発生しました",
                "errors": [error.dict() for error in result.errors]
            }
        )
    
    # 対局データの保存処理
    # ...
```

---

## 新しいバリデーションルールの追加

### ステップ1: エラーコードの追加

#### フロントエンド

`frontend/src/types/validation.ts`にエラーコードを追加：

```typescript
export enum ValidationErrorCode {
  // 既存のエラーコード...
  
  // E-50系: 新しいカテゴリのエラー
  NEW_VALIDATION_ERROR = 'E-50-01',
}
```

#### バックエンド

`backend/app/utils/validation_types.py`にエラーコードを追加：

```python
class ValidationErrorCode(str, Enum):
    # 既存のエラーコード...
    
    # E-50系: 新しいカテゴリのエラー
    NEW_VALIDATION_ERROR = "E-50-01"
```

**重要:** フロントエンドとバックエンドで同じコード値を使用すること。

### ステップ2: エラーメッセージの追加

#### フロントエンド

`frontend/src/types/validation.ts`の`ERROR_MESSAGES`に追加：

```typescript
export const ERROR_MESSAGES: Record<
  ValidationErrorCode,
  { message: string; hint: string }
> = {
  // 既存のメッセージ...
  
  [ValidationErrorCode.NEW_VALIDATION_ERROR]: {
    message: '新しいバリデーションエラーが発生しました',
    hint: '修正方法のヒントをここに記載',
  },
};
```

#### バックエンド

`backend/app/utils/validation_types.py`の`ERROR_MESSAGES`に追加：

```python
ERROR_MESSAGES: Dict[ValidationErrorCode, Dict[str, str]] = {
    # 既存のメッセージ...
    
    ValidationErrorCode.NEW_VALIDATION_ERROR: {
        "message": "新しいバリデーションエラーが発生しました",
        "hint": "修正方法のヒントをここに記載",
    },
}
```

### ステップ3: バリデーションメソッドの追加

#### フロントエンド

`frontend/src/utils/matchValidator.ts`にメソッドを追加：

```typescript
export class MatchValidator {
  // 既存のメソッド...
  
  /**
   * 新しいバリデーション
   */
  static validateNewRule(input: MatchValidationInput): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // バリデーションロジック
    if (/* 条件 */) {
      errors.push({
        field: 'fieldName',
        code: ValidationErrorCode.NEW_VALIDATION_ERROR,
        message: ERROR_MESSAGES[ValidationErrorCode.NEW_VALIDATION_ERROR].message,
        severity: 'error',
        hint: ERROR_MESSAGES[ValidationErrorCode.NEW_VALIDATION_ERROR].hint,
      });
    }
    
    return errors;
  }
  
  // validate()メソッドから呼び出す
  static validate(input: MatchValidationInput): ValidationResult {
    const errors: ValidationError[] = [];
    
    // 既存のバリデーション...
    
    // 新しいバリデーションを追加
    errors.push(...this.validateNewRule(input));
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

#### バックエンド

`backend/app/utils/match_validator.py`にメソッドを追加：

```python
class MatchValidator:
    # 既存のメソッド...
    
    @staticmethod
    def validate_new_rule(
        # パラメータ
    ) -> ValidationResult:
        """新しいバリデーション"""
        errors: List[ValidationError] = []
        
        # バリデーションロジック
        if # 条件:
            errors.append(
                ValidationError(
                    field="fieldName",
                    code=ValidationErrorCode.NEW_VALIDATION_ERROR,
                    message=ERROR_MESSAGES[ValidationErrorCode.NEW_VALIDATION_ERROR]["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=ERROR_MESSAGES[ValidationErrorCode.NEW_VALIDATION_ERROR]["hint"],
                )
            )
        
        return ValidationResult(is_valid=len(errors) == 0, errors=errors)
    
    @staticmethod
    def validate(
        # パラメータ
    ) -> ValidationResult:
        """包括的バリデーション"""
        errors: List[ValidationError] = []
        
        # 既存のバリデーション...
        
        # 新しいバリデーションを追加
        new_rule_result = MatchValidator.validate_new_rule(...)
        errors.extend(new_rule_result.errors)
        
        return ValidationResult(is_valid=len(errors) == 0, errors=errors)
```

### ステップ4: テストの追加

#### フロントエンド

`frontend/src/utils/__tests__/matchValidator.newRule.test.ts`を作成：

```typescript
import { MatchValidator } from '../matchValidator';
import { ValidationErrorCode } from '../../types/validation';
import { FIXED_UMA_RULESET_4 } from './fixtures/rulesets';

describe('MatchValidator - 新しいバリデーション', () => {
  describe('正常系', () => {
    it('正常なデータではエラーが発生しない', () => {
      const input = {
        date: '2024-01-15',
        gameMode: 'four' as const,
        entryMethod: 'rank_plus_raw' as const,
        rank: 1,
        rawScore: 30000,
        ruleset: FIXED_UMA_RULESET_4,
      };
      
      const result = MatchValidator.validate(input);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  describe('異常系', () => {
    it('条件を満たす場合はエラーが発生する', () => {
      const input = {
        // エラーが発生するデータ
      };
      
      const result = MatchValidator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(ValidationErrorCode.NEW_VALIDATION_ERROR);
    });
  });
  
  describe('境界値', () => {
    it('境界値でのテスト', () => {
      // 境界値テストケース
    });
  });
});
```

#### バックエンド

`backend/tests/utils/test_match_validator_new_rule.py`を作成：

```python
import pytest
from app.utils.match_validator import MatchValidator
from app.utils.validation_types import ValidationErrorCode
from tests.fixtures.rulesets import FIXED_UMA_RULESET_4

class TestMatchValidatorNewRule:
    """新しいバリデーションのテスト"""
    
    def test_valid_data(self):
        """正常なデータではエラーが発生しない"""
        result = MatchValidator.validate(
            date="2024-01-15",
            game_mode="four",
            entry_method="rank_plus_raw",
            rank=1,
            ruleset=FIXED_UMA_RULESET_4,
            raw_score=30000,
        )
        
        assert result.is_valid is True
        assert len(result.errors) == 0
    
    def test_invalid_data(self):
        """条件を満たす場合はエラーが発生する"""
        result = MatchValidator.validate(
            # エラーが発生するデータ
        )
        
        assert result.is_valid is False
        assert len(result.errors) == 1
        assert result.errors[0].code == ValidationErrorCode.NEW_VALIDATION_ERROR
    
    def test_boundary_value(self):
        """境界値でのテスト"""
        # 境界値テストケース
        pass
```

### ステップ5: ドキュメントの更新

`spec/design/match-validation.md`に新しいバリデーションルールを追加：

1. エラーコード体系に追加
2. 複合バリデーションセクションに説明を追加
3. エラーメッセージ一覧に追加
4. 条件マトリクスに追加（必要に応じて）

---

## テストの書き方

### テストの基本構造

```typescript
describe('MatchValidator - バリデーション名', () => {
  describe('正常系', () => {
    it('正常なデータではエラーが発生しない', () => {
      // テストケース
    });
  });
  
  describe('異常系', () => {
    it('エラー条件を満たす場合はエラーが発生する', () => {
      // テストケース
    });
  });
  
  describe('境界値', () => {
    it('境界値でのテスト', () => {
      // テストケース
    });
  });
});
```

### テストフィクスチャの使用

テストで使用するルールセットデータは共通化します。

**フロントエンド:**

```typescript
import {
  FIXED_UMA_RULESET_3,
  FIXED_UMA_RULESET_4,
  FLOATING_UMA_RULESET_3,
  FLOATING_UMA_RULESET_4,
} from './fixtures/rulesets';

// テストで使用
const input = {
  // ...
  ruleset: FIXED_UMA_RULESET_4,
};
```

**バックエンド:**

```python
from tests.fixtures.rulesets import (
    FIXED_UMA_RULESET_3,
    FIXED_UMA_RULESET_4,
    FLOATING_UMA_RULESET_3,
    FLOATING_UMA_RULESET_4,
)

# テストで使用
result = MatchValidator.validate(
    # ...
    ruleset=FIXED_UMA_RULESET_4,
)
```

### テストケースの網羅

各バリデーションルールについて、以下のテストケースを作成します：

1. **正常系**: バリデーションが成功するケース
2. **異常系**: バリデーションが失敗するケース
3. **境界値**: 境界値でのテスト（範囲チェックの場合）
4. **エッジケース**: 特殊なケース（全員同点など）

### テストの実行

**フロントエンド:**

```bash
# 全テスト実行
npm test

# 特定のテストファイルのみ実行
npm test matchValidator.test.ts

# カバレッジ付きで実行
npm test -- --coverage
```

**バックエンド:**

```bash
# 全テスト実行
pytest

# 特定のテストファイルのみ実行
pytest tests/utils/test_match_validator.py

# カバレッジ付きで実行
pytest --cov=app/utils
```

---

## トラブルシューティング

### フロントエンドとバックエンドでバリデーション結果が異なる

**症状:**
- フロントエンドではエラーが出ないが、バックエンドでエラーが発生する
- または、その逆

**原因:**
1. エラーコードが異なる
2. バリデーションロジックが異なる
3. 浮動小数点の比較方法が異なる

**解決方法:**

1. **エラーコードの確認**
   ```typescript
   // フロントエンド
   ValidationErrorCode.FUTURE_DATE = 'E-00-02'
   ```
   ```python
   # バックエンド
   ValidationErrorCode.FUTURE_DATE = "E-00-02"
   ```
   両方で同じ値になっているか確認。

2. **バリデーションロジックの確認**
   フロントエンドとバックエンドのバリデーションメソッドを比較し、同等のロジックになっているか確認。

3. **浮動小数点の比較**
   ```typescript
   // フロントエンド
   if (Math.abs(value1 - value2) < 0.0001) {
     // ほぼ等しい
   }
   ```
   ```python
   # バックエンド
   if abs(value1 - value2) < 0.0001:
       # ほぼ等しい
   ```

4. **テストケースの実行**
   両方で同じテストケースを実行して、差異を特定。

### 新しいルールセットでバリデーションエラーが発生する

**症状:**
- 新しいルールセットを追加したら、バリデーションエラーが発生する

**原因:**
1. `useFloatingUma`フラグが正しく設定されていない
2. 浮きウマルールの場合、`umaMatrix`に必要なキーが定義されていない
3. 固定ウマルールの場合、`uma`配列の長さが不正

**解決方法:**

1. **useFloatingUmaフラグの確認**
   ```typescript
   const ruleset = {
     // ...
     useFloatingUma: true, // または false
   };
   ```

2. **umaMatrixの確認（浮きウマルールの場合）**
   ```typescript
   const ruleset = {
     // ...
     useFloatingUma: true,
     umaMatrix: {
       '1': [40, 20, -20, -40], // 浮き1人
       '2': [35, 15, -15, -35], // 浮き2人
       '3': [30, 10, -10, -30], // 浮き3人
     },
   };
   ```
   
   必要な浮き人数のキーが全て定義されているか確認。
   - 3麻: '1', '2', '3'
   - 4麻: '1', '2', '3'（'0'と'4'は存在しない）

3. **uma配列の確認（固定ウマルールの場合）**
   ```typescript
   const ruleset = {
     // ...
     useFloatingUma: false,
     uma: [30, 10, -10, -30], // 4麻の場合は4要素
   };
   ```
   
   配列の長さがゲームモード人数と一致しているか確認。

### バリデーションが厳しすぎる

**症状:**
- 正常なデータでもバリデーションエラーが発生する
- ユーザーから「入力できない」という報告がある

**原因:**
1. バリデーションルールが実際の麻雀のルールと合っていない
2. 境界値の判定が厳しすぎる
3. エッジケースを考慮していない

**解決方法:**

1. **バリデーションルールの見直し**
   - 該当するバリデーションルールが本当に必要か再検討
   - 麻雀のルールと照らし合わせて、論理的に正しいか確認

2. **警告レベルへの変更**
   ```typescript
   errors.push({
     field: 'fieldName',
     code: ValidationErrorCode.SOME_ERROR,
     message: 'エラーメッセージ',
     severity: 'warning', // errorからwarningに変更
     hint: 'ヒント',
   });
   ```
   
   エラーではなく警告として表示し、送信はブロックしない。

3. **条件の追加**
   特定の条件下でのみバリデーションを適用するように変更。
   
   ```typescript
   // 例: Mode 2の場合のみチェック
   if (input.entryMethod === 'rank_plus_raw') {
     // バリデーション
   }
   ```

4. **境界値の調整**
   ```typescript
   // 厳しすぎる
   if (value > threshold) {
     // エラー
   }
   
   // 調整後
   if (value > threshold + 0.1) { // 許容範囲を追加
     // エラー
   }
   ```

### テストが失敗する

**症状:**
- テストが失敗する
- カバレッジが低い

**原因:**
1. テストケースが不足している
2. テストデータが不正
3. バリデーションロジックにバグがある

**解決方法:**

1. **テストケースの追加**
   - 正常系・異常系・境界値のテストケースを全て作成
   - エッジケースのテストケースを追加

2. **テストデータの確認**
   - テストフィクスチャが正しいか確認
   - ルールセットデータが正しいか確認

3. **バリデーションロジックの修正**
   - テストが失敗する原因を特定
   - バリデーションロジックを修正

4. **カバレッジの確認**
   ```bash
   # フロントエンド
   npm test -- --coverage
   
   # バックエンド
   pytest --cov=app/utils
   ```
   
   カバレッジレポートを確認し、テストされていない部分を特定。

---

## ベストプラクティス

### 1. フロントエンドとバックエンドの一貫性

- エラーコードは必ず両方で同じ値を使用する
- バリデーションロジックは同等にする
- テストケースも同等にする

### 2. エラーメッセージの明確性

- エラーメッセージは具体的に記述する
- 修正ヒントを必ず提供する
- 専門用語を避け、わかりやすい言葉を使う

**良い例:**
```typescript
{
  message: '1位の最終ポイントがルール上の最小値を下回っています',
  hint: '最終ポイントは50.0以上である必要があります',
}
```

**悪い例:**
```typescript
{
  message: 'エラー',
  hint: '修正してください',
}
```

### 3. バリデーション実行順序

バリデーションは以下の順序で実行する：

1. 基本形式チェック（型・桁数・範囲）
2. ルール整合性チェック
3. 浮き人数の存在可能性チェック
4. 素点と浮き人数の整合性チェック
5. 順位と素点の関係チェック
6. 最終ポイント計算・形式チェック
7. 入力方式別の追加チェック

この順序により、早期にエラーを検出でき、パフォーマンスが向上します。

### 4. テストの網羅性

- 各バリデーションルールに対して、正常系・異常系・境界値のテストケースを作成
- カバレッジ90%以上を目標とする
- エッジケース（全員同点など）も忘れずにテストする

### 5. ドキュメントの保守

- 新しいバリデーションルールを追加したら、必ずドキュメントを更新する
- エラーコード一覧を最新に保つ
- 実装状況セクションを更新する

### 6. パフォーマンス考慮

- 早期リターンを活用する（基本形式エラーがあれば複合バリデーションをスキップ）
- 不要な計算を避ける
- キャッシュを活用する（頻繁に参照されるデータ）

### 7. 拡張性

- 新しいバリデーションルールを追加しやすい設計にする
- エラーコード体系を拡張可能にする
- 将来の国際化対応を考慮する

### 8. セキュリティ

- フロントエンドのバリデーションだけに頼らない
- バックエンドでも必ずバリデーションを実施する
- 入力値のサニタイズを忘れない

---

## 参考資料

### 関連ドキュメント

- **バリデーション仕様書**: `spec/design/match-validation.md`
- **要件定義**: `.kiro/specs/features/comprehensive-match-validation/requirements.md`
- **設計書**: `.kiro/specs/features/comprehensive-match-validation/design.md`
- **API仕様**: `spec/openapi.yaml`

### 実装ファイル

**フロントエンド:**
- `frontend/src/types/validation.ts`
- `frontend/src/utils/matchValidator.ts`
- `frontend/src/hooks/useMatchForm.ts`

**バックエンド:**
- `backend/app/utils/validation_types.py`
- `backend/app/utils/match_validator.py`
- `backend/app/models/match.py`

### テストファイル

**フロントエンド:**
- `frontend/src/utils/__tests__/matchValidator.*.test.ts`

**バックエンド:**
- `backend/tests/utils/test_match_validator_*.py`
- `backend/tests/api/test_matches_validation.py`

---

## 変更履歴

| 日付 | 変更内容 | 担当者 |
|------|----------|--------|
| 2025-01 | 初版作成 | 開発チーム |
