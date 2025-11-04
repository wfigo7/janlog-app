import React from 'react';
import { render } from '@testing-library/react-native';
import MatchTypeBadge from '../../../src/components/common/MatchTypeBadge';

describe('MatchTypeBadge', () => {
  it('matchTypeがnullの場合は何も表示しない', () => {
    const { queryByText } = render(<MatchTypeBadge matchType={null} />);

    expect(queryByText('フリー')).toBeNull();
    expect(queryByText('セット')).toBeNull();
    expect(queryByText('競技')).toBeNull();
  });

  it('matchTypeが"free"の場合は「フリー」バッジを表示する', () => {
    const { getByText } = render(<MatchTypeBadge matchType="free" />);

    expect(getByText('フリー')).toBeTruthy();
  });

  it('matchTypeが"set"の場合は「セット」バッジを表示する', () => {
    const { getByText } = render(<MatchTypeBadge matchType="set" />);

    expect(getByText('セット')).toBeTruthy();
  });

  it('matchTypeが"competition"の場合は「競技」バッジを表示する', () => {
    const { getByText } = render(<MatchTypeBadge matchType="competition" />);

    expect(getByText('競技')).toBeTruthy();
  });
});
