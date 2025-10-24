/**
 * RuleCardコンポーネントのテスト
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import RuleCard from '../RuleCard';
import { Ruleset } from '@/src/types/ruleset';

// モックデータ
const mockGlobalRule: Ruleset = {
  rulesetId: 'test-global-rule-1',
  ruleName: 'Mリーグルール',
  gameMode: 'four',
  startingPoints: 25000,
  basePoints: 30000,
  useFloatingUma: false,
  uma: [30, 10, -10, -30],
  oka: 20,
  useChips: false,
  isGlobal: true,
  createdBy: 'system',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockPersonalRule: Ruleset = {
  rulesetId: 'test-personal-rule-1',
  ruleName: 'マイルール',
  gameMode: 'three',
  startingPoints: 35000,
  basePoints: 40000,
  useFloatingUma: false,
  uma: [20, 0, -20],
  oka: 15,
  useChips: true,
  memo: 'テストメモ',
  isGlobal: false,
  createdBy: 'test-user-001',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('RuleCard', () => {
  it('ルール名を表示する', () => {
    const { getByText } = render(
      <RuleCard rule={mockGlobalRule} editable={false} />
    );
    expect(getByText('Mリーグルール')).toBeTruthy();
  });

  it('ゲームモードを表示する', () => {
    const { getByText } = render(
      <RuleCard rule={mockGlobalRule} editable={false} />
    );
    expect(getByText('4人麻雀')).toBeTruthy();
  });

  it('3人麻雀のゲームモードを表示する', () => {
    const { getByText } = render(
      <RuleCard rule={mockPersonalRule} editable={false} />
    );
    expect(getByText('3人麻雀')).toBeTruthy();
  });

  it('開始点と基準点を表示する', () => {
    const { getByText } = render(
      <RuleCard rule={mockGlobalRule} editable={false} />
    );
    expect(getByText('25000点')).toBeTruthy();
    expect(getByText('30000点')).toBeTruthy();
  });

  it('ウマを表示する', () => {
    const { getByText } = render(
      <RuleCard rule={mockGlobalRule} editable={false} />
    );
    expect(getByText('+30 / +10 / -10 / -30')).toBeTruthy();
  });

  it('オカを表示する', () => {
    const { getByText } = render(
      <RuleCard rule={mockGlobalRule} editable={false} />
    );
    expect(getByText('+20')).toBeTruthy();
  });

  it('チップありを表示する', () => {
    const { getByText } = render(
      <RuleCard rule={mockPersonalRule} editable={false} />
    );
    expect(getByText('あり')).toBeTruthy();
  });

  it('チップなしを表示する', () => {
    const { getByText } = render(
      <RuleCard rule={mockGlobalRule} editable={false} />
    );
    expect(getByText('なし')).toBeTruthy();
  });

  it('メモを表示する', () => {
    const { getByText } = render(
      <RuleCard rule={mockPersonalRule} editable={false} />
    );
    expect(getByText('テストメモ')).toBeTruthy();
  });

  it('編集可能な場合は編集ボタンを表示する', () => {
    const mockOnEdit = jest.fn();
    const { getByText } = render(
      <RuleCard rule={mockGlobalRule} editable={true} onEdit={mockOnEdit} />
    );
    expect(getByText('編集')).toBeTruthy();
  });

  it('編集可能な場合は削除ボタンを表示する', () => {
    const mockOnDelete = jest.fn();
    const { getByText } = render(
      <RuleCard rule={mockGlobalRule} editable={true} onDelete={mockOnDelete} />
    );
    expect(getByText('削除')).toBeTruthy();
  });

  it('編集不可の場合は編集・削除ボタンを表示しない', () => {
    const { queryByText } = render(
      <RuleCard rule={mockGlobalRule} editable={false} />
    );
    expect(queryByText('編集')).toBeNull();
    expect(queryByText('削除')).toBeNull();
  });
});
