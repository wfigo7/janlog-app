"""
対局編集・削除機能のテスト
"""
import pytest
from unittest.mock import AsyncMock, patch
from app.services.match_service import MatchService
from app.models.match import MatchRequest, Match


class TestMatchEditDelete:
    """対局編集・削除機能のテストクラス"""

    @pytest.fixture
    def match_service(self):
        """MatchServiceのインスタンスを作成"""
        return MatchService()

    @pytest.fixture
    def sample_match_request(self):
        """サンプルの対局リクエスト"""
        return MatchRequest(
            gameMode="four",
            entryMethod="rank_plus_points",
            date="2024-03-15T00:00:00+09:00",
            rank=1,
            rulesetId="test-ruleset-001",
            finalPoints=25.0,
            memo="テスト対局"
        )

    @pytest.fixture
    def sample_match(self):
        """サンプルの対局データ"""
        return Match(
            userId="test-user-001",
            matchId="test-match-001",
            gameMode="four",
            entryMethod="rank_plus_points",
            date="2024-03-15T00:00:00+09:00",
            rank=1,
            rulesetId="test-ruleset-001",
            finalPoints=25.0,
            memo="テスト対局",
            createdAt="2024-03-15T10:00:00Z",
            updatedAt="2024-03-15T10:00:00Z"
        )

    @pytest.mark.asyncio
    async def test_update_match_success(self, match_service, sample_match_request, sample_match):
        """対局更新の成功テスト"""
        user_id = "test-user-001"
        match_id = "test-match-001"

        # モック設定
        with patch.object(match_service, 'get_match_by_id', return_value=sample_match), \
             patch.object(match_service, '_adjust_chip_count_by_ruleset', return_value=sample_match_request), \
             patch.object(match_service.dynamodb_client, 'put_item', new_callable=AsyncMock) as mock_put:

            # 更新実行
            result = await match_service.update_match(user_id, match_id, sample_match_request)

            # 結果検証
            assert result is not None
            assert result.matchId == match_id
            assert result.rank == 1
            assert result.finalPoints == 25.0
            assert result.memo == "テスト対局"
            
            # DynamoDBへの保存が呼ばれたことを確認
            mock_put.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_match_not_found(self, match_service, sample_match_request):
        """存在しない対局の更新テスト"""
        user_id = "test-user-001"
        match_id = "non-existent-match"

        # モック設定（対局が見つからない）
        with patch.object(match_service, 'get_match_by_id', return_value=None):
            # 更新実行
            result = await match_service.update_match(user_id, match_id, sample_match_request)

            # 結果検証
            assert result is None

    @pytest.mark.asyncio
    async def test_update_match_preserves_creation_time(self, match_service, sample_match_request, sample_match):
        """対局更新時に作成日時が保持されることのテスト"""
        user_id = "test-user-001"
        match_id = "test-match-001"
        original_created_at = "2024-03-15T10:00:00Z"

        # 元の対局データに作成日時を設定
        sample_match.createdAt = original_created_at

        # モック設定
        with patch.object(match_service, 'get_match_by_id', return_value=sample_match), \
             patch.object(match_service, '_adjust_chip_count_by_ruleset', return_value=sample_match_request), \
             patch.object(match_service.dynamodb_client, 'put_item', new_callable=AsyncMock):

            # 更新実行
            result = await match_service.update_match(user_id, match_id, sample_match_request)

            # 作成日時が保持されていることを確認
            assert result.createdAt == original_created_at

    @pytest.mark.asyncio
    async def test_delete_match_success(self, match_service, sample_match):
        """対局削除の成功テスト"""
        user_id = "test-user-001"
        match_id = "test-match-001"

        # モック設定
        with patch.object(match_service, 'get_match_by_id', return_value=sample_match), \
             patch.object(match_service.dynamodb_client, 'delete_item', new_callable=AsyncMock) as mock_delete:

            # 削除実行
            result = await match_service.delete_match(user_id, match_id)

            # 結果検証
            assert result is True
            
            # DynamoDBからの削除が呼ばれたことを確認
            mock_delete.assert_called_once_with(
                match_service.table_name,
                f"USER#{user_id}",
                f"MATCH#{match_id}"
            )

    @pytest.mark.asyncio
    async def test_delete_match_not_found(self, match_service):
        """存在しない対局の削除テスト"""
        user_id = "test-user-001"
        match_id = "non-existent-match"

        # モック設定（対局が見つからない）
        with patch.object(match_service, 'get_match_by_id', return_value=None):
            # 削除実行
            result = await match_service.delete_match(user_id, match_id)

            # 結果検証
            assert result is False

    @pytest.mark.asyncio
    async def test_update_match_with_chip_adjustment(self, match_service, sample_match_request, sample_match):
        """チップ調整を含む対局更新のテスト"""
        user_id = "test-user-001"
        match_id = "test-match-001"

        # チップありのリクエスト
        sample_match_request.chipCount = 5

        # チップなしに調整されるリクエスト
        adjusted_request = MatchRequest(
            gameMode=sample_match_request.gameMode,
            entryMethod=sample_match_request.entryMethod,
            date=sample_match_request.date,
            rank=sample_match_request.rank,
            rulesetId=sample_match_request.rulesetId,
            finalPoints=sample_match_request.finalPoints,
            chipCount=None,  # チップなしルールで調整
            memo=sample_match_request.memo
        )

        # モック設定
        with patch.object(match_service, 'get_match_by_id', return_value=sample_match), \
             patch.object(match_service, '_adjust_chip_count_by_ruleset', return_value=adjusted_request), \
             patch.object(match_service.dynamodb_client, 'put_item', new_callable=AsyncMock):

            # 更新実行
            result = await match_service.update_match(user_id, match_id, sample_match_request)

            # チップが調整されていることを確認
            assert result.chipCount is None

    @pytest.mark.asyncio
    async def test_update_match_date_normalization(self, match_service, sample_match_request, sample_match):
        """対局更新時の日付正規化テスト"""
        user_id = "test-user-001"
        match_id = "test-match-001"

        # 時刻付きの日付
        sample_match_request.date = "2024-03-15T15:30:45+09:00"

        # モック設定
        with patch.object(match_service, 'get_match_by_id', return_value=sample_match), \
             patch.object(match_service, '_adjust_chip_count_by_ruleset', return_value=sample_match_request), \
             patch.object(match_service.dynamodb_client, 'put_item', new_callable=AsyncMock):

            # 更新実行
            result = await match_service.update_match(user_id, match_id, sample_match_request)

            # 時刻が00:00:00に正規化されていることを確認
            assert "T00:00:00" in result.date

    @pytest.mark.asyncio
    async def test_update_match_database_error(self, match_service, sample_match_request, sample_match):
        """対局更新時のデータベースエラーテスト"""
        user_id = "test-user-001"
        match_id = "test-match-001"

        # モック設定（データベースエラー）
        with patch.object(match_service, 'get_match_by_id', return_value=sample_match), \
             patch.object(match_service, '_adjust_chip_count_by_ruleset', return_value=sample_match_request), \
             patch.object(match_service.dynamodb_client, 'put_item', side_effect=Exception("Database error")):

            # 更新実行とエラー確認
            with pytest.raises(Exception) as exc_info:
                await match_service.update_match(user_id, match_id, sample_match_request)
            
            assert "対局の更新に失敗しました" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_delete_match_database_error(self, match_service, sample_match):
        """対局削除時のデータベースエラーテスト"""
        user_id = "test-user-001"
        match_id = "test-match-001"

        # モック設定（データベースエラー）
        with patch.object(match_service, 'get_match_by_id', return_value=sample_match), \
             patch.object(match_service.dynamodb_client, 'delete_item', side_effect=Exception("Database error")):

            # 削除実行とエラー確認
            with pytest.raises(Exception) as exc_info:
                await match_service.delete_match(user_id, match_id)
            
            assert "対局の削除に失敗しました" in str(exc_info.value)