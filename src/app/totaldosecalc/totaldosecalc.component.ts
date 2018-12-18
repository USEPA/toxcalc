import { Component, ElementRef, ViewChild, isDevMode } from '@angular/core';

import { SdCalcRowComponent } from '../sd-calc-row/sd-calc-row.component';
import { SdSelectComponent } from '../sd-select/sd-select.component';

import { Dimension, ScalarAndDimension, isCalculateError } from '../shared/dimension';
import { Term, Equation, EquationPrinter, Variable } from '../shared/equation';
import { SdInputPositiveNumber, printNum } from '../shared/number-util';
import { SdMathJaxDirective } from '../sd-math-jax.directive';

@Component({
  selector: 'app-totaldosecalc',
  templateUrl: './totaldosecalc.component.html',
  styleUrls: ['./totaldosecalc.component.css']
})
export class TotaldosecalcComponent {
  // Controls for whether the optional rows are displayed.
  substanceDensityShow: boolean = false;
  molarMassShow: boolean = false;
  solutionDensityShow: boolean = false;
  underConstructionShow: boolean = false;

  // Should the calculation reciprocate its value and unit? Value is meaningless
  // when the matching Show variable is false.
  molarMassRecip: boolean = false;
  solutionDensityRecip: boolean = false;

  // Variables for equation calculation.
  concenVar: Variable = new Variable;
  intakeVar: Variable = new Variable;
  substanceDensityVar: Variable = new Variable;
  molarMassVar: Variable = new Variable;
  molarMassRecipVar: Variable = new Variable
  solutionDensityVar: Variable = new Variable;
  solutionDensityRecipVar: Variable = new Variable;
  bodyWeightVar: Variable = new Variable;
  doseVar: Variable = new Variable;

  // Each variable in terms of the other variables.
  concenTerm: Term;
  intakeTerm: Term;
  substanceDensityTerm: Term;
  molarMassTerm: Term;
  molarMassRecipTerm: Term;
  solutionDensityTerm: Term;
  solutionDensityRecipTerm: Term;
  bodyWeightTerm: Term;
  doseTerm: Term;

  // User-visible alert, disables calculate button. Should never happen on any
  // user input.
  internalError: string;

  @ViewChild('concen') concen: SdCalcRowComponent;
  @ViewChild('concenInput') concenInput: ElementRef<HTMLInputElement>;
  @ViewChild('concenUnits') concenUnits: SdSelectComponent;
  @ViewChild('intake') intake: SdCalcRowComponent;
  @ViewChild('intakeInput') intakeInput: ElementRef<HTMLInputElement>;
  @ViewChild('intakeUnits') intakeUnits: SdSelectComponent;
  @ViewChild('substanceDensity') substanceDensity: SdCalcRowComponent;
  @ViewChild('substanceDensityInput') substanceDensityInput: ElementRef<HTMLInputElement>;
  @ViewChild('molarMass') molarMass: SdCalcRowComponent;
  @ViewChild('molarMassInput') molarMassInput: ElementRef<HTMLInputElement>;
  @ViewChild('solutionDensity') solutionDensity: SdCalcRowComponent;
  @ViewChild('solutionDensityInput') solutionDensityInput: ElementRef<HTMLInputElement>;
  @ViewChild('solutionDensityUnits') solutionDensityUnits: SdSelectComponent;
  @ViewChild('bodyWeight') bodyWeight: SdCalcRowComponent;
  @ViewChild('bodyWeightInput') bodyWeightInput: ElementRef<HTMLInputElement>;
  @ViewChild('bodyWeightUnits') bodyWeightUnits: SdSelectComponent;
  @ViewChild('dose') dose: SdCalcRowComponent;
  @ViewChild('doseInput') doseInput: ElementRef<HTMLInputElement>;
  @ViewChild('doseUnits') doseUnits: SdSelectComponent;

  variableMap: Map<Variable, string> = new Map();
  eqPrinter: EquationPrinter = new EquationPrinter(this.variableMap);
  equationSnippet: string;

  constructor() {
    let calcEq = new Equation(Equation.div(Equation.mul(this.concenVar, this.intakeVar, this.substanceDensityVar, this.molarMassVar, this.solutionDensityVar), Equation.mul(this.molarMassRecipVar, this.solutionDensityRecipVar, this.bodyWeightVar, this.doseVar)), Equation.constantFromNumber(1));
    this.concenTerm = (<Equation>calcEq.solve(this.concenVar)).RHS;
    this.intakeTerm = (<Equation>calcEq.solve(this.intakeVar)).RHS;
    this.substanceDensityTerm = (<Equation>calcEq.solve(this.substanceDensityVar)).RHS;
    this.molarMassTerm = (<Equation>calcEq.solve(this.molarMassVar)).RHS;
    this.solutionDensityTerm = (<Equation>calcEq.solve(this.solutionDensityVar)).RHS;
    this.molarMassRecipTerm = (<Equation>calcEq.solve(this.molarMassRecipVar)).RHS;
    this.solutionDensityRecipTerm = (<Equation>calcEq.solve(this.solutionDensityRecipVar)).RHS;
    this.bodyWeightTerm = (<Equation>calcEq.solve(this.bodyWeightVar)).RHS;
    this.doseTerm = (<Equation>calcEq.solve(this.doseVar)).RHS;

    this.variableMap.set(this.concenVar, 'Concentration');
    this.variableMap.set(this.intakeVar, 'Intake');
    this.variableMap.set(this.bodyWeightVar, 'Body weight');
    this.variableMap.set(this.doseVar, 'Dose');
    this.updateEquation();
  }

  // Set to true between focus and blur to prevent formChange from updating the
  // result box. Normally formChange doesn't trigger when typing new numbers,
  // but you can trigger it through other actions.
  suppress_change: boolean = false;

  formChange(): void {
    if (this.suppress_change)
      return;

    this.calculate();
  }

