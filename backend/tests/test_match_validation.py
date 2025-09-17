"""
対局データのバリデーションテスト
"""

import pytest
from pydantic import ValidationError
from app.models.match import MatchRequest


class TestMatchRequestValidation:
    """MatchRequestのバリデーションテスト"""

    def test_valid_rank_plus_points_request(self):
        """有効な順位+最終スコア方式のリクエスト"""
        request = MatchRequest(
            date="2024-01-01T10:00:00Z",
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId="test-rule-1",
            rank=2,
            finalPoints=25.5,
            chipCount=5,
            memo="テスト対局"
        )
        assert request.rank == 2
        assert request.finalPoints == 25.5

    def test_valid_rank_plus_raw_request(self):
        """有効な順位+素点方式のリクエスト"""
        request = MatchRequest(
            date="2024-01-01T10:00:00Z",
            gameMode="four",
            entryMethod="rank_plus_raw",
            rulesetId="test-rule-1",
            rank=2,
            rawScore=32400
        )
        assert request.rank == 2
        assert request.rawScore == 32400

    def test_valid_provisional_rank_only_request(self):
        """有効な仮スコア方式のリクエスト"""
        request = MatchRequest(
            date="2024-01-01T10:00:00Z",
            gameMode="three",
            entryMethod="provisional_rank_only",
            rulesetId="test-rule-1",
            rank=1
        )
        assert request.rank == 1

    def test_invalid_rank_for_three_player(self):
        """3人麻雀で無効な順位"""
        with pytest.raises(ValidationError) as exc_info:
            MatchRequest(
                date="2024-01-01T10:00:00Z",
                gameMode="three",
                entryMethod="rank_plus_points",
                rank=4,  # 3人麻雀で4位は無効
                finalPoints=25.0
            )
        
        error = exc_info.value.errors()[0]
        assert "3以下である必要があります" in error["msg"]

    def test_invalid_rank_for_four_player(self):
        """4人麻雀で無効な順位"""
        with pytest.raises(ValidationError) as exc_info:
            MatchRequest(
                date="2024-01-01T10:00:00Z",
                gameMode="four",
                entryMethod="rank_plus_points",
                rank=5,  # 4人麻雀で5位は無効
                finalPoints=25.0
            )
        
        error = exc_info.value.errors()[0]
        # Pydanticの基本バリデーションメッセージ
        assert "less than or equal to 4" in error["msg"]

    def test_missing_final_points_for_rank_plus_points(self):
        """順位+最終スコア方式で最終ポイント未入力"""
        with pytest.raises(ValidationError) as exc_info:
            MatchRequest(
                date="2024-01-01T10:00:00Z",
                gameMode="four",
                entryMethod="rank_plus_points",
                rank=2
                # finalPoints が未入力
            )
        
        error = exc_info.value.errors()[0]
        assert "最終ポイントが必要です" in error["msg"]

    def test_final_points_out_of_range_upper(self):
        """最終ポイントの範囲外（上限超過）"""
        with pytest.raises(ValidationError) as exc_info:
            MatchRequest(
                date="2024-01-01T10:00:00Z",
                gameMode="four",
                entryMethod="rank_plus_points",
                rank=2,
                finalPoints=1000.0  # 範囲外
            )
        
        error = exc_info.value.errors()[0]
        assert "-999.9から999.9の範囲で入力してください" in error["msg"]

    def test_final_points_out_of_range_lower(self):
        """最終ポイントの範囲外（下限未満）"""
        with pytest.raises(ValidationError) as exc_info:
            MatchRequest(
                date="2024-01-01T10:00:00Z",
                gameMode="four",
                entryMethod="rank_plus_points",
                rank=2,
                finalPoints=-1000.0  # 範囲外
            )
        
        error = exc_info.value.errors()[0]
        assert "-999.9から999.9の範囲で入力してください" in error["msg"]

    def test_final_points_too_many_decimal_places(self):
        """最終ポイントの小数点桁数超過"""
        with pytest.raises(ValidationError) as exc_info:
            MatchRequest(
                date="2024-01-01T10:00:00Z",
                gameMode="four",
                entryMethod="rank_plus_points",
                rank=2,
                finalPoints=25.12  # 小数点第2位まで
            )
        
        error = exc_info.value.errors()[0]
        assert "-999.9から999.9の範囲で入力してください" in error["msg"]

    def test_missing_raw_score_for_rank_plus_raw(self):
        """順位+素点方式で素点未入力"""
        with pytest.raises(ValidationError) as exc_info:
            MatchRequest(
                date="2024-01-01T10:00:00Z",
                gameMode="four",
                entryMethod="rank_plus_raw",
                rank=2
                # rawScore が未入力
            )
        
        error = exc_info.value.errors()[0]
        assert "素点が必要です" in error["msg"]

    def test_raw_score_out_of_range_upper(self):
        """素点の範囲外（上限超過）"""
        with pytest.raises(ValidationError) as exc_info:
            MatchRequest(
                date="2024-01-01T10:00:00Z",
                gameMode="four",
                entryMethod="rank_plus_raw",
                rank=2,
                rawScore=1000000  # 範囲外
            )
        
        error = exc_info.value.errors()[0]
        assert "6桁までの数値を入力してください" in error["msg"]

    def test_raw_score_out_of_range_lower(self):
        """素点の範囲外（下限未満）"""
        with pytest.raises(ValidationError) as exc_info:
            MatchRequest(
                date="2024-01-01T10:00:00Z",
                gameMode="four",
                entryMethod="rank_plus_raw",
                rank=2,
                rawScore=-1000000  # 範囲外
            )
        
        error = exc_info.value.errors()[0]
        assert "6桁までの数値を入力してください" in error["msg"]

    def test_raw_score_not_hundred_unit(self):
        """素点が100点単位でない"""
        with pytest.raises(ValidationError) as exc_info:
            MatchRequest(
                date="2024-01-01T10:00:00Z",
                gameMode="four",
                entryMethod="rank_plus_raw",
                rank=2,
                rawScore=32450  # 100点単位でない
            )
        
        error = exc_info.value.errors()[0]
        assert "6桁までの数値を入力してください" in error["msg"]

    def test_invalid_date_format(self):
        """無効な日付形式"""
        with pytest.raises(ValidationError) as exc_info:
            MatchRequest(
                date="2024/01/01",  # 無効な形式
                gameMode="four",
                entryMethod="rank_plus_points",
                rank=2,
                finalPoints=25.0
            )
        
        error = exc_info.value.errors()[0]
        assert "ISO形式で入力してください" in error["msg"]

    def test_negative_chip_count(self):
        """負のチップ数"""
        with pytest.raises(ValidationError) as exc_info:
            MatchRequest(
                date="2024-01-01T10:00:00Z",
                gameMode="four",
                entryMethod="rank_plus_points",
                rank=2,
                finalPoints=25.0,
                chipCount=-5  # 負の値
            )
        
        error = exc_info.value.errors()[0]
        assert "0以上で入力してください" in error["msg"]

    def test_boundary_values(self):
        """境界値テスト"""
        # 最終ポイント境界値
        request1 = MatchRequest(
            date="2024-01-01T10:00:00Z",
            gameMode="four",
            entryMethod="rank_plus_points",
            rank=2,
            finalPoints=999.9  # 上限
        )
        assert request1.finalPoints == 999.9

        request2 = MatchRequest(
            date="2024-01-01T10:00:00Z",
            gameMode="four",
            entryMethod="rank_plus_points",
            rank=2,
            finalPoints=-999.9  # 下限
        )
        assert request2.finalPoints == -999.9

        # 素点境界値
        request3 = MatchRequest(
            date="2024-01-01T10:00:00Z",
            gameMode="four",
            entryMethod="rank_plus_raw",
            rank=2,
            rawScore=999900  # 上限
        )
        assert request3.rawScore == 999900

        request4 = MatchRequest(
            date="2024-01-01T10:00:00Z",
            gameMode="four",
            entryMethod="rank_plus_raw",
            rank=2,
            rawScore=-999900  # 下限
        )
        assert request4.rawScore == -999900