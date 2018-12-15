import { Component, ElementRef, ViewChild } from '@angular/core';

import { ToxRatio } from '../toxicology/tox-ratio';

import { SdCalcRowComponent } from '../sd-calc-row/sd-calc-row.component';
import { SdSelectComponent } from '../sd-select/sd-select.component';

import { SdMathJaxDirective } from '../sd-math-jax.directive';

import { Dimension, ScalarAndDimension, isCalculateError } from '../shared/dimension';
import { Term, Equation, EquationPrinter, Variable } from '../shared/equation';

import { printNum } from '../shared/number-util';

import { CONCEN_RATIOS_INHALATION, INTAKE_RATIOS_INHALATION, WEIGHT_RATIOS, DOSE_RATIOS_INHALATION, SATP_RATIO } from '../toxicology/UNIT_LISTS';

@Component({
  selector: 'app-inhalation-form',
  templateUrl: './inhalation-form.component.html',
  styleUrls: ['./inhalation-form.component.css'],
})
export class InhalationFormComponent {
  @ViewChild('concenVolVol') concenVolVol: ElementRef<HTMLInputElement>
  @ViewChild('concenUnitsVolVol') concenUnitsVolVol: SdSelectComponent;
  @ViewChild('concenVolVolRow') concenVolVolRow: SdCalcRowComponent;
  @ViewChild('concenMassVol') concenMassVol: ElementRef<HTMLInputElement>
  @ViewChild('concenUnitsMassVol') concenUnitsMassVol: SdSelectComponent;
  @ViewChild('concenMassVolRow') concenMassVolRow: SdCalcRowComponent;
  @ViewChild('molarMass') molarMass: ElementRef<HTMLInputElement>
  @ViewChild('molarMassRow') molarMassRow: SdCalcRowComponent;

  @ViewChild('concen') concen: ElementRef<HTMLInputElement>
  @ViewChild('concenUnits') concenUnits: SdSelectComponent;
  @ViewChild('concenRow') concenRow: SdCalcRowComponent;
  @ViewChild('intake') intake: ElementRef<HTMLInputElement>
  @ViewChild('intakeRow') intakeRow: SdCalcRowComponent;
  @ViewChild('weight') weight: ElementRef<HTMLInputElement>
  @ViewChild('weightUnits') weightUnits: SdSelectComponent;
  @ViewChild('weightRow') weightRow: SdCalcRowComponent;
  @ViewChild('dose') dose: ElementRef<HTMLInputElement>
  @ViewChild('doseUnits') doseUnits: SdSelectComponent;
  @ViewChild('doseRow') doseRow: SdCalcRowComponent;

  readonly concenUnitsVolVolOptions: ToxRatio[] = [
    {units: 'ppm (v/v)', value: 1},
    {units: 'ppb (v/v)', value: 0.001},
    {units: '% (v/v)', value: 10000}
  ];

  readonly concenUnitsMassVolOptions: ToxRatio[] = [
    {units: 'mg/m³', value: 1},
    {units: '\u03BCg/m³', value: 0.001},
    {units: 'mg/L', value: 1000},
    {units: '\u03BCg/L', value: 1}
  ];

  concenUnitsOptions = CONCEN_RATIOS_INHALATION;
  weightUnitsOptions = WEIGHT_RATIOS;
  doseUnitsOptions = DOSE_RATIOS_INHALATION;

  concenVolVolVar: Variable = new Variable;
  molarMassVar: Variable = new Variable;
  concenMassVolVar: Variable = new Variable;
  concenVar: Variable = new Variable;
  intakeVar: Variable = new Variable;
  weightVar: Variable = new Variable;
  doseVar: Variable = new Variable;

  concenVolVolTerm: Term;
  molarMassTerm: Term;
  concenMassVolTerm: Term;
  concenTerm: Term;
  intakeTerm: Term;
  weightTerm: Term;
  doseTerm: Term;

  conversionInternalError: string;
  inhalationInternalError: string;

  variableMap: Map<Variable, string> = new Map();
  eqPrinter: EquationPrinter = new EquationPrinter(this.variableMap);
  conversionEquationSnippet: string;
  inhalationEquationSnippet: string;

  getConcenVolVolUnit(): ScalarAndDimension {
    return new ScalarAndDimension(this.concenUnitsVolVol.value.value, Dimension.initUnit());
  }

  readonly G_MOL = new ScalarAndDimension(1, Dimension.initMass().div(Dimension.initMolarMass()));
  getMolarMassUnit(): ScalarAndDimension {
    return this.G_MOL;
  }

  getConcenMassVolUnit(): ScalarAndDimension {
    const VOLUME = Dimension.initLength().exp(3);
    const MASS_VOLUME = Dimension.initMass().div(VOLUME);
    return new ScalarAndDimension(this.concenUnitsMassVol.value.value, MASS_VOLUME);
  }

