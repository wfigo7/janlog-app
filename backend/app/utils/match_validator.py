"""
対局データバリデーター

フロントエンドの matchValidator.ts と同等の機能を提供します。
"""

from typing import Optional, List
from datetime import datetime, timedelta

from app.models.ruleset import Ruleset
from app.utils.validation_types import (
    ValidationResult,
    ValidationError,
    ValidationErrorCode,
    ValidationSeverity,
    ERROR_MESSAGES,
    format_error_message,
)


class MatchValidator:
    """対局データバリデーター"""

    @staticmethod
    def validate(
        date: str,
        game_mode: str,
        entry_method: str,
        rank: int,
        ruleset: Ruleset,
        final_points: Optional[float] = None,
        raw_score: Optional[int] = None,
        floating_count: Optional[int] = None,
        chip_count: Optional[int] = None,
    ) -> ValidationResult:
        """
        包括的バリデーション
        
        Args:
            date: 対局日（ISO 8601形式）
            game_mode: ゲームモード（'three' | 'four'）
            entry_method: 入力方式（'rank_plus_points' | 'rank_plus_raw' | 'provisional_rank_only'）
            rank: 順位
            ruleset: ルールセット
            final_points: 最終ポイント（オプション）
            raw_score: 素点（オプション）
            floating_count: 浮き人数（オプション）
            chip_count: チップ数（オプション）
        
        Returns:
            ValidationResult: バリデーション結果
        """
        errors: List[ValidationError] = []
        
        # 1. 基本形式チェック
        date_result = MatchValidator.validate_date(date)
        errors.extend(date_result.errors)
        
        rank_result = MatchValidator.validate_rank(rank, game_mode)
        errors.extend(rank_result.errors)
        
        if final_points is not None:
            points_result = MatchValidator.validate_final_points(final_points)
            errors.extend(points_result.errors)
        
        if raw_score is not None:
            score_result = MatchValidator.validate_raw_score(raw_score)
            errors.extend(score_result.errors)
        
        if floating_count is not None:
            floating_result = MatchValidator.validate_floating_count(floating_count, game_mode)
            errors.extend(floating_result.errors)
        
        if chip_count is not None:
            chip_result = MatchValidator.validate_chip_count(chip_count)
            errors.extend(chip_result.errors)
        
        # 基本形式エラーがある場合は、複合バリデーションをスキップ
        if errors:
            return ValidationResult(is_valid=False, errors=errors)
        
        # 2. ルール整合性チェック
        consistency_result = MatchValidator.validate_entry_method_consistency(
            entry_method, ruleset, final_points, raw_score, floating_count
        )
        errors.extend(consistency_result.errors)
        
        # 3. 浮き人数の存在可能性チェック（浮きウマルールの場合のみ）
        if ruleset.useFloatingUma and floating_count is not None:
            existence_result = MatchValidator.validate_floating_count_existence(
                ruleset, floating_count, game_mode
            )
            errors.extend(existence_result.errors)
        
        # 4. 素点と浮き人数の整合性チェック（浮きウマルール + 素点入力の場合のみ）
        if ruleset.useFloatingUma and raw_score is not None and floating_count is not None:
            raw_floating_result = MatchValidator.validate_raw_score_floating_consistency(
                raw_score, floating_count, ruleset, game_mode
            )
            errors.extend(raw_floating_result.errors)
        
        # 5. 順位と素点の関係チェック（素点入力の場合のみ）
        if raw_score is not None and floating_count is not None:
            rank_raw_result = MatchValidator.validate_rank_raw_score_relation(
                rank, raw_score, floating_count, game_mode, ruleset
            )
            errors.extend(rank_raw_result.errors)
        
        # 6. トップの最終ポイント下限チェック
        if rank == 1 and final_points is not None:
            top_points_result = MatchValidator.validate_top_points_minimum(
                final_points, rank, ruleset, floating_count
            )
            errors.extend(top_points_result.errors)
        
        # 7. ラスの最終ポイント上限チェック
        N = 3 if game_mode == "three" else 4
        if rank == N and final_points is not None:
            last_points_result = MatchValidator.validate_last_points_maximum(
                final_points, rank, game_mode, ruleset, floating_count
            )
            errors.extend(last_points_result.errors)
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )

    @staticmethod
    def validate_date(date: str) -> ValidationResult:
        """
        日付バリデーション
        
        Args:
            date: 対局日（ISO 8601形式）
        
        Returns:
            ValidationResult: バリデーション結果
        """
        errors: List[ValidationError] = []
        
        # ISO 8601形式チェック
        try:
            date_obj = datetime.fromisoformat(date.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            error_info = ERROR_MESSAGES[ValidationErrorCode.INVALID_DATE_FORMAT]
            errors.append(
                ValidationError(
                    field="date",
                    code=ValidationErrorCode.INVALID_DATE_FORMAT,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
            return ValidationResult(is_valid=False, errors=errors)
        
        # 未来日付チェック
        today = datetime.now().date()
        if date_obj.date() > today:
            error_info = ERROR_MESSAGES[ValidationErrorCode.FUTURE_DATE]
            errors.append(
                ValidationError(
                    field="date",
                    code=ValidationErrorCode.FUTURE_DATE,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        # 5年以上前チェック
        five_years_ago = today - timedelta(days=365 * 5)
        if date_obj.date() < five_years_ago:
            error_info = ERROR_MESSAGES[ValidationErrorCode.TOO_OLD_DATE]
            errors.append(
                ValidationError(
                    field="date",
                    code=ValidationErrorCode.TOO_OLD_DATE,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )

    @staticmethod
    def validate_rank(rank: int, game_mode: str) -> ValidationResult:
        """
        順位バリデーション
        
        Args:
            rank: 順位
            game_mode: ゲームモード（'three' | 'four'）
        
        Returns:
            ValidationResult: バリデーション結果
        """
        errors: List[ValidationError] = []
        
        # ゲームモード別の最大順位
        max_rank = 3 if game_mode == "three" else 4
        
        # 範囲チェック
        if rank < 1 or rank > max_rank:
            error_info = ERROR_MESSAGES[ValidationErrorCode.INVALID_RANK]
            message = format_error_message(error_info["message"], {})
            hint = format_error_message(error_info["hint"], {"maxRank": max_rank})
            errors.append(
                ValidationError(
                    field="rank",
                    code=ValidationErrorCode.INVALID_RANK,
                    message=message,
                    severity=ValidationSeverity.ERROR,
                    hint=hint,
                )
            )
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )

    @staticmethod
    def validate_final_points(points: float) -> ValidationResult:
        """
        最終ポイントバリデーション
        
        Args:
            points: 最終ポイント
        
        Returns:
            ValidationResult: バリデーション結果
        """
        errors: List[ValidationError] = []
        
        # 範囲チェック（-999.9〜999.9）
        if points < -999.9 or points > 999.9:
            error_info = ERROR_MESSAGES[ValidationErrorCode.INVALID_FINAL_POINTS_RANGE]
            errors.append(
                ValidationError(
                    field="finalPoints",
                    code=ValidationErrorCode.INVALID_FINAL_POINTS_RANGE,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        # 精度チェック（小数第1位まで）
        # 小数第2位以降があるかチェック
        rounded = round(points, 1)
        if abs(points - rounded) > 1e-10:  # 浮動小数点誤差を考慮
            error_info = ERROR_MESSAGES[ValidationErrorCode.INVALID_FINAL_POINTS_PRECISION]
            errors.append(
                ValidationError(
                    field="finalPoints",
                    code=ValidationErrorCode.INVALID_FINAL_POINTS_PRECISION,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )

    @staticmethod
    def validate_raw_score(score: int) -> ValidationResult:
        """
        素点バリデーション
        
        Args:
            score: 素点
        
        Returns:
            ValidationResult: バリデーション結果
        """
        errors: List[ValidationError] = []
        
        # 範囲チェック（-999900〜999900）
        if score < -999900 or score > 999900:
            error_info = ERROR_MESSAGES[ValidationErrorCode.INVALID_RAW_SCORE_RANGE]
            errors.append(
                ValidationError(
                    field="rawScore",
                    code=ValidationErrorCode.INVALID_RAW_SCORE_RANGE,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        # 単位チェック（下2桁が00）
        if score % 100 != 0:
            error_info = ERROR_MESSAGES[ValidationErrorCode.INVALID_RAW_SCORE_UNIT]
            errors.append(
                ValidationError(
                    field="rawScore",
                    code=ValidationErrorCode.INVALID_RAW_SCORE_UNIT,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )

    @staticmethod
    def validate_floating_count(count: int, game_mode: str) -> ValidationResult:
        """
        浮き人数バリデーション
        
        Args:
            count: 浮き人数
            game_mode: ゲームモード（'three' | 'four'）
        
        Returns:
            ValidationResult: バリデーション結果
        """
        errors: List[ValidationError] = []
        
        # ゲームモード別の最大人数
        max_floating = 3 if game_mode == "three" else 4
        
        # 範囲チェック（0以上、ゲームモード人数以下）
        if count < 0 or count > max_floating:
            error_info = ERROR_MESSAGES[ValidationErrorCode.INVALID_FLOATING_COUNT_RANGE]
            message = format_error_message(error_info["message"], {})
            hint = format_error_message(error_info["hint"], {"maxFloating": max_floating})
            errors.append(
                ValidationError(
                    field="floatingCount",
                    code=ValidationErrorCode.INVALID_FLOATING_COUNT_RANGE,
                    message=message,
                    severity=ValidationSeverity.ERROR,
                    hint=hint,
                )
            )
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )

    @staticmethod
    def validate_chip_count(count: int) -> ValidationResult:
        """
        チップ数バリデーション
        
        Args:
            count: チップ数
        
        Returns:
            ValidationResult: バリデーション結果
        """
        errors: List[ValidationError] = []
        
        if count < 0:
            error_info = ERROR_MESSAGES[ValidationErrorCode.INVALID_CHIP_COUNT]
            errors.append(
                ValidationError(
                    field="chipCount",
                    code=ValidationErrorCode.INVALID_CHIP_COUNT,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )

    @staticmethod
    def validate_entry_method_consistency(
        entry_method: str,
        ruleset: Ruleset,
        final_points: Optional[float],
        raw_score: Optional[int],
        floating_count: Optional[int],
    ) -> ValidationResult:
        """
        入力方式とルールの整合性バリデーション
        
        Args:
            entry_method: 入力方式
            ruleset: ルールセット
            final_points: 最終ポイント
            raw_score: 素点
            floating_count: 浮き人数
        
        Returns:
            ValidationResult: バリデーション結果
        """
        errors: List[ValidationError] = []
        
        # 固定ウマルールで浮き人数が入力されている場合
        if not ruleset.useFloatingUma and floating_count is not None:
            error_info = ERROR_MESSAGES[ValidationErrorCode.FLOATING_COUNT_WITH_FIXED_UMA]
            errors.append(
                ValidationError(
                    field="floatingCount",
                    code=ValidationErrorCode.FLOATING_COUNT_WITH_FIXED_UMA,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        # 浮きウマルールで素点入力時に浮き人数が必須
        if ruleset.useFloatingUma and entry_method in ["rank_plus_raw", "provisional_rank_only"]:
            if floating_count is None:
                error_info = ERROR_MESSAGES[ValidationErrorCode.MISSING_FLOATING_COUNT]
                errors.append(
                    ValidationError(
                        field="floatingCount",
                        code=ValidationErrorCode.MISSING_FLOATING_COUNT,
                        message=error_info["message"],
                        severity=ValidationSeverity.ERROR,
                        hint=error_info["hint"],
                    )
                )
        
        # Mode 1（順位+最終ポイント）で最終ポイントが必須
        if entry_method == "rank_plus_points" and final_points is None:
            error_info = ERROR_MESSAGES[ValidationErrorCode.MISSING_FINAL_POINTS]
            errors.append(
                ValidationError(
                    field="finalPoints",
                    code=ValidationErrorCode.MISSING_FINAL_POINTS,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        # Mode 2（順位+素点）で素点が必須
        if entry_method == "rank_plus_raw" and raw_score is None:
            error_info = ERROR_MESSAGES[ValidationErrorCode.MISSING_RAW_SCORE]
            errors.append(
                ValidationError(
                    field="rawScore",
                    code=ValidationErrorCode.MISSING_RAW_SCORE,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )

    @staticmethod
    def validate_floating_count_existence(
        ruleset: Ruleset,
        floating_count: int,
        game_mode: str,
    ) -> ValidationResult:
        """
        浮き人数の存在可能性バリデーション
        
        Args:
            ruleset: ルールセット
            floating_count: 浮き人数
            game_mode: ゲームモード
        
        Returns:
            ValidationResult: バリデーション結果
        """
        errors: List[ValidationError] = []
        
        starting_points = ruleset.startingPoints
        base_points = ruleset.basePoints
        max_players = 3 if game_mode == "three" else 4
        
        # 開始点 = 基準点の場合、浮き人数0は存在しない
        if starting_points == base_points and floating_count == 0:
            error_info = ERROR_MESSAGES[ValidationErrorCode.IMPOSSIBLE_ZERO_FLOATING]
            errors.append(
                ValidationError(
                    field="floatingCount",
                    code=ValidationErrorCode.IMPOSSIBLE_ZERO_FLOATING,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        # 開始点 < 基準点の場合、全員浮きは不可能
        if starting_points < base_points and floating_count == max_players:
            error_info = ERROR_MESSAGES[ValidationErrorCode.IMPOSSIBLE_ALL_FLOATING]
            message = format_error_message(error_info["message"], {})
            hint = format_error_message(error_info["hint"], {"maxFloating": max_players - 1})
            errors.append(
                ValidationError(
                    field="floatingCount",
                    code=ValidationErrorCode.IMPOSSIBLE_ALL_FLOATING,
                    message=message,
                    severity=ValidationSeverity.ERROR,
                    hint=hint,
                )
            )
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )

    @staticmethod
    def validate_raw_score_floating_consistency(
        raw_score: int,
        floating_count: int,
        ruleset: Ruleset,
        game_mode: str,
    ) -> ValidationResult:
        """
        素点と浮き人数の整合性バリデーション
        
        Args:
            raw_score: 素点
            floating_count: 浮き人数
            ruleset: ルールセット
            game_mode: ゲームモード
        
        Returns:
            ValidationResult: バリデーション結果
        """
        errors: List[ValidationError] = []
        
        base_points = ruleset.basePoints
        max_players = 3 if game_mode == "three" else 4
        
        # 自分が浮いているのに浮き人数が0
        if raw_score >= base_points and floating_count == 0:
            error_info = ERROR_MESSAGES[ValidationErrorCode.FLOATING_SCORE_WITH_ZERO_COUNT]
            errors.append(
                ValidationError(
                    field="floatingCount",
                    code=ValidationErrorCode.FLOATING_SCORE_WITH_ZERO_COUNT,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        # 自分が沈んでいるのに全員浮き
        if raw_score < base_points and floating_count == max_players:
            error_info = ERROR_MESSAGES[ValidationErrorCode.SINKING_SCORE_WITH_ALL_FLOATING]
            errors.append(
                ValidationError(
                    field="floatingCount",
                    code=ValidationErrorCode.SINKING_SCORE_WITH_ALL_FLOATING,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )

    @staticmethod
    def validate_rank_raw_score_relation(
        rank: int,
        raw_score: int,
        floating_count: int,
        game_mode: str,
        ruleset: Ruleset,
    ) -> ValidationResult:
        """
        順位と素点の関係バリデーション
        
        Args:
            rank: 順位
            raw_score: 素点
            floating_count: 浮き人数
            game_mode: ゲームモード
            ruleset: ルールセット
        
        Returns:
            ValidationResult: バリデーション結果
        """
        errors: List[ValidationError] = []
        
        # 浮きウマルールの場合のみチェック
        if not ruleset.useFloatingUma:
            return ValidationResult(is_valid=True, errors=[])
        
        base_points = ruleset.basePoints
        starting_points = ruleset.startingPoints
        max_players = 3 if game_mode == "three" else 4
        last_rank = max_players
        
        # 1位で浮き2人以上なのに沈み
        if rank == 1 and floating_count >= 2 and raw_score < base_points:
            error_info = ERROR_MESSAGES[ValidationErrorCode.TOP_RANK_SINKING_WITH_FLOATING]
            errors.append(
                ValidationError(
                    field="rawScore",
                    code=ValidationErrorCode.TOP_RANK_SINKING_WITH_FLOATING,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        # 最下位で浮き少ないのに浮き
        if rank == last_rank and floating_count <= (max_players - 2) and raw_score > base_points:
            error_info = ERROR_MESSAGES[ValidationErrorCode.LAST_RANK_FLOATING_WITHOUT_ALL_FLOATING]
            errors.append(
                ValidationError(
                    field="rawScore",
                    code=ValidationErrorCode.LAST_RANK_FLOATING_WITHOUT_ALL_FLOATING,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        # 開始点 < 基準点の場合、最下位が浮くことはない
        if starting_points < base_points and rank == last_rank and raw_score > base_points:
            error_info = ERROR_MESSAGES[ValidationErrorCode.LAST_RANK_FLOATING_WITH_LOWER_START]
            errors.append(
                ValidationError(
                    field="rawScore",
                    code=ValidationErrorCode.LAST_RANK_FLOATING_WITH_LOWER_START,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        # 全員浮きなのに自分が沈み
        if floating_count == max_players and raw_score < base_points:
            error_info = ERROR_MESSAGES[ValidationErrorCode.ALL_FLOATING_WITH_SINKING_SCORE]
            errors.append(
                ValidationError(
                    field="floatingCount",
                    code=ValidationErrorCode.ALL_FLOATING_WITH_SINKING_SCORE,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        # 全員沈みなのに自分が浮き
        if floating_count == 0 and raw_score >= base_points:
            error_info = ERROR_MESSAGES[ValidationErrorCode.ALL_SINKING_WITH_FLOATING_SCORE]
            errors.append(
                ValidationError(
                    field="floatingCount",
                    code=ValidationErrorCode.ALL_SINKING_WITH_FLOATING_SCORE,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )

    @staticmethod
    def validate_final_points_consistency(
        rank: int,
        raw_score: int,
        floating_count: Optional[int],
        final_points: float,
        ruleset: Ruleset,
    ) -> ValidationResult:
        """
        最終ポイントとルールの整合性バリデーション
        
        Args:
            rank: 順位
            raw_score: 素点
            floating_count: 浮き人数
            final_points: 最終ポイント
            ruleset: ルールセット
        
        Returns:
            ValidationResult: バリデーション結果
        """
        errors: List[ValidationError] = []
        
        # ウマの取得
        uma_points = None
        
        if ruleset.useFloatingUma:
            # 浮きウマルールの場合
            if floating_count is None:
                # 浮き人数が不明な場合はチェックできない
                return ValidationResult(is_valid=True, errors=[])
            
            floating_key = str(floating_count)
            if ruleset.umaMatrix and floating_key in ruleset.umaMatrix:
                uma_array = ruleset.umaMatrix[floating_key]
                if rank <= len(uma_array):
                    uma_points = uma_array[rank - 1]
            
            # ウマが定義されていない場合
            if uma_points is None:
                error_info = ERROR_MESSAGES[ValidationErrorCode.UMA_NOT_DEFINED]
                errors.append(
                    ValidationError(
                        field="floatingCount",
                        code=ValidationErrorCode.UMA_NOT_DEFINED,
                        message=error_info["message"],
                        severity=ValidationSeverity.ERROR,
                        hint=error_info["hint"],
                    )
                )
                return ValidationResult(is_valid=False, errors=errors)
        else:
            # 固定ウマルールの場合
            if rank <= len(ruleset.uma):
                uma_points = ruleset.uma[rank - 1]
            else:
                error_info = ERROR_MESSAGES[ValidationErrorCode.UMA_NOT_DEFINED]
                errors.append(
                    ValidationError(
                        field="rank",
                        code=ValidationErrorCode.UMA_NOT_DEFINED,
                        message=error_info["message"],
                        severity=ValidationSeverity.ERROR,
                        hint=error_info["hint"],
                    )
                )
                return ValidationResult(is_valid=False, errors=errors)
        
        # 最終ポイントを計算
        base_calculation = (raw_score - ruleset.basePoints) / 1000
        oka_points = ruleset.oka if rank == 1 else 0
        calculated_points = base_calculation + uma_points + oka_points
        
        # 小数点第1位まで丸める
        calculated_points = round(calculated_points, 1)
        
        # 範囲チェック（-999.9〜999.9）
        if calculated_points < -999.9 or calculated_points > 999.9:
            error_info = ERROR_MESSAGES[ValidationErrorCode.CALCULATED_POINTS_OUT_OF_RANGE]
            errors.append(
                ValidationError(
                    field="rawScore",
                    code=ValidationErrorCode.CALCULATED_POINTS_OUT_OF_RANGE,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        # 精度チェック（小数第1位まで）
        rounded = round(calculated_points, 1)
        if abs(calculated_points - rounded) > 1e-10:
            error_info = ERROR_MESSAGES[ValidationErrorCode.CALCULATED_POINTS_PRECISION_ERROR]
            errors.append(
                ValidationError(
                    field="finalPoints",
                    code=ValidationErrorCode.CALCULATED_POINTS_PRECISION_ERROR,
                    message=error_info["message"],
                    severity=ValidationSeverity.ERROR,
                    hint=error_info["hint"],
                )
            )
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )

    @staticmethod
    def validate_top_points_minimum(
        rank: int,
        final_points: float,
        floating_count: Optional[int],
        ruleset: Ruleset,
    ) -> ValidationResult:
        """
        トップの最終ポイント下限バリデーション
        
        Args:
            rank: 順位
            final_points: 最終ポイント
            floating_count: 浮き人数
            ruleset: ルールセット
        
        Returns:
            ValidationResult: バリデーション結果
        """
        errors: List[ValidationError] = []
        
        # 1位以外はチェック不要
        if rank != 1:
            return ValidationResult(is_valid=True, errors=[])
        
        # 固定ウマルールの場合
        if not ruleset.useFloatingUma:
            top_uma = ruleset.uma[0]  # 1位のウマ
            min_points = top_uma + ruleset.oka
            
            if final_points < min_points:
                error_info = ERROR_MESSAGES[ValidationErrorCode.TOP_POINTS_BELOW_MINIMUM]
                message = format_error_message(error_info["message"], {})
                hint = format_error_message(error_info["hint"], {"minPoints": min_points})
                errors.append(
                    ValidationError(
                        field="finalPoints",
                        code=ValidationErrorCode.TOP_POINTS_BELOW_MINIMUM,
                        message=message,
                        severity=ValidationSeverity.ERROR,
                        hint=hint,
                    )
                )
        
        # 浮きウマルールの場合
        else:
            if floating_count is None:
                # 浮き人数が不明な場合はチェックできない
                return ValidationResult(is_valid=True, errors=[])
            
            # 浮き人数に対応するウマを取得
            floating_key = str(floating_count)
            if ruleset.umaMatrix and floating_key in ruleset.umaMatrix:
                top_uma = ruleset.umaMatrix[floating_key][0]  # 1位のウマ
                min_points = top_uma + ruleset.oka
                
                if final_points < min_points:
                    error_info = ERROR_MESSAGES[ValidationErrorCode.TOP_POINTS_BELOW_MINIMUM]
                    message = format_error_message(error_info["message"], {})
                    hint = format_error_message(error_info["hint"], {"minPoints": min_points})
                    errors.append(
                        ValidationError(
                            field="finalPoints",
                            code=ValidationErrorCode.TOP_POINTS_BELOW_MINIMUM,
                            message=message,
                            severity=ValidationSeverity.ERROR,
                            hint=hint,
                        )
                    )
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )

    @staticmethod
    def validate_last_points_maximum(
        rank: int,
        final_points: float,
        floating_count: Optional[int],
        game_mode: str,
        ruleset: Ruleset,
    ) -> ValidationResult:
        """
        ラスの最終ポイント上限バリデーション
        
        Args:
            rank: 順位
            final_points: 最終ポイント
            floating_count: 浮き人数
            game_mode: ゲームモード
            ruleset: ルールセット
        
        Returns:
            ValidationResult: バリデーション結果
        """
        errors: List[ValidationError] = []
        
        max_players = 3 if game_mode == "three" else 4
        last_rank = max_players
        
        # 最下位以外はチェック不要
        if rank != last_rank:
            return ValidationResult(is_valid=True, errors=[])
        
        # 固定ウマルールの場合
        if not ruleset.useFloatingUma:
            last_uma = ruleset.uma[last_rank - 1]  # 最下位のウマ
            max_points = last_uma  # オカは1位のみなので含まない
            
            if final_points > max_points:
                error_info = ERROR_MESSAGES[ValidationErrorCode.LAST_POINTS_ABOVE_MAXIMUM]
                message = format_error_message(error_info["message"], {})
                hint = format_error_message(error_info["hint"], {"maxPoints": max_points})
                errors.append(
                    ValidationError(
                        field="finalPoints",
                        code=ValidationErrorCode.LAST_POINTS_ABOVE_MAXIMUM,
                        message=message,
                        severity=ValidationSeverity.ERROR,
                        hint=hint,
                    )
                )
        
        # 浮きウマルールの場合
        else:
            if floating_count is None:
                # 浮き人数が不明な場合はチェックできない
                return ValidationResult(is_valid=True, errors=[])
            
            # 浮き人数に対応するウマを取得
            floating_key = str(floating_count)
            if ruleset.umaMatrix and floating_key in ruleset.umaMatrix:
                last_uma = ruleset.umaMatrix[floating_key][last_rank - 1]  # 最下位のウマ
                max_points = last_uma  # オカは1位のみなので含まない
                
                if final_points > max_points:
                    error_info = ERROR_MESSAGES[ValidationErrorCode.LAST_POINTS_ABOVE_MAXIMUM]
                    message = format_error_message(error_info["message"], {})
                    hint = format_error_message(error_info["hint"], {"maxPoints": max_points})
                    errors.append(
                        ValidationError(
                            field="finalPoints",
                            code=ValidationErrorCode.LAST_POINTS_ABOVE_MAXIMUM,
                            message=message,
                            severity=ValidationSeverity.ERROR,
                            hint=hint,
                        )
                    )
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )

    @staticmethod
    def validate_top_points_minimum(
        final_points: float,
        rank: int,
        ruleset: Ruleset,
        floating_count: Optional[int],
    ) -> ValidationResult:
        """
        トップの最終ポイント下限バリデーション
        
        Args:
            final_points: 最終ポイント
            rank: 順位
            ruleset: ルールセット
            floating_count: 浮き人数
        
        Returns:
            ValidationResult: バリデーション結果
        """
        errors: List[ValidationError] = []
        
        # 1位でない場合はスキップ
        if rank != 1:
            return ValidationResult(is_valid=True, errors=errors)
        
        # ウマの取得
        try:
            if ruleset.useFloatingUma:
                # 浮きウマルールの場合
                if floating_count is None or floating_count < 1:
                    return ValidationResult(is_valid=True, errors=errors)
                
                if not ruleset.umaMatrix or str(floating_count) not in ruleset.umaMatrix:
                    return ValidationResult(is_valid=True, errors=errors)
                
                uma_points = ruleset.umaMatrix[str(floating_count)][0]  # 1位のウマ
            else:
                # 固定ウマルールの場合
                uma_points = ruleset.uma[0]  # 1位のウマ
        except (IndexError, KeyError, TypeError):
            return ValidationResult(is_valid=True, errors=errors)
        
        # オカの取得
        oka_points = ruleset.oka
        
        # 最小値の計算（素点=基準点の場合）
        min_points = uma_points + oka_points
        
        # E-43-01: 1位の最終ポイントが下限未満
        if final_points < min_points:
            error_info = ERROR_MESSAGES[ValidationErrorCode.TOP_POINTS_BELOW_MINIMUM]
            errors.append(
                ValidationError(
                    field="finalPoints",
                    code=ValidationErrorCode.TOP_POINTS_BELOW_MINIMUM,
                    message=format_error_message(error_info["message"], {"minPoints": min_points}),
                    severity=ValidationSeverity.ERROR,
                    hint=format_error_message(error_info["hint"], {"minPoints": min_points}),
                )
            )
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )
    
    @staticmethod
    def validate_last_points_maximum(
        final_points: float,
        rank: int,
        game_mode: str,
        ruleset: Ruleset,
        floating_count: Optional[int],
    ) -> ValidationResult:
        """
        ラスの最終ポイント上限バリデーション
        
        Args:
            final_points: 最終ポイント
            rank: 順位
            game_mode: ゲームモード
            ruleset: ルールセット
            floating_count: 浮き人数
        
        Returns:
            ValidationResult: バリデーション結果
        """
        errors: List[ValidationError] = []
        
        N = 3 if game_mode == "three" else 4
        
        # 最下位でない場合はスキップ
        if rank != N:
            return ValidationResult(is_valid=True, errors=errors)
        
        # ウマの取得
        try:
            if ruleset.useFloatingUma:
                # 浮きウマルールの場合
                if floating_count is None or floating_count >= N:
                    return ValidationResult(is_valid=True, errors=errors)
                
                if not ruleset.umaMatrix or str(floating_count) not in ruleset.umaMatrix:
                    return ValidationResult(is_valid=True, errors=errors)
                
                uma_points = ruleset.umaMatrix[str(floating_count)][N - 1]  # 最下位のウマ
            else:
                # 固定ウマルールの場合
                uma_points = ruleset.uma[N - 1]  # 最下位のウマ
        except (IndexError, KeyError, TypeError):
            return ValidationResult(is_valid=True, errors=errors)
        
        # 最大値の計算（素点=基準点の場合、オカは0）
        max_points = uma_points
        
        # E-44-01: 最下位の最終ポイントが上限超過
        if final_points > max_points:
            error_info = ERROR_MESSAGES[ValidationErrorCode.LAST_POINTS_ABOVE_MAXIMUM]
            errors.append(
                ValidationError(
                    field="finalPoints",
                    code=ValidationErrorCode.LAST_POINTS_ABOVE_MAXIMUM,
                    message=format_error_message(error_info["message"], {"maxPoints": max_points}),
                    severity=ValidationSeverity.ERROR,
                    hint=format_error_message(error_info["hint"], {"maxPoints": max_points}),
                )
            )
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )
