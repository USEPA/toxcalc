import { Dimension } from './dimension';

// A tiny computer algebra system, supporting one equation with one unknown, on
// an equality relation. Create Variable objects to hold on to and build an
// expression out of them using the static constructors in Equation. (Hint: to
// avoid hitting implementation limits in the solver, try to use each Variable
// only once.) Call solved_eq = my_eq.solve(my_var) to return a new Equation in
// my_var = expr... form. If all your variables are set, solved_eq.RHS.getValue()
// should result in a concrete value.

export class Unit {
  private scale: number;
  private dimension: Dimension;

  constructor(s: number, d: Dimension) { [this.scale, this.dimension] = [s, d]; }

  setScale(n: number): void { this.scale = n; }
  getScale(): number { return this.scale; }
  setDimension(d: Dimension): void { this.dimension = d; }
  getDimension(): Dimension { return this.dimension; }
}

type CalculateErrors = 'dimension conformity error' | 'zero to the power of zero' | 'complex exponential';
function isCalculateError(x: ScalarAndUnit | Term | null | CalculateErrors): x is CalculateErrors {
  return x == 'dimension conformity error' || x == 'zero to the power of zero' || x == 'complex exponential';
}

export class ScalarAndUnit {
  n: number;
  u: Unit | null;

  constructor(n: number, u: Unit | null) { [this.n, this.u] = [n, u]; }

  clone(): ScalarAndUnit {
    return new ScalarAndUnit(this.n, this.u);
  }

  hasUnit(): boolean {
    if (this.u == null)
      return false;
     if (this.u.getScale() != 1)
       return false;
     if (!this.u.getDimension().unit())
       return false;
     return true;
  }

  addEq(other: ScalarAndUnit): void | CalculateErrors {
    let unitScale: number = 1;
    if (this.u != other.u) {
      if (!this.u || !other.u || this.u.getDimension() != other.u.getDimension())
        return 'dimension conformity error';
      unitScale = other.u.getScale() / this.u.getScale();
    }
    this.n += other.n * unitScale;
  }

  mulEq(other: ScalarAndUnit): void {
    if (!this.u && other.u)
      this.u = other.u
    else if (this.u && other.u) {
      this.u.setScale(this.u.getScale() * other.u.getScale());
      this.u.setDimension(this.u.getDimension().mul(other.u.getDimension()));
    }
    this.n *= other.n;
  }

  expEq(exponent: ScalarAndUnit): void | CalculateErrors {
    // 'this' is the base of the exponentiation.
    if (exponent.u && !exponent.u.getDimension().unit())
      return 'dimension conformity error';
    let scaled_exponent = exponent.n;
    if (exponent.u)
      scaled_exponent *= exponent.u.getScale();
    if (this.n == 0 && scaled_exponent == 0)
      return 'zero to the power of zero';
    if (this.n < 0 && !Number.isInteger(scaled_exponent))
      return 'complex exponential';
    this.n **= scaled_exponent;
    if (this.u)
      this.u.setDimension(this.u.getDimension().exp(scaled_exponent));
    return;
  }

  /* TODO
  logEq(antilogarithm: scalarAndUnit): void | CalculateErrors {
    // 'this' is the base of the logarithm.
  }
  */
}

enum TypeDiscriminator {
  Constant,
  Variable,
  Add,
  Multiply,
  Exponentiate,
  Logarithmize,
}

export interface Term {
  contains(v: Variable): boolean;

  getValue(): ScalarAndUnit | CalculateErrors | null;

  kind: TypeDiscriminator;
}

class Constant implements Term {
  kind = TypeDiscriminator.Constant;

  constructor(private readonly value: ScalarAndUnit) {}

  getValue(): ScalarAndUnit { return this.value; }

  contains(v: Variable): boolean { return false; }
}

export class Variable implements Term {
  kind = TypeDiscriminator.Variable;

  value: ScalarAndUnit | null = null;

  getValue(): ScalarAndUnit | null { return this.value; }
  setValue(value: ScalarAndUnit | null): void { this.value = value; }

  contains(v: Variable): boolean { return this === v; }
}

interface CollectFilterFunc {
  (term: Term): boolean;
}

class Add implements Term {
  kind = TypeDiscriminator.Add;

  // All units must be the same.
  private summands: Term[];

  constructor(terms: Term[]) { this.summands = terms; }

  getSummands(): Term[] { return this.summands; }

  contains(v: Variable): boolean {
    return this.summands.some(function(t: Term) { return t.contains(v); });
  }

  collect(filter: CollectFilterFunc): {'collected': Term[], 'anticollected': Term[]} {
    let collected: Term[] = [];
    let anticollected: Term[] = [];
    for (let i = 0; i != this.summands.length; ++i) {
      if (filter(this.summands[i])) {
        collected.push(this.summands[i]);
      } else {
        anticollected.push(this.summands[i]);
      }
    }
    return {'collected': collected, 'anticollected': anticollected};
  }

