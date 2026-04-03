import { getSportLabel, SPORT_TYPES, BELT_SYSTEMS, VICTORY_TYPES } from '../src/utils/sports';

describe('Sports Utils', () => {
  test('SPORT_TYPES is defined and non-empty', () => {
    expect(Array.isArray(SPORT_TYPES)).toBe(true);
    expect(SPORT_TYPES.length).toBeGreaterThan(0);
  });

  test('each sport type has id and label', () => {
    for (const sport of SPORT_TYPES) {
      expect(sport).toHaveProperty('id');
      expect(sport).toHaveProperty('label');
      expect(typeof sport.id).toBe('string');
      expect(typeof sport.label).toBe('string');
    }
  });

  test('getSportLabel returns correct label for known sport', () => {
    const bjj = SPORT_TYPES.find(s => s.id === 'bjj');
    if (bjj) {
      expect(getSportLabel('bjj')).toBe(bjj.label);
    }
  });

  test('getSportLabel returns fallback for unknown sport', () => {
    const result = getSportLabel('unknown_sport_xyz');
    expect(typeof result).toBe('string');
  });

  test('VICTORY_TYPES is defined', () => {
    expect(VICTORY_TYPES).toBeDefined();
  });
});
