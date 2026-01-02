import { describe, it, expect, vi } from 'vitest';
import { Clock } from '../scripts/clock.js';

describe('Clock', () => {
  test('初期化時にlastが設定される', () => {
    const now = 123456.789;
    vi.stubGlobal('performance', { now: () => now });
    const clock = new Clock();
    expect(clock.last).toBe(now);
  });

  test('elapsedTime()で経過秒数が返る', () => {
    let t = 1000;
    vi.stubGlobal('performance', { now: () => t });
    const clock = new Clock();
    t += 250;
    expect(clock.elapsedTime()).toBeCloseTo(0.25);
    t += 500;
    expect(clock.elapsedTime()).toBeCloseTo(0.5);
  });

  test('elapsedTime()呼び出しごとにlastが更新される', () => {
    let t = 2000;
    vi.stubGlobal('performance', { now: () => t });
    const clock = new Clock();
    t += 100;
    clock.elapsedTime();
    expect(clock.last).toBe(t);
    t += 100;
    clock.elapsedTime();
    expect(clock.last).toBe(t);
  });
});