  getValue(): ScalarAndUnit | CalculateErrors | null {
    if (this.summands.length == 0)
      return null;
    let result = this.summands[0].getValue();
    if (result == null || isCalculateError(result))
      return result;
    for (let i = 1; i != this.summands.length; ++i) {
      let value = this.summands[i].getValue();
      if (value == null || isCalculateError(value))
        return value;
      let error = result.addEq(value);
      if (error)
        return error;
    }
    return result;
  }
}

class Multiply implements Term {
  kind = TypeDiscriminator.Multiply;

  private factors: Term[];

  constructor(terms: Term[]) { this.factors = terms; }

  getFactors(): Term[] { return this.factors; }

  contains(v: Variable): boolean {
    return this.factors.some(function(t: Term) { return t.contains(v); });
  }

  collect(filter: CollectFilterFunc): {'collected': Term[], 'anticollected': Term[]} {
    let collected: Term[] = [];
    let anticollected: Term[] = [];
    for (let i = 0; i != this.factors.length; ++i) {
      if (filter(this.factors[i])) {
        collected.push(this.factors[i]);
      } else {
        anticollected.push(this.factors[i]);
      }
    }
    return {'collected': collected, 'anticollected': anticollected};
  }

  getValue(): ScalarAndUnit | CalculateErrors | null {
    if (this.factors.length == 0)
      return null;
    let result = this.factors[0].getValue();
    if (result == null || isCalculateError(result))
      return result;
    for (let i = 1; i != this.factors.length; ++i) {
      let value = this.factors[i].getValue();
      if (value == null || isCalculateError(value))
        return value;
      result.mulEq(value);
    }
    return result;
  }
}

class Exponentiate implements Term {
  kind = TypeDiscriminator.Exponentiate;

  private base: Term;
  private exponent: Term;

  constructor(b: Term, e: Term) { [this.base, this.exponent] = [b, e]; }

  getBase(): Term { return this.base; }
  getExponent(): Term { return this.exponent; }

  contains(v: Variable): boolean {
    return this.base.contains(v) || this.exponent.contains(v);
  }

  getValue(): ScalarAndUnit | CalculateErrors | null {
    let base = this.base.getValue();
    if (base == null || isCalculateError(base))
      return base;
    let exponent = this.exponent.getValue();
    if (exponent == null || isCalculateError(exponent))
      return exponent;
    let error = base.expEq(exponent);
    if (error)
      return error;
    return base;
  }
}

class Logarithmize implements Term {
  kind = TypeDiscriminator.Logarithmize;

  private base: Term;
  private antilogarithm: Term;

  constructor(b: Term, a: Term) { [this.base, this.antilogarithm] = [b, a]; }

  contains(v: Variable): boolean {
    return this.base.contains(v) || this.antilogarithm.contains(v);
  }

  getValue(): ScalarAndUnit | null {
    return null;
  /* TODO
    let base = this.base.getValue();
    let antilogarithm = this.antilogarithm.getValue();
    if (base == null || antilogarithm == null)
      return null;
    return Math.log(base, antilogarithm);
  */
  }
}

type SolveErrors = 'overdefined' | 'underdefined' | 'too complex' | CalculateErrors;

// An equation with a single equality relationship between two terms.
export class Equation {
  LHS: Term;
  RHS: Term;

  constructor(lhs: Term, rhs: Term) { [this.LHS, this.RHS] = [lhs, rhs]; }

  // Rewrite equation into 'v = term' form.
  solve(v: Variable): Equation | SolveErrors {
    if (this.RHS.contains(v)) {
      if (this.LHS.contains(v))
        return 'too complex';
      return new Equation(this.RHS, this.LHS).solve(v);
    }
    switch(this.LHS.kind) {
    case TypeDiscriminator.Add: {
      let add = <Add>this.LHS;
      let left = add.collect(function(t: Term) { return t.contains(v); });
      if (left['collected'].length != 1)
        return 'too complex';
      let right = Equation.sub(this.RHS, Equation.addFromArray(left['anticollected']));
      return new Equation(left['collected'][0], right).solve(v);
    }
    case TypeDiscriminator.Multiply: {
      let multiply = <Multiply>this.LHS;
      let left = multiply.collect(function(t: Term) { return t.contains(v); });
      if (left['collected'].length != 1)
        return 'too complex';
      let right = Equation.div(this.RHS, Equation.mulFromArray(left['anticollected']));
      return new Equation(left['collected'][0], right).solve(v);
    }
    case TypeDiscriminator.Constant:
      return 'underdefined';
    case TypeDiscriminator.Variable: {
      if (this.LHS == v)
        return this;
      return 'too complex';
    }
    case TypeDiscriminator.Exponentiate: {
      let exponentiate = <Exponentiate>this.LHS;
      if (!exponentiate.getExponent().contains(v)) {
        let left = exponentiate.getBase();
        let right = Equation.exp(this.RHS, Equation.exp(exponentiate.getExponent(), Equation.constantFromNumber(-1)));
        return new Equation(left, right).solve(v);
      }
      return 'too complex';
    }
    case TypeDiscriminator.Logarithmize:
      return 'too complex';
    default:
      let exhaustive: never = this.LHS.kind;
      return exhaustive;
    }
    return 'too complex';  // This should be unreachable.
  }

