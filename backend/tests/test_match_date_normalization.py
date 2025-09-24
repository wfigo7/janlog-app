"""
対局日付正規化機能のテスト
"""

import pytest
from datetime import datetime, timezone, timedelta
from app.models.match import MatchRequest
from app.services.match_service import MatchService


class TestMatchDateNormalization:
    """対局日付正規化のテストクラス"""

    def setup_method(self):
        """テストメソッド実行前の準備"""
        self.match_service = MatchService()

    def test_normalize_date_with_time(self):
        """時刻付きの日付を00:00:00に正規化"""
        match_request = MatchRequest(
            date="2024-03-15T14:30:45+09:00",
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId="test-ruleset",
            rank=1,
            finalPoints=50.0
        )
        
        normalized = self.match_service._normalize_match_date(match_request)
        
        assert normalized.date == "2024-03-15T00:00:00+09:00"

    def test_normalize_date_already_normalized(self):
        """既に00:00:00の日付はそのまま"""
        match_request = MatchRequest(
            date="2024-03-15T00:00:00+09:00",
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId="test-ruleset",
            rank=1,
            finalPoints=50.0
        )
        
        normalized = self.match_service._normalize_match_date(match_request)
        
        assert normalized.date == "2024-03-15T00:00:00+09:00"

    def test_normalize_date_different_timezone(self):
        """異なるタイムゾーンでも正規化される"""
        match_request = MatchRequest(
            date="2024-03-15T14:30:45+00:00",  # UTC
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId="test-ruleset",
            rank=1,
            finalPoints=50.0
        )
        
        normalized = self.match_service._normalize_match_date(match_request)
        
        assert normalized.date == "2024-03-15T00:00:00+00:00"

    def test_normalize_date_with_seconds(self):
        """秒付きの日付も00:00:00に正規化される"""
        match_request = MatchRequest(
            date="2024-03-15T14:30:59+09:00",  # 秒付き
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId="test-ruleset",
            rank=1,
            finalPoints=50.0
        )
        
        normalized = self.match_service._normalize_match_date(match_request)
        
        assert normalized.date == "2024-03-15T00:00:00+09:00"

    def test_normalize_preserves_other_fields(self):
        """日付正規化時に他のフィールドは変更されない"""
        original_request = MatchRequest(
            date="2024-03-15T14:30:45+09:00",
            gameMode="four",
            entryMethod="rank_plus_raw",
            rulesetId="test-ruleset-123",
            rank=2,
            rawScore=35000,
            chipCount=5,
            memo="テストメモ"
        )
        
        normalized = self.match_service._normalize_match_date(original_request)
        
        # 日付以外のフィールドは変更されない
        assert normalized.gameMode == original_request.gameMode
        assert normalized.entryMethod == original_request.entryMethod
        assert normalized.rulesetId == original_request.rulesetId
        assert normalized.rank == original_request.rank
        assert normalized.rawScore == original_request.rawScore
        assert normalized.chipCount == original_request.chipCount
        assert normalized.memo == original_request.memo

    def test_normalize_date_microseconds_removed(self):
        """マイクロ秒も00に正規化される"""
        match_request = MatchRequest(
            date="2024-03-15T14:30:45.123456+09:00",  # マイクロ秒付き
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId="test-ruleset",
            rank=1,
            finalPoints=50.0
        )
        
        normalized = self.match_service._normalize_match_date(match_request)
        
        # マイクロ秒も含めて00:00:00に正規化される
        assert "T00:00:00" in normalized.date
        assert ".123456" not in normalized.date