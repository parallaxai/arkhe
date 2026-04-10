/**
 * A half-open interval `[start, end)` on the number line where `start` is
 * inclusive and `end` is exclusive.
 *
 * ## Positioned-interval semantics
 *
 * Every range — including an empty one — has a **position** defined by its
 * `start` and `end` bounds. An empty range (`start === end`) represents a
 * zero-width point at that position, not an abstract "nothing".
 *
 * This has concrete consequences for every operation:
 *
 * - **Equality** — `[5, 5)` and `[3, 3)` are *not* equal; they are empty
 *   ranges at different positions. Two ranges are equal iff they share the
 *   same `start` and `end`.
 *
 * - **Containment** — `[0, 100)` contains `[50, 50)` (position 50 is within
 *   bounds) but does *not* contain `[200, 200)` (position 200 is outside).
 *   Formally, `a.contains(b)` iff `b.start >= a.start && b.end <= a.end`.
 *
 * - **Intersection** — two ranges intersect only if they share at least one
 *   concrete point. Because an empty range covers no points, it never
 *   intersects anything — not even itself.
 *
 * - **Union** — requires the operands to overlap, be adjacent, or for one to
 *   contain the other. `[3, 3).union([0, 5))` succeeds (the empty range is
 *   inside), but `[100, 100).union([0, 5))` throws (disjoint).
 *
 * - **Span** — always succeeds. The bounds of both ranges (including empty
 *   ones) contribute to the result: `[100, 100).span([0, 5))` yields
 *   `[0, 100)`.
 *
 * These rules follow from a single principle: *the bounds of a range always
 * carry meaning*. This makes `Range` suitable for modelling cursors, insertion
 * points, zero-width selections, and other position-sensitive concepts.
 *
 * Use {@link Range.of} to create instances — the constructor is private.
 *
 * @see {@link Range.zero} — a convenience alias for the empty range at
 * position 0 (`[0, 0)`).
 */
export class Range {
  /** A convenience alias for `Range.of(0, 0)` — the empty range at position 0. */
  static readonly zero: Range = new Range(0, 0);

  private constructor(
    /** The inclusive lower bound. */
    public readonly start: number,
    /** The exclusive upper bound. */
    public readonly end: number,
  ) {}

  /**
   * Creates a half-open range `[start, end)`.
   *
   * @throws {Error} If `start` is greater than `end`.
   */
  static of(start: number, end: number): Range {
    if (Number.isNaN(start) || Number.isNaN(end)) {
      throw new Error('Range bounds must not be NaN');
    }
    if (start > end) {
      throw new Error('Start must be less than or equal to end');
    }
    return new Range(start, end);
  }

  /** The number of units in the range. Always non-negative. */
  get length(): number {
    return this.end - this.start;
  }

  /** Returns `true` if the range contains no elements (`start === end`). */
  isEmpty(): boolean {
    return this.start === this.end;
  }

  /**
   * Returns `true` if `value` lies within `[start, end)`,
   * or if this range fully contains `other`.
   *
   * An empty range contains no values.
   * Containment of another range (including empty ones) is a bounds check:
   * `other.start >= this.start && other.end <= this.end`.
   */
  contains(value: number): boolean;
  contains(other: Range): boolean;
  contains(valueOrRange: number | Range): boolean {
    if (valueOrRange instanceof Range) {
      return valueOrRange.start >= this.start && valueOrRange.end <= this.end;
    }
    return valueOrRange >= this.start && valueOrRange < this.end;
  }

  /**
   * Returns `true` if this range and `other` share at least one point.
   *
   * Adjacent ranges (e.g. `[0, 5)` and `[5, 10)`) do **not** intersect.
   */
  intersects(other: Range): boolean {
    if (this.isEmpty() || other.isEmpty()) return false;
    return this.start < other.end && this.end > other.start;
  }

  /**
   * Returns the overlapping sub-range, or {@link Range.zero} if there is no overlap.
   *
   * As an implementation detail, when the result equals `this` or `other` the
   * existing instance is returned to avoid allocation. Callers should not rely
   * on this reference identity — use {@link equals} for comparisons.
   */
  intersect(other: Range): Range {
    if (!this.intersects(other)) return Range.zero;
    const start = Math.max(this.start, other.start);
    const end = Math.min(this.end, other.end);
    if (start === this.start && end === this.end) return this;
    if (start === other.start && end === other.end) return other;
    return Range.of(start, end);
  }

  /**
   * Returns the smallest range that covers both `this` and `other`.
   *
   * The two ranges must overlap, be adjacent (e.g. `[0, 5)` and `[5, 10)`),
   * or one must contain the other (including positioned empty ranges).
   *
   * @throws {Error} If the ranges are disjoint and neither is contained by the other.
   */
  union(other: Range): Range {
    if (
      !this.intersects(other) &&
      !this.contains(other) &&
      !other.contains(this) &&
      this.end !== other.start &&
      other.end !== this.start
    ) {
      throw new Error('Cannot union non-overlapping, non-adjacent ranges');
    }
    return Range.of(Math.min(this.start, other.start), Math.max(this.end, other.end));
  }

  /**
   * Returns the smallest range that covers both `this` and `other`,
   * including any gap between them.
   *
   * Unlike {@link union}, this never throws — disjoint ranges are valid input.
   * Both ranges' bounds contribute to the result, even if empty.
   */
  span(other: Range): Range {
    return Range.of(Math.min(this.start, other.start), Math.max(this.end, other.end));
  }

  /**
   * Returns `true` if both ranges have the same `start` and `end`.
   *
   * Empty ranges at different positions are *not* equal.
   */
  equals(other: Range): boolean {
    if (this === other) return true;
    return this.start === other.start && this.end === other.end;
  }

  /** Returns the interval in mathematical notation, e.g. `[0, 10)`. */
  toString(): string {
    return `[${this.start}, ${this.end})`;
  }
}
