/**
 * 複合バリデーションのテスト
 */

import { MatchValidator, MatchValidationInput } from '../matchValidator';
import { ValidationErrorCode } from '../../types/validation';
import {
  FIXED_UMA_FOUR,
  FLOATING_UMA_FOUR,
  FLOATING_UMA_THREE,
  FIXED_UMA_FOUR_EQUAL_POINTS,
} from './fixtures/rulesets';

describe('MatchValidator - 複合バリデーション', () => {
  const today = new Date().toISOString().split('T')[0];

  describe('浮き人数の存在可能性バリデーション', () => {
    describe('E-10-01: 開始点=基準点で浮き人数0は存在しない', () => {
      it('開始点=基準点で浮き人数0はエラー', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 30000,
          floatingCount: 0,
          ruleset: FLOATING_UMA_FOUR, // 30000点持ち30000点返し
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.IMPOSSIBLE_ZERO_FLOATING
          )
        ).toBe(true);
      });

      it('開始点=基準点で浮き人数1は有効', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 35000,
          floatingCount: 1,
          ruleset: FLOATING_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });
    });

    describe('E-10-02: 開始点<基準点で浮き人数=ゲームモード人数は不可能', () => {
      it('開始点<基準点で浮き人数4はエラー（4麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 40000,
          floatingCount: 3,
          ruleset: FLOATING_UMA_THREE, // 30000点持ち35000点返し
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.IMPOSSIBLE_ALL_FLOATING
          )
        ).toBe(true);
      });

      it('開始点<基準点で浮き人数2は有効（3麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 40000,
          floatingCount: 2,
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('素点と浮き人数の整合性バリデーション', () => {
    describe('E-20-01: 自分が浮いているのに浮き人数0', () => {
      it('素点が基準点以上で浮き人数0はエラー', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 40000, // 基準点35000より大きい
          floatingCount: 0,
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.FLOATING_SCORE_WITH_ZERO_COUNT
          )
        ).toBe(true);
      });

      it('素点が基準点以上で浮き人数1は有効', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 40000,
          floatingCount: 1,
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });
    });

    describe('E-20-02: 自分が沈んでいるのに全員浮き', () => {
      it('素点が基準点未満で全員浮きはエラー（3麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 3,
          rawScore: 30000, // 基準点35000より小さい
          floatingCount: 3,
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) =>
              e.code === ValidationErrorCode.SINKING_SCORE_WITH_ALL_FLOATING
          )
        ).toBe(true);
      });

      it('素点が基準点未満で浮き人数2は有効（3麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 3,
          rawScore: 30000,
          floatingCount: 2,
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });
    });

    describe('E-20-03: 開始点=基準点で浮き人数<1', () => {
      it('開始点=基準点で浮き人数0はエラー', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 30000,
          floatingCount: 0,
          ruleset: FLOATING_UMA_FOUR, // 30000点持ち30000点返し
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) =>
              e.code ===
              ValidationErrorCode.INCONSISTENT_FLOATING_COUNT_WITH_EQUAL_POINTS
          )
        ).toBe(true);
      });
    });

    describe('E-20-04: 開始点<基準点で浮き人数>N-1', () => {
      it('開始点<基準点で浮き人数3はエラー（3麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 40000,
          floatingCount: 3,
          ruleset: FLOATING_UMA_THREE, // 30000点持ち35000点返し
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) =>
              e.code ===
              ValidationErrorCode.INCONSISTENT_FLOATING_COUNT_WITH_LOWER_START
          )
        ).toBe(true);
      });

      it('開始点<基準点で浮き人数2は有効（3麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 40000,
          floatingCount: 2,
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('順位と素点の関係バリデーション', () => {
    describe('E-30-01: 1位で浮き2人以上なのに沈み', () => {
      it('1位で浮き2人以上なのに素点が基準点未満はエラー', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 30000, // 基準点35000より小さい
          floatingCount: 2,
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) =>
              e.code === ValidationErrorCode.TOP_RANK_SINKING_WITH_FLOATING
          )
        ).toBe(true);
      });

      it('1位で浮き2人以上で素点が基準点以上は有効', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 40000,
          floatingCount: 2,
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });

      it('1位で浮き1人なら素点が基準点未満でも有効（全員同点）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 30000,
          floatingCount: 1,
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });
    });

    describe('E-30-02: 最下位で浮き少ないのに浮き', () => {
      it('3位で浮き1人なのに素点が基準点より大きいはエラー（3麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 3,
          rawScore: 36000, // 基準点35000より大きい
          floatingCount: 1,
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) =>
              e.code ===
              ValidationErrorCode.LAST_RANK_FLOATING_WITHOUT_ALL_FLOATING
          )
        ).toBe(true);
      });

      it('3位で浮き2人なら素点が基準点でも有効（3麻、全員同点）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 3,
          rawScore: 35000, // 基準点と同じ（全員同点）
          floatingCount: 2,
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });
    });

    describe('E-30-03: 開始点<基準点で最下位が浮き', () => {
      it('開始点<基準点で最下位が基準点より大きいはエラー', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 3,
          rawScore: 36000, // 基準点35000より大きい
          floatingCount: 2,
          ruleset: FLOATING_UMA_THREE, // 30000点持ち35000点返し
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) =>
              e.code ===
              ValidationErrorCode.LAST_RANK_FLOATING_WITH_LOWER_START
          )
        ).toBe(true);
      });

      it('開始点<基準点で最下位が基準点以下は有効', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 3,
          rawScore: 30000,
          floatingCount: 2,
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });
    });

    describe('E-30-04: 全員浮きなのに自分が沈み', () => {
      it('開始点=基準点で全員浮きなのに素点が基準点未満はエラー', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_raw',
          rank: 4,
          rawScore: 29000, // 基準点30000より小さい
          floatingCount: 4,
          ruleset: FLOATING_UMA_FOUR, // 30000点持ち30000点返し
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) =>
              e.code === ValidationErrorCode.ALL_FLOATING_WITH_SINKING_SCORE
          )
        ).toBe(true);
      });

      it('全員浮きで素点が基準点以上は有効', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_raw',
          rank: 4,
          rawScore: 30000,
          floatingCount: 4,
          ruleset: FLOATING_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });
    });

    describe('E-30-05: 全員沈みなのに自分が浮き', () => {
      it('全員沈みなのに素点が基準点以上はエラー', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 35000, // 基準点35000以上
          floatingCount: 0,
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) =>
              e.code === ValidationErrorCode.ALL_SINKING_WITH_FLOATING_SCORE
          )
        ).toBe(true);
      });

      it('全員沈みで素点が基準点未満は有効', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 34000,
          floatingCount: 0,
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('最終ポイント関連のバリデーション', () => {
    describe('E-43-01: トップの最終ポイント下限チェック', () => {
      it('1位の最終ポイントが下限未満はエラー（固定ウマ）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_points',
          rank: 1,
          finalPoints: 49.0, // 下限は50.0（ウマ30 + オカ20）
          ruleset: FIXED_UMA_FOUR, // ウマ[30, 10, -10, -30], オカ20
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.TOP_POINTS_BELOW_MINIMUM
          )
        ).toBe(true);
      });

      it('1位の最終ポイントが下限以上は有効（固定ウマ）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_points',
          rank: 1,
          finalPoints: 50.0,
          ruleset: FIXED_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });

      it('1位の最終ポイントが下限未満はエラー（浮きウマ）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_points',
          rank: 1,
          finalPoints: 11.0, // 下限は12.0（ウマ12 + オカ0）
          floatingCount: 1,
          ruleset: FLOATING_UMA_FOUR, // 浮き1人: ウマ[12, -1, -3, -8], オカ0
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.TOP_POINTS_BELOW_MINIMUM
          )
        ).toBe(true);
      });

      it('1位の最終ポイントが下限以上は有効（浮きウマ）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_points',
          rank: 1,
          finalPoints: 12.0,
          floatingCount: 1,
          ruleset: FLOATING_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });
    });

    describe('E-44-01: ラスの最終ポイント上限チェック', () => {
      it('4位の最終ポイントが上限超過はエラー（固定ウマ）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_points',
          rank: 4,
          finalPoints: -29.0, // 上限は-30.0（ウマ-30）
          ruleset: FIXED_UMA_FOUR, // ウマ[30, 10, -10, -30]
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.LAST_POINTS_ABOVE_MAXIMUM
          )
        ).toBe(true);
      });

      it('4位の最終ポイントが上限以下は有効（固定ウマ）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_points',
          rank: 4,
          finalPoints: -30.0,
          ruleset: FIXED_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });

      it('4位の最終ポイントが上限超過はエラー（浮きウマ）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_points',
          rank: 4,
          finalPoints: -7.0, // 上限は-8.0（ウマ-8）
          floatingCount: 1,
          ruleset: FLOATING_UMA_FOUR, // 浮き1人: ウマ[12, -1, -3, -8]
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.LAST_POINTS_ABOVE_MAXIMUM
          )
        ).toBe(true);
      });

      it('4位の最終ポイントが上限以下は有効（浮きウマ）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_points',
          rank: 4,
          finalPoints: -8.0,
          floatingCount: 1,
          ruleset: FLOATING_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });
    });
  });
});
