import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';

describe('createEngine', () => {
  it('creates an engine instance', () => {
    const engine = createEngine();
    expect(engine).toBeDefined();
  });

  it('computes the sum of two numbers', () => {
    const engine = createEngine();
    expect(engine.compute(2, 3)).toBe(5);
  });

  it('handles negative numbers', () => {
    const engine = createEngine();
    expect(engine.compute(-1, -2)).toBe(-3);
  });
});
