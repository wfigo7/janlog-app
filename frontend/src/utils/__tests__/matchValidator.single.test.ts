/**
 * 単一項目バリデーションのテスト
 */

import { MatchValidator } from '../matchValidator';
import { ValidationErrorCode } from '../../types/validation';

describe('MatchValidator - 単一項目バリデーション', () => {
  describe('日付バリデーション', () => {
    describe('正常系', () => {
      it('今日の日付は有効', () => {
        const today = new Date().toISOString().split('T')[0];
        const result = MatchValidator.validateDate(today);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('昨日の日付は有効', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        const result = MatchValidator.validateDate(dateStr);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('1年前の日付は有効', () => {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const dateStr = oneYearAgo.toISOString().split('T')[0];
        const result = MatchValidator.validateDate(dateStr);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('4年前の日付は有効', () => {
        const fourYearsAgo = new Date();
        fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);
        const dateStr = fourYearsAgo.toISOString().split('T')[0];
        const result = MatchValidator.validateDate(dateStr);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('異常系', () => {
      it('未来の日付はエラー', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        const result = MatchValidator.validateDate(dateStr);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(ValidationErrorCode.FUTURE_DATE);
      });

      it('5年以上前の日付はエラー', () => {
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        fiveYearsAgo.setDate(fiveYearsAgo.getDate() - 1);
        const dateStr = fiveYearsAgo.toISOString().split('T')[0];
        const result = MatchValidator.validateDate(dateStr);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(ValidationErrorCode.TOO_OLD_DATE);
      });

      it('不正な形式の日付はエラー', () => {
        const result = MatchValidator.validateDate('invalid-date');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          ValidationErrorCode.INVALID_DATE_FORMAT
        );
      });

      it('空文字はエラー', () => {
        const result = MatchValidator.validateDate('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(0); // 空文字は早期リターン
      });
    });

    describe('境界値', () => {
      it('ちょうど5年前の日付は有効', () => {
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        fiveYearsAgo.setDate(fiveYearsAgo.getDate() + 1); // 5年前の翌日（5年以内）
        const dateStr = fiveYearsAgo.toISOString().split('T')[0];
        const result = MatchValidator.validateDate(dateStr);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('順位バリデーション', () => {
    describe('正常系 - 3人麻雀', () => {
      it('順位1は有効', () => {
        const result = MatchValidator.validateRank(1, 'three');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('順位2は有効', () => {
        const result = MatchValidator.validateRank(2, 'three');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('順位3は有効', () => {
        const result = MatchValidator.validateRank(3, 'three');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('正常系 - 4人麻雀', () => {
      it('順位1は有効', () => {
        const result = MatchValidator.validateRank(1, 'four');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('順位2は有効', () => {
        const result = MatchValidator.validateRank(2, 'four');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('順位3は有効', () => {
        const result = MatchValidator.validateRank(3, 'four');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('順位4は有効', () => {
        const result = MatchValidator.validateRank(4, 'four');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('異常系 - 3人麻雀', () => {
      it('順位0はエラー', () => {
        const result = MatchValidator.validateRank(0, 'three');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(ValidationErrorCode.INVALID_RANK);
      });

      it('順位4はエラー', () => {
        const result = MatchValidator.validateRank(4, 'three');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(ValidationErrorCode.INVALID_RANK);
      });

      it('負の順位はエラー', () => {
        const result = MatchValidator.validateRank(-1, 'three');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(ValidationErrorCode.INVALID_RANK);
      });
    });

    describe('異常系 - 4人麻雀', () => {
      it('順位0はエラー', () => {
        const result = MatchValidator.validateRank(0, 'four');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(ValidationErrorCode.INVALID_RANK);
      });

      it('順位5はエラー', () => {
        const result = MatchValidator.validateRank(5, 'four');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(ValidationErrorCode.INVALID_RANK);
      });

      it('負の順位はエラー', () => {
        const result = MatchValidator.validateRank(-1, 'four');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(ValidationErrorCode.INVALID_RANK);
      });
    });
  });

  describe('最終ポイントバリデーション', () => {
    describe('正常系', () => {
      it('0.0は有効', () => {
        const result = MatchValidator.validateFinalPoints(0.0);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('50.5は有効', () => {
        const result = MatchValidator.validateFinalPoints(50.5);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('-50.5は有効', () => {
        const result = MatchValidator.validateFinalPoints(-50.5);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('999.9は有効', () => {
        const result = MatchValidator.validateFinalPoints(999.9);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('-999.9は有効', () => {
        const result = MatchValidator.validateFinalPoints(-999.9);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('異常系 - 範囲外', () => {
      it('1000.0はエラー', () => {
        const result = MatchValidator.validateFinalPoints(1000.0);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          ValidationErrorCode.INVALID_FINAL_POINTS_RANGE
        );
      });

      it('-1000.0はエラー', () => {
        const result = MatchValidator.validateFinalPoints(-1000.0);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          ValidationErrorCode.INVALID_FINAL_POINTS_RANGE
        );
      });
    });

    describe('異常系 - 精度', () => {
      it('50.55はエラー（小数第2位）', () => {
        const result = MatchValidator.validateFinalPoints(50.55);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          ValidationErrorCode.INVALID_FINAL_POINTS_PRECISION
        );
      });

      it('50.123はエラー（小数第3位）', () => {
        const result = MatchValidator.validateFinalPoints(50.123);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          ValidationErrorCode.INVALID_FINAL_POINTS_PRECISION
        );
      });
    });

    describe('境界値', () => {
      it('999.9は有効（上限）', () => {
        const result = MatchValidator.validateFinalPoints(999.9);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('-999.9は有効（下限）', () => {
        const result = MatchValidator.validateFinalPoints(-999.9);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('素点バリデーション', () => {
    describe('正常系', () => {
      it('0は有効', () => {
        const result = MatchValidator.validateRawScore(0);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('25000は有効', () => {
        const result = MatchValidator.validateRawScore(25000);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('-25000は有効', () => {
        const result = MatchValidator.validateRawScore(-25000);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('999900は有効', () => {
        const result = MatchValidator.validateRawScore(999900);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('-999900は有効', () => {
        const result = MatchValidator.validateRawScore(-999900);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('異常系 - 範囲外', () => {
      it('1000000はエラー', () => {
        const result = MatchValidator.validateRawScore(1000000);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          ValidationErrorCode.INVALID_RAW_SCORE_RANGE
        );
      });

      it('-1000000はエラー', () => {
        const result = MatchValidator.validateRawScore(-1000000);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          ValidationErrorCode.INVALID_RAW_SCORE_RANGE
        );
      });
    });

    describe('異常系 - 単位', () => {
      it('25050はエラー（下2桁が50）', () => {
        const result = MatchValidator.validateRawScore(25050);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          ValidationErrorCode.INVALID_RAW_SCORE_UNIT
        );
      });

      it('25001はエラー（下2桁が01）', () => {
        const result = MatchValidator.validateRawScore(25001);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          ValidationErrorCode.INVALID_RAW_SCORE_UNIT
        );
      });

      it('-25050はエラー（下2桁が50）', () => {
        const result = MatchValidator.validateRawScore(-25050);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          ValidationErrorCode.INVALID_RAW_SCORE_UNIT
        );
      });
    });

    describe('境界値', () => {
      it('999900は有効（上限）', () => {
        const result = MatchValidator.validateRawScore(999900);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('-999900は有効（下限）', () => {
        const result = MatchValidator.validateRawScore(-999900);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('100は有効（最小単位）', () => {
        const result = MatchValidator.validateRawScore(100);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('-100は有効（最小単位）', () => {
        const result = MatchValidator.validateRawScore(-100);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('チップ数バリデーション', () => {
    describe('正常系', () => {
      it('0は有効', () => {
        const result = MatchValidator.validateChipCount(0);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('1は有効', () => {
        const result = MatchValidator.validateChipCount(1);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('10は有効', () => {
        const result = MatchValidator.validateChipCount(10);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('100は有効', () => {
        const result = MatchValidator.validateChipCount(100);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('異常系', () => {
      it('-1はエラー', () => {
        const result = MatchValidator.validateChipCount(-1);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          ValidationErrorCode.INVALID_CHIP_COUNT
        );
      });

      it('-10はエラー', () => {
        const result = MatchValidator.validateChipCount(-10);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          ValidationErrorCode.INVALID_CHIP_COUNT
        );
      });
    });

    describe('境界値', () => {
      it('0は有効（下限）', () => {
        const result = MatchValidator.validateChipCount(0);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('浮き人数バリデーション', () => {
    describe('正常系 - 3人麻雀', () => {
      it('0は有効', () => {
        const result = MatchValidator.validateFloatingCount(0, 'three');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('1は有効', () => {
        const result = MatchValidator.validateFloatingCount(1, 'three');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('2は有効', () => {
        const result = MatchValidator.validateFloatingCount(2, 'three');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('3は有効', () => {
        const result = MatchValidator.validateFloatingCount(3, 'three');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('正常系 - 4人麻雀', () => {
      it('0は有効', () => {
        const result = MatchValidator.validateFloatingCount(0, 'four');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('1は有効', () => {
        const result = MatchValidator.validateFloatingCount(1, 'four');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('2は有効', () => {
        const result = MatchValidator.validateFloatingCount(2, 'four');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('3は有効', () => {
        const result = MatchValidator.validateFloatingCount(3, 'four');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('4は有効', () => {
        const result = MatchValidator.validateFloatingCount(4, 'four');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('異常系 - 3人麻雀', () => {
      it('-1はエラー', () => {
        const result = MatchValidator.validateFloatingCount(-1, 'three');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          ValidationErrorCode.INVALID_FLOATING_COUNT_RANGE
        );
      });

      it('4はエラー', () => {
        const result = MatchValidator.validateFloatingCount(4, 'three');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          ValidationErrorCode.INVALID_FLOATING_COUNT_RANGE
        );
      });
    });

    describe('異常系 - 4人麻雀', () => {
      it('-1はエラー', () => {
        const result = MatchValidator.validateFloatingCount(-1, 'four');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          ValidationErrorCode.INVALID_FLOATING_COUNT_RANGE
        );
      });

      it('5はエラー', () => {
        const result = MatchValidator.validateFloatingCount(5, 'four');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          ValidationErrorCode.INVALID_FLOATING_COUNT_RANGE
        );
      });
    });

    describe('境界値 - 3人麻雀', () => {
      it('0は有効（下限）', () => {
        const result = MatchValidator.validateFloatingCount(0, 'three');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('3は有効（上限）', () => {
        const result = MatchValidator.validateFloatingCount(3, 'three');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('境界値 - 4人麻雀', () => {
      it('0は有効（下限）', () => {
        const result = MatchValidator.validateFloatingCount(0, 'four');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('4は有効（上限）', () => {
        const result = MatchValidator.validateFloatingCount(4, 'four');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });
});
