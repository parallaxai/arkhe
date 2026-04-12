const NONE: unique symbol = Symbol('arkhe-none');

type NoneType = typeof NONE;

export class Maybe<T> {
  private readonly value: T | NoneType;

  private constructor(value: T | NoneType) {
    this.value = value;
  }

  *[Symbol.iterator](): Generator<Maybe<T>, T, T> {
    return yield this;
  }

  static some<T>(value: NonNullable<T>): Maybe<T> {
    return new Maybe(value);
  }

  static none<T = never>(): Maybe<T> {
    return new Maybe<T>(NONE);
  }

  static from<T>(value: T | null | undefined): Maybe<T> {
    return value == null ? Maybe.none() : Maybe.some(value);
  }

  isSome(): this is Some<T> {
    return this.value !== NONE;
  }

  isNone(): this is None<T> {
    return this.value === NONE;
  }

  unwrap(): T {
    if (this.isNone()) {
      throw new Error('Cannot unwrap a None value');
    }
    return this.value as T;
  }

  unwrapOr(defaultValue: T): T {
    return this.value !== NONE ? this.value : defaultValue;
  }

  unwrapOrElse(fn: () => T): T {
    return this.value !== NONE ? this.value : fn();
  }

  map<U>(fn: (value: T) => NonNullable<U>): Maybe<U> {
    return this.value !== NONE ? Maybe.some(fn(this.value)) : Maybe.none();
  }

  flatMap<U>(fn: (value: T) => Maybe<U>): Maybe<U> {
    return this.value !== NONE ? fn(this.value) : Maybe.none();
  }

  tap(fn: (value: T) => void): Maybe<T> {
    if (this.value !== NONE) fn(this.value);
    return this;
  }

  or(fallback: Maybe<T>): Maybe<T> {
    return this.value !== NONE ? this : fallback;
  }

  orElse(fn: () => Maybe<T>): Maybe<T> {
    return this.value !== NONE ? this : fn();
  }

  filter(predicate: (value: T) => boolean): Maybe<T> {
    return this.value !== NONE && predicate(this.value) ? this : Maybe.none();
  }

  match<U>(cases: { some: (value: T) => U; none: () => U }): U {
    return this.value !== NONE ? cases.some(this.value) : cases.none();
  }

  zip<U>(other: Maybe<U>): Maybe<[T, U]> {
    return this.value !== NONE && other.isSome()
      ? Maybe.some([this.value, other.unwrap()] as [T, U])
      : Maybe.none();
  }

  flatten<U>(this: Maybe<Maybe<U>>): Maybe<U> {
    const inner = this.value;
    return inner !== NONE ? inner : Maybe.none();
  }

  toString(): string {
    return this.value !== NONE ? `Some(${String(this.value)})` : 'None';
  }

  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return this.toString();
  }

  toNullable(): T | null {
    return this.value !== NONE ? this.value : null;
  }

  toUndefined(): T | undefined {
    return this.value !== NONE ? this.value : undefined;
  }

  static Do<T>(fn: () => Generator<Maybe<unknown>, T, unknown>): Maybe<NonNullable<T>> {
    const gen = fn();
    let next = gen.next();
    while (!next.done) {
      const maybe = next.value;
      if (maybe.isNone()) return Maybe.none();
      next = gen.next(maybe.unwrap());
    }
    return Maybe.from(next.value) as Maybe<NonNullable<T>>;
  }
}

export type Some<T> = Maybe<T> & {
  isSome(): this is Some<T>;
  isNone(): this is never;
  unwrap(): T;
};

export type None<T> = Maybe<T> & {
  isSome(): this is never;
  isNone(): this is None<T>;
};

export function Some<T extends {}>(value: T): Maybe<T> {
  return Maybe.some(value);
}

export function None<T = never>(): Maybe<T> {
  return Maybe.none();
}
