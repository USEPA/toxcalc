import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

import { ToxRatio } from '../toxicology/tox-ratio';

import { SdCalcRowComponent } from '../sd-calc-row/sd-calc-row.component';
import { SdSelectComponent } from '../sd-select/sd-select.component';

import { SdMathJaxDirective } from '../sd-math-jax.directive';

import { Dimension, ScalarAndDimension, isCalculateError } from '../shared/dimension';
import { Term, Equation, EquationPrinter, Variable } from '../shared/equation';

import { printNum } from '../shared/number-util';

import { CONCEN_RATIOS_INHALATION, INTAKE_RATIOS_INHALATION, WEIGHT_RATIOS, DOSE_RATIOS_INHALATION, SATP_RATIO } from '../toxicology/UNIT_LISTS';

abstract class Field {
  input: ElementRef<HTMLInputElement>;
  units?: SdSelectComponent;
  row: SdCalcRowComponent;
  var: Variable = new Variable;
  term: Term;
  readonly unit: ScalarAndDimension;
  readOnly: boolean = false;
  value: string = '';

  // Update our 'var' from the text in 'value'.
  updateVar(): void {
    if (this.value == '') {
      this.var.setValue(null);
      return;
    }
    this.var.setValue(new ScalarAndDimension(parseFloat(this.value) * this.unit.n, this.unit.d));
  }

  equationSnippet(eqPrinter: EquationPrinter) {
    return eqPrinter.print(this.var, this.term);
  }
}

// Conversion form fields.

class ConcenVolVol extends Field {
  get unit(): ScalarAndDimension {
    return new ScalarAndDimension(this.units!.value.value, Dimension.initUnit());
  }
}

class MolarMass extends Field {
  private readonly G_MOL = new ScalarAndDimension(1, Dimension.initMass().div(Dimension.initMolarMass()));
  get unit(): ScalarAndDimension { return this.G_MOL; }
}

class ConcenMassVol extends Field {
  private readonly VOLUME = Dimension.initLength().exp(3);
  private readonly MASS_VOLUME = Dimension.initMass().div(this.VOLUME);
  get unit(): ScalarAndDimension {
    return new ScalarAndDimension(this.units!.value.value, this.MASS_VOLUME);
  }
}

// Inhalation form fields.

class Concen extends Field {
  private readonly VOLUME = Dimension.initLength().exp(3);
  private readonly MASS_VOLUME = Dimension.initMass().div(this.VOLUME);
  get unit(): ScalarAndDimension {
    return new ScalarAndDimension(this.units!.value.value, this.MASS_VOLUME);
  }
}

class Intake extends Field {
  private readonly VOLUME = Dimension.initLength().exp(3);
  private readonly VOLUME_TIME = this.VOLUME.div(Dimension.initTime());
  get unit(): ScalarAndDimension {
    return new ScalarAndDimension(1, this.VOLUME_TIME);
  }
}

class Weight extends Field {
  get unit(): ScalarAndDimension {
    return new ScalarAndDimension(this.units!.value.value, Dimension.initMass());
  }
}

class Dose extends Field {
  get unit(): ScalarAndDimension {
    return new ScalarAndDimension(this.units!.value.value, Dimension.initTime().recip());
  }
}


@Component({
  selector: 'app-inhalation-form',
  templateUrl: './inhalation-form.component.html',
  styleUrls: ['./inhalation-form.component.css'],
})
export class InhalationFormComponent implements AfterViewInit {
  concenVolVol: ConcenVolVol = new ConcenVolVol;
  @ViewChild('concenVolVolInput') concenVolVolInput: ElementRef<HTMLInputElement>
  @ViewChild('concenVolVolUnits') concenVolVolUnits: SdSelectComponent;
  @ViewChild('concenVolVolRow') concenVolVolRow: SdCalcRowComponent;

  molarMass: MolarMass = new MolarMass;
  @ViewChild('molarMassInput') molarMassInput: ElementRef<HTMLInputElement>
  @ViewChild('molarMassRow') molarMassRow: SdCalcRowComponent;

  concenMassVol: ConcenMassVol = new ConcenMassVol;
  @ViewChild('concenMassVolInput') concenMassVolInput: ElementRef<HTMLInputElement>
  @ViewChild('concenMassVolUnits') concenMassVolUnits: SdSelectComponent;
  @ViewChild('concenMassVolRow') concenMassVolRow: SdCalcRowComponent;

  concen: Concen = new Concen;
  @ViewChild('concenInput') concenInput: ElementRef<HTMLInputElement>
  @ViewChild('concenUnits') concenUnits: SdSelectComponent;
  @ViewChild('concenRow') concenRow: SdCalcRowComponent;

