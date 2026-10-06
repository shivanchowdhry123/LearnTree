import type { ReviewRating, SM2State } from '../types/syllabus';

/**
 * Standard default parameters for the SuperMemo-2 algorithm.
 */
export const SM2_DEFAULTS = {
  INITIAL_EASE_FACTOR: 2.5,
  MINIMUM_EASE_FACTOR: 1.3,
  INITIAL_INTERVAL: 0,
  FIRST_INTERVAL: 1,
  SECOND_INTERVAL: 6,
} as const;

/**
 * Maps categorical review ratings to standard SM-2 0-5 quality score scale.
 * - 'again': 1 (failed recall / repeat)
 * - 'hard':  3 (correct recall with significant difficulty)
 * - 'good':  4 (correct response after hesitation)
 * - 'easy':  5 (perfect recall without hesitation)
 */
export const RATING_TO_QUALITY: Record<ReviewRating, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

/**
 * Creates a clean initial SM-2 state for a newly initialized node or card.
 */
export function createInitialSM2State(): SM2State {
  return {
    interval: SM2_DEFAULTS.INITIAL_INTERVAL,
    repetition: 0,
    easeFactor: SM2_DEFAULTS.INITIAL_EASE_FACTOR,
    lastReviewedAt: null,
    nextReviewAt: null,
  };
}

/**
 * Calculates the next SM-2 state based on the current state and review rating.
 *
 * Implements the standard SuperMemo-2 mathematical formulation:
 * 1. EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 * 2. EF' is bounded from below by 1.3.
 * 3. If q < 3 (failure):
 *    - repetition count resets to 0
 *    - interval resets to 1 day
 * 4. If q >= 3 (success):
 *    - repetition 1 -> interval = 1 day
 *    - repetition 2 -> interval = 6 days
 *    - repetition n > 2 -> interval = round(previous_interval * EF')
 *
 * @param currentState Current SM2 state of the syllabus node.
 * @param rating Review rating given by the user ('again' | 'hard' | 'good' | 'easy').
 * @param reviewDate Optional reference date (defaults to current system time).
 * @returns Updated SM2State with recalculated intervals and timestamps.
 */
export function calculateNextReview(
  currentState: SM2State,
  rating: ReviewRating,
  reviewDate: Date = new Date()
): SM2State {
  const q = RATING_TO_QUALITY[rating];
  const currentEase = currentState.easeFactor ?? SM2_DEFAULTS.INITIAL_EASE_FACTOR;
  const currentRep = currentState.repetition ?? 0;
  const currentInterval = currentState.interval ?? 0;

  // Calculate new Ease Factor:
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const rawEaseFactor = currentEase + delta;
  const newEaseFactor = Math.max(
    SM2_DEFAULTS.MINIMUM_EASE_FACTOR,
    Math.round(rawEaseFactor * 100) / 100
  );

  let newRepetition: number;
  let newInterval: number;

  if (q < 3) {
    // Failure: reset repetition count and set interval to 1 day
    newRepetition = 0;
    newInterval = SM2_DEFAULTS.FIRST_INTERVAL;
  } else {
    // Successful recall: increment repetition and advance interval
    if (currentRep === 0) {
      newInterval = SM2_DEFAULTS.FIRST_INTERVAL;
    } else if (currentRep === 1) {
      newInterval = SM2_DEFAULTS.SECOND_INTERVAL;
    } else {
      const baseInterval = currentInterval > 0 ? currentInterval : SM2_DEFAULTS.FIRST_INTERVAL;
      newInterval = Math.round(baseInterval * newEaseFactor);
      // Ensure monotonic advance for successive successful reviews
      if (newInterval <= currentInterval) {
        newInterval = currentInterval + 1;
      }
    }
    newRepetition = currentRep + 1;
  }

  const reviewTimestamp = reviewDate.toISOString();
  const nextDate = new Date(reviewDate.getTime() + newInterval * 24 * 60 * 60 * 1000);
  const nextReviewTimestamp = nextDate.toISOString();

  return {
    interval: newInterval,
    repetition: newRepetition,
    easeFactor: newEaseFactor,
    lastReviewedAt: reviewTimestamp,
    nextReviewAt: nextReviewTimestamp,
  };
}
