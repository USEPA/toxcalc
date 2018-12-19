import { Dimension, ScalarAndDimension, ScalarAndDimensionMutable, CalculateErrors, isCalculateError } from './dimension';
import { printNum } from './number-util';

// A tiny computer algebra system, supporting one equation with one unknown, on
// an equality relation. Create Variable objects to hold on to and build an
// expression out of them using the static constructors in Equation. (Hint: to
// avoid hitting implementation limits in the solver, try to use each Variable
// only once.) Call solved_eq = my_eq.solve(my_var) to return a new Equation in
// my_var = expr... form. If all your variables are set, solved_eq.RHS.getValue()
// should result in a concrete value.

enum TypeDiscriminator {
  Constant,
  Variable,
  Add,
  Multiply,
  Exponentiate,
  Logarithmize,
}

export interface Term {
  kind: TypeDiscriminator;

  contains(v: Variable): boolean;

  getValue(): ScalarAndDimension | CalculateErrors | null;
}

class Constant implements Term {
  kind = TypeDiscriminator.Constant;

  constructor(private readonly value: ScalarAndDimension) {}

  getValue(): ScalarAndDimension { return this.value; }

  contains(v: Variable): boolean { return false; }
}

export class Variable implements Term {
  kind = TypeDiscriminator.Variable;

  value: ScalarAndDimension | null = null;

  getValue(): ScalarAndDimension | null { return this.value }
  setValue(value: ScalarAndDimension | null): void { this.value = value; }

  contains(v: Variable): boolean { return this === v; }
}

interface CollectFilterFunc {
  (term: Term): boolean;
}

class Add implements Term {
  kind = TypeDiscriminator.Add;

  // All units in summands must be the same.
  constructor(readonly summands: Term[]) {}

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

  getValue(): ScalarAndDimension | CalculateErrors | null {
    if (this.summands.length == 0)
      return null;
    let result = this.summands[0].getValue();
    if (result == null || isCalculateError(result))
      return result;
    let mut_result = result.clone();
    for (let i = 1; i != this.summands.length; ++i) {
      let value = this.summands[i].getValue();
      if (value == null || isCalculateError(value))
        return value;
      let error = mut_result.addEq(value);
      if (error)
        return error;
    }
    return mut_result;
  }
}

class Multiply implements Term {
  kind = TypeDiscriminator.Multiply;

  constructor(readonly multipliers: Term[]) {}

  contains(v: Variable): boolean {
    return this.multipliers.some(function(t: Term) { return t.contains(v); });
  }

  collect(filter: CollectFilterFunc): {'collected': Term[], 'anticollected': Term[]} {
    let collected: Term[] = [];
    let anticollected: Term[] = [];
    for (let i = 0; i != this.multipliers.length; ++i) {
      if (filter(this.multipliers[i])) {
        collected.push(this.multipliers[i]);
      } else {
        anticollected.push(this.multipliers[i]);
      }
    }
    return {'collected': collected, 'anticollected': anticollected};
  }

  getValue(): ScalarAndDimension | CalculateErrors | null {
    if (this.multipliers.length == 0)
      return null;
    let result = this.multipliers[0].getValue();
    if (result == null || isCalculateError(result))
      return result;
    let mut_result = result.clone();
    for (let i = 1; i != this.multipliers.length; ++i) {
      let value = this.multipliers[i].getValue();
      if (value == null || isCalculateError(value))
        return value;
      mut_result.mulEq(value);
    }
    return mut_result;
  }
}

class Exponentiate implements Term {
  kind = TypeDiscriminator.Exponentiate;

  constructor(private base: Term, private exponent: Term) {}

  getBase(): Term { return this.base; }
  getExponent(): Term { return this.exponent; }

  contains(v: Variable): boolean {
    return this.base.contains(v) || this.exponent.contains(v);
  }

