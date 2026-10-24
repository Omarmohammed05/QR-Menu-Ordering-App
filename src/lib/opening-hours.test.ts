import {describe, expect, it} from 'vitest';
import {isOpenAt, wallClock} from './opening-hours';

// Fixed instants: 2026-11-21 is a Saturday, safely after Cairo's DST ends —
// Africa/Cairo is UTC+2 then, so the expectations stay tzdata-stable.
const satNoonUtc = new Date('2026-11-21T10:00:00Z'); // 12:00 in Africa/Cairo
const satLateUtc = new Date('2026-11-21T22:00:00Z'); // 2026-11-22 00:00 in Cairo → Sunday

describe('wallClock', () => {
  it('maps a UTC instant to Cairo wall-clock time', () => {
    expect(wallClock(satNoonUtc, 'Africa/Cairo')).toEqual({weekday: 6, minutes: 12 * 60});
  });

  it('rolls weekday past midnight in the local zone', () => {
    expect(wallClock(satLateUtc, 'Africa/Cairo')).toEqual({weekday: 0, minutes: 0});
  });
});

describe('isOpenAt', () => {
  const satDay = [{weekday: 6, opensAt: '10:00:00', closesAt: '23:00:00'}];

  it('is open inside a matching slot in the restaurant timezone', () => {
    expect(isOpenAt(satDay, satNoonUtc, 'Africa/Cairo')).toBe(true);
  });

  it('is closed outside every slot', () => {
    // 07:00 Cairo, before the 10:00 open.
    expect(isOpenAt(satDay, new Date('2026-11-21T05:00:00Z'), 'Africa/Cairo')).toBe(false);
  });

  it('is closed on an unscheduled weekday', () => {
    // Sunday 00:00 Cairo after Saturday's slot has rolled over.
    expect(isOpenAt(satDay, satLateUtc, 'Africa/Cairo')).toBe(false);
  });

  it('treats an empty schedule as always open', () => {
    expect(isOpenAt([], satNoonUtc, 'Africa/Cairo')).toBe(true);
  });
});