  private calculate(): void {
    this.updateErrors(false);

    let inout_controls: HTMLInputElement[] = [
      this.concenInput.nativeElement,
      this.intakeInput.nativeElement,
      this.bodyWeightInput.nativeElement,
      this.doseInput.nativeElement
    ];
    if (this.substanceDensityShow)
      inout_controls.push(this.substanceDensityInput.nativeElement);
    if (this.molarMassShow)
      inout_controls.push(this.molarMassInput.nativeElement);
    if (this.solutionDensityShow)
      inout_controls.push(this.solutionDensityInput.nativeElement);

    let out_control: HTMLInputElement | null = null;
    for (let i = 0; i != inout_controls.length; ++i) {
      if (inout_controls[i].readOnly || inout_controls[i].value == '') {
        if (out_control == null) {
          out_control = inout_controls[i];
        } else {
          out_control = null;
          break;
        }
      }
    }

    if (!out_control) {
      // We might be here if there were multiple possible outputs found. Wipe
      // values and readonly state for all of them.
      for (let i = 0; i != inout_controls.length; ++i) {
        if (inout_controls[i].readOnly) {
          inout_controls[i].readOnly = false;
          inout_controls[i].value = '';
        }
      }
      this.updateEquation();
      return;
    }

    out_control.readOnly = true;
    out_control.value = '';

    if (this.hasErrors() || this.underConstructionShow || this.internalError)
      return;

    // Load text in the form into the equation variables.
    function setValue(v: Variable, i: ElementRef<HTMLInputElement>, sad: ScalarAndDimension): void {
      if (i.nativeElement.value == '') {
        v.setValue(null);
        return;
      }
      v.setValue(new ScalarAndDimension(parseFloat(i.nativeElement.value) * sad.n, sad.d));
    }

    // A unit-less 1. Use this value for variables on hidden rows.
    const ONE = new ScalarAndDimension(1, null);

    setValue(this.concenVar, this.concenInput, this.getConcenUnit());
    setValue(this.intakeVar, this.intakeInput, this.getIntakeUnit());
    setValue(this.bodyWeightVar, this.bodyWeightInput, this.getBodyWeightUnit());
    setValue(this.doseVar, this.doseInput, this.getDoseUnit());

    if (this.substanceDensityShow) {
      setValue(this.substanceDensityVar, this.substanceDensityInput, this.getSubstanceDensityUnit());
    } else {
      this.substanceDensityVar.setValue(ONE);
    }

    if (this.molarMassShow) {
      if (this.molarMassRecip) {
        this.molarMassVar.setValue(ONE);
        setValue(this.molarMassRecipVar, this.molarMassInput, this.getMolarMassUnit());
      } else {
        setValue(this.molarMassVar, this.molarMassInput, this.getMolarMassUnit());
        this.molarMassRecipVar.setValue(ONE);
      }
    } else {
      this.molarMassVar.setValue(ONE);
      this.molarMassRecipVar.setValue(ONE);
    }

    if (this.solutionDensityShow) {
      if (this.solutionDensityRecip) {
        this.solutionDensityVar.setValue(ONE);
        setValue(this.solutionDensityRecipVar, this.solutionDensityInput, this.getSolutionDensityUnit());
      } else {
        setValue(this.solutionDensityVar, this.solutionDensityInput, this.getSolutionDensityUnit());
        this.solutionDensityRecipVar.setValue(ONE);
      }
    } else {
      this.solutionDensityVar.setValue(ONE);
      this.solutionDensityRecipVar.setValue(ONE);
    }

    let solution: Term;
    let solutionUnit: ScalarAndDimension;
    if (out_control == this.concenInput.nativeElement) {
      solution = this.concenTerm;
      solutionUnit = this.getConcenUnit();
      this.equationSnippet = this.eqPrinter.print(this.concenVar, solution);
    } else if (out_control == this.intakeInput.nativeElement) {
      solution = this.intakeTerm;
      solutionUnit = this.getIntakeUnit();
      this.equationSnippet = this.eqPrinter.print(this.intakeVar, solution);
    } else if (out_control == this.substanceDensityInput.nativeElement) {
      solution = this.substanceDensityTerm;
      solutionUnit = this.getSubstanceDensityUnit();
      this.equationSnippet = this.eqPrinter.print(this.substanceDensityVar, solution);
    } else if (out_control == this.molarMassInput.nativeElement) {
      if (this.molarMassRecip) {
        solution = this.molarMassRecipTerm;
        solutionUnit = this.getMolarMassUnit();
        this.equationSnippet = this.eqPrinter.print(this.molarMassRecipVar, solution);
      } else {
        solution = this.molarMassTerm;
        solutionUnit = this.getMolarMassUnit();
        this.equationSnippet = this.eqPrinter.print(this.molarMassVar, solution);
      }
    } else if (out_control == this.solutionDensityInput.nativeElement) {
      if (this.solutionDensityRecip) {
        solution = this.solutionDensityRecipTerm;
        solutionUnit = this.getSolutionDensityUnit();
        this.equationSnippet = this.eqPrinter.print(this.solutionDensityRecipVar, solution);
      } else {
        solution = this.solutionDensityTerm;
        solutionUnit = this.getSolutionDensityUnit();
        this.equationSnippet = this.eqPrinter.print(this.solutionDensityVar, solution);
      }
    } else if (out_control == this.bodyWeightInput.nativeElement) {
      solution = this.bodyWeightTerm;
      solutionUnit = this.getBodyWeightUnit();
      this.equationSnippet = this.eqPrinter.print(this.bodyWeightVar, solution);
    } else if (out_control == this.doseInput.nativeElement) {
      solution = this.doseTerm;
      solutionUnit = this.getDoseUnit();
      this.equationSnippet = this.eqPrinter.print(this.doseVar, solution);
    } else {
      this.internalError = 'calculator has no output box';
      return;
    }

    let result = solution.getValue();
    if (result == null) {
      this.internalError = 'calculation returned null';
      return;
    }
    if (isCalculateError(result)) {
      this.internalError = result;
      return;
    }

    if (!result.d.equal(solutionUnit.d)) {
      this.internalError = 'dimension mismatch';
      if (isDevMode()) {
        console.log(result.n);
        console.log(result.d);
        console.log(solutionUnit.n);
        console.log(solutionUnit.d);
      }
      return;
    }

    out_control.value = printNum(result.n / solutionUnit.n);
  }