  getValue(): ScalarAndDimension | CalculateErrors | null {
    let base = this.base.getValue();
    if (base == null || isCalculateError(base))
      return base;
    let exponent = this.exponent.getValue();
    if (exponent == null || isCalculateError(exponent))
      return exponent;
    let mut_base = base.clone();
    let error = mut_base.expEq(exponent);
    if (error)
      return error;
    return mut_base;
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

  getValue(): ScalarAndDimension | null {
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

type SolveErrors = 'overdefined' | 'underdefined' | 'too complex';
function isSolveError(x: ScalarAndDimension | Term | null | SolveErrors): x is SolveErrors {
  return x == 'overdefined' || x == 'underdefined' || x == 'too complex';
}

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

  static constant(sau: ScalarAndDimension) { return new Constant(sau); }

  static constantFromNumberDimension(n: number, d: Dimension | null) {
    return Equation.constant(new ScalarAndDimension(n, d));
  }

  static constantFromNumber(n: number) {
    return Equation.constantFromNumberDimension(n, null);
  }

  static add(...terms: Term[]): Term { return Equation.addFromArray(terms); }

  static addFromArray(terms: Term[]): Term {
    // Expand any add's terms to our terms.
    let newTerms: Term[] = [];
    for (let i = 0; i != terms.length; ++i) {
      if (terms[i].kind == TypeDiscriminator.Add) {
        newTerms = newTerms.concat((<Add>terms[i]).summands);
      } else {
        newTerms.push(terms[i]);
      }
    }
    terms = newTerms;

    // Collapse multiple constants into one.
    let constants: ScalarAndDimensionMutable | null = null;
    newTerms = [];
    for (let i = 0; i != terms.length; ++i) {
      if (terms[i].kind == TypeDiscriminator.Constant) {
        let term: Constant = <Constant>terms[i];
        if (constants == null)
          constants = term.getValue().clone();
        else if (constants.d == term.getValue().d)
          constants.addEq(term.getValue());
        else
          // In the case the units don't match, defer error until getValue().
          newTerms.push(terms[i]);
      } else {
        newTerms.push(terms[i]);
      }
    }
    terms = newTerms;
    if (constants && terms.length == 0)
      return Equation.constant(constants);
    if (constants && constants.n != 0)
      terms.push(Equation.constant(constants));

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
        newTerms = newTerms.concat((<Multiply>terms[i]).multipliers);
      } else {
        newTerms.push(terms[i]);
      }
    }
    terms = newTerms;

    // Collapse multiple constants into one.
    let constants: ScalarAndDimensionMutable | null = null;
    newTerms = [];
    for (let i = 0; i != terms.length; ++i) {
      if (terms[i].kind == TypeDiscriminator.Constant) {
        let term: Constant = <Constant>terms[i];
        if (constants == null)
          constants = term.getValue().clone();
        else
          constants.mulEq(term.getValue());
      } else {
        newTerms.push(terms[i]);
      }
    }
    terms = newTerms;

    // TODO: handle constant zero. It may have units which must be preserved.
    if (constants) {
      if (constants.n == 1 && constants.d.unit()) {
        if (terms.length == 0)
          return Equation.constant(constants);
      } else {
        terms.push(Equation.constant(constants));
      }
    }

    // TODO: got the same term twice or more? Convert to an exponentiation.

    // Turn a^x * a^y into a^(x+y).
    // Collect the terms with common exponent bases.
    let common_exp_bases = new Map<Term /* exp's base */, Array<number> /* index into terms */>();
    for (let i = 0; i != terms.length; ++i) {
      let term = terms[i];
      if (terms[i].kind == TypeDiscriminator.Exponentiate) {
        term = (<Exponentiate>term).getBase();
      }
      if (!common_exp_bases.has(term)) {
        common_exp_bases.set(term, [i]);
      } else {
        common_exp_bases.get(term)!.push(i);
      }
    }
    // Calculate the replacement terms into newTerms.
    newTerms = [];
    common_exp_bases.forEach(function(value: Array<number>, key: Term): void {
      if (value.length > 1) {
        if (key.kind == TypeDiscriminator.Exponentiate) {
          key = (<Exponentiate>key).getBase();
        }
        newTerms.push(Equation.exp(key, Equation.addFromArray(value.map(
          i => terms[i].kind == TypeDiscriminator.Exponentiate ? (<Exponentiate>terms[i]).getExponent() : Equation.constantFromNumber(1)
        ))));
      }
    });
    // Remove now-dead terms. Produce a sorted list of indices so that we remove
    // back to front, so as to not disrupt the later indices.
    let deadIndices: Array<number> = [];
    common_exp_bases.forEach(function(value: Array<number>, key: Term): void {
      if (value.length > 1) {
        deadIndices.push.apply(deadIndices, value);
      }
    });
    deadIndices.sort().reverse();
    for (let i = 0; i != deadIndices.length; ++i) {
      terms.splice(deadIndices[i], 1);
    }
    terms.push.apply(terms, newTerms);

    if (terms.length == 1)
      return terms[0];
    return new Multiply(terms);
  }