  intake: Intake = new Intake;
  @ViewChild('intakeInput') intakeInput: ElementRef<HTMLInputElement>
  @ViewChild('intakeRow') intakeRow: SdCalcRowComponent;

  weight: Weight = new Weight;
  @ViewChild('weightInput') weightInput: ElementRef<HTMLInputElement>
  @ViewChild('weightUnits') weightUnits: SdSelectComponent;
  @ViewChild('weightRow') weightRow: SdCalcRowComponent;

  dose: Dose = new Dose;
  @ViewChild('doseInput') doseInput: ElementRef<HTMLInputElement>
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

  conversionInternalError: string;
  inhalationInternalError: string;

  variableMap: Map<Variable, string> = new Map();
  eqPrinter: EquationPrinter = new EquationPrinter(this.variableMap);
  conversionEquationSnippet: string;
  inhalationEquationSnippet: string;

  ngAfterViewInit() {
    // Conversion form.
    this.concenVolVol.input = this.concenVolVolInput;
    this.concenVolVol.units = this.concenVolVolUnits;
    this.concenVolVol.row = this.concenVolVolRow;

    this.molarMass.input = this.molarMassInput;
    this.molarMass.row = this.molarMassRow;

    this.concenMassVol.input = this.concenMassVolInput;
    this.concenMassVol.units = this.concenMassVolUnits;
    this.concenMassVol.row = this.concenMassVolRow;

    // Inhalation form.
    this.concen.input = this.concenInput;
    this.concen.units = this.concenUnits;
    this.concen.row = this.concenRow;

    this.intake.input = this.intakeInput;
    this.intake.row = this.intakeRow;

    this.weight.input = this.weightInput;
    this.weight.units = this.weightUnits;
    this.weight.row = this.weightRow;

    this.dose.input = this.doseInput;
    this.dose.units = this.doseUnits;
    this.dose.row = this.doseRow;
  }

  constructor() {
    let conversionEq = new Equation(Equation.div(Equation.mul(this.concenVolVol.var, this.molarMass.var), Equation.mul(Equation.constantFromNumberDimension(SATP_RATIO, Dimension.initLength().exp(3).div(Dimension.initMolarMass())), this.concenMassVol.var)), Equation.constantFromNumber(1));
    this.concenVolVol.term = (<Equation>conversionEq.solve(this.concenVolVol.var)).RHS;
    this.molarMass.term = (<Equation>conversionEq.solve(this.molarMass.var)).RHS;
    this.concenMassVol.term = (<Equation>conversionEq.solve(this.concenMassVol.var)).RHS;

    this.variableMap.set(this.concenVolVol.var, 'Air concentration (v/v)');
    this.variableMap.set(this.molarMass.var, 'Molar mass');
    this.variableMap.set(this.concenMassVol.var, 'Air concentration (m/v)');

    this.conversionEquationSnippet = this.concenMassVol.equationSnippet(this.eqPrinter);

    let inhalationEq = new Equation(Equation.div(Equation.mul(this.concen.var, this.intake.var), Equation.mul(this.weight.var, this.dose.var)), Equation.constantFromNumber(1));
    this.concen.term = (<Equation>inhalationEq.solve(this.concen.var)).RHS;
    this.intake.term = (<Equation>inhalationEq.solve(this.intake.var)).RHS;
    this.weight.term = (<Equation>inhalationEq.solve(this.weight.var)).RHS;
    this.dose.term = (<Equation>inhalationEq.solve(this.dose.var)).RHS;

    this.variableMap.set(this.concen.var, 'Concentration');
    this.variableMap.set(this.intake.var, 'Intake');
    this.variableMap.set(this.weight.var, 'Body weight');
    this.variableMap.set(this.dose.var, 'Dose');

    this.inhalationEquationSnippet = this.dose.equationSnippet(this.eqPrinter);
  }

  inhalationCalculate(): void {
    this.inhalationUpdateErrors(false);

    let inout_controls: Field[] = [
      this.concen,
      this.intake,
      this.weight,
      this.dose,
    ];

    let out_control: Field | null = null;
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
      this.inhalationEquationSnippet = this.dose.equationSnippet(this.eqPrinter);
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

    this.concen.updateVar();
    this.intake.updateVar();
    this.weight.updateVar();
    this.dose.updateVar();
    this.inhalationEquationSnippet = out_control.equationSnippet(this.eqPrinter);

    let result = out_control.term.getValue();
    if (result == null) {
      this.inhalationInternalError = 'calculation returned null';
      return;
    }
    if (isCalculateError(result)) {
      this.inhalationInternalError = result;
      return;
    }

    if (!result.d.equal(out_control.unit.d)) {
      this.inhalationInternalError = 'dimension mismatch';
      return;
    }

    out_control.value = printNum(result.n / out_control.unit.n);
  }

