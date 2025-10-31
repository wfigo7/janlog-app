/**
 * 対局データバリデーター
 */

import {
  ValidationResult,
  ValidationError,
  ValidationErrorCode,
  ERROR_MESSAGES,
  formatErrorMessage,
} from '../types/validation';
import { Ruleset } from '../types/ruleset';

/**
 * バリデーション対象データ
 */
export interface MatchValidationInput {
  date: string;
  gameMode: 'three' | 'four';
  entryMethod: 'rank_plus_points' | 'rank_plus_raw' | 'provisional_rank_only';
  rank: number;
  finalPoints?: number;
  rawScore?: number;
  floatingCount?: number;
  chipCount?: number;
  ruleset: Ruleset;
}

/**
 * 対局データバリデーター
 */
export class MatchValidator {
  /**
   * 包括的バリデーション
   */
  static validate(input: MatchValidationInput): ValidationResult {
    const errors: ValidationError[] = [];

    // 1. 基本形式チェック
    errors.push(...this.validateBasicFormat(input));

    // エラーがある場合は早期リターン
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // 2. ルール整合性チェック
    errors.push(...this.validateEntryMethodConsistency(input));

    // 3. 浮き人数の存在可能性チェック（浮きウマルールの場合のみ）
    if (input.ruleset.useFloatingUma && input.floatingCount !== undefined) {
      errors.push(...this.validateFloatingCountExistence(input));
    }

    // 4. 素点と浮き人数の整合性チェック（素点がある場合のみ）
    if (
      input.rawScore !== undefined &&
      input.floatingCount !== undefined &&
      input.ruleset.useFloatingUma
    ) {
      errors.push(...this.validateRawScoreFloatingConsistency(input));
    }

    // 5. 順位と素点の関係チェック（素点がある場合のみ）
    if (input.rawScore !== undefined) {
      errors.push(...this.validateRankRawScoreRelation(input));
    }

    // 6. 最終ポイント計算・形式チェック
    if (input.entryMethod === 'rank_plus_raw' && input.rawScore !== undefined) {
      errors.push(...this.validateFinalPointsConsistency(input));
    }

    // 7. トップの最終ポイント下限チェック
    if (input.rank === 1 && input.finalPoints !== undefined) {
      errors.push(...this.validateTopPointsMinimum(input));
    }

    // 8. ラスの最終ポイント上限チェック
    const maxRank = input.gameMode === 'three' ? 3 : 4;
    if (input.rank === maxRank && input.finalPoints !== undefined) {
      errors.push(...this.validateLastPointsMaximum(input));
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 基本形式チェック
   */
  private static validateBasicFormat(
    input: MatchValidationInput
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // 日付バリデーション
    const dateResult = this.validateDate(input.date);
    errors.push(...dateResult.errors);

    // 順位バリデーション
    const rankResult = this.validateRank(input.rank, input.gameMode);
    errors.push(...rankResult.errors);

    // 最終ポイントバリデーション
    if (input.finalPoints !== undefined) {
      const pointsResult = this.validateFinalPoints(input.finalPoints);
      errors.push(...pointsResult.errors);
    }

    // 素点バリデーション
    if (input.rawScore !== undefined) {
      const rawScoreResult = this.validateRawScore(input.rawScore);
      errors.push(...rawScoreResult.errors);
    }

    // チップ数バリデーション
    if (input.chipCount !== undefined) {
      const chipResult = this.validateChipCount(input.chipCount);
      errors.push(...chipResult.errors);
    }

    // 浮き人数バリデーション
    if (input.floatingCount !== undefined) {
      const floatingResult = this.validateFloatingCount(
        input.floatingCount,
        input.gameMode
      );
      errors.push(...floatingResult.errors);
    }

    return errors;
  }

  /**
   * 日付バリデーション
   */
  static validateDate(date: string): ValidationResult {
    const errors: ValidationError[] = [];

    // 空文字チェック
    if (!date) {
      return { isValid: false, errors };
    }

    // ISO 8601形式チェック
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        errors.push(
          this.createError('date', ValidationErrorCode.INVALID_DATE_FORMAT)
        );
        return { isValid: false, errors };
      }
    } catch (e) {
      errors.push(
        this.createError('date', ValidationErrorCode.INVALID_DATE_FORMAT)
      );
      return { isValid: false, errors };
    }

    const dateObj = new Date(date);
    const now = new Date();
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    // 未来日付チェック
    if (dateObj > todayEnd) {
      errors.push(this.createError('date', ValidationErrorCode.FUTURE_DATE));
    }

    // 5年以上前チェック
    const fiveYearsAgo = new Date(now);
    fiveYearsAgo.setFullYear(now.getFullYear() - 5);
    if (dateObj < fiveYearsAgo) {
      errors.push(this.createError('date', ValidationErrorCode.TOO_OLD_DATE));
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 順位バリデーション
   */
  static validateRank(rank: number, gameMode: string): ValidationResult {
    const errors: ValidationError[] = [];

    // 下限チェック（1以上）
    if (rank < 1) {
      errors.push(
        this.createError('rank', ValidationErrorCode.INVALID_RANK, {
          maxRank: gameMode === 'three' ? 3 : 4,
        })
      );
      return { isValid: false, errors };
    }

    // 上限チェック（ゲームモード別）
    const maxRank = gameMode === 'three' ? 3 : 4;
    if (rank > maxRank) {
      errors.push(
        this.createError('rank', ValidationErrorCode.INVALID_RANK, {
          maxRank,
        })
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 最終ポイントバリデーション
   */
  static validateFinalPoints(points: number): ValidationResult {
    const errors: ValidationError[] = [];

    // 範囲チェック（-999.9〜999.9）
    if (points < -999.9 || points > 999.9) {
      errors.push(
        this.createError(
          'finalPoints',
          ValidationErrorCode.INVALID_FINAL_POINTS_RANGE
        )
      );
    }

    // 精度チェック（小数第1位まで）
    const rounded = Math.round(points * 10) / 10;
    if (Math.abs(points - rounded) > 0.001) {
      errors.push(
        this.createError(
          'finalPoints',
          ValidationErrorCode.INVALID_FINAL_POINTS_PRECISION
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 素点バリデーション
   */
  static validateRawScore(score: number): ValidationResult {
    const errors: ValidationError[] = [];

    // 範囲チェック（-999900〜999900）
    // 注: 0は許可される
    if (score < -999900 || score > 999900) {
      errors.push(
        this.createError('rawScore', ValidationErrorCode.INVALID_RAW_SCORE_RANGE)
      );
    }

    // 単位チェック（下2桁が00）
    // 0の場合もOK（0 % 100 === 0）
    if (Math.abs(score) % 100 !== 0) {
      errors.push(
        this.createError('rawScore', ValidationErrorCode.INVALID_RAW_SCORE_UNIT)
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * チップ数バリデーション
   */
  static validateChipCount(count: number): ValidationResult {
    const errors: ValidationError[] = [];

    // 下限チェック（0以上）
    if (count < 0) {
      errors.push(
        this.createError('chipCount', ValidationErrorCode.INVALID_CHIP_COUNT)
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 浮き人数バリデーション
   */
  static validateFloatingCount(
    count: number,
    gameMode: string
  ): ValidationResult {
    const errors: ValidationError[] = [];

    const maxFloating = gameMode === 'three' ? 3 : 4;

    // 下限チェック（0以上）
    if (count < 0) {
      errors.push(
        this.createError(
          'floatingCount',
          ValidationErrorCode.INVALID_FLOATING_COUNT_RANGE,
          { maxFloating }
        )
      );
    }

    // 上限チェック（ゲームモード人数以下）
    if (count > maxFloating) {
      errors.push(
        this.createError(
          'floatingCount',
          ValidationErrorCode.INVALID_FLOATING_COUNT_RANGE,
          { maxFloating }
        )
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 入力方式とルールの整合性バリデーション
   */
  private static validateEntryMethodConsistency(
    input: MatchValidationInput
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // 固定ウマルールで浮き人数が入力されている場合
    if (!input.ruleset.useFloatingUma && input.floatingCount !== undefined) {
      errors.push(
        this.createError(
          'floatingCount',
          ValidationErrorCode.FLOATING_COUNT_WITH_FIXED_UMA
        )
      );
    }

    // 浮きウマルールで浮き人数が必須の入力方式
    if (input.ruleset.useFloatingUma) {
      if (
        (input.entryMethod === 'rank_plus_raw' ||
          input.entryMethod === 'provisional_rank_only') &&
        input.floatingCount === undefined
      ) {
        errors.push(
          this.createError(
            'floatingCount',
            ValidationErrorCode.MISSING_FLOATING_COUNT
          )
        );
      }
    }

    // 入力方式別の必須項目チェック
    if (
      input.entryMethod === 'rank_plus_points' &&
      input.finalPoints === undefined
    ) {
      errors.push(
        this.createError(
          'finalPoints',
          ValidationErrorCode.MISSING_FINAL_POINTS
        )
      );
    }

    if (
      input.entryMethod === 'rank_plus_raw' &&
      input.rawScore === undefined
    ) {
      errors.push(
        this.createError('rawScore', ValidationErrorCode.MISSING_RAW_SCORE)
      );
    }

    return errors;
  }

  /**
   * 浮き人数の存在可能性バリデーション
   * 浮きウマルールの場合のみ実行
   */
  private static validateFloatingCountExistence(
    input: MatchValidationInput
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // 浮きウマルールでない場合はスキップ
    if (!input.ruleset.useFloatingUma || input.floatingCount === undefined) {
      return errors;
    }

    const { startingPoints, basePoints } = input.ruleset;
    const { floatingCount, gameMode } = input;
    const N = gameMode === 'three' ? 3 : 4;

    // E-10-01: 開始点=基準点で浮き人数0は存在しない
    if (startingPoints === basePoints && floatingCount === 0) {
      errors.push(
        this.createError(
          'floatingCount',
          ValidationErrorCode.IMPOSSIBLE_ZERO_FLOATING
        )
      );
    }

    // E-10-02: 開始点<基準点で浮き人数=ゲームモード人数は不可能
    if (startingPoints < basePoints && floatingCount === N) {
      errors.push(
        this.createError(
          'floatingCount',
          ValidationErrorCode.IMPOSSIBLE_ALL_FLOATING,
          { maxFloating: N }
        )
      );
    }

    return errors;
  }

  /**
   * 素点と浮き人数の整合性バリデーション
   * 浮きウマルールの場合のみ実行
   */
  private static validateRawScoreFloatingConsistency(
    input: MatchValidationInput
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // 浮きウマルールでない場合、または必要なデータがない場合はスキップ
    if (
      !input.ruleset.useFloatingUma ||
      input.rawScore === undefined ||
      input.floatingCount === undefined
    ) {
      return errors;
    }

    const { startingPoints, basePoints } = input.ruleset;
    const { rawScore, floatingCount, gameMode } = input;
    const N = gameMode === 'three' ? 3 : 4;
    const isFloating = rawScore >= basePoints;

    // E-20-01: 自分が浮いているのに浮き人数0
    if (isFloating && floatingCount === 0) {
      errors.push(
        this.createError(
          'floatingCount',
          ValidationErrorCode.FLOATING_SCORE_WITH_ZERO_COUNT
        )
      );
    }

    // E-20-02: 自分が沈んでいるのに全員浮き
    if (!isFloating && floatingCount === N) {
      errors.push(
        this.createError(
          'floatingCount',
          ValidationErrorCode.SINKING_SCORE_WITH_ALL_FLOATING
        )
      );
    }

    // E-20-03: 開始点=基準点で浮き人数<1
    if (startingPoints === basePoints && floatingCount < 1) {
      errors.push(
        this.createError(
          'floatingCount',
          ValidationErrorCode.INCONSISTENT_FLOATING_COUNT_WITH_EQUAL_POINTS
        )
      );
    }

    // E-20-04: 開始点<基準点で浮き人数>N-1
    if (startingPoints < basePoints && floatingCount > N - 1) {
      errors.push(
        this.createError(
          'floatingCount',
          ValidationErrorCode.INCONSISTENT_FLOATING_COUNT_WITH_LOWER_START
        )
      );
    }

    return errors;
  }

  /**
   * 順位と素点の関係バリデーション
   * 浮きウマルールの場合は詳細チェック、固定ウマルールの場合は基本チェック
   */
  private static validateRankRawScoreRelation(
    input: MatchValidationInput
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // 素点がない場合はスキップ
    if (input.rawScore === undefined) {
      return errors;
    }

    const { startingPoints, basePoints } = input.ruleset;
    const { rank, rawScore, floatingCount, gameMode } = input;
    const N = gameMode === 'three' ? 3 : 4;

    // 浮きウマルールの場合の詳細チェック
    if (input.ruleset.useFloatingUma && floatingCount !== undefined) {
      // E-30-01: 1位で浮き2人以上なのに沈み
      if (rank === 1 && floatingCount >= 2 && rawScore < basePoints) {
        errors.push(
          this.createError(
            'rawScore',
            ValidationErrorCode.TOP_RANK_SINKING_WITH_FLOATING
          )
        );
      }

      // E-30-02: 最下位で浮き少ないのに浮き（基準点より大きい）
      if (rank === N && floatingCount <= N - 2 && rawScore > basePoints) {
        errors.push(
          this.createError(
            'rawScore',
            ValidationErrorCode.LAST_RANK_FLOATING_WITHOUT_ALL_FLOATING
          )
        );
      }

      // E-30-03: 開始点<基準点で最下位が浮き（基準点より大きい）
      if (
        startingPoints < basePoints &&
        rank === N &&
        rawScore > basePoints
      ) {
        errors.push(
          this.createError(
            'rawScore',
            ValidationErrorCode.LAST_RANK_FLOATING_WITH_LOWER_START
          )
        );
      }

      // E-30-04: 全員浮きなのに自分が沈み
      if (floatingCount === N && rawScore < basePoints) {
        errors.push(
          this.createError(
            'rawScore',
            ValidationErrorCode.ALL_FLOATING_WITH_SINKING_SCORE
          )
        );
      }

      // E-30-05: 全員沈みなのに自分が浮き
      if (floatingCount === 0 && rawScore >= basePoints) {
        errors.push(
          this.createError(
            'rawScore',
            ValidationErrorCode.ALL_SINKING_WITH_FLOATING_SCORE
          )
        );
      }
    } else {
      // 固定ウマルールの場合の基本チェック（警告レベル）
      // 極端な矛盾のみチェック（例：1位なのに極端に低い素点）
      // 現時点では実装しない（将来的に追加可能）
    }

    return errors;
  }

  /**
   * 最終ポイントとルールの整合性バリデーション
   */
  private static validateFinalPointsConsistency(
    input: MatchValidationInput
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // 素点がない場合はスキップ
    if (input.rawScore === undefined) {
      return errors;
    }

    const { ruleset, rank, rawScore, floatingCount } = input;

    // ウマの取得
    let umaPoints: number;
    try {
      if (ruleset.useFloatingUma) {
        // 浮きウマルールの場合
        if (floatingCount === undefined) {
          return errors; // 浮き人数がない場合はスキップ（別のバリデーションでエラー）
        }

        // E-40-01: ウマが定義されていない
        if (
          !ruleset.umaMatrix ||
          !ruleset.umaMatrix[floatingCount.toString()]
        ) {
          errors.push(
            this.createError('floatingCount', ValidationErrorCode.UMA_NOT_DEFINED)
          );
          return errors;
        }

        umaPoints = ruleset.umaMatrix[floatingCount.toString()][rank - 1];
      } else {
        // 固定ウマルールの場合
        umaPoints = ruleset.uma[rank - 1];
      }
    } catch (e) {
      errors.push(
        this.createError('rank', ValidationErrorCode.UMA_NOT_DEFINED)
      );
      return errors;
    }

    // オカの取得
    const okaPoints = rank === 1 ? ruleset.oka : 0;

    // 最終ポイント計算
    const calculatedPoints =
      (rawScore - ruleset.basePoints) / 1000 + umaPoints + okaPoints;

    // E-40-02: 計算結果が範囲外
    if (calculatedPoints < -999.9 || calculatedPoints > 999.9) {
      errors.push(
        this.createError(
          'rawScore',
          ValidationErrorCode.CALCULATED_POINTS_OUT_OF_RANGE
        )
      );
    }

    // E-40-03: 計算結果の精度エラー（小数第1位に丸める）
    const rounded = Math.round(calculatedPoints * 10) / 10;
    if (Math.abs(calculatedPoints - rounded) > 0.001) {
      // 精度エラーは警告として扱う（自動で丸められる）
      errors.push(
        this.createWarning(
          'rawScore',
          ValidationErrorCode.CALCULATED_POINTS_PRECISION_ERROR
        )
      );
    }

    return errors;
  }

  /**
   * トップの最終ポイント下限バリデーション
   */
  private static validateTopPointsMinimum(
    input: MatchValidationInput
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // 1位でない、または最終ポイントがない場合はスキップ
    if (input.rank !== 1 || input.finalPoints === undefined) {
      return errors;
    }

    const { ruleset, finalPoints, floatingCount } = input;

    // ウマの取得
    let umaPoints: number;
    try {
      if (ruleset.useFloatingUma) {
        // 浮きウマルールの場合
        if (floatingCount === undefined || floatingCount < 1) {
          return errors; // 浮き人数がない、または0の場合はスキップ
        }

        if (
          !ruleset.umaMatrix ||
          !ruleset.umaMatrix[floatingCount.toString()]
        ) {
          return errors; // ウマが定義されていない場合はスキップ（別のバリデーションでエラー）
        }

        umaPoints = ruleset.umaMatrix[floatingCount.toString()][0]; // 1位のウマ
      } else {
        // 固定ウマルールの場合
        umaPoints = ruleset.uma[0]; // 1位のウマ
      }
    } catch (e) {
      return errors;
    }

    // オカの取得
    const okaPoints = ruleset.oka;

    // 最小値の計算（素点=基準点の場合）
    const minPoints = umaPoints + okaPoints;

    // E-43-01: 1位の最終ポイントが下限未満
    if (finalPoints < minPoints) {
      errors.push(
        this.createError(
          'finalPoints',
          ValidationErrorCode.TOP_POINTS_BELOW_MINIMUM,
          { minPoints }
        )
      );
    }

    return errors;
  }

  /**
   * ラスの最終ポイント上限バリデーション
   */
  private static validateLastPointsMaximum(
    input: MatchValidationInput
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    const N = input.gameMode === 'three' ? 3 : 4;

    // 最下位でない、または最終ポイントがない場合はスキップ
    if (input.rank !== N || input.finalPoints === undefined) {
      return errors;
    }

    const { ruleset, finalPoints, floatingCount } = input;

    // ウマの取得
    let umaPoints: number;
    try {
      if (ruleset.useFloatingUma) {
        // 浮きウマルールの場合
        if (floatingCount === undefined || floatingCount >= N) {
          return errors; // 浮き人数がない、または全員浮きの場合はスキップ
        }

        if (
          !ruleset.umaMatrix ||
          !ruleset.umaMatrix[floatingCount.toString()]
        ) {
          return errors; // ウマが定義されていない場合はスキップ（別のバリデーションでエラー）
        }

        umaPoints = ruleset.umaMatrix[floatingCount.toString()][N - 1]; // 最下位のウマ
      } else {
        // 固定ウマルールの場合
        umaPoints = ruleset.uma[N - 1]; // 最下位のウマ
      }
    } catch (e) {
      return errors;
    }

    // 最大値の計算（素点=基準点の場合、オカは0）
    const maxPoints = umaPoints;

    // E-44-01: 最下位の最終ポイントが上限超過
    if (finalPoints > maxPoints) {
      errors.push(
        this.createError(
          'finalPoints',
          ValidationErrorCode.LAST_POINTS_ABOVE_MAXIMUM,
          { maxPoints }
        )
      );
    }

    return errors;
  }

  /**
   * エラーを作成するヘルパー関数
   */
  protected static createError(
    field: string,
    code: ValidationErrorCode,
    params?: Record<string, string | number>
  ): ValidationError {
    const { message, hint } = ERROR_MESSAGES[code];
    return {
      field,
      code,
      message: params ? formatErrorMessage(message, params) : message,
      severity: 'error',
      hint: params ? formatErrorMessage(hint, params) : hint,
    };
  }

  /**
   * 警告を作成するヘルパー関数
   */
  protected static createWarning(
    field: string,
    code: ValidationErrorCode,
    params?: Record<string, string | number>
  ): ValidationError {
    const { message, hint } = ERROR_MESSAGES[code];
    return {
      field,
      code,
      message: params ? formatErrorMessage(message, params) : message,
      severity: 'warning',
      hint: params ? formatErrorMessage(hint, params) : hint,
    };
  }
}