  static div(dividend: Term, divisor: Term): Term {
    return Equation.mul(dividend,
                        Equation.exp(divisor, Equation.constantFromNumber(-1)));
  }

  static exp(base: Term, exponent: Term): Term {
    // If both terms are constant, return a constant.
    if (base.kind == TypeDiscriminator.Constant &&
        exponent.kind == TypeDiscriminator.Constant) {
      let base_c = <Constant>base;
      let exponent_c = <Constant>exponent;
      let result = base_c.getValue().clone();
      let error = result.expEq(exponent_c.getValue());
      if (!error)
        return Equation.constant(result);
    }

    if (exponent.kind == TypeDiscriminator.Constant) {
      let exponent_c = <Constant>exponent;
      // If the exponent is one, return the base.
      if (exponent_c.getValue().n == 1)
        return base;
      // If the exponent is zero, return one.
      if (exponent_c.getValue().n == 0)
        return Equation.constantFromNumber(1);
    }

    // If base is an exponentiation, combine our exponents.
    if (base.kind == TypeDiscriminator.Exponentiate) {
      let base_exp = <Exponentiate>base;
      return Equation.exp(base_exp.getBase(), Equation.mul(base_exp.getExponent(), exponent));
    }

    // If base is a multiplication, distribute across its elements instead.
    if (base.kind == TypeDiscriminator.Multiply) {
      let base_mul = <Multiply>base;
      return Equation.mulFromArray(base_mul.multipliers.map(x => Equation.exp(x, exponent)));
    }

    return new Exponentiate(base, exponent);
  }
  // TODO: log.

}

export class EquationPrinter {
  protected precedence: number = 0;

  // Emit parentheses when moving to a region of lower precedence.
  // Example 1: add[a, mul[b, c], d]/ Precedence starts at zero, then we visit
  // the Add and it goes up to 10. Emit a, emit the multiply which pushes the
  // precedence up to 20. Exiting the multiply, it calls leaveGroup(10) which
  // restores the precedence back to 10, and finally Add emits d
  // producing 'a + b * c + d'.
  // Example 2: mul[add[a, b], add[c, d]]. Precedence starts at zero, enters the
  // mul and goes to 20. Then it goes to emit its first member, the add enters
  // precedence 10 which is less than 20 so enterGroup returns [20, '('], the
  // first value being the remembered precedence to pop back to, the second
  // value being the grouping character. After emitting a and b, we reach
  // leaveGroup(20) and it restores the precedence to 20 and also detects that
  // this an increase in the precedence, so we must be closing a group and
  // returns ')'. We emit '(a + b) * (c + d)'.
  enterGroup(new_precedence: number): [number, string] {
    let old_precedence = this.precedence;
    this.precedence = new_precedence;
    return [old_precedence, new_precedence > old_precedence ? '' : '\\left('];
  }
  leaveGroup(new_precedence: number): string {
    let old_precedence = this.precedence;
    this.precedence = new_precedence;
    return new_precedence < old_precedence ? '' : '\\right)';
  }

  constructor(readonly variables: Map<Variable, string>) {}

  print(lhs: Term, rhs: Term): string {
    return this.dispatch(lhs) + ' = ' + this.dispatch(rhs);
  }

  visitVariable(v: Variable): string {
    let s = <string>this.variables.get(v);
    if (!s) return '';
    return `\\text{${s}}`;
  }