  getConcenUnit(): ScalarAndDimension {
    const VOLUME = Dimension.initLength().exp(3);
    const MASS_VOLUME = Dimension.initMass().div(VOLUME);
    return new ScalarAndDimension(this.concenUnits.value.value, MASS_VOLUME);
  }

  getIntakeUnit(): ScalarAndDimension {
    const VOLUME = Dimension.initLength().exp(3);
    const VOLUME_TIME = VOLUME.div(Dimension.initTime());
    return new ScalarAndDimension(1, VOLUME_TIME);
  }

  getWeightUnit(): ScalarAndDimension {
    return new ScalarAndDimension(this.weightUnits.value.value, Dimension.initMass());
  }

  getDoseUnit(): ScalarAndDimension {
    return new ScalarAndDimension(this.doseUnits.value.value, Dimension.initTime().recip());
  }

  constructor() {
    let conversionEq = new Equation(Equation.div(Equation.mul(this.concenVolVolVar, this.molarMassVar), Equation.mul(Equation.constantFromNumberDimension(SATP_RATIO, Dimension.initLength().exp(3).div(Dimension.initMolarMass())), this.concenMassVolVar)), Equation.constantFromNumber(1));
    this.concenVolVolTerm = (<Equation>conversionEq.solve(this.concenVolVolVar)).RHS;
    this.molarMassTerm = (<Equation>conversionEq.solve(this.molarMassVar)).RHS;
    this.concenMassVolTerm = (<Equation>conversionEq.solve(this.concenMassVolVar)).RHS;

    this.variableMap.set(this.concenVolVolVar, 'Air concentration (v/v)');
    this.variableMap.set(this.molarMassVar, 'Molar mass');
    this.variableMap.set(this.concenMassVolVar, 'Air concentration (m/v)');

    this.conversionEquationSnippet = this.eqPrinter.print(this.concenMassVolVar, this.concenMassVolTerm);

    let inhalationEq = new Equation(Equation.div(Equation.mul(this.concenVar, this.intakeVar), Equation.mul(this.weightVar, this.doseVar)), Equation.constantFromNumber(1));
    this.concenTerm = (<Equation>inhalationEq.solve(this.concenVar)).RHS;
    this.intakeTerm = (<Equation>inhalationEq.solve(this.intakeVar)).RHS;
    this.weightTerm = (<Equation>inhalationEq.solve(this.weightVar)).RHS;
    this.doseTerm = (<Equation>inhalationEq.solve(this.doseVar)).RHS;

    this.variableMap.set(this.concenVar, 'Concentration');
    this.variableMap.set(this.intakeVar, 'Intake');
    this.variableMap.set(this.weightVar, 'Body weight');
    this.variableMap.set(this.doseVar, 'Dose');

    this.inhalationEquationSnippet = this.eqPrinter.print(this.doseVar, this.doseTerm);
  }

  inhalationCalculate(): void {
    this.inhalationUpdateErrors(false);

    let inout_controls: HTMLInputElement[] = [
      this.concen.nativeElement,
      this.intake.nativeElement,
      this.weight.nativeElement,
      this.dose.nativeElement
    ];

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
      // We might be here if there were multiple possible outputs found.
      // Wipe values and readonly state for all of them.
      for (let i = 0; i != inout_controls.length; ++i) {
        if (inout_controls[i].readOnly) {
          inout_controls[i].readOnly = false;
          inout_controls[i].value = '';
        }
      }
      this.inhalationEquationSnippet = this.eqPrinter.print(this.doseVar, this.doseTerm);
      return;
    }

    out_control.readOnly = true;
    out_control.value = '';

    if (this.inhalationHasErrors())
      return;

    // Load text in the form into the equation variables.
    function setValue(v: Variable, i: ElementRef<HTMLInputElement>, sad: ScalarAndDimension): void {
      if (i.nativeElement.value == '') {
        v.setValue(null);
        return;
      }
      v.setValue(new ScalarAndDimension(parseFloat(i.nativeElement.value) * sad.n, sad.d));
    }

    setValue(this.concenVar, this.concen, this.getConcenUnit());
    setValue(this.intakeVar, this.intake, this.getIntakeUnit());
    setValue(this.weightVar, this.weight, this.getWeightUnit());
    setValue(this.doseVar, this.dose, this.getDoseUnit());