  // Allow the template to iterate over unit labels filtered by dimension.
  iterUnits(table: {[index: string]: ScalarAndDimension}, d: Dimension | null): string[] {
    let results: string[] = [];
    Object.keys(table).forEach(function(key) {
      if (d == null || table[key].d.equal(d))
        results.push(key);
    });
    return results;
  }

  readonly VOLUME = Dimension.initLength().exp(3);
  readonly MASS_VOLUME = Dimension.initMass().div(this.VOLUME);
  readonly MOL_VOLUME = Dimension.initMolarMass().div(this.VOLUME);
  readonly MOL_MASS = Dimension.initMolarMass().div(Dimension.initMass());
  readonly CONCEN_UNITS: {[index: string]: ScalarAndDimension} = {
    'mg/L': new ScalarAndDimension(0.001, this.MASS_VOLUME),
    'g/L': new ScalarAndDimension(1, this.MASS_VOLUME),
    'µg/L': new ScalarAndDimension(0.000001, this.MASS_VOLUME),
    'ppm (w/v)': new ScalarAndDimension(0.001, this.MASS_VOLUME),
    'ppb (w/v)': new ScalarAndDimension(0.000001, this.MASS_VOLUME),
    '% (w/v)': new ScalarAndDimension(10, this.MASS_VOLUME),
    'mL/L': new ScalarAndDimension(0.001, Dimension.initUnit()),
    'µL/L': new ScalarAndDimension(0.000001, Dimension.initUnit()),
    'µL/mL': new ScalarAndDimension(0.001, Dimension.initUnit()),
    'ppm (v/v)': new ScalarAndDimension(0.000001, Dimension.initUnit()),
    'ppb (v/v)': new ScalarAndDimension(0.000000001, Dimension.initUnit()),
    '% (v/v)': new ScalarAndDimension(0.01, Dimension.initUnit()),
    'mol/L': new ScalarAndDimension(1, this.MOL_VOLUME),
    'mmol/L': new ScalarAndDimension(0.001, this.MOL_VOLUME),
    'µmol/L': new ScalarAndDimension(0.000001, this.MOL_VOLUME),
    'mol/kg': new ScalarAndDimension(0.001, this.MOL_MASS),
    'mmol/kg': new ScalarAndDimension(0.000001, this.MOL_MASS),
    'µmol/kg': new ScalarAndDimension(0.000000001, this.MOL_MASS),
    'mg/kg': new ScalarAndDimension(0.000001, Dimension.initUnit()),
    'µg/kg': new ScalarAndDimension(0.000000001, Dimension.initUnit()),
  };
  getConcenUnit(): ScalarAndDimension {
    return this.CONCEN_UNITS[this.concenUnits.selectedName];
  }


  readonly VOLUME_TIME = this.VOLUME.div(Dimension.initTime());
  readonly MASS_TIME = Dimension.initMass().div(Dimension.initTime());
  readonly INTAKE_UNITS: {[index: string]: ScalarAndDimension} = {
    'L/day': new ScalarAndDimension(1, this.VOLUME_TIME),
    'mL/day': new ScalarAndDimension(0.001, this.VOLUME_TIME),
    'kg/day': new ScalarAndDimension(1000, this.MASS_TIME),
    'g/day': new ScalarAndDimension(1, this.MASS_TIME),
  }
  getIntakeUnit(): ScalarAndDimension {
    return this.INTAKE_UNITS[this.intakeUnits.selectedName];
  }

  readonly G_ML = new ScalarAndDimension(1000, Dimension.initMass().div(this.VOLUME));
  getSubstanceDensityUnit(): ScalarAndDimension {
    // g/mL
    return this.G_ML;
  }

  readonly G_MOL = new ScalarAndDimension(1, Dimension.initMass().div(Dimension.initMolarMass()));
  getMolarMassUnit(): ScalarAndDimension {
    // g/mol
    return this.G_MOL;
  }

  readonly ML_G = new ScalarAndDimension(0.001, this.VOLUME.div(Dimension.initMass()));
  readonly SOLUTION_DENSITY_UNITS: {[index: string]: ScalarAndDimension} = {
    'g/mL': this.G_ML,
    'g/L': new ScalarAndDimension(1, Dimension.initMass().div(this.VOLUME)),
    'kg/m³': new ScalarAndDimension(1, Dimension.initMass().div(this.VOLUME)),
    'g/cm³': new ScalarAndDimension(1000, Dimension.initMass().div(this.VOLUME)),
  };
  getSolutionDensityUnit(): ScalarAndDimension {
    return this.SOLUTION_DENSITY_UNITS[this.solutionDensityUnits.selectedName];
  }

