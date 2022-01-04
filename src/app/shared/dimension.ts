// ToxCalc! by Safe Dose © 2018-2021. See LICENSE file for details.
// SPDX-License-Identifier: GPL-3.0-or-later

// A dimension represents the non-scalar portion of units as an integer vector.
// The vector is <mass, length, molar mass, time> where each integer is the
// exponent. For instance one metre and ten metres are the same, but one meter
// and one square metre are different.
//
// This class is immutable and has a private constructor. Create new instances
// using the "init" methods. Creating a new object can be done by methods that
// return a new Dimension.
export class Dimension {
  private constructor(readonly mass: number,
                      readonly length: number,
                      readonly molar_mass: number,
                      readonly time: number) {}

  private static readonly UNIT = new Dimension(0, 0, 0, 0);
  private static readonly MASS = new Dimension(1, 0, 0, 0);
  private static readonly LENGTH = new Dimension(0, 1, 0, 0);
  private static readonly MOLAR_MASS = new Dimension(0, 0, 1, 0);
  private static readonly TIME = new Dimension(0, 0, 0, 1);

  static initUnit(): Dimension { return this.UNIT; }
  static initMass(): Dimension { return this.MASS; }
  static initLength(): Dimension { return this.LENGTH; }
  static initMolarMass(): Dimension { return this.MOLAR_MASS; }
  static initTime(): Dimension { return this.TIME; }

  unit(): boolean {
    return this.mass === 0 &&
           this.length === 0 &&
           this.molar_mass === 0 &&
           this.time === 0;
  }

  equal(other: Dimension): boolean {
    return this === other ||
           (this.mass === other.mass &&
            this.length === other.length &&
            this.molar_mass === other.molar_mass &&
            this.time === other.time);
  }

  mul(other: Dimension): Dimension {
    return new Dimension(this.mass + other.mass,
                         this.length + other.length,
                         this.molar_mass + other.molar_mass,
                         this.time + other.time);
  }

  div(other: Dimension): Dimension {
    return new Dimension(this.mass - other.mass,
                         this.length - other.length,
                         this.molar_mass - other.molar_mass,
                         this.time - other.time);
  }

  exp(other: number): Dimension {
    return new Dimension(this.mass * other,
                         this.length * other,
                         this.molar_mass * other,
                         this.time * other);
  }

  recip(): Dimension {
    return new Dimension(-this.mass,
                         -this.length,
                         -this.molar_mass,
                         -this.time);
  }
}

// A class with two members, 'n' and 'd' that are a number and a Dimension
// respectively. This is immutable and there suitable for readonly or const
// datatypes. If you would like to perform calculations, call clone() which
// produces a ScalarAndDimensionMutable with the same values.
export class ScalarAndDimension {
  protected _n: number;
  protected _d: Dimension;

  get n(): number { return this._n; }
  get d(): Dimension { return this._d; }

  constructor(n: number, d: Dimension | null) {
    this._n = n;
    this._d = d == null ? Dimension.initUnit() : d;
  }

  clone(): ScalarAndDimensionMutable {
    return new ScalarAndDimensionMutable(this.n, this.d);
  }
};

// ScalarAndDimensionMutable provides functions that perform calculations which
// preserve the dimensions. The CalculateErrors type indicates different causes
// of failures encountered when calculating.

export type CalculateErrors = 'dimension conformity error' | 'zero to the power of zero' | 'complex exponential';

export function isCalculateError(x: null | ScalarAndDimension | CalculateErrors): x is CalculateErrors {
  return x === 'dimension conformity error' || x === 'zero to the power of zero' || x === 'complex exponential';
}

export class ScalarAndDimensionMutable extends ScalarAndDimension {
  // The getters should have been inherited:
  //   https://github.com/Microsoft/TypeScript/issues/25927
  get n(): number { return this._n; }
  get d(): Dimension { return this._d; }

  set n(n: number) { this._n = n; }
  set d(d: Dimension) { this._d = d; }

  constructor(n: number, d: Dimension | null) { super(n, d); }

  addEq(other: ScalarAndDimension): void | CalculateErrors {
    if (!this.d.equal(other.d)) {
      return 'dimension conformity error';
    }
    this.n += other.n;
  }

  mulEq(other: ScalarAndDimension): void {
    this.d = this.d.mul(other.d);
    this.n *= other.n;
  }

  expEq(exponent: ScalarAndDimension): void | CalculateErrors {
    // 'this' is the base of the exponentiation.

    // The exponent must have a unit dimension. It's not meaningful to take
    // (2g).exp(3mL).
    if (!exponent.d.unit()) {
      return 'dimension conformity error';
    }

    // Has no defined value, and usually indicates a division by zero.
    if (this.n === 0 && exponent.n === 0) {
      return 'zero to the power of zero';
    }

    // Our scalar is notionally a real value, not a complex.
    if (this.n < 0 && !Number.isInteger(exponent.n)) {
      return 'complex exponential';
    }

    this.n **= exponent.n;
    this.d = this.d.exp(exponent.n);
  }

  /* TODO
  logEq(antilogarithm: ScalarAndDimension): void | CalculateErrors {
    // 'this' is the base of the logarithm.
  }
  */
}