    let solution: Term;
    let solutionUnit: ScalarAndDimension;
    if (out_control == this.concen.nativeElement) {
      solution = this.concenTerm;
      solutionUnit = this.getConcenUnit();
      this.inhalationEquationSnippet = this.eqPrinter.print(this.concenVar, solution);
    } else if (out_control == this.intake.nativeElement) {
      solution = this.intakeTerm;
      solutionUnit = this.getIntakeUnit();
      this.inhalationEquationSnippet = this.eqPrinter.print(this.intakeVar, solution);
    } else if (out_control == this.weight.nativeElement) {
      solution = this.weightTerm;
      solutionUnit = this.getWeightUnit();
      this.inhalationEquationSnippet = this.eqPrinter.print(this.weightVar, solution);
    } else if (out_control == this.dose.nativeElement) {
      solution = this.doseTerm;
      solutionUnit = this.getDoseUnit();
      this.inhalationEquationSnippet = this.eqPrinter.print(this.doseVar, solution);
    } else {
      this.inhalationInternalError = 'calculator has no output box';
      return;
    }

    let result = solution.getValue();
    if (result == null) {
      this.inhalationInternalError = 'calculation returned null';
      return;
    }
    if (isCalculateError(result)) {
      this.inhalationInternalError = result;
      return;
    }

    if (!result.d.equal(solutionUnit.d)) {
      this.inhalationInternalError = 'dimension mismatch';
      return;
    }