  readonly KG_UNIT = new ScalarAndDimension(1000, Dimension.initMass());
  readonly G_UNIT = new ScalarAndDimension(1, Dimension.initMass());
  getBodyWeightUnit(): ScalarAndDimension {
    return this.bodyWeightUnits.selectedName == 'g' ? this.G_UNIT : this.KG_UNIT;
  }

  readonly DOSE_UNITS: {[index: string]: ScalarAndDimension} = {
    'mg/kg BW/day': new ScalarAndDimension(0.000001, Dimension.initTime().recip()),
    'µg/kg BW/day': new ScalarAndDimension(0.000000001, Dimension.initTime().recip()),
    'mol/kg BW/day': new ScalarAndDimension(0.001, Dimension.initMolarMass().div(Dimension.initMass()).div(Dimension.initTime())),
    'mmol/kg BW/day': new ScalarAndDimension(0.000001, Dimension.initMolarMass().div(Dimension.initMass()).div(Dimension.initTime())),
  }
  getDoseUnit(): ScalarAndDimension {
    return this.DOSE_UNITS[this.doseUnits.selectedName];
  }

  updateEquation(): void {
    this.variableMap.set(this.substanceDensityVar,
                         this.substanceDensityShow ? 'Substance density' : '');
    this.variableMap.set(this.molarMassVar,
                         this.molarMassShow && !this.molarMassRecip ? 'Molar mass' : '');
    this.variableMap.set(this.molarMassRecipVar,
                         this.molarMassShow && this.molarMassRecip ? 'Molar mass' : '');
    this.variableMap.set(this.solutionDensityVar,
                         this.solutionDensityShow && !this.solutionDensityRecip ? 'Solvent or media density' : '');
    this.variableMap.set(this.solutionDensityRecipVar,
                         this.solutionDensityShow && this.solutionDensityRecip ? 'Solvent or media density' : '');
    this.equationSnippet = this.eqPrinter.dispatch(this.doseVar) + ' = ' + this.eqPrinter.dispatch(this.doseTerm);
  }

