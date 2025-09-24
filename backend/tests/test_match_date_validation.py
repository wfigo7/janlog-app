"""
対局日選択機能のテスト（要件10.1-10.7対応）
"""
import pytest
from datetime import datetime, timedelta
from pydantic import ValidationError
from app.models.match import MatchRequest


class TestMatchDateValidation:
    """対局日バリデーションのテスト"""

    def test_valid_date_today(self):
        """今日の日付は有効"""
        today = datetime.now()
        date_str = today.strftime("%Y-%m-%dT00:00:00+09:00")
        
        match_request = MatchRequest(
            date=date_str,
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId="test-ruleset",
            rank=1,
            finalPoints=50.0
        )
        
        assert match_request.date == date_str

    def test_valid_date_yesterday(self):
        """昨日の日付は有効"""
        yesterday = datetime.now() - timedelta(days=1)
        date_str = yesterday.strftime("%Y-%m-%dT00:00:00+09:00")
        
        match_request = MatchRequest(
            date=date_str,
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId="test-ruleset",
            rank=1,
            finalPoints=50.0
        )
        
        assert match_request.date == date_str

    def test_valid_date_one_year_ago(self):
        """1年前の日付は有効"""
        one_year_ago = datetime.now() - timedelta(days=365)
        date_str = one_year_ago.strftime("%Y-%m-%dT00:00:00+09:00")
        
        match_request = MatchRequest(
            date=date_str,
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId="test-ruleset",
            rank=1,
            finalPoints=50.0
        )
        
        assert match_request.date == date_str

    def test_invalid_date_future(self):
        """未来の日付は無効（要件10.4）"""
        tomorrow = datetime.now() + timedelta(days=1)
        date_str = tomorrow.strftime("%Y-%m-%dT00:00:00+09:00")
        
        with pytest.raises(ValidationError) as exc_info:
            MatchRequest(
                date=date_str,
                gameMode="four",
                entryMethod="rank_plus_points",
                rulesetId="test-ruleset",
                rank=1,
                finalPoints=50.0
            )
        
        assert "未来の日付は選択できません" in str(exc_info.value)

    def test_invalid_date_five_years_ago(self):
        """5年以上前の日付は無効（要件10.5）"""
        five_years_ago = datetime.now() - timedelta(days=5*365 + 1)  # 5年と1日前
        date_str = five_years_ago.strftime("%Y-%m-%dT00:00:00+09:00")
        
        with pytest.raises(ValidationError) as exc_info:
            MatchRequest(
                date=date_str,
                gameMode="four",
                entryMethod="rank_plus_points",
                rulesetId="test-ruleset",
                rank=1,
                finalPoints=50.0
            )
        
        assert "5年以上前の日付は選択できません" in str(exc_info.value)

    def test_invalid_date_empty(self):
        """空の日付は無効（要件10.6）"""
        with pytest.raises(ValidationError) as exc_info:
            MatchRequest(
                date="",
                gameMode="four",
                entryMethod="rank_plus_points",
                rulesetId="test-ruleset",
                rank=1,
                finalPoints=50.0
            )
        
        assert "対局日を選択してください" in str(exc_info.value)

    def test_invalid_date_format(self):
        """不正な日付形式は無効"""
        with pytest.raises(ValidationError) as exc_info:
            MatchRequest(
                date="2024/03/15",  # スラッシュ区切りは無効
                gameMode="four",
                entryMethod="rank_plus_points",
                rulesetId="test-ruleset",
                rank=1,
                finalPoints=50.0
            )
        
        assert "日付はISO形式で入力してください" in str(exc_info.value)

    def test_valid_iso_formats(self):
        """様々なISO形式の日付が有効"""
        today = datetime.now()
        
        # 様々なISO形式をテスト
        valid_formats = [
            today.strftime("%Y-%m-%dT00:00:00+09:00"),  # タイムゾーン付き
            today.strftime("%Y-%m-%dT00:00:00Z"),       # UTC
            today.strftime("%Y-%m-%dT00:00:00"),        # タイムゾーンなし
        ]
        
        for date_str in valid_formats:
            match_request = MatchRequest(
                date=date_str,
                gameMode="four",
                entryMethod="rank_plus_points",
                rulesetId="test-ruleset",
                rank=1,
                finalPoints=50.0
            )
            assert match_request.date == date_str

    def test_boundary_date_exactly_five_years_ago(self):
        """ちょうど5年前の日付は有効"""
        five_years_ago = datetime.now() - timedelta(days=5*365)  # ちょうど5年前
        date_str = five_years_ago.strftime("%Y-%m-%dT00:00:00+09:00")
        
        match_request = MatchRequest(
            date=date_str,
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId="test-ruleset",
            rank=1,
            finalPoints=50.0
        )
        
        assert match_request.date == date_str

    def test_boundary_date_end_of_today(self):
        """今日の終わり（23:59:59）は有効"""
        today_end = datetime.now().replace(hour=23, minute=59, second=59)
        date_str = today_end.strftime("%Y-%m-%dT%H:%M:%S+09:00")
        
        match_request = MatchRequest(
            date=date_str,
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId="test-ruleset",
            rank=1,
            finalPoints=50.0
        )
        
        assert match_request.date == date_str