  conversionCalculate() {
    this.conversionUpdateErrors(false);

    let inout_controls: Field[] = [
      this.concenVolVol,
      this.molarMass,
      this.concenMassVol
    ];

    let out_control: Field | null = null;
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
      this.conversionEquationSnippet = this.concenMassVol.equationSnippet(this.eqPrinter);
      return;
    }

    out_control.readOnly = true;
    out_control.value = '';

    if (this.conversionHasErrors())
      return;

    this.concenVolVol.updateVar();
    this.molarMass.updateVar();
    this.concenMassVol.updateVar();
    this.conversionEquationSnippet = out_control.equationSnippet(this.eqPrinter);

    let result = out_control.term.getValue();
    if (result == null) {
      this.conversionInternalError = 'calculation returned null';
      return;
    }
    if (isCalculateError(result)) {
      this.conversionInternalError = result;
      return;
    }

    if (!result.d.equal(out_control.unit.d)) {
      this.conversionInternalError = 'dimension mismatch';
      return;
    }

    out_control.value = printNum(result.n / out_control.unit.n);
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

  requiredAndValidNumber(e: Field): string {
    if (e.readOnly) return '';
    if (e.value == '')
      return 'Please fill in a number.';
    if (e.value.match(/.*\..*\..*/))
      return 'One decimal point maximum.';
    if (isNaN(parseFloat(e.value)))
      return 'Must be a number.';
    return '';
  }
  validNumber(e: Field): string {
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
    this.concenVolVol.row.errorText = checkFn(this.concenVolVol);
    this.molarMass.row.errorText = checkFn(this.molarMass);
    this.concenMassVol.row.errorText = checkFn(this.concenMassVol);
  }

  inhalationUpdateErrors(required: boolean): void {
    let checkFn = required ? this.requiredAndValidNumber : this.validNumber;
    this.concen.row.errorText = checkFn(this.concen);
    this.intake.row.errorText = checkFn(this.intake);
    this.weight.row.errorText = checkFn(this.weight);
    this.dose.row.errorText = checkFn(this.dose);
  }

  conversionHasErrors(): boolean {
    return this.concenVolVol.row.errorText != '' ||
           this.molarMass.row.errorText != '' ||
           this.concenMassVol.row.errorText != '';
  }

  inhalationHasErrors(): boolean {
    return this.concen.row.errorText != '' ||
           this.intake.row.errorText != '' ||
           this.weight.row.errorText != '' ||
           this.dose.row.errorText != '';
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

    if (this.concenVolVol.readOnly &&
        this.concenVolVol.input.nativeElement != self) {
      this.concenVolVol.value = '';
    } else if (this.molarMass.readOnly &&
               this.molarMass.input.nativeElement != self) {
      this.molarMass.value = '';
    } else if (this.concenMassVol.readOnly &&
               this.concenMassVol.input.nativeElement != self) {
      this.concenMassVol.value = '';
    }
  }

  inhalationInputFocus(self: HTMLInputElement): void {
    this.inhalation_suppress_change = true;

    if (this.concen.readOnly) {
      if (this.concen.input.nativeElement != self)
        this.concen.value = '';
      return;
    }
    if (this.intake.readOnly) {
      if (this.intake.input.nativeElement != self)
        this.intake.value = '';
      return;
    }
    if (this.weight.readOnly) {
      if (this.weight.input.nativeElement != self)
        this.weight.value = '';
      return;
    }
    if (this.dose.readOnly) {
      if (this.dose.input.nativeElement != self)
        this.dose.value = '';
      return;
    }
  }

  clearConversion(): void {
    this.concenVolVol.row.errorText = '';
    this.concenVolVol.readOnly = false;
    this.concenVolVol.value = '';
    this.molarMass.row.errorText = '';
    this.molarMass.readOnly = false;
    this.molarMass.value = '';
    this.concenMassVol.row.errorText = '';
    this.concenMassVol.readOnly = false;
    this.concenMassVol.value = '';
    this.conversionEquationSnippet = this.concenMassVol.equationSnippet(this.eqPrinter);
  }

  clearInhalation(): void {
    this.inhalationInternalError = '';
    this.concen.row.errorText = '';
    this.concen.readOnly = false;
    this.concen.value = '';
    this.intake.row.errorText = '';
    this.intake.readOnly = false;
    this.intake.value = '';
    this.weight.row.errorText = '';
    this.weight.readOnly = false;
    this.weight.value = '';
    this.dose.row.errorText = '';
    this.dose.readOnly = false;
    this.dose.value = '';
    this.inhalationEquationSnippet = this.dose.equationSnippet(this.eqPrinter);
  }

}
