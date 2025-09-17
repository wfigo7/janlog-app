import React from 'react';
import { render } from '@testing-library/react-native';
import MatchRegistrationScreen from '../../../src/components/match/MatchRegistrationScreen';

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
  return function MockRuleSelector() {
    return null; // 簡単なモック
  };
});

describe('MatchRegistrationScreen', () => {
  it('基本的なレンダリングが正常に動作する', () => {
    const { getByText } = render(<MatchRegistrationScreen />);
    
    // 基本的な要素が表示されることを確認
    expect(getByText('ゲームモード')).toBeTruthy();
    expect(getByText('4人麻雀')).toBeTruthy();
    expect(getByText('3人麻雀')).toBeTruthy();
    expect(getByText('入力方式')).toBeTruthy();
    expect(getByText('順位+最終スコア')).toBeTruthy();
    expect(getByText('順位+素点')).toBeTruthy();
    expect(getByText('仮スコア')).toBeTruthy();
    expect(getByText('順位')).toBeTruthy();
    expect(getByText('対局を登録')).toBeTruthy();
  });

  it('デフォルト状態が正しく設定されている', () => {
    const { getByPlaceholderText, getByText } = render(<MatchRegistrationScreen />);
    
    // 4人麻雀がデフォルト選択
    expect(getByPlaceholderText('1〜4位')).toBeTruthy();
    
    // 順位+最終スコアがデフォルト選択
    expect(getByText('最終スコア')).toBeTruthy();
  });
});