  changeUnits(): void {
    // Concentration of volume/volume and intake of mass/time has units that
    // line up, but the calculation would not be correct without considering the
    // volume of solvent per mass.
    if (this.concenUnits.selectedGroupName == 'volume/volume' &&
        this.intakeUnits.selectedGroupName == 'mass/time') {
      this.substanceDensityShow = false;
      this.molarMassShow = false;
      this.solutionDensityShow = false;
      this.underConstructionShow = true;
      this.updateEquation();
      return;
    }

    // Substance density and reciprocal solution density are indistinguishable.
    // Handle the three cases of reciprocal solution density up front.
    if (this.concenUnits.selectedGroupName == 'mol/mass' &&
        this.intakeUnits.selectedGroupName == 'volume/time' &&
        (this.doseUnits.selectedName == 'mg/kg BW/day' ||
         this.doseUnits.selectedName == 'µg/kg BW/day')) {
      this.substanceDensityShow = false;
      this.molarMassShow = true;
      this.molarMassRecip = false;
      this.solutionDensityShow = true;
      this.solutionDensityRecip = false;
      this.underConstructionShow = false;
      this.updateEquation();
      return;
    }
    if (this.concenUnits.selectedGroupName == 'mol/mass' &&
        this.intakeUnits.selectedGroupName == 'volume/time' &&
        (this.doseUnits.selectedName == 'mol/kg BW/day' ||
         this.doseUnits.selectedName == 'mmol/kg BW/day')) {
      this.substanceDensityShow = false;
      this.molarMassShow = false;
      this.solutionDensityShow = true;
      this.solutionDensityRecip = false;
      this.underConstructionShow = false;
      this.updateEquation();
      return;
    }
    if (this.concenUnits.selectedGroupName == 'mass/mass' &&
        this.intakeUnits.selectedGroupName == 'volume/time') {
      this.substanceDensityShow = false;
      this.molarMassShow = false;
      this.solutionDensityShow = true;
      this.solutionDensityRecip = false;
      this.underConstructionShow = false;
      this.updateEquation();
      return;
    }

    // Use dimensional analysis to determine which rows to show.
    let residual =
        this.getConcenUnit().d
            .mul(this.getIntakeUnit().d)
            .div(this.getBodyWeightUnit().d)
            .div(this.getDoseUnit().d)
            .recip();

    if (residual.unit()) {
      this.substanceDensityShow = false;
      this.molarMassShow = false;
      this.solutionDensityShow = false;
      this.underConstructionShow = false;
      this.updateEquation();
      return;
    }

    if (residual.equal(this.getSubstanceDensityUnit().d)) {
      this.substanceDensityShow = true;
      this.molarMassShow = false;
      this.solutionDensityShow = false;
      this.underConstructionShow = false;
      this.updateEquation();
      return;
    }

    if (residual.equal(this.getMolarMassUnit().d)) {
      this.substanceDensityShow = false;
      this.molarMassShow = true;
      this.molarMassRecip = false;
      this.solutionDensityShow = false;
      this.underConstructionShow = false;
      this.updateEquation();
      return;
    }
    if (residual.equal(this.getMolarMassUnit().d.recip())) {
      this.substanceDensityShow = false;
      this.molarMassShow = true;
      this.molarMassRecip = true;
      this.solutionDensityShow = false;
      this.underConstructionShow = false;
      this.updateEquation();
      return;
    }

    if (residual.equal(this.getSolutionDensityUnit().d.recip())) {
      this.substanceDensityShow = false;
      this.molarMassShow = false;
      this.solutionDensityShow = true;
      this.solutionDensityRecip = true;
      this.underConstructionShow = false;
      this.updateEquation();
      return;
    }

    if (residual.equal(this.getSubstanceDensityUnit().d.mul(this.getMolarMassUnit().d))) {
      this.substanceDensityShow = true;
      this.molarMassShow = true;
      this.molarMassRecip = false;
      this.solutionDensityShow = false;
      this.underConstructionShow = false;
      this.updateEquation();
      return;
    }
    if (residual.equal(this.getSubstanceDensityUnit().d.div(this.getMolarMassUnit().d))) {
      this.substanceDensityShow = true;
      this.molarMassShow = true;
      this.molarMassRecip = true;
      this.solutionDensityShow = false;
      this.underConstructionShow = false;
      this.updateEquation();
      return;
    }

    if (residual.equal(this.getSolutionDensityUnit().d.recip().mul(this.getMolarMassUnit().d))) {
      this.substanceDensityShow = false
      this.molarMassShow = true;
      this.molarMassRecip = false;
      this.solutionDensityShow = true;
      this.solutionDensityRecip = true;
      this.underConstructionShow = false;
      this.updateEquation();
      return;
    }
    if (residual.equal(this.getSolutionDensityUnit().d.recip().mul(this.getMolarMassUnit().d.recip()))) {
      this.substanceDensityShow = false;
      this.molarMassShow = true;
      this.molarMassRecip = true;
      this.solutionDensityShow = true;
      this.solutionDensityRecip = true;
      this.underConstructionShow = false;
      this.updateEquation();
      return;
    }

    if (isDevMode())
      console.log(residual);

    this.updateEquation();
    this.underConstructionShow = true;
  }

  inputFocus(self: HTMLInputElement): void {
    this.suppress_change = true;

    // Clear the calculation result if there is one. It'll be the only
    // HTMLInputElement marked readOnly=true.
    let inout_controls: HTMLInputElement[] = [
      this.concenInput.nativeElement,
      this.intakeInput.nativeElement,
      this.bodyWeightInput.nativeElement,
      this.doseInput.nativeElement
    ];
    if (this.substanceDensityShow) { inout_controls.push(this.substanceDensityInput.nativeElement); }
    if (this.molarMassShow) { inout_controls.push(this.molarMassInput.nativeElement); }
    if (this.solutionDensityShow) { inout_controls.push(this.solutionDensityInput.nativeElement); }

    for (let i = 0; i != inout_controls.length; ++i) {
      if (inout_controls[i].readOnly) {
        if (inout_controls[i] != self)
          inout_controls[i].value = '';
        return;
      }
    }
  }