  visitConstant(c: Constant): string {
    return printNum(c.getValue().n);
  }

  visitAdd(a: Add): string {
    // TODO: convert a + -1 * b into a - b. See the code in multiply.
    let p = this.enterGroup(10);
    return p[1] + a.summands.map(x => this.dispatch(x)).filter(x => x != '').join(' + ') + this.leaveGroup(p[0]);
  }

  visitMultiply(m: Multiply): string {
    let p = this.enterGroup(20);
    let result = p[1];
    // Emit A ÷ B instead of A × B^-1. Collect all b^e where e is a negative
    // constant and emit those second, with division signs, and with a
    // sign-flipped exponent. Everything else gets emitted in the first pass.
    let denominator = m.collect(function(t: Term) {
      return t.kind == TypeDiscriminator.Exponentiate &&
             (<Exponentiate>t).getExponent().kind == TypeDiscriminator.Constant &&
             (<Constant>(<Exponentiate>t).getExponent()).getValue().n < 0; });
    let numerator_str;
    if (denominator['anticollected'].length == 0) {
      // Used when the whole multiply is emitted in the second pass. We get
      // "1 ÷ A ÷ B".
      numerator_str = '1';
    } else {
      // Print -A × B instead of A × -1 × B unless the -1 has a dimension.
      let index = denominator['anticollected'].findIndex(function(t: Term): boolean {
        return t.kind == TypeDiscriminator.Constant &&
               (<Constant>t).getValue().n == -1 &&
               (<Constant>t).getValue().d.unit();
      });
      if (index != -1 && denominator['anticollected'].length > 1) {
        denominator['anticollected'].splice(index, 1);
        numerator_str = '-';
      } else {
        numerator_str = '';
      }
      numerator_str += denominator['anticollected'].map(x => this.dispatch(x)).filter(x => x != '').join(' \\times ');
    }
    if (denominator['collected'].length != 0) {
      result += '\\frac{' + numerator_str + '}{' + denominator['collected'].map(x => Equation.exp(x, Equation.constantFromNumber(-1))).map(x => this.dispatch(x)).filter(x => x != '').join(' \\times ') + '}';
    } else {
      result += numerator_str;
    }
    return result + this.leaveGroup(p[0]);
  }

  visitExponentiate(e: Exponentiate): string {
    // Print 1/x instead of x^-1.
    if (e.getExponent().kind == TypeDiscriminator.Constant &&
        (<Constant>e.getExponent()).getValue().n == -1) {
      let p = this.enterGroup(20);
      let result = p[1] + '\\frac{1}{';
      result += this.dispatch(e.getBase());
      return result + '}' + this.leaveGroup(p[0]);
    }

    let p_enter = this.enterGroup(30);
    let base_str = this.dispatch(e.getBase());
    let p_close = this.leaveGroup(p_enter[0]);

    // Because we enter a new superscript region for every exponent, we never
    // need parentheses to disambiguate order of operation.
    let savePrecedence = this.precedence;
    this.precedence = 0;
    let exp_str = this.dispatch(e.getExponent());
    this.precedence = savePrecedence;

    if (base_str == '' || exp_str == '')
      return '';
    return `${p_enter[1]}${base_str}${p_close}^{${exp_str}}`;
  }

  visitLogarithmize(l: Logarithmize): string {
    // TODO
    return '';
  }

  dispatch(t: Term): string {
    switch (t.kind) {
      case TypeDiscriminator.Constant:
        return this.visitConstant(<Constant>t);
        break;
      case TypeDiscriminator.Variable:
        return this.visitVariable(<Variable>t);
        break;
      case TypeDiscriminator.Add:
        return this.visitAdd(<Add>t);
        break;
      case TypeDiscriminator.Multiply:
        return this.visitMultiply(<Multiply>t);
        break;
      case TypeDiscriminator.Exponentiate:
        return this.visitExponentiate(<Exponentiate>t);
        break;
      case TypeDiscriminator.Logarithmize:
        return this.visitLogarithmize(<Logarithmize>t);
        break;
    }
  }
}