    out_control.value = printNum(result.n / solutionUnit.n);
  }

  conversionCalculate() {
    this.conversionUpdateErrors(false);

    let inout_controls: HTMLInputElement[] = [
      this.concenVolVol.nativeElement,
      this.molarMass.nativeElement,
      this.concenMassVol.nativeElement
    ];

    let out_control: HTMLInputElement | null = null;
    for (let i = 0; i != inout_controls.length; ++i) {
      if (inout_controls[i].readOnly || inout_controls[i].value == ''){
        if (out_control == null) {
          out_control = inout_controls[i];
        } else {
          out_control = null;
          break;
        }
      }
    }

    if (!out_control) {
      // We might be here if there were multiple possible outputs found.
      // Wipe values and readonly state for all of them.
      for (let i = 0; i != inout_controls.length; ++i) {
        if (inout_controls[i].readOnly) {
          inout_controls[i].readOnly = false;
          inout_controls[i].value = '';
        }
      }
      this.conversionEquationSnippet = this.eqPrinter.print(this.concenMassVolVar, this.concenMassVolTerm);
      return;
    }

    out_control.readOnly = true;
    out_control.value = '';

    if (this.conversionHasErrors())
      return;

    // Load text in the form into the equation variables.
    function setValue(v: Variable, i: ElementRef<HTMLInputElement>, sad: ScalarAndDimension): void {
      if (i.nativeElement.value == '') {
        v.setValue(null);
        return;
      }
      v.setValue(new ScalarAndDimension(parseFloat(i.nativeElement.value) * sad.n, sad.d));
    }

    setValue(this.concenVolVolVar, this.concenVolVol, this.getConcenVolVolUnit());
    setValue(this.molarMassVar, this.molarMass, this.getMolarMassUnit());
    setValue(this.concenMassVolVar, this.concenMassVol, this.getConcenMassVolUnit());

    let solution: Term;
    let solutionUnit: ScalarAndDimension;
    if (out_control == this.concenVolVol.nativeElement) {
      solution = this.concenVolVolTerm;
      solutionUnit = this.getConcenVolVolUnit();
      this.conversionEquationSnippet = this.eqPrinter.print(this.concenVolVolVar, solution);
    } else if (out_control == this.molarMass.nativeElement) {
      solution = this.molarMassTerm;
      solutionUnit = this.getMolarMassUnit();
      this.conversionEquationSnippet = this.eqPrinter.print(this.molarMassVar, solution);
    } else if (out_control == this.concenMassVol.nativeElement) {
      solution = this.concenMassVolTerm;
      solutionUnit = this.getConcenMassVolUnit();
      this.conversionEquationSnippet = this.eqPrinter.print(this.concenMassVolVar, solution);
    } else {
      this.conversionInternalError = 'calculator has no output box';
      return;
    }

    let result = solution.getValue();
    if (result == null) {
      this.conversionInternalError = 'calculation returned null';
      return;
    }
    if (isCalculateError(result)) {
      this.conversionInternalError = result;
      return;
    }

    if (!result.d.equal(solutionUnit.d)) {
      this.conversionInternalError = 'dimension mismatch';
      return;
    }

    out_control.value = printNum(result.n / solutionUnit.n);
  }

  conversion_suppress_change: boolean = false;
  conversionFormChange(): void {
    if (this.conversion_suppress_change)
      return;

    this.conversionCalculate();
  }

  inhalation_suppress_change: boolean = false;
  inhalationFormChange(): void {
    if (this.inhalation_suppress_change)
      return;

    this.inhalationCalculate();
  }

  requiredAndValidNumber(e: HTMLInputElement): string {
    if (e.readOnly) return '';
    if (e.value == '')
      return 'Please fill in a number.';
    if (e.value.match(/.*\..*\..*/))
      return 'One decimal point maximum.';
    if (isNaN(parseFloat(e.value)))
      return 'Must be a number.';
    return '';
  }
  validNumber(e: HTMLInputElement): string {
    if (e.readOnly || e.value == '')
      return '';
    if (e.value.match(/.*\..*\..*/))
      return 'One decimal point maximum.';
    if (isNaN(parseFloat(e.value)))
      return 'Must be a number.';
    return '';
  }

  conversionUpdateErrors(required: boolean): void {
    let checkFn = required ? this.requiredAndValidNumber : this.validNumber;
    this.concenVolVolRow.errorText = checkFn(this.concenVolVol.nativeElement);
    this.concenMassVolRow.errorText = checkFn(this.concenMassVol.nativeElement);
    this.molarMassRow.errorText = checkFn(this.molarMass.nativeElement);
  }

  inhalationUpdateErrors(required: boolean): void {
    let checkFn = required ? this.requiredAndValidNumber : this.validNumber;
    this.concenRow.errorText = checkFn(this.concen.nativeElement);
    this.intakeRow.errorText = checkFn(this.intake.nativeElement);
    this.weightRow.errorText = checkFn(this.weight.nativeElement);
    this.doseRow.errorText = checkFn(this.dose.nativeElement);
  }

  conversionHasErrors(): boolean {
    return this.concenVolVolRow.errorText != '' ||
           this.concenMassVolRow.errorText != '' ||
           this.molarMassRow.errorText != '';
  }

  inhalationHasErrors(): boolean {
    return this.concenRow.errorText != '' ||
           this.intakeRow.errorText != '' ||
           this.weightRow.errorText != '' ||
           this.doseRow.errorText != '';
  }

  conversionInputBlur(): void {
    this.conversion_suppress_change = false;
    this.conversionCalculate();
  }

  inhalationInputBlur(): void {
    this.inhalation_suppress_change = false;
    this.inhalationCalculate()
  }

  conversionInputFocus(self: HTMLInputElement): void {
    this.conversion_suppress_change = true;

    if (this.concenVolVol.nativeElement.readOnly &&
        this.concenVolVol.nativeElement != self) {
      this.concenVolVol.nativeElement.value = '';
    } else if (this.concenMassVol.nativeElement.readOnly &&
               this.concenMassVol.nativeElement != self) {
      this.concenMassVol.nativeElement.value = '';
    } else if (this.molarMass.nativeElement.readOnly &&
               this.molarMass.nativeElement != self) {
      this.molarMass.nativeElement.value = '';
    }
  }

  inhalationInputFocus(self: HTMLInputElement): void {
    this.inhalation_suppress_change = true;

    if (this.concen.nativeElement.readOnly) {
      if (this.concen.nativeElement != self)
        this.concen.nativeElement.value = '';
      return;
    }
    if (this.intake.nativeElement.readOnly) {
      if (this.intake.nativeElement != self)
        this.intake.nativeElement.value = '';
      return;
    }
    if (this.weight.nativeElement.readOnly) {
      if (this.weight.nativeElement != self)
        this.weight.nativeElement.value = '';
      return;
    }
    if (this.dose.nativeElement.readOnly) {
      if (this.dose.nativeElement != self)
        this.dose.nativeElement.value = '';
      return;
    }
  }

  clearConversion(): void {
    this.concenVolVolRow.errorText = '';
    this.concenVolVol.nativeElement.readOnly = false;
    this.concenVolVol.nativeElement.value = '';
    this.concenMassVolRow.errorText = '';
    this.concenMassVol.nativeElement.readOnly = false;
    this.concenMassVol.nativeElement.value = '';
    this.molarMassRow.errorText = '';
    this.molarMass.nativeElement.readOnly = false;
    this.molarMass.nativeElement.value = '';
    this.conversionEquationSnippet = this.eqPrinter.print(this.concenMassVolVar, this.concenMassVolTerm);
  }

  clearInhalation(): void {
    this.inhalationInternalError = '';
    this.concenRow.errorText = '';
    this.concen.nativeElement.readOnly = false;
    this.concen.nativeElement.value = '';
    this.intakeRow.errorText = '';
    this.intake.nativeElement.readOnly = false;
    this.intake.nativeElement.value = '';
    this.weightRow.errorText = '';
    this.weight.nativeElement.readOnly = false;
    this.weight.nativeElement.value = '';
    this.doseRow.errorText = '';
    this.dose.nativeElement.readOnly = false;
    this.dose.nativeElement.value = '';

    this.inhalationEquationSnippet = this.eqPrinter.print(this.doseVar, this.doseTerm);
  }

}
