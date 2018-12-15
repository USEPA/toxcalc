import { Component, ElementRef, ViewChild } from '@angular/core';

import { ToxRatio } from '../toxicology/tox-ratio';

import { SdCalcRowComponent } from '../sd-calc-row/sd-calc-row.component';
import { SdSelectComponent } from '../sd-select/sd-select.component';

import { SdMathJaxDirective } from '../sd-math-jax.directive';

import { Dimension, ScalarAndDimension, isCalculateError } from '../shared/dimension';
import { Term, Equation, EquationToMathJax, Variable } from '../shared/equation';

import { printNum } from '../shared/number-util';

import { CONCEN_RATIOS_INHALATION, INTAKE_RATIOS_INHALATION, WEIGHT_RATIOS, DOSE_RATIOS_INHALATION, SATP_RATIO } from '../toxicology/UNIT_LISTS';

class EquationPrinter extends EquationToMathJax {
  constructor(readonly variables: Map<Variable, string>) { super(); }

  visitVariable(v: Variable): string {
    let s = <string>this.variables.get(v);
    if (!s) return '';
    return `\\text{${s}}`;
  }

  print(lhs: Term, rhs: Term): string {
    return this.dispatch(lhs) + ' = ' + this.dispatch(rhs);
  }
}

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

  concenVar: Variable = new Variable;
  intakeVar: Variable = new Variable;
  weightVar: Variable = new Variable;
  doseVar: Variable = new Variable;

  concenTerm: Term;
  intakeTerm: Term;
  weightTerm: Term;
  doseTerm: Term;

  inhalationInternalError: string;

  inhalationVariableMap: Map<Variable, string> = new Map();
  inhalationEqPrinter: EquationPrinter = new EquationPrinter(this.inhalationVariableMap);
  inhalationEquationSnippet: string;

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
    let inhalationEq = new Equation(Equation.div(Equation.mul(this.concenVar, this.intakeVar), Equation.mul(this.weightVar, this.doseVar)), Equation.constantFromNumber(1));
    this.concenTerm = (<Equation>inhalationEq.solve(this.concenVar)).RHS;
    this.intakeTerm = (<Equation>inhalationEq.solve(this.intakeVar)).RHS;
    this.weightTerm = (<Equation>inhalationEq.solve(this.weightVar)).RHS;
    this.doseTerm = (<Equation>inhalationEq.solve(this.doseVar)).RHS;

    this.inhalationVariableMap.set(this.concenVar, 'Concentration');
    this.inhalationVariableMap.set(this.intakeVar, 'Intake');
    this.inhalationVariableMap.set(this.weightVar, 'Body weight');
    this.inhalationVariableMap.set(this.doseVar, 'Dose');

    this.inhalationEquationSnippet = this.inhalationEqPrinter.print(this.doseVar, this.doseTerm);
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
      this.inhalationEquationSnippet = this.inhalationEqPrinter.print(this.doseVar, this.doseTerm);
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
      this.inhalationEquationSnippet = this.inhalationEqPrinter.print(this.concenVar, solution);
    } else if (out_control == this.intake.nativeElement) {
      solution = this.intakeTerm;
      solutionUnit = this.getIntakeUnit();
      this.inhalationEquationSnippet = this.inhalationEqPrinter.print(this.intakeVar, solution);
    } else if (out_control == this.weight.nativeElement) {
      solution = this.weightTerm;
      solutionUnit = this.getWeightUnit();
      this.inhalationEquationSnippet = this.inhalationEqPrinter.print(this.weightVar, solution);
    } else if (out_control == this.dose.nativeElement) {
      solution = this.doseTerm;
      solutionUnit = this.getDoseUnit();
      this.inhalationEquationSnippet = this.inhalationEqPrinter.print(this.doseVar, solution);
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

    let ratio1 = this.concenUnitsVolVol.value.value;
    let ratio2 = this.concenUnitsMassVol.value.value;
    let val1 = this.concenVolVol.nativeElement.value ? parseFloat(this.concenVolVol.nativeElement.value) : null;
    let val2 = this.concenMassVol.nativeElement.value ? parseFloat(this.concenMassVol.nativeElement.value) : null;
    let molMass = this.molarMass.nativeElement.value ? parseFloat(this.molarMass.nativeElement.value) : null;
    if ((!val1 && val2 && molMass) ||
        (val1 && val2 && molMass && this.concenVolVol.nativeElement.readOnly)) {
      this.concenVolVol.nativeElement.readOnly = true;
      if (this.conversionHasErrors()) {
        this.concenVolVol.nativeElement.value = '';
        return;
      }
      val1 = val2 * ratio2 * SATP_RATIO / (molMass * ratio1);
      this.concenVolVol.nativeElement.value = printNum(val1);
    } else if ((val1 && !val2 && molMass) ||
               (val1 && val2 && molMass && this.concenMassVol.nativeElement.readOnly)) {
      this.concenMassVol.nativeElement.readOnly = true;
      if (this.conversionHasErrors()) {
        this.concenMassVol.nativeElement.value = '';
        return;
      }
      val2 = val1 * ratio1 * molMass / (SATP_RATIO * ratio2);
      this.concenMassVol.nativeElement.value = printNum(val2);
    } else if ((val1 && val2 && !molMass) ||
               (val1 && val2 && molMass && this.molarMass.nativeElement.readOnly)) {
      this.molarMass.nativeElement.readOnly = true;
      if (this.conversionHasErrors()) {
        this.molarMass.nativeElement.value = '';
        return;
      }
      molMass = val2 * ratio2 * SATP_RATIO / (val1 * ratio1);
      this.molarMass.nativeElement.value = printNum(molMass);
    } else if (this.conversionHasErrors()) {
      // Do nothing.
    } else if (val1 && val2 && molMass) {
      // Do nothing. Occurs when the user focuses and blurs on the
      // result <input>.
    } else {
      // No single output was found. (Two or three blank inputs.)
      this.concenVolVol.nativeElement.readOnly = false;
      this.concenMassVol.nativeElement.readOnly = false;
      this.molarMass.nativeElement.readOnly = false;
    }
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

    this.inhalationEquationSnippet = this.inhalationEqPrinter.print(this.doseVar, this.doseTerm);
  }

}
