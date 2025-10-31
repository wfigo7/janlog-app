/**
 * 入力方式別バリデーションのテスト
 */

import { MatchValidator, MatchValidationInput } from '../matchValidator';
import { ValidationErrorCode } from '../../types/validation';
import {
  FIXED_UMA_FOUR,
  FLOATING_UMA_FOUR,
  FIXED_UMA_THREE,
  FLOATING_UMA_THREE,
} from './fixtures/rulesets';

describe('MatchValidator - 入力方式別バリデーション', () => {
  const today = new Date().toISOString().split('T')[0];

  describe('Mode 1: 順位+最終ポイント (rank_plus_points)', () => {
    describe('固定ウマルール', () => {
      it('正常な入力は有効（4麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_points',
          rank: 1,
          finalPoints: 55.0, // (35000-30000)/1000 + 30 + 20 = 55.0
          ruleset: FIXED_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });

      it('トップの下限チェック（4麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_points',
          rank: 1,
          finalPoints: 49.0, // 下限50.0未満
          ruleset: FIXED_UMA_FOUR, // ウマ30 + オカ20 = 50.0
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.TOP_POINTS_BELOW_MINIMUM
          )
        ).toBe(true);
      });

      it('ラスの上限チェック（4麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_points',
          rank: 4,
          finalPoints: -29.0, // 上限-30.0超過
          ruleset: FIXED_UMA_FOUR, // ウマ-30
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.LAST_POINTS_ABOVE_MAXIMUM
          )
        ).toBe(true);
      });

      it('浮き人数を入力するとエラー（固定ウマ）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_points',
          rank: 1,
          finalPoints: 55.0,
          floatingCount: 2, // 固定ウマでは不要
          ruleset: FIXED_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.FLOATING_COUNT_WITH_FIXED_UMA
          )
        ).toBe(true);
      });

      it('最終ポイント未入力はエラー', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_points',
          rank: 1,
          // finalPoints未入力
          ruleset: FIXED_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.MISSING_FINAL_POINTS
          )
        ).toBe(true);
      });
    });

    describe('浮きウマルール', () => {
      it('正常な入力は有効（4麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_points',
          rank: 1,
          finalPoints: 12.0, // 浮き1人: ウマ12 + オカ0 = 12.0
          floatingCount: 1,
          ruleset: FLOATING_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });

      it('トップの下限チェック（浮き1人）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_points',
          rank: 1,
          finalPoints: 11.0, // 下限12.0未満
          floatingCount: 1,
          ruleset: FLOATING_UMA_FOUR, // 浮き1人: ウマ12 + オカ0 = 12.0
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.TOP_POINTS_BELOW_MINIMUM
          )
        ).toBe(true);
      });

      it('ラスの上限チェック（浮き1人）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_points',
          rank: 4,
          finalPoints: -7.0, // 上限-8.0超過
          floatingCount: 1,
          ruleset: FLOATING_UMA_FOUR, // 浮き1人: ウマ-8
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.LAST_POINTS_ABOVE_MAXIMUM
          )
        ).toBe(true);
      });
    });
  });

  describe('Mode 2: 順位+素点 (rank_plus_raw)', () => {
    describe('固定ウマルール', () => {
      it('正常な入力は有効（4麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 35000,
          ruleset: FIXED_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });

      it('素点未入力はエラー', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          // rawScore未入力
          ruleset: FIXED_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.MISSING_RAW_SCORE
          )
        ).toBe(true);
      });

      it('浮き人数を入力するとエラー（固定ウマ）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 35000,
          floatingCount: 2, // 固定ウマでは不要
          ruleset: FIXED_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.FLOATING_COUNT_WITH_FIXED_UMA
          )
        ).toBe(true);
      });
    });

    describe('浮きウマルール', () => {
      it('正常な入力は有効（3麻）', () => {
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

      it('浮き人数未入力はエラー', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'rank_plus_raw',
          rank: 1,
          rawScore: 40000,
          // floatingCount未入力
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.MISSING_FLOATING_COUNT
          )
        ).toBe(true);
      });

      it('複合バリデーション: 自分が浮いているのに浮き人数0', () => {
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

      it('複合バリデーション: 1位で浮き2人以上なのに沈み', () => {
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
    });
  });

  describe('Mode 3: 仮ポイント (provisional_rank_only)', () => {
    describe('固定ウマルール', () => {
      it('正常な入力は有効（4麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'provisional_rank_only',
          rank: 1,
          ruleset: FIXED_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });

      it('2位の入力は有効（4麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'provisional_rank_only',
          rank: 2,
          ruleset: FIXED_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });

      it('3位の入力は有効（4麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'provisional_rank_only',
          rank: 3,
          ruleset: FIXED_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });

      it('4位の入力は有効（4麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'provisional_rank_only',
          rank: 4,
          ruleset: FIXED_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });

      it('浮き人数を入力するとエラー（固定ウマ）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'provisional_rank_only',
          rank: 1,
          floatingCount: 2, // 固定ウマでは不要
          ruleset: FIXED_UMA_FOUR,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.FLOATING_COUNT_WITH_FIXED_UMA
          )
        ).toBe(true);
      });
    });

    describe('浮きウマルール', () => {
      it('正常な入力は有効（3麻）', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'provisional_rank_only',
          rank: 1,
          floatingCount: 1,
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(true);
      });

      it('浮き人数未入力はエラー', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'provisional_rank_only',
          rank: 1,
          // floatingCount未入力
          ruleset: FLOATING_UMA_THREE,
        };

        const result = MatchValidator.validate(input);
        expect(result.isValid).toBe(false);
        expect(
          result.errors.some(
            (e) => e.code === ValidationErrorCode.MISSING_FLOATING_COUNT
          )
        ).toBe(true);
      });

      it('開始点=基準点で浮き人数0はエラー', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'four',
          entryMethod: 'provisional_rank_only',
          rank: 1,
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

      it('開始点<基準点で浮き人数=ゲームモード人数はエラー', () => {
        const input: MatchValidationInput = {
          date: today,
          gameMode: 'three',
          entryMethod: 'provisional_rank_only',
          rank: 1,
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
    });
  });

  describe('入力方式の組み合わせテスト', () => {
    it('rank_plus_pointsで素点を入力しても無視される', () => {
      const input: MatchValidationInput = {
        date: today,
        gameMode: 'four',
        entryMethod: 'rank_plus_points',
        rank: 1,
        finalPoints: 55.0,
        rawScore: 35000, // 入力されているが無視される
        ruleset: FIXED_UMA_FOUR,
      };

      const result = MatchValidator.validate(input);
      expect(result.isValid).toBe(true);
    });

    it('rank_plus_rawで最終ポイントを入力しても無視される', () => {
      const input: MatchValidationInput = {
        date: today,
        gameMode: 'four',
        entryMethod: 'rank_plus_raw',
        rank: 1,
        rawScore: 35000,
        finalPoints: 55.0, // 入力されているが無視される
        ruleset: FIXED_UMA_FOUR,
      };

      const result = MatchValidator.validate(input);
      expect(result.isValid).toBe(true);
    });

    it('provisional_rank_onlyで素点と最終ポイントを入力しても無視される', () => {
      const input: MatchValidationInput = {
        date: today,
        gameMode: 'four',
        entryMethod: 'provisional_rank_only',
        rank: 1,
        rawScore: 35000, // 入力されているが無視される
        finalPoints: 55.0, // 入力されているが無視される
        ruleset: FIXED_UMA_FOUR,
      };

      const result = MatchValidator.validate(input);
      expect(result.isValid).toBe(true);
    });
  });
});
