import { expectTypeOf } from 'expect-type';
import { describe, expect, it } from 'vitest';
import { Maybe, None, Some } from '../src/maybe.js';

// -----------------------------------------------------------------------------
// Static constructors
// -----------------------------------------------------------------------------

describe('Maybe.some', () => {
  it('wraps a value as Some', () => {
    const m = Maybe.some(1);
    expect(m.isSome()).toBe(true);
    expect(m.unwrap()).toBe(1);
  });

  it('accepts falsy non-nullish values', () => {
    expect(Maybe.some(0).unwrap()).toBe(0);
    expect(Maybe.some('').unwrap()).toBe('');
    expect(Maybe.some(false).unwrap()).toBe(false);
  });
});

describe('Maybe.none', () => {
  it('creates a None', () => {
    const m = Maybe.none();
    expect(m.isNone()).toBe(true);
  });
});

describe('Maybe.from', () => {
  it('returns Some for non-nullish values', () => {
    expect(Maybe.from(1).isSome()).toBe(true);
    expect(Maybe.from('hello').unwrap()).toBe('hello');
  });

  it('returns None for null', () => {
    expect(Maybe.from(null).isNone()).toBe(true);
  });

  it('returns None for undefined', () => {
    expect(Maybe.from(undefined).isNone()).toBe(true);
  });

  it('wraps falsy non-nullish values as Some', () => {
    expect(Maybe.from(0).unwrap()).toBe(0);
    expect(Maybe.from('').unwrap()).toBe('');
    expect(Maybe.from(false).unwrap()).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// Helper functions
// -----------------------------------------------------------------------------

describe('Some()', () => {
  it('is equivalent to Maybe.some', () => {
    const m = Some(42);
    expect(m.isSome()).toBe(true);
    expect(m.unwrap()).toBe(42);
  });
});

describe('None()', () => {
  it('is equivalent to Maybe.none', () => {
    const m = None();
    expect(m.isNone()).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// Type guards
// -----------------------------------------------------------------------------

describe('isSome / isNone', () => {
  it('isSome returns true for Some, false for None', () => {
    expect(Some(1).isSome()).toBe(true);
    expect(None().isSome()).toBe(false);
  });

  it('isNone returns true for None, false for Some', () => {
    expect(None().isNone()).toBe(true);
    expect(Some(1).isNone()).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// Unwrapping
// -----------------------------------------------------------------------------

describe('unwrap', () => {
  it('returns the inner value for Some', () => {
    expect(Some('value').unwrap()).toBe('value');
  });

  it('throws for None', () => {
    expect(() => None().unwrap()).toThrow('Cannot unwrap a None value');
  });
});

describe('unwrapOr', () => {
  it('returns the inner value for Some', () => {
    expect(Some(1).unwrapOr(99)).toBe(1);
  });

  it('returns the default for None', () => {
    expect(Maybe.none<number>().unwrapOr(99)).toBe(99);
  });
});

describe('unwrapOrElse', () => {
  it('returns the inner value for Some without calling fn', () => {
    const fn = () => {
      throw new Error('should not be called');
    };
    expect(Some(1).unwrapOrElse(fn)).toBe(1);
  });

  it('calls fn and returns its result for None', () => {
    expect(Maybe.none<number>().unwrapOrElse(() => 42)).toBe(42);
  });
});

// -----------------------------------------------------------------------------
// Transformations
// -----------------------------------------------------------------------------

describe('map', () => {
  it('transforms the inner value of Some', () => {
    expect(
      Some(2)
        .map((n) => n * 3)
        .unwrap(),
    ).toBe(6);
  });

  it('passes through None', () => {
    expect(
      Maybe.none<number>()
        .map((n) => n * 3)
        .isNone(),
    ).toBe(true);
  });

  it('chains multiple maps', () => {
    const result = Some('hello')
      .map((s) => s.length)
      .map((n) => n > 3);
    expect(result.unwrap()).toBe(true);
  });
});

describe('flatMap', () => {
  it('chains computations that return Maybe', () => {
    const safeDivide = (a: number, b: number) => (b === 0 ? None<number>() : Some(a / b));

    expect(
      Some(10)
        .flatMap((n) => safeDivide(n, 2))
        .unwrap(),
    ).toBe(5);
  });

  it('short-circuits on None in the chain', () => {
    const result = Some(10)
      .flatMap(() => None<number>())
      .flatMap((n) => Some(n + 1));
    expect(result.isNone()).toBe(true);
  });

  it('passes through when called on None', () => {
    expect(
      Maybe.none<number>()
        .flatMap((n) => Some(n + 1))
        .isNone(),
    ).toBe(true);
  });
});

describe('flatten', () => {
  it('unwraps a nested Some(Some(v)) to Some(v)', () => {
    const nested = Some(Some(42));
    expect(nested.flatten().unwrap()).toBe(42);
  });

  it('unwraps Some(None) to None', () => {
    const nested = Some(None<number>());
    expect(nested.flatten().isNone()).toBe(true);
  });

  it('passes through outer None', () => {
    const nested = None<Maybe<number>>();
    expect(nested.flatten().isNone()).toBe(true);
  });
});

describe('filter', () => {
  it('keeps Some when predicate passes', () => {
    expect(
      Some(10)
        .filter((n) => n > 5)
        .unwrap(),
    ).toBe(10);
  });

  it('converts to None when predicate fails', () => {
    expect(
      Some(3)
        .filter((n) => n > 5)
        .isNone(),
    ).toBe(true);
  });

  it('passes through None', () => {
    expect(
      Maybe.none<number>()
        .filter(() => true)
        .isNone(),
    ).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// Side effects
// -----------------------------------------------------------------------------

describe('tap', () => {
  it('calls fn with the value for Some and returns the same Maybe', () => {
    let captured: number | undefined;
    const m = Some(42);
    const result = m.tap((v) => {
      captured = v;
    });
    expect(captured).toBe(42);
    expect(result).toBe(m);
  });

  it('does not call fn for None', () => {
    let called = false;
    None<number>().tap(() => {
      called = true;
    });
    expect(called).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// Fallbacks
// -----------------------------------------------------------------------------

describe('or', () => {
  it('returns this when Some', () => {
    const a = Some(1);
    const b = Some(2);
    expect(a.or(b)).toBe(a);
  });

  it('returns fallback when None', () => {
    const fallback = Some(99);
    expect(Maybe.none<number>().or(fallback)).toBe(fallback);
  });
});

describe('orElse', () => {
  it('returns this without calling fn when Some', () => {
    const m = Some(1);
    const result = m.orElse(() => {
      throw new Error('should not be called');
    });
    expect(result).toBe(m);
  });

  it('calls fn and returns its result when None', () => {
    const result = Maybe.none<number>().orElse(() => Some(42));
    expect(result.unwrap()).toBe(42);
  });
});

// -----------------------------------------------------------------------------
// Pattern matching
// -----------------------------------------------------------------------------

describe('match', () => {
  it('calls some branch for Some', () => {
    const result = Some(5).match({
      some: (n) => `got ${n}`,
      none: () => 'nothing',
    });
    expect(result).toBe('got 5');
  });

  it('calls none branch for None', () => {
    const result = Maybe.none<number>().match({
      some: (n) => `got ${n}`,
      none: () => 'nothing',
    });
    expect(result).toBe('nothing');
  });
});

// -----------------------------------------------------------------------------
// Combinators
// -----------------------------------------------------------------------------

describe('zip', () => {
  it('zips two Somes into a tuple', () => {
    expect(Some(1).zip(Some('a')).unwrap()).toEqual([1, 'a']);
  });

  it('returns None if left is None', () => {
    expect(Maybe.none<number>().zip(Some('a')).isNone()).toBe(true);
  });

  it('returns None if right is None', () => {
    expect(Some(1).zip(None()).isNone()).toBe(true);
  });

  it('returns None if both are None', () => {
    expect(Maybe.none<number>().zip(None()).isNone()).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// Conversions
// -----------------------------------------------------------------------------

describe('toString', () => {
  it('returns Some(value) for Some', () => {
    expect(Some(42).toString()).toBe('Some(42)');
    expect(Some('hi').toString()).toBe('Some(hi)');
  });

  it('returns None for None', () => {
    expect(None().toString()).toBe('None');
  });
});

describe('[Symbol.for nodejs.util.inspect.custom]', () => {
  const inspectSymbol = Symbol.for('nodejs.util.inspect.custom');

  it('returns Some(value) for Some', () => {
    const m = Some(42) as unknown as Record<symbol, () => string>;
    expect(m[inspectSymbol]()).toBe('Some(42)');
  });

  it('returns None for None', () => {
    const m = None() as unknown as Record<symbol, () => string>;
    expect(m[inspectSymbol]()).toBe('None');
  });
});

describe('toNullable', () => {
  it('returns the value for Some', () => {
    expect(Some(42).toNullable()).toBe(42);
  });

  it('returns null for None', () => {
    expect(None().toNullable()).toBeNull();
  });
});

describe('toUndefined', () => {
  it('returns the value for Some', () => {
    expect(Some(42).toUndefined()).toBe(42);
  });

  it('returns undefined for None', () => {
    expect(None().toUndefined()).toBeUndefined();
  });
});

// -----------------------------------------------------------------------------
// Do notation
// -----------------------------------------------------------------------------

describe('Maybe.Do', () => {
  it('chains multiple Some values', () => {
    const result = Maybe.Do(function* () {
      const a = yield* Some(1);
      const b = yield* Some(2);
      return a + b;
    });
    expect(result.unwrap()).toBe(3);
  });

  it('short-circuits on first None', () => {
    let reached = false;
    const result = Maybe.Do(function* () {
      const a = yield* Some(1);
      yield* None<number>();
      reached = true;
      return a;
    });
    expect(result.isNone()).toBe(true);
    expect(reached).toBe(false);
  });

  it('returns None when the generator returns null', () => {
    const result = Maybe.Do(function* () {
      yield* Some(1);
      return null as string | null;
    });
    expect(result.isNone()).toBe(true);
  });

  it('returns None when the generator returns undefined', () => {
    const result = Maybe.Do(function* () {
      yield* Some(1);
      return undefined as string | undefined;
    });
    expect(result.isNone()).toBe(true);
  });

  it('works with complex chains', () => {
    const safeParse = (s: string): Maybe<number> => {
      const n = Number(s);
      return Number.isNaN(n) ? None() : Some(n);
    };

    const result = Maybe.Do(function* () {
      const a = yield* safeParse('10');
      const b = yield* safeParse('20');
      return a + b;
    });
    expect(result.unwrap()).toBe(30);
  });

  it('short-circuits in complex chains', () => {
    const safeParse = (s: string): Maybe<number> => {
      const n = Number(s);
      return Number.isNaN(n) ? None() : Some(n);
    };

    const result = Maybe.Do(function* () {
      const a = yield* safeParse('10');
      const b = yield* safeParse('not a number');
      return a + b;
    });
    expect(result.isNone()).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// Iterator protocol
// -----------------------------------------------------------------------------

describe('[Symbol.iterator]', () => {
  it('yields the Maybe itself and returns the sent value', () => {
    const m = Some(42);
    const gen = m[Symbol.iterator]();
    const first = gen.next();
    expect(first.done).toBe(false);
    expect(first.value).toBe(m);
    const second = gen.next(42);
    expect(second.done).toBe(true);
    expect(second.value).toBe(42);
  });

  it('yields None itself when called on None', () => {
    const m = None<number>();
    const gen = m[Symbol.iterator]();
    const first = gen.next();
    expect(first.done).toBe(false);
    expect(first.value).toBe(m);
    if (!first.done) {
      expect(first.value.isNone()).toBe(true);
    }
  });
});

// -----------------------------------------------------------------------------
// Type-level tests
// -----------------------------------------------------------------------------

describe('types', () => {
  describe('constructors', () => {
    it('Maybe.some infers the value type', () => {
      expectTypeOf(Maybe.some(1)).toEqualTypeOf<Maybe<1>>();
      expectTypeOf(Maybe.some('a')).toEqualTypeOf<Maybe<'a'>>();
      expectTypeOf(Maybe.some(true)).toEqualTypeOf<Maybe<true>>();
    });

    it('Maybe.none defaults to Maybe<never>', () => {
      expectTypeOf(Maybe.none()).toEqualTypeOf<Maybe<never>>();
    });

    it('Maybe.none accepts explicit type parameter', () => {
      expectTypeOf(Maybe.none<string>()).toEqualTypeOf<Maybe<string>>();
    });

    it('Maybe.from infers the non-null type', () => {
      expectTypeOf(Maybe.from('hello' as string | null)).toEqualTypeOf<Maybe<string>>();
      expectTypeOf(Maybe.from(1 as number | undefined)).toEqualTypeOf<Maybe<number>>();
      expectTypeOf(Maybe.from(true as boolean | null | undefined)).toEqualTypeOf<Maybe<boolean>>();
    });

    it('Maybe.some rejects null', () => {
      // @ts-expect-error — null is not assignable to NonNullable
      Maybe.some(null);
    });

    it('Maybe.some rejects undefined', () => {
      // @ts-expect-error — undefined is not assignable to NonNullable
      Maybe.some(undefined);
    });

    it('Some() helper matches Maybe.some', () => {
      expectTypeOf(Some(42)).toEqualTypeOf<Maybe<number>>();
    });

    it('Some() rejects null', () => {
      // @ts-expect-error — null is not assignable to {}
      Some(null);
    });

    it('Some() rejects undefined', () => {
      // @ts-expect-error — undefined is not assignable to {}
      Some(undefined);
    });

    it('None() helper matches Maybe.none', () => {
      expectTypeOf(None()).toEqualTypeOf<Maybe<never>>();
      expectTypeOf(None<string>()).toEqualTypeOf<Maybe<string>>();
    });
  });

  describe('unwrapping', () => {
    it('unwrap returns T', () => {
      expectTypeOf(Some(1).unwrap()).toEqualTypeOf<number>();
    });

    it('unwrapOr returns T', () => {
      expectTypeOf(Maybe.none<string>().unwrapOr('default')).toEqualTypeOf<string>();
    });

    it('unwrapOrElse returns T', () => {
      expectTypeOf(Maybe.none<number>().unwrapOrElse(() => 0)).toEqualTypeOf<number>();
    });
  });

  describe('transformations', () => {
    it('map changes the inner type', () => {
      expectTypeOf(Some(1).map((n) => String(n))).toEqualTypeOf<Maybe<string>>();
    });

    it('flatMap changes the inner type', () => {
      expectTypeOf(Some(1).flatMap((n) => Some(String(n)))).toEqualTypeOf<Maybe<string>>();
    });

    it('map callback requires NonNullable return', () => {
      // @ts-expect-error — null return is not assignable to NonNullable
      Some(1).map(() => null);
    });

    it('filter preserves the type', () => {
      expectTypeOf(Some(1).filter((n) => n > 0)).toEqualTypeOf<Maybe<number>>();
    });

    it('flatten unwraps one layer', () => {
      expectTypeOf(Some(Some(1)).flatten()).toEqualTypeOf<Maybe<number>>();
    });
  });

  describe('combinators', () => {
    it('zip produces a tuple type', () => {
      expectTypeOf(Some(1).zip(Some('a'))).toEqualTypeOf<Maybe<[number, string]>>();
    });

    it('match resolves to the return type', () => {
      expectTypeOf(
        Some(1).match({ some: (n) => String(n), none: () => 'none' }),
      ).toEqualTypeOf<string>();
    });
  });

  describe('conversions', () => {
    it('toNullable returns T | null', () => {
      expectTypeOf(Some(1).toNullable()).toEqualTypeOf<number | null>();
    });

    it('toUndefined returns T | undefined', () => {
      expectTypeOf(Some(1).toUndefined()).toEqualTypeOf<number | undefined>();
    });
  });

  describe('type narrowing', () => {
    it('narrows to Some after isSome check', () => {
      const m: Maybe<number> = Some(1);
      if (m.isSome()) {
        expectTypeOf(m).toMatchTypeOf<Some<number>>();
        expectTypeOf(m.unwrap()).toEqualTypeOf<number>();
      }
    });

    it('narrows to None after isNone check', () => {
      const m: Maybe<number> = None();
      if (m.isNone()) {
        expectTypeOf(m).toMatchTypeOf<None<number>>();
      }
    });
  });

  describe('Do notation', () => {
    it('infers NonNullable return type', () => {
      const result = Maybe.Do(function* () {
        const a = yield* Some(1);
        const b = yield* Some('hello');
        return `${b}: ${a}`;
      });
      expectTypeOf(result).toEqualTypeOf<Maybe<string>>();
    });
  });
});
