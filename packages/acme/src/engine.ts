export interface Engine {
  compute(a: number, b: number): number;
}

export function createEngine(): Engine {
  return {
    compute(a: number, b: number): number {
      return a + b;
    },
  };
}
