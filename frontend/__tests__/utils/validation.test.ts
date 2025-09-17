/**
 * バリデーション関数の単体テスト
 * MatchRegistrationScreenから抽出したバリデーションロジックをテスト
 */

describe('Validation Functions', () => {
  // 素点バリデーション関数（MatchRegistrationScreenから抽出）
  const validateRawScore = (score: string): { isValid: boolean; message?: string } => {
    if (!score) return { isValid: false };

    const num = parseInt(score);
    if (isNaN(num)) return { isValid: false, message: '数値を入力してください' };

    // -999900〜999900の範囲チェック
    if (num < -999900 || num > 999900) {
      return { isValid: false, message: '6桁までの数値を入力してください（下2桁は00）' };
    }

    // 下2桁が00でない場合はエラー
    if (Math.abs(num) % 100 !== 0) {
      return { isValid: false, message: '6桁までの数値を入力してください（下2桁は00）' };
    }

    return { isValid: true };
  };

  // 順位バリデーション関数（MatchRegistrationScreenから抽出）
  const validateRank = (rankValue: string, maxRank: number): { isValid: boolean; message?: string } => {
    if (!rankValue) return { isValid: false };

    const num = parseInt(rankValue);
    if (isNaN(num)) return { isValid: false, message: '数値を入力してください' };

    if (num < 1 || num > maxRank) {
      return { isValid: false, message: `1〜${maxRank}位で入力してください` };
    }

    return { isValid: true };
  };

  // 最終ポイントバリデーション関数（MatchRegistrationScreenから抽出）
  const validateFinalPoints = (points: string): { isValid: boolean; message?: string } => {
    if (!points) return { isValid: false };
    
    const num = parseFloat(points);
    if (isNaN(num)) return { isValid: false, message: '数値を入力してください' };
    
    // -999.9〜999.9の範囲チェック
    if (num < -999.9 || num > 999.9) {
      return { isValid: false, message: '-999.9から999.9の範囲で入力してください（小数点第1位まで）' };
    }
    
    // 小数点第1位までかチェック
    const decimalPlaces = (points.split('.')[1] || '').length;
    if (decimalPlaces > 1) {
      return { isValid: false, message: '-999.9から999.9の範囲で入力してください（小数点第1位まで）' };
    }
    
    return { isValid: true };
  };

  describe('validateRawScore', () => {
    describe('有効な値', () => {
      it('正の整数（100点単位）', () => {
        expect(validateRawScore('45000')).toEqual({ isValid: true });
        expect(validateRawScore('32400')).toEqual({ isValid: true });
        expect(validateRawScore('100')).toEqual({ isValid: true });
        expect(validateRawScore('999900')).toEqual({ isValid: true });
      });

      it('負の整数（100点単位）', () => {
        expect(validateRawScore('-25000')).toEqual({ isValid: true });
        expect(validateRawScore('-18000')).toEqual({ isValid: true });
        expect(validateRawScore('-100')).toEqual({ isValid: true });
        expect(validateRawScore('-999900')).toEqual({ isValid: true });
      });

      it('境界値', () => {
        expect(validateRawScore('999900')).toEqual({ isValid: true });
        expect(validateRawScore('-999900')).toEqual({ isValid: true });
      });
    });

    describe('無効な値', () => {
      it('空文字', () => {
        expect(validateRawScore('')).toEqual({ isValid: false });
      });

      it('非数値', () => {
        expect(validateRawScore('abc')).toEqual({ 
          isValid: false, 
          message: '数値を入力してください' 
        });
        // parseInt('12abc') は 12 になるため、範囲チェックでエラーになる
        expect(validateRawScore('12abc')).toEqual({ 
          isValid: false, 
          message: '6桁までの数値を入力してください（下2桁は00）' 
        });
      });

      it('範囲外（上限超過）', () => {
        expect(validateRawScore('1000000')).toEqual({ 
          isValid: false, 
          message: '6桁までの数値を入力してください（下2桁は00）' 
        });
        expect(validateRawScore('999901')).toEqual({ 
          isValid: false, 
          message: '6桁までの数値を入力してください（下2桁は00）' 
        });
      });

      it('範囲外（下限未満）', () => {
        expect(validateRawScore('-1000000')).toEqual({ 
          isValid: false, 
          message: '6桁までの数値を入力してください（下2桁は00）' 
        });
        expect(validateRawScore('-999901')).toEqual({ 
          isValid: false, 
          message: '6桁までの数値を入力してください（下2桁は00）' 
        });
      });

      it('100点単位でない', () => {
        // 100点単位でないのでエラー
        expect(validateRawScore('32450')).toEqual({ 
          isValid: false, 
          message: '6桁までの数値を入力してください（下2桁は00）' 
        });
        expect(validateRawScore('-18050')).toEqual({ 
          isValid: false, 
          message: '6桁までの数値を入力してください（下2桁は00）' 
        });
        expect(validateRawScore('12345')).toEqual({ 
          isValid: false, 
          message: '6桁までの数値を入力してください（下2桁は00）' 
        });
      });

      it('小さすぎる値', () => {
        expect(validateRawScore('99')).toEqual({ 
          isValid: false, 
          message: '6桁までの数値を入力してください（下2桁は00）' 
        });
        expect(validateRawScore('50')).toEqual({ 
          isValid: false, 
          message: '6桁までの数値を入力してください（下2桁は00）' 
        });
      });
    });
  });

  describe('validateRank', () => {
    describe('4人麻雀（maxRank = 4）', () => {
      const maxRank = 4;

      it('有効な順位', () => {
        expect(validateRank('1', maxRank)).toEqual({ isValid: true });
        expect(validateRank('2', maxRank)).toEqual({ isValid: true });
        expect(validateRank('3', maxRank)).toEqual({ isValid: true });
        expect(validateRank('4', maxRank)).toEqual({ isValid: true });
      });

      it('無効な順位', () => {
        expect(validateRank('', maxRank)).toEqual({ isValid: false });
        expect(validateRank('0', maxRank)).toEqual({ 
          isValid: false, 
          message: '1〜4位で入力してください' 
        });
        expect(validateRank('5', maxRank)).toEqual({ 
          isValid: false, 
          message: '1〜4位で入力してください' 
        });
        expect(validateRank('abc', maxRank)).toEqual({ 
          isValid: false, 
          message: '数値を入力してください' 
        });
      });
    });

    describe('3人麻雀（maxRank = 3）', () => {
      const maxRank = 3;

      it('有効な順位', () => {
        expect(validateRank('1', maxRank)).toEqual({ isValid: true });
        expect(validateRank('2', maxRank)).toEqual({ isValid: true });
        expect(validateRank('3', maxRank)).toEqual({ isValid: true });
      });

      it('無効な順位', () => {
        expect(validateRank('4', maxRank)).toEqual({ 
          isValid: false, 
          message: '1〜3位で入力してください' 
        });
        expect(validateRank('0', maxRank)).toEqual({ 
          isValid: false, 
          message: '1〜3位で入力してください' 
        });
      });
    });
  });

  describe('validateFinalPoints', () => {
    describe('有効な値', () => {
      it('正の数値', () => {
        expect(validateFinalPoints('25.0')).toEqual({ isValid: true });
        expect(validateFinalPoints('100')).toEqual({ isValid: true });
        expect(validateFinalPoints('999.9')).toEqual({ isValid: true });
        expect(validateFinalPoints('0.5')).toEqual({ isValid: true });
      });

      it('負の数値', () => {
        expect(validateFinalPoints('-15.5')).toEqual({ isValid: true });
        expect(validateFinalPoints('-100')).toEqual({ isValid: true });
        expect(validateFinalPoints('-999.9')).toEqual({ isValid: true });
        expect(validateFinalPoints('-0.1')).toEqual({ isValid: true });
      });

      it('整数', () => {
        expect(validateFinalPoints('25')).toEqual({ isValid: true });
        expect(validateFinalPoints('-15')).toEqual({ isValid: true });
        expect(validateFinalPoints('0')).toEqual({ isValid: true });
      });

      it('境界値', () => {
        expect(validateFinalPoints('999.9')).toEqual({ isValid: true });
        expect(validateFinalPoints('-999.9')).toEqual({ isValid: true });
      });
    });

    describe('無効な値', () => {
      it('空文字', () => {
        expect(validateFinalPoints('')).toEqual({ isValid: false });
      });

      it('非数値', () => {
        expect(validateFinalPoints('abc')).toEqual({ 
          isValid: false, 
          message: '数値を入力してください' 
        });
        // parseFloat('12.5abc') は 12.5 になるため、範囲チェックでエラーになる
        expect(validateFinalPoints('12.5abc')).toEqual({ 
          isValid: false, 
          message: '-999.9から999.9の範囲で入力してください（小数点第1位まで）' 
        });
      });

      it('範囲外（上限超過）', () => {
        expect(validateFinalPoints('1000.0')).toEqual({ 
          isValid: false, 
          message: '-999.9から999.9の範囲で入力してください（小数点第1位まで）' 
        });
        expect(validateFinalPoints('1500.5')).toEqual({ 
          isValid: false, 
          message: '-999.9から999.9の範囲で入力してください（小数点第1位まで）' 
        });
      });

      it('範囲外（下限未満）', () => {
        expect(validateFinalPoints('-1000.0')).toEqual({ 
          isValid: false, 
          message: '-999.9から999.9の範囲で入力してください（小数点第1位まで）' 
        });
        expect(validateFinalPoints('-1500.5')).toEqual({ 
          isValid: false, 
          message: '-999.9から999.9の範囲で入力してください（小数点第1位まで）' 
        });
      });

      it('小数点第2位以下', () => {
        expect(validateFinalPoints('25.12')).toEqual({ 
          isValid: false, 
          message: '-999.9から999.9の範囲で入力してください（小数点第1位まで）' 
        });
        expect(validateFinalPoints('-15.123')).toEqual({ 
          isValid: false, 
          message: '-999.9から999.9の範囲で入力してください（小数点第1位まで）' 
        });
        expect(validateFinalPoints('0.12345')).toEqual({ 
          isValid: false, 
          message: '-999.9から999.9の範囲で入力してください（小数点第1位まで）' 
        });
      });
    });
  });

  describe('エッジケース', () => {
    it('validateRawScore - ゼロ', () => {
      // 0は100点単位で、Math.abs(0) % 100 === 0 なので有効
      expect(validateRawScore('0')).toEqual({ isValid: true });
    });

    it('validateFinalPoints - ゼロ', () => {
      expect(validateFinalPoints('0')).toEqual({ isValid: true });
      expect(validateFinalPoints('0.0')).toEqual({ isValid: true });
    });

    it('validateRank - 文字列の数値', () => {
      expect(validateRank('2.0', 4)).toEqual({ isValid: true }); // parseIntで2になる
      expect(validateRank('2.5', 4)).toEqual({ isValid: true }); // parseIntで2になる
    });

    it('validateFinalPoints - 先頭ゼロ', () => {
      expect(validateFinalPoints('025.5')).toEqual({ isValid: true });
      expect(validateFinalPoints('-025.5')).toEqual({ isValid: true });
    });

    it('validateRawScore - 先頭ゼロ', () => {
      expect(validateRawScore('025000')).toEqual({ isValid: true });
      expect(validateRawScore('-025000')).toEqual({ isValid: true });
    });
  });
});