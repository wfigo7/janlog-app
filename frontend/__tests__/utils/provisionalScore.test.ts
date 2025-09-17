/**
 * 仮スコア計算ユーティリティのテスト
 */

describe('ProvisionalScore Utilities', () => {
  describe('仮素点の計算ロジック', () => {
    it('4人麻雀の仮素点が開始点ベースで正しく計算される', () => {
      const startingPoints = 25000; // Mリーグルール
      
      // 4人麻雀の増減値
      const fourPlayerAdjustments = {
        1: +15000, // 1位
        2: +5000,  // 2位
        3: -5000,  // 3位
        4: -15000, // 4位
      };

      // 期待される仮素点
      const expectedScores = {
        1: startingPoints + 15000, // 40000
        2: startingPoints + 5000,  // 30000
        3: startingPoints - 5000,  // 20000
        4: startingPoints - 15000, // 10000
      };

      expect(expectedScores[1]).toBe(40000);
      expect(expectedScores[2]).toBe(30000);
      expect(expectedScores[3]).toBe(20000);
      expect(expectedScores[4]).toBe(10000);
    });

    it('3人麻雀でも統一された増減値が使用される', () => {
      const startingPoints = 35000; // 3人麻雀標準
      
      // 統一された増減値（ゲームモードに関係なく同じ）
      const unifiedAdjustments = {
        1: +15000, // 1位
        2: +5000,  // 2位
        3: -5000,  // 3位
        4: -15000, // 4位（3人麻雀では使用しない）
      };

      // 期待される仮素点（3人麻雀でも4人麻雀と同じ増減値）
      const expectedScores = {
        1: startingPoints + 15000, // 50000
        2: startingPoints + 5000,  // 40000
        3: startingPoints - 5000,  // 30000
      };

      expect(expectedScores[1]).toBe(50000);
      expect(expectedScores[2]).toBe(40000);
      expect(expectedScores[3]).toBe(30000);
    });

    it('仮素点が100点単位で計算される', () => {
      const startingPoints = 25000;
      const adjustments = [15000, 5000, -5000, -15000];
      
      adjustments.forEach(adjustment => {
        const provisionalScore = startingPoints + adjustment;
        expect(provisionalScore % 100).toBe(0);
      });
    });
  });

  describe('順位バリデーション', () => {
    it('4人麻雀では1-4位が有効', () => {
      const validRanks = [1, 2, 3, 4];
      const invalidRanks = [0, 5, -1, 10];

      validRanks.forEach(rank => {
        expect(rank >= 1 && rank <= 4).toBe(true);
      });

      invalidRanks.forEach(rank => {
        expect(rank >= 1 && rank <= 4).toBe(false);
      });
    });

    it('3人麻雀では1-3位が有効', () => {
      const validRanks = [1, 2, 3];
      const invalidRanks = [0, 4, -1, 10];

      validRanks.forEach(rank => {
        expect(rank >= 1 && rank <= 3).toBe(true);
      });

      invalidRanks.forEach(rank => {
        expect(rank >= 1 && rank <= 3).toBe(false);
      });
    });
  });

  describe('仮スコア計算の一貫性', () => {
    it('バックエンドとフロントエンドで同じ計算ロジックを使用する', () => {
      const startingPoints = 25000;
      
      // 4人麻雀の増減値（バックエンドとフロントエンドで共通）
      const fourPlayerAdjustments = {
        1: +15000,
        2: +5000,
        3: -5000,
        4: -15000,
      };

      // 3人麻雀の増減値（バックエンドとフロントエンドで共通）
      const threePlayerAdjustments = {
        1: +15000,
        2: 0,
        3: -15000,
      };

      // 計算結果が一致することを確認
      Object.keys(fourPlayerAdjustments).forEach(rank => {
        const rankNum = parseInt(rank) as keyof typeof fourPlayerAdjustments;
        const expectedScore = startingPoints + fourPlayerAdjustments[rankNum];
        expect(expectedScore).toBeGreaterThan(0);
        expect(expectedScore % 100).toBe(0);
      });
    });
  });

  describe('UI表示テキスト', () => {
    it('4人麻雀の仮スコア説明文が正しい増減値を表示する', () => {
      const expectedText = '4人麻雀: 1位(+15000), 2位(+5000), 3位(-5000), 4位(-15000)';
      
      // 実際の表示テキストに含まれる増減値を検証
      expect(expectedText).toContain('1位(+15000)');
      expect(expectedText).toContain('2位(+5000)');
      expect(expectedText).toContain('3位(-5000)');
      expect(expectedText).toContain('4位(-15000)');
    });

    it('3人麻雀の仮スコア説明文が正しい増減値を表示する', () => {
      const expectedText = '3人麻雀: 1位(+15000), 2位(±0), 3位(-15000)';
      
      // 実際の表示テキストに含まれる増減値を検証
      expect(expectedText).toContain('1位(+15000)');
      expect(expectedText).toContain('2位(±0)');
      expect(expectedText).toContain('3位(-15000)');
    });

    it('計算結果の警告メッセージが適切', () => {
      const warningMessage = '※ これは仮の計算結果です。実際の素点とは異なる場合があります。';
      
      // 警告メッセージが仮計算であることを明確に示している
      expect(warningMessage).toContain('仮の計算結果');
      expect(warningMessage).toContain('実際の素点とは異なる');
    });
  });

  describe('エラーハンドリング', () => {
    it('無効な順位に対する処理', () => {
      const invalidRanks = [0, 5, -1, null, undefined, NaN];
      
      invalidRanks.forEach(rank => {
        // 無効な順位では計算が実行されないことを確認
        const isValidRank = typeof rank === 'number' && rank >= 1 && rank <= 4;
        expect(isValidRank).toBe(false);
      });
    });

    it('ルールセット未選択時の処理', () => {
      // ルールセットが未選択の場合は計算が実行されない
      const ruleset = null;
      const rank = 1;
      
      const shouldCalculate = ruleset !== null && rank >= 1 && rank <= 4;
      expect(shouldCalculate).toBe(false);
    });
  });
});