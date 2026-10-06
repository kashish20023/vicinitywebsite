import { calculateReelV1Score } from './reels.service.js';

describe('Phase 14 — Feed Ranking V1 Scoring Model', () => {
  const now = new Date('2026-09-20T12:00:00.000Z');

  describe('Freshness Score', () => {
    it('gives maximum freshness score (40) to a newly published Reel', () => {
      const reel = {
        publishedAt: new Date('2026-09-20T12:00:00.000Z'),
        likeCount: 0,
        commentCount: 0,
        viewCount: 0,
        now,
      };

      const score = calculateReelV1Score(reel);
      // 40 (freshness) + 0 (engagement) + 12.5 (cold start completion baseline) = 52.5
      expect(score).toBeCloseTo(52.5, 1);
    });

    it('decays freshness score predictably over time', () => {
      const reel1h = { publishedAt: new Date('2026-09-20T11:00:00.000Z'), now };
      const reel24h = { publishedAt: new Date('2026-09-19T12:00:00.000Z'), now };
      const reel48h = { publishedAt: new Date('2026-09-18T12:00:00.000Z'), now };

      const score1h = calculateReelV1Score(reel1h);
      const score24h = calculateReelV1Score(reel24h);
      const score48h = calculateReelV1Score(reel48h);

      expect(score1h).toBeGreaterThan(score24h);
      expect(score24h).toBeGreaterThan(score48h);
    });
  });

  describe('Engagement Score & Normalization', () => {
    it('increases score with higher likes, comments, and listing clicks', () => {
      const pubDate = new Date('2026-09-20T12:00:00.000Z');
      const lowEng = {
        publishedAt: pubDate,
        likeCount: 2,
        commentCount: 1,
        now,
      };
      const highEng = {
        publishedAt: pubDate,
        likeCount: 50,
        commentCount: 20,
        analytics: { listingClicks: 10 },
        now,
      };

      expect(calculateReelV1Score(highEng)).toBeGreaterThan(calculateReelV1Score(lowEng));
    });

    it('applies log normalization to prevent extreme counts from overflowing score', () => {
      const pubDate = new Date('2026-09-20T12:00:00.000Z');
      const viral1 = { publishedAt: pubDate, likeCount: 100, commentCount: 50, now };
      const viral2 = { publishedAt: pubDate, likeCount: 100000, commentCount: 50000, now };

      const score1 = calculateReelV1Score(viral1);
      const score2 = calculateReelV1Score(viral2);

      expect(score2).toBeGreaterThan(score1);
      // Even with 1000x more likes, total score remains strictly bounded <= 100
      expect(score2).toBeLessThanOrEqual(100);
    });
  });

  describe('Completion Rate Score', () => {
    it('rewards Reels with higher completion rates', () => {
      const pubDate = new Date('2026-09-20T12:00:00.000Z');
      const lowComp = {
        publishedAt: pubDate,
        analytics: { views: 100, completions100: 10 }, // 10%
        now,
      };
      const highComp = {
        publishedAt: pubDate,
        analytics: { views: 100, completions100: 80 }, // 80%
        now,
      };

      expect(calculateReelV1Score(highComp)).toBeGreaterThan(calculateReelV1Score(lowComp));
    });

    it('uses a neutral cold-start baseline (0.5 rate) for Reels with fewer than 3 views', () => {
      const pubDate = new Date('2026-09-20T12:00:00.000Z');
      const coldStart = { publishedAt: pubDate, analytics: { views: 1, completions100: 0 }, now };
      const score = calculateReelV1Score(coldStart);

      expect(score).toBeGreaterThan(40); // 40 (freshness) + 12.5 (baseline completion) = 52.5
    });
  });

  describe('Robustness & Determinism', () => {
    it('never produces NaN or Infinity for missing/null analytics or zero views', () => {
      const invalidReel = {
        publishedAt: null,
        likeCount: null,
        commentCount: null,
        viewCount: null,
        analytics: null,
        now,
      };

      const score = calculateReelV1Score(invalidReel as any);
      expect(Number.isFinite(score)).toBe(true);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
