"""
対局サービスのチップ管理機能のテスト
"""
import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime
from app.services.match_service import MatchService
from app.models.match import MatchRequest
from app.models.ruleset import Ruleset


class TestMatchServiceChips:
    """対局サービスのチップ管理機能のテストクラス"""

    @pytest.fixture
    def match_service(self):
        """対局サービスのインスタンスを作成"""
        return MatchService()

    @pytest.fixture
    def chip_ruleset(self):
        """チップありルールセット"""
        return Ruleset(
            rulesetId="chip-rule",
            ruleName="チップありルール",
            gameMode="four",
            startingPoints=25000,
            basePoints=30000,
            uma=[30, 10, -10, -30],
            oka=20,
            useChips=True,
            createdBy="test-user"
        )

    @pytest.fixture
    def no_chip_ruleset(self):
        """チップなしルールセット"""
        return Ruleset(
            rulesetId="no-chip-rule",
            ruleName="チップなしルール",
            gameMode="four",
            startingPoints=25000,
            basePoints=30000,
            uma=[30, 10, -10, -30],
            oka=20,
            useChips=False,
            createdBy="test-user"
        )

    @pytest.mark.asyncio
    async def test_create_match_with_chip_ruleset(self, match_service, chip_ruleset):
        """チップありルールでの対局作成テスト"""
        match_request = MatchRequest(
            date="2024-01-01T10:00:00Z",
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId="chip-rule",
            rank=1,
            finalPoints=25.5,
            chipCount=3,  # チップ数を指定
            memo="テスト対局"
        )

        # ルールセットサービスのモック
        with patch('app.services.ruleset_service.get_ruleset_service') as mock_ruleset_service:
            mock_service = AsyncMock()
            mock_service.get_ruleset.return_value = chip_ruleset
            mock_ruleset_service.return_value = mock_service

            # DynamoDBクライアントのモック
            with patch.object(match_service.dynamodb_client, 'put_item', return_value=True):
                result = await match_service.create_match(match_request, "test-user")

                # チップありルールの場合、chipCountはそのまま保持される
                assert result.chipCount == 3
                assert result.rulesetId == "chip-rule"

    @pytest.mark.asyncio
    async def test_create_match_with_no_chip_ruleset(self, match_service, no_chip_ruleset):
        """チップなしルールでの対局作成テスト"""
        match_request = MatchRequest(
            date="2024-01-01T10:00:00Z",
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId="no-chip-rule",
            rank=1,
            finalPoints=25.5,
            chipCount=3,  # チップ数を指定しても無視される
            memo="テスト対局"
        )

        # ルールセットサービスのモック
        with patch('app.services.ruleset_service.get_ruleset_service') as mock_ruleset_service:
            mock_service = AsyncMock()
            mock_service.get_ruleset.return_value = no_chip_ruleset
            mock_ruleset_service.return_value = mock_service

            # DynamoDBクライアントのモック
            with patch.object(match_service.dynamodb_client, 'put_item', return_value=True):
                result = await match_service.create_match(match_request, "test-user")

                # チップなしルールの場合、chipCountはNoneに設定される
                assert result.chipCount is None
                assert result.rulesetId == "no-chip-rule"

    @pytest.mark.asyncio
    async def test_create_match_without_ruleset(self, match_service):
        """ルールセット未指定での対局作成テスト"""
        match_request = MatchRequest(
            date="2024-01-01T10:00:00Z",
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId=None,  # ルールセット未指定
            rank=1,
            finalPoints=25.5,
            chipCount=3,
            memo="テスト対局"
        )

        # DynamoDBクライアントのモック
        with patch.object(match_service.dynamodb_client, 'put_item', return_value=True):
            result = await match_service.create_match(match_request, "test-user")

            # ルールセット未指定の場合、chipCountはそのまま保持される
            assert result.chipCount == 3
            assert result.rulesetId is None

    @pytest.mark.asyncio
    async def test_update_match_with_chip_ruleset(self, match_service, chip_ruleset):
        """チップありルールでの対局更新テスト"""
        # 既存の対局データ（モック）
        existing_match = type('Match', (), {
            'matchId': 'test-match',
            'createdAt': '2024-01-01T00:00:00Z'
        })()

        match_request = MatchRequest(
            date="2024-01-01T10:00:00Z",
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId="chip-rule",
            rank=2,
            finalPoints=10.0,
            chipCount=1,
            memo="更新されたテスト対局"
        )

        # ルールセットサービスのモック
        with patch('app.services.ruleset_service.get_ruleset_service') as mock_ruleset_service:
            mock_service = AsyncMock()
            mock_service.get_ruleset.return_value = chip_ruleset
            mock_ruleset_service.return_value = mock_service

            # 既存対局取得とDynamoDB更新のモック
            with patch.object(match_service, 'get_match_by_id', return_value=existing_match):
                with patch.object(match_service.dynamodb_client, 'put_item', return_value=True):
                    result = await match_service.update_match("test-user", "test-match", match_request)

                    # チップありルールの場合、chipCountはそのまま保持される
                    assert result.chipCount == 1
                    assert result.rulesetId == "chip-rule"

    @pytest.mark.asyncio
    async def test_update_match_with_no_chip_ruleset(self, match_service, no_chip_ruleset):
        """チップなしルールでの対局更新テスト"""
        # 既存の対局データ（モック）
        existing_match = type('Match', (), {
            'matchId': 'test-match',
            'createdAt': '2024-01-01T00:00:00Z'
        })()

        match_request = MatchRequest(
            date="2024-01-01T10:00:00Z",
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId="no-chip-rule",
            rank=2,
            finalPoints=10.0,
            chipCount=1,  # チップ数を指定しても無視される
            memo="更新されたテスト対局"
        )

        # ルールセットサービスのモック
        with patch('app.services.ruleset_service.get_ruleset_service') as mock_ruleset_service:
            mock_service = AsyncMock()
            mock_service.get_ruleset.return_value = no_chip_ruleset
            mock_ruleset_service.return_value = mock_service

            # 既存対局取得とDynamoDB更新のモック
            with patch.object(match_service, 'get_match_by_id', return_value=existing_match):
                with patch.object(match_service.dynamodb_client, 'put_item', return_value=True):
                    result = await match_service.update_match("test-user", "test-match", match_request)

                    # チップなしルールの場合、chipCountはNoneに設定される
                    assert result.chipCount is None
                    assert result.rulesetId == "no-chip-rule"

    @pytest.mark.asyncio
    async def test_adjust_chip_count_by_ruleset_error_handling(self, match_service):
        """ルールセット取得エラー時の処理テスト"""
        match_request = MatchRequest(
            date="2024-01-01T10:00:00Z",
            gameMode="four",
            entryMethod="rank_plus_points",
            rulesetId="invalid-rule",
            rank=1,
            finalPoints=25.5,
            chipCount=3,
            memo="テスト対局"
        )

        # ルールセットサービスでエラーが発生する場合
        with patch('app.services.ruleset_service.get_ruleset_service') as mock_ruleset_service:
            mock_service = AsyncMock()
            mock_service.get_ruleset.side_effect = Exception("ルールセット取得エラー")
            mock_ruleset_service.return_value = mock_service

            # エラーが発生してもchipCountは元の値のまま
            result = await match_service._adjust_chip_count_by_ruleset(match_request, "test-user")
            assert result.chipCount == 3


if __name__ == "__main__":
    pytest.main([__file__])