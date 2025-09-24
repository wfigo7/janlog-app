import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import MatchRegistrationScreen from '../../../src/components/match/MatchRegistrationScreen';

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

describe('MatchRegistrationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('基本的なレンダリングが正常に動作する', () => {
    const { getByText, getByTestId, getAllByText } = render(<MatchRegistrationScreen />);

    // 基本的な要素が表示されることを確認
    expect(getByText('ゲームモード')).toBeTruthy();
    expect(getByText('4人麻雀')).toBeTruthy();
    expect(getByText('3人麻雀')).toBeTruthy();
    expect(getByText('対局日')).toBeTruthy();
    expect(getByTestId('mock-match-date-picker')).toBeTruthy();
    expect(getAllByText('入力方式')).toHaveLength(2); // セクションタイトルとEntryMethodSelectorの両方
    expect(getByText('順位+最終スコア')).toBeTruthy();
    expect(getByText('順位+素点')).toBeTruthy();
    expect(getByText('順位のみ')).toBeTruthy();
    expect(getByText('順位')).toBeTruthy();
    expect(getByText('登録')).toBeTruthy();
  });

  it('デフォルト状態が正しく設定されている', () => {
    const { getByPlaceholderText, getByText } = render(<MatchRegistrationScreen />);

    // 4人麻雀がデフォルト選択
    expect(getByPlaceholderText('1〜4位')).toBeTruthy();

    // 順位+最終スコアがデフォルト選択
    expect(getByText('最終ポイント')).toBeTruthy();
  });

  it('順位のみ入力方式を選択できる', () => {
    const { getByText } = render(<MatchRegistrationScreen />);

    // 順位のみボタンをタップ
    const provisionalButton = getByText('順位のみ');
    fireEvent.press(provisionalButton);

    // 順位のみ入力の説明が表示される
    expect(getByText(/順位のみで仮のスコアを計算します。開始点からの増減:/)).toBeTruthy();
    // 複数の場所に同じテキストがあるため、getAllByTextを使用
    const descriptions = screen.getAllByText(/1位\(\+15000\), 2位\(\+5000\), 3位\(-5000\), 4位\(-15000\)/);
    expect(descriptions.length).toBeGreaterThan(0);
  });

  it('順位のみ方式で仮スコア計算が実行される', async () => {
    const { rulesetService } = require('../../../src/services/rulesetService');
    rulesetService.calculatePoints.mockResolvedValue(mockCalculationResponse);

    const { getByText, getByPlaceholderText, getByTestId } = render(<MatchRegistrationScreen />);

    // 順位のみ方式を選択
    fireEvent.press(getByText('順位のみ'));

    // ルールセットを選択
    fireEvent.press(getByTestId('mock-rule-selector'));

    // 順位を入力
    const rankInput = getByPlaceholderText('1〜4位');
    fireEvent.changeText(rankInput, '1');

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

    const { getByText, getByPlaceholderText, getByTestId } = render(<MatchRegistrationScreen />);

    // 順位のみ方式を選択
    fireEvent.press(getByText('順位のみ'));

    // ルールセットを選択
    fireEvent.press(getByTestId('mock-rule-selector'));

    const rankInput = getByPlaceholderText('1〜4位');

    // 1位の場合（25000 + 15000 = 40000）
    rulesetService.calculatePoints.mockResolvedValue({
      ...mockCalculationResponse,
      calculation: { ...mockCalculationResponse.calculation, provisionalRawScore: 40000 }
    });
    fireEvent.changeText(rankInput, '1');
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
    fireEvent.changeText(rankInput, '2');
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
    fireEvent.changeText(rankInput, '3');
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
    fireEvent.changeText(rankInput, '4');
    await waitFor(() => {
      expect(rulesetService.calculatePoints).toHaveBeenLastCalledWith({
        rulesetId: 'test-ruleset-1',
        rank: 4,
        rawScore: 10000,
      });
    });
  });

  it('3人麻雀モードでも順位のみ方式が動作する', async () => {
    const { rulesetService } = require('../../../src/services/rulesetService');
    rulesetService.calculatePoints.mockResolvedValue(mockCalculationResponse);

    const { getByText, getByPlaceholderText, getByTestId } = render(<MatchRegistrationScreen />);

    // 3人麻雀を選択
    fireEvent.press(getByText('3人麻雀'));

    // 順位のみ方式を選択
    fireEvent.press(getByText('順位のみ'));

    // プレースホルダーが3人麻雀用に変更される
    expect(getByPlaceholderText('1〜3位')).toBeTruthy();

    // ルールセットを選択
    fireEvent.press(getByTestId('mock-rule-selector'));

    // 順位を入力（3位まで）
    const rankInput = getByPlaceholderText('1〜3位');
    fireEvent.changeText(rankInput, '3');

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

    const { getByText, getByPlaceholderText, getByTestId, queryByText } = render(<MatchRegistrationScreen />);

    // 順位のみ方式を選択
    fireEvent.press(getByText('順位のみ'));

    // ルールセットを選択
    fireEvent.press(getByTestId('mock-rule-selector'));

    // 順位を入力
    const rankInput = getByPlaceholderText('1〜4位');
    fireEvent.changeText(rankInput, '1');

    // エラー時は計算結果が表示されない
    await waitFor(() => {
      expect(queryByText('計算結果（順位のみ）')).toBeNull();
    });
  });

  it('入力方式を変更すると計算結果がクリアされる', async () => {
    const { rulesetService } = require('../../../src/services/rulesetService');
    rulesetService.calculatePoints.mockResolvedValue(mockCalculationResponse);

    const { getByText, getByPlaceholderText, getByTestId, queryByText } = render(<MatchRegistrationScreen />);

    // 順位のみ方式を選択して計算結果を表示
    fireEvent.press(getByText('順位のみ'));
    fireEvent.press(getByTestId('mock-rule-selector'));
    fireEvent.changeText(getByPlaceholderText('1〜4位'), '1');

    await waitFor(() => {
      expect(getByText('計算結果（順位のみ）')).toBeTruthy();
    });

    // 別の入力方式に変更
    fireEvent.press(getByText('順位+最終スコア'));

    // 計算結果がクリアされる
    expect(queryByText('計算結果（順位のみ）')).toBeNull();
  });

  it('対局日選択機能が正常に動作する', () => {
    const { getByText, getByTestId } = render(<MatchRegistrationScreen />);

    // 対局日セクションが表示される
    expect(getByText('対局日')).toBeTruthy();
    expect(getByTestId('mock-match-date-picker')).toBeTruthy();
  });
});