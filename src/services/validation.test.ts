import { describe, expect, it } from 'vitest';
import { imageUrl } from './tmdb';
import { isMovieStatus, isValidRating, validateListTitle } from './validation';

describe('KinoLog validacija', () => {
  it('leidžia tik įvertinimus nuo 1 iki 10', () => { expect(isValidRating(1)).toBe(true); expect(isValidRating(10)).toBe(true); expect(isValidRating(0)).toBe(false); expect(isValidRating(11)).toBe(false); });
  it('atmeta tuščią ir per ilgą sąrašo pavadinimą', () => { expect(validateListTitle('   ')).toBeTruthy(); expect(validateListTitle(' Klasika ')).toBeNull(); expect(validateListTitle('x'.repeat(81))).toBeTruthy(); });
  it('validuoja visas filmų būsenas', () => { expect(isMovieStatus('planned')).toBe(true); expect(isMovieStatus('watching')).toBe(true); expect(isMovieStatus('watched')).toBe(true); expect(isMovieStatus('deleted')).toBe(false); });
});
describe('TMDB paveikslėlių URL', () => {
  it('sukuria saugų paveikslėlio URL ir atmeta netinkamus kelius', () => { expect(imageUrl('/poster.jpg')).toBe('https://image.tmdb.org/t/p/w500/poster.jpg'); expect(imageUrl('/bg.png','original')).toBe('https://image.tmdb.org/t/p/original/bg.png'); expect(imageUrl(null)).toBeNull(); expect(imageUrl('//evil.example/a.jpg')).toBeNull(); });
});
