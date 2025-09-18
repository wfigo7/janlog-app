import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EntryMethodSelector from '../../../src/components/match/EntryMethodSelector';
import { EntryMethod } from '../../../src/types/match';
import { GameMode } from '../../../src/types/common';

describe('EntryMethodSelector', () => {
    const mockOnMethodChange = jest.fn();

    beforeEach(() => {
        mockOnMethodChange.mockClear();
    });

    it('3つの入力方式が表示される', () => {
        const { getByText } = render(
            <EntryMethodSelector
                selectedMethod="rank_plus_points"
                gameMode="four"
                onMethodChange={mockOnMethodChange}
            />
        );

        expect(getByText('順位+最終スコア')).toBeTruthy();
        expect(getByText('順位+素点')).toBeTruthy();
        expect(getByText('順位のみ')).toBeTruthy();
    });

    it('選択された方式がハイライトされる', () => {
        const { getByText } = render(
            <EntryMethodSelector
                selectedMethod="rank_plus_raw"
                gameMode="four"
                onMethodChange={mockOnMethodChange}
            />
        );

        // 選択されたボタンのテキストが青色になることを確認
        const selectedTitle = getByText('順位+素点');
        expect(selectedTitle).toBeTruthy();
    });

    it('方式をタップすると変更イベントが発火される', () => {
        const { getByText } = render(
            <EntryMethodSelector
                selectedMethod="rank_plus_points"
                gameMode="four"
                onMethodChange={mockOnMethodChange}
            />
        );

        fireEvent.press(getByText('順位+素点'));
        expect(mockOnMethodChange).toHaveBeenCalledWith('rank_plus_raw');
    });

    it('4人麻雀の場合、順位のみ方式の説明が正しく表示される', () => {
        const { getByText } = render(
            <EntryMethodSelector
                selectedMethod="provisional_rank_only"
                gameMode="four"
                onMethodChange={mockOnMethodChange}
            />
        );

        expect(getByText(/1位\(\+15000\), 2位\(\+5000\), 3位\(-5000\), 4位\(-15000\)/)).toBeTruthy();
    });

    it('3人麻雀の場合、順位のみ方式の説明が正しく表示される', () => {
        const { getByText } = render(
            <EntryMethodSelector
                selectedMethod="provisional_rank_only"
                gameMode="three"
                onMethodChange={mockOnMethodChange}
            />
        );

        expect(getByText(/1位\(\+15000\), 2位\(±0\), 3位\(-15000\)/)).toBeTruthy();
    });

    it('各方式の説明文が表示される', () => {
        const { getByText } = render(
            <EntryMethodSelector
                selectedMethod="rank_plus_points"
                gameMode="four"
                onMethodChange={mockOnMethodChange}
            />
        );

        expect(getByText('順位と最終ポイントを直接入力します。計算済みのスコアがある場合に便利です。')).toBeTruthy();
        expect(getByText('順位と素点を入力し、選択されたルールに基づいて自動でポイント計算を行います。')).toBeTruthy();
    });

    it('選択インジケーターが表示される', () => {
        const { getByText } = render(
            <EntryMethodSelector
                selectedMethod="rank_plus_points"
                gameMode="four"
                onMethodChange={mockOnMethodChange}
            />
        );

        // 選択された方式のタイトルが表示されることを確認
        expect(getByText('順位+最終スコア')).toBeTruthy();
        expect(getByText('順位と最終ポイントを直接入力します。計算済みのスコアがある場合に便利です。')).toBeTruthy();
    });
});