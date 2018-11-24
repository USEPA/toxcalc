export class Dimension {
  private mass_: number;
  private length_: number;
  private molar_mass_: number;
  private time_: number;

  private constructor(mass: number,
                      length: number,
                      molar_mass: number,
                      time: number) {
    this.mass_ = mass;
    this.length_ = length;
    this.molar_mass_ = molar_mass;
    this.time_ = time;
  }

  static initUnit(): Dimension {
    return new Dimension(0, 0, 0, 0);
  }
  static initMass(): Dimension {
    return new Dimension(1, 0, 0, 0);
  }
  static initLength(): Dimension {
    return new Dimension(0, 1, 0, 0);
  }
  static initMolarMass(): Dimension {
    return new Dimension(0, 0, 1, 0);
  }
  static initTime(): Dimension {
    return new Dimension(0, 0, 0, 1);
  }

  get mass(): number { return this.mass_; }
  get length(): number { return this.length_; }
  get molar_mass(): number { return this.molar_mass_; }
  get time(): number { return this.time_; }

  unit(): boolean {
    return this.mass == 0 &&
           this.length == 0 &&
           this.molar_mass == 0 &&
           this.time == 0;
  }

  equal(other: Dimension): boolean {
    return this.mass == other.mass &&
           this.length == other.length &&
           this.molar_mass == other.molar_mass &&
           this.time == other.time;
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

  recip(): Dimension {
    return new Dimension(-this.mass, -this.length, -this.molar_mass, -this.time);
  }

  mulEq(other: Dimension): void {
    this.mass_ += other.mass;
    this.length_ += other.length;
    this.molar_mass_ += other.molar_mass;
    this.time_ += other.time;
  }

  divEq(other: Dimension): void {
    this.mass_ -= other.mass;
    this.length_ -= other.length;
    this.molar_mass_ -= other.molar_mass;
    this.time_ -= other.time;
  }

  recipEq(): void {
    this.mass_ = -this.mass;
    this.length_ = -this.length;
    this.molar_mass_ = -this.molar_mass;
    this.time_ = -this.time;
  }
}
