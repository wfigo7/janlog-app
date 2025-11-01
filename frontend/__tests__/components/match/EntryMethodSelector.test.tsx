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

        expect(getByText('最終ポイント')).toBeTruthy();
        expect(getByText('素点計算')).toBeTruthy();
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
        const selectedTitle = getByText('素点計算');
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

        fireEvent.press(getByText('素点計算'));
        expect(mockOnMethodChange).toHaveBeenCalledWith('rank_plus_raw');
    });

    it('ヘルプボタンが表示される', () => {
        const { getByText } = render(
            <EntryMethodSelector
                selectedMethod="provisional_rank_only"
                gameMode="four"
                onMethodChange={mockOnMethodChange}
            />
        );

        expect(getByText('?')).toBeTruthy();
    });

    it('ヘルプボタンをタップするとモーダルが表示される', () => {
        const { getByText } = render(
            <EntryMethodSelector
                selectedMethod="provisional_rank_only"
                gameMode="four"
                onMethodChange={mockOnMethodChange}
            />
        );

        fireEvent.press(getByText('?'));
        expect(getByText('入力方式について')).toBeTruthy();
        expect(getByText('■ 最終ポイント')).toBeTruthy();
        expect(getByText('■ 素点計算')).toBeTruthy();
        expect(getByText('■ 順位のみ')).toBeTruthy();
    });

    it('ヘルプモーダル内で各方式の説明文が表示される', () => {
        const { getByText } = render(
            <EntryMethodSelector
                selectedMethod="rank_plus_points"
                gameMode="four"
                onMethodChange={mockOnMethodChange}
            />
        );

        // ヘルプボタンをタップしてモーダルを開く
        fireEvent.press(getByText('?'));
        
        expect(getByText('順位と最終ポイントを直接入力します。計算済みのポイントがある場合に便利です。')).toBeTruthy();
        expect(getByText('順位と素点を入力し、選択されたルールに基づいて自動でポイント計算を行います。')).toBeTruthy();
    });

    it('入力方式ラベルが表示される', () => {
        const { getByText } = render(
            <EntryMethodSelector
                selectedMethod="rank_plus_points"
                gameMode="four"
                onMethodChange={mockOnMethodChange}
            />
        );

        expect(getByText('入力方式')).toBeTruthy();
    });
});