  inputBlur(): void {
    this.suppress_change = false;
    this.calculate();
  }

  private numBlankOrReadonlyFields(): number {
    function count(e: HTMLInputElement): number {
      if (e.value == '')
        return 1;
      if (e.readOnly)
        return 1;
      return 0;
    }
    let total: number = count(this.concenInput.nativeElement) +
                        count(this.intakeInput.nativeElement) +
                        count(this.bodyWeightInput.nativeElement) +
                        count(this.doseInput.nativeElement);
    if (this.substanceDensityShow)
      total += count(this.substanceDensityInput.nativeElement);
    if (this.molarMassShow)
      total += count(this.molarMassInput.nativeElement);
    if (this.solutionDensityShow)
      total += count(this.solutionDensityInput.nativeElement);
    return total;
  }

  updateErrors(required: boolean): void {
    function requiredAndValidNumber(e: HTMLInputElement): string {
      if (e.readOnly) return '';
      if (e.value == '')
        return 'Please fill in a number.';
      if (e.value.match(/.*\..*\..*/))
        return 'One decimal point maximum.';
      if (isNaN(parseFloat(e.value)))
        return 'Must be a number.';
      return '';
    }
    function validNumber(e: HTMLInputElement): string {
      if (e.readOnly || e.value == '')
        return '';
      if (e.value.match(/.*\..*\..*/))
        return 'One decimal point maximum.';
      if (isNaN(parseFloat(e.value)))
        return 'Must be a number.';
      return '';
    }
    function pleaseRemoveValue(e: HTMLInputElement): string {
      return 'Please remove a value.';
    }

    let checkFn;
    if (this.numBlankOrReadonlyFields() == 0) checkFn = pleaseRemoveValue;
    else if (required) checkFn = requiredAndValidNumber;
    else checkFn = validNumber;

    this.concen.errorText = checkFn(this.concenInput.nativeElement);
    this.intake.errorText = checkFn(this.intakeInput.nativeElement);
    if (this.substanceDensityShow)
      this.substanceDensity.errorText = checkFn(this.substanceDensityInput.nativeElement);
    if (this.molarMassShow)
      this.molarMass.errorText = checkFn(this.molarMassInput.nativeElement);
    if (this.solutionDensityShow)
      this.solutionDensity.errorText = checkFn(this.solutionDensityInput.nativeElement);
    this.bodyWeight.errorText = checkFn(this.bodyWeightInput.nativeElement);
    this.dose.errorText = checkFn(this.doseInput.nativeElement);
  }

  // Whether the user input has any errors. Internal error is separate.
  hasErrors(): boolean {
    return this.concen.errorText != '' ||
           this.intake.errorText != '' ||
           (this.substanceDensityShow && this.substanceDensity.errorText != '') ||
           (this.molarMassShow && this.molarMass.errorText != '') ||
           (this.solutionDensityShow && this.solutionDensity.errorText != '') ||
           this.bodyWeight.errorText != '' ||
           this.dose.errorText != '';
  }

  clear(): void {
    this.suppress_change = false;

    this.internalError = '';

    this.concen.errorText = '';
    this.intake.errorText = '';
    if (this.substanceDensityShow) this.substanceDensity.errorText = '';
    if (this.molarMassShow) this.molarMass.errorText = '';
    if (this.solutionDensityShow) this.solutionDensity.errorText = '';
    this.bodyWeight.errorText = '';
    this.dose.errorText = '';

    this.concenInput.nativeElement.readOnly = false;
    this.intakeInput.nativeElement.readOnly = false;
    this.substanceDensityInput.nativeElement.readOnly = false;
    this.molarMassInput.nativeElement.readOnly = false;
    this.solutionDensityInput.nativeElement.readOnly = false;
    this.bodyWeightInput.nativeElement.readOnly = false;
    this.doseInput.nativeElement.readOnly = false;

    this.updateEquation();
  }
}
