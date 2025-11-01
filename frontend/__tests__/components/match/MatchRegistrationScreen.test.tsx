import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import MatchRegistrationScreen from '../../../src/components/match/MatchRegistrationScreen';
import { GameModeProvider } from '../../../src/contexts/GameModeContext';

// モックデータ
const mockRuleset = {
  rulesetId: 'test-ruleset-1',
  name: 'テストルール',
  gameMode: 'four' as const,
  startingPoints: 25000,
  basePoints: 30000,
  uma: [30, 10, -10, -30],
  oka: 20,
  createdBy: 'test-user',
  isGlobal: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockCalculationResponse = {
  finalPoints: 60.0,
  calculation: {
    rawScore: 40000,
    basePoints: 30000,
    baseCalculation: 10.0,
    rank: 1,
    umaPoints: 30,
    okaPoints: 20,
    finalPoints: 60.0,
    formula: '(40000 - 30000) / 1000 + 30 + 20 = 60.0',
    isProvisional: true,
    provisionalRawScore: 40000,
  },
};

// 必要なモック
jest.mock('../../../src/services/rulesetService', () => ({
  rulesetService: {
    calculatePoints: jest.fn(),
  },
}));

jest.mock('../../../src/services/matchService', () => ({
  MatchService: {
    createMatch: jest.fn(),
  },
}));

jest.mock('../../../src/components/match/RuleSelector', () => {
  return function MockRuleSelector({ onRulesetSelect }: { onRulesetSelect: (ruleset: any) => void }) {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity
        testID="mock-rule-selector"
        onPress={() => onRulesetSelect(mockRuleset)}
      >
        <Text>ルール選択</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock('../../../src/components/match/MatchDatePicker', () => {
  return {
    MatchDatePicker: function MockMatchDatePicker({ value, onChange, error }: { value: string; onChange: (date: string) => void; error?: string | null }) {
      const { TouchableOpacity, Text, View } = require('react-native');
      return (
        <View testID="mock-match-date-picker">
          <TouchableOpacity
            testID="mock-date-picker-button"
            onPress={() => onChange('2024-03-15T00:00:00+09:00')}
          >
            <Text>対局日選択</Text>
          </TouchableOpacity>
          {error && <Text testID="date-error">{error}</Text>}
        </View>
      );
    }
  };
});

jest.mock('../../../src/components/match/VenueSelector', () => {
  return {
    VenueSelector: function MockVenueSelector({ value, onValueChange }: { value?: string; onValueChange: (value: string | undefined) => void }) {
      const { TouchableOpacity, Text, View } = require('react-native');
      return (
        <View testID="mock-venue-selector">
          <TouchableOpacity
            testID="mock-venue-selector-button"
            onPress={() => onValueChange('テスト会場')}
          >
            <Text>会場選択</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };
});

// テスト用ヘルパー関数
const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <GameModeProvider>
      {component}
    </GameModeProvider>
  );
};

describe('MatchRegistrationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('基本的なレンダリングが正常に動作する', () => {
    const { getByText, getByTestId, getAllByText } = renderWithProvider(<MatchRegistrationScreen />);

    // 基本的な要素が表示されることを確認
    expect(getByText('対局日')).toBeTruthy();
    expect(getByTestId('mock-match-date-picker')).toBeTruthy();
    expect(getByText('入力方式')).toBeTruthy(); // セクションタイトルのみ
    // 複数の「最終ポイント」があるので getAllByText を使用
    const finalPointsElements = screen.getAllByText('最終ポイント');
    expect(finalPointsElements.length).toBeGreaterThan(0);
    expect(getByText('素点計算')).toBeTruthy();
    expect(getByText('順位のみ')).toBeTruthy();
    expect(getByText('順位')).toBeTruthy();
    expect(getByText('登録')).toBeTruthy();
  });

  it('デフォルト状態が正しく設定されている', () => {
    const { getByText } = renderWithProvider(<MatchRegistrationScreen />);

    // 4人麻雀がデフォルト選択（順位ボタンが4つ表示される）
    expect(getByText('1着')).toBeTruthy();
    expect(getByText('2着')).toBeTruthy();
    expect(getByText('3着')).toBeTruthy();
    expect(getByText('4着')).toBeTruthy();

    // 最終ポイントがデフォルト選択（複数あるので getAllByText を使用）
    const finalPointsElements = screen.getAllByText('最終ポイント');
    expect(finalPointsElements.length).toBeGreaterThan(0);
  });

  it('順位のみ入力方式を選択できる', () => {
    const { getByText } = renderWithProvider(<MatchRegistrationScreen />);

    // 順位のみボタンをタップ
    const provisionalButton = getByText('順位のみ');
    fireEvent.press(provisionalButton);

    // 順位のみ方式が選択されたことを確認（説明文は削除されたのでヘルプモーダルで確認）
    expect(getByText('?')).toBeTruthy(); // ヘルプボタンが表示される
  });

  it('順位のみ方式で仮ポイント計算が実行される', async () => {
    const { rulesetService } = require('../../../src/services/rulesetService');
    rulesetService.calculatePoints.mockResolvedValue(mockCalculationResponse);

    const { getByText, getByTestId } = renderWithProvider(<MatchRegistrationScreen />);

    // 順位のみ方式を選択
    fireEvent.press(getByText('順位のみ'));

    // ルールセットを選択
    fireEvent.press(getByTestId('mock-rule-selector'));

    // 順位ボタンをタップ（1着を選択）
    const rankButton = getByText('1着');
    fireEvent.press(rankButton);

    // 計算結果が表示されるまで待機
    await waitFor(() => {
      expect(getByText('計算結果（順位のみ）')).toBeTruthy();
      expect(getByText('※ これは仮の計算結果です。実際の素点とは異なる場合があります。')).toBeTruthy();
    });

    // 正しいパラメータで計算APIが呼ばれることを確認
    expect(rulesetService.calculatePoints).toHaveBeenCalledWith({
      rulesetId: 'test-ruleset-1',
      rank: 1,
      rawScore: 40000, // 1位の仮素点（25000 + 15000 = 40000）
    });
  });

  it('順位のみ方式で各順位の仮素点が正しく設定される', async () => {
    const { rulesetService } = require('../../../src/services/rulesetService');

    const { getByText, getByTestId } = renderWithProvider(<MatchRegistrationScreen />);

    // 順位のみ方式を選択
    fireEvent.press(getByText('順位のみ'));

    // ルールセットを選択
    fireEvent.press(getByTestId('mock-rule-selector'));

    // 1位の場合（25000 + 15000 = 40000）
    rulesetService.calculatePoints.mockResolvedValue({
      ...mockCalculationResponse,
      calculation: { ...mockCalculationResponse.calculation, provisionalRawScore: 40000 }
    });
    fireEvent.press(getByText('1着'));
    await waitFor(() => {
      expect(rulesetService.calculatePoints).toHaveBeenLastCalledWith({
        rulesetId: 'test-ruleset-1',
        rank: 1,
        rawScore: 40000,
      });
    });

    // 2位の場合（25000 + 5000 = 30000）
    rulesetService.calculatePoints.mockResolvedValue({
      ...mockCalculationResponse,
      calculation: { ...mockCalculationResponse.calculation, provisionalRawScore: 30000 }
    });
    fireEvent.press(getByText('2着'));
    await waitFor(() => {
      expect(rulesetService.calculatePoints).toHaveBeenLastCalledWith({
        rulesetId: 'test-ruleset-1',
        rank: 2,
        rawScore: 30000,
      });
    });

    // 3位の場合（25000 - 5000 = 20000）
    rulesetService.calculatePoints.mockResolvedValue({
      ...mockCalculationResponse,
      calculation: { ...mockCalculationResponse.calculation, provisionalRawScore: 20000 }
    });
    fireEvent.press(getByText('3着'));
    await waitFor(() => {
      expect(rulesetService.calculatePoints).toHaveBeenLastCalledWith({
        rulesetId: 'test-ruleset-1',
        rank: 3,
        rawScore: 20000,
      });
    });

    // 4位の場合（25000 - 15000 = 10000）
    rulesetService.calculatePoints.mockResolvedValue({
      ...mockCalculationResponse,
      calculation: { ...mockCalculationResponse.calculation, provisionalRawScore: 10000 }
    });
    fireEvent.press(getByText('4着'));
    await waitFor(() => {
      expect(rulesetService.calculatePoints).toHaveBeenLastCalledWith({
        rulesetId: 'test-ruleset-1',
        rank: 4,
        rawScore: 10000,
      });
    });
  });

  it.skip('3人麻雀モードでも順位のみ方式が動作する', async () => {
    const { rulesetService } = require('../../../src/services/rulesetService');
    rulesetService.calculatePoints.mockResolvedValue(mockCalculationResponse);

    const { getByText, getByTestId, queryByText } = renderWithProvider(<MatchRegistrationScreen />);

    // 3人麻雀を選択
    fireEvent.press(getByText('3人麻雀'));

    // 順位のみ方式を選択
    fireEvent.press(getByText('順位のみ'));

    // 順位ボタンが3つ表示される（4着ボタンは表示されない）
    expect(getByText('1着')).toBeTruthy();
    expect(getByText('2着')).toBeTruthy();
    expect(getByText('3着')).toBeTruthy();
    expect(queryByText('4着')).toBeNull();

    // ルールセットを選択
    fireEvent.press(getByTestId('mock-rule-selector'));

    // 順位ボタンをタップ（3位まで）
    fireEvent.press(getByText('3着'));

    // 計算が実行される
    await waitFor(() => {
      expect(rulesetService.calculatePoints).toHaveBeenCalledWith({
        rulesetId: 'test-ruleset-1',
        rank: 3,
        rawScore: 10000, // 3位の仮素点（25000 - 15000 = 10000）
      });
    });
  });

  it('順位のみ方式で計算エラーが発生した場合の処理', async () => {
    const { rulesetService } = require('../../../src/services/rulesetService');
    rulesetService.calculatePoints.mockRejectedValue(new Error('計算エラー'));

    const { getByText, getByTestId, queryByText } = renderWithProvider(<MatchRegistrationScreen />);

    // 順位のみ方式を選択
    fireEvent.press(getByText('順位のみ'));

    // ルールセットを選択
    fireEvent.press(getByTestId('mock-rule-selector'));

    // 順位ボタンをタップ
    fireEvent.press(getByText('1着'));

    // エラー時は計算結果が表示されない
    await waitFor(() => {
      expect(queryByText('計算結果（順位のみ）')).toBeNull();
    });
  });

  it('入力方式を変更すると計算結果がクリアされる', async () => {
    const { rulesetService } = require('../../../src/services/rulesetService');
    rulesetService.calculatePoints.mockResolvedValue(mockCalculationResponse);

    const { getByText, getByTestId, queryByText } = renderWithProvider(<MatchRegistrationScreen />);

    // 順位のみ方式を選択して計算結果を表示
    fireEvent.press(getByText('順位のみ'));
    fireEvent.press(getByTestId('mock-rule-selector'));
    fireEvent.press(getByText('1着'));

    await waitFor(() => {
      expect(getByText('計算結果（順位のみ）')).toBeTruthy();
    });

    // 別の入力方式に変更（複数の「最終ポイント」があるので、入力方式セクション内のものを選択）
    const finalPointsButtons = screen.getAllByText('最終ポイント');
    // 入力方式選択ボタンの方をタップ（通常は最初の要素）
    fireEvent.press(finalPointsButtons[0]);

    // 計算結果がクリアされる
    expect(queryByText('計算結果（順位のみ）')).toBeNull();
  });

  it('対局日選択機能が正常に動作する', () => {
    const { getByText, getByTestId } = renderWithProvider(<MatchRegistrationScreen />);

    // 対局日セクションが表示される
    expect(getByText('対局日')).toBeTruthy();
    expect(getByTestId('mock-match-date-picker')).toBeTruthy();
  });
});