  // Static constructors form the public API.
  //
  // The implementations will do some simplification, but none of the
  // simplifications are needed for correctness. They should behave the same as
  // if the did nothing but call the relevant constructor, which is also why
  // they aren't allowed to return CalculateErrors.

  static constant(sau: ScalarAndUnit) { return new Constant(sau); }

  static constantFromNumber(n: number) {
    return Equation.constantFromNumberUnit(n, null);
  }

  static constantFromNumberUnit(n: number, u: Unit | null) {
    return Equation.constant(new ScalarAndUnit(n, u));
  }

  static add(...terms: Term[]): Term { return Equation.addFromArray(terms); }

  static addFromArray(terms: Term[]): Term {
    // Expand any add's terms to our terms.
    let newTerms: Term[] = [];
    for (let i = 0; i != terms.length; ++i) {
      if (terms[i].kind == TypeDiscriminator.Add) {
        newTerms = newTerms.concat((<Add>terms[i]).getSummands());
      } else {
        newTerms.push(terms[i]);
      }
    }
    terms = newTerms;

    // Collapse multiple constants into one.
    let constants: ScalarAndUnit | null = null;
    newTerms = [];
    for (let i = 0; i != terms.length; ++i) {
      if (terms[i].kind == TypeDiscriminator.Constant) {
        let term: Constant = <Constant>terms[i];
        if (constants == null)
          constants = term.getValue();
        else if (constants.u == term.getValue().u)
          constants.addEq(term.getValue());
        else
          // In the case the units don't match, defer error until getValue().
          newTerms.push(terms[i]);
      } else {
        newTerms.push(terms[i]);
      }
    }
    terms = newTerms;
    if (constants && constants.n != 0)
      terms.push(Equation.constant(constants));

    // TODO: got an add term? Make a single combined add.
    // TODO: got the same term twice or more? Convert that into a multiply.
    if (terms.length == 1)
      return terms[0];
    return new Add(terms);
  }

  static sub(minuend: Term, subtrahend: Term): Term {
    return Equation.add(minuend, Equation.mul(subtrahend, Equation.constantFromNumber(-1)));
  }

  static mul(...terms: Term[]): Term { return Equation.mulFromArray(terms); }

  static mulFromArray(terms: Term[]): Term {
    // Expand any multiply's terms to our terms.
    let newTerms: Term[] = [];
    for (let i = 0; i != terms.length; ++i) {
      if (terms[i].kind == TypeDiscriminator.Multiply) {
        newTerms = newTerms.concat((<Multiply>terms[i]).getFactors());
      } else {
        newTerms.push(terms[i]);
      }
    }
    terms = newTerms;

    // Collapse multiple constants into one.
    let constants: ScalarAndUnit | null = null;
    newTerms = [];
    for (let i = 0; i != terms.length; ++i) {
      if (terms[i].kind == TypeDiscriminator.Constant) {
        let term: Constant = <Constant>terms[i];
        if (constants == null)
          constants = term.getValue();
        else
          constants.mulEq(term.getValue());
      } else {
        newTerms.push(terms[i]);
      }
    }
    terms = newTerms;
    // TODO: handle constant zero and one. What if it has units?
    if (constants)
      terms.push(Equation.constant(constants));

    // TODO: got a multiply term? Create a single combined multiply.
    // TODO: got the same term twice or more? Convert to an exponentiation.
    // TODO: got exponentiate terms with the same base? Fold them.
    if (terms.length == 1)
      return terms[0];
    return new Multiply(terms);
  }

  static div(dividend: Term, divisor: Term): Term {
    return Equation.mul(dividend, Equation.exp(divisor, Equation.constantFromNumber(-1)));
  }

  static exp(base: Term, exponent: Term): Term {
    // If both terms are constant, return a constant.
    if (base.kind == TypeDiscriminator.Constant && exponent.kind == TypeDiscriminator.Constant) {
      let base_c = <Constant>base;
      let exponent_c = <Constant>exponent;
      let result = base_c.getValue().clone();
      let error = result.expEq(exponent_c.getValue());
      if (!error)
        return Equation.constant(result);
    }

    // If the exponent is one, return the base.
    if (exponent.kind == TypeDiscriminator.Constant) {
      let exponent_c = <Constant>exponent;
      if (exponent_c.getValue().n == 1)
        return base;
    }

    // If base is an exponentiation, combine our exponents.
    if (base.kind == TypeDiscriminator.Exponentiate) {
      let base_exp = <Exponentiate>base;
      return Equation.exp(base_exp.getBase(), Equation.mul(base_exp.getExponent(), exponent));
    }

    return new Exponentiate(base, exponent);
  }
  // TODO: log.

}
