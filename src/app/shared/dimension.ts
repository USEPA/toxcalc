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
    return this.mass == 0 &&
           this.length == 0 &&
           this.molar_mass == 0 &&
           this.time == 0;
  }

  equal(other: Dimension): boolean {
    return this === other ||
           (this.mass == other.mass &&
            this.length == other.length &&
            this.molar_mass == other.molar_mass &&
            this.time == other.time);
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
