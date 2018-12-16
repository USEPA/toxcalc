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
  get hasError(): boolean {
    return this.row.errorText != '';
  }

  // Only look for errors that are certainly wrong given the state of this field,
  // ignoring the state of the of the rest of the form.
  updateErrorState(): void {
    if (this.readOnly || this.value == '') {
      this.row.errorText = '';
      return;
    }
    if (this.value.match(/.*\..*\..*/)) {
      this.row.errorText = 'One decimal point maximum.';
      return;
    }
    if (isNaN(parseFloat(this.value))) {
      this.row.errorText = 'Must be a number.';
      return;
    }
    this.row.errorText = '';
  }

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

class Form {
  constructor(eqPrinter: EquationPrinter, ...field: Field[]) {
    this.fields = field;
    this.eqPrinter = eqPrinter;
  }

  eqPrinter: EquationPrinter;

  fields: Field[];

  updateVars(): void {
    this.fields.forEach(function(f: Field) {
      f.updateVar();
    });
  }

  updateErrors(required: boolean): void {
    this.fields.forEach(function(f: Field) {
      f.updateErrorState();
      if (required && !f.hasError && f.value == '') {
        f.row.errorText = 'Please fill in a number.';
      }
    });
  }

  hasErrors(): boolean {
    return this.fields.some(function (f: Field) { return f.hasError; } );
  }

  internalError: string;

  equationSnippet: string;

  clear(): void {
    this.suppressChange = false;
    this.internalError = '';
    this.fields.forEach(function(f: Field) {
      f.row.errorText = '';
      f.readOnly = false;
      f.value = '';
    });
    this.equationSnippet = this.fields[this.fields.length - 1].equationSnippet(this.eqPrinter);
  }

  suppressChange: boolean = false;

  inputBlur(): void {
    this.suppressChange = false;
    this.calculate();
  }

  inputFocus(self: HTMLInputElement): void {
    this.suppressChange = true;
    for (let i = 0; i != this.fields.length; ++i) {
      if (this.fields[i].readOnly &&
          this.fields[i].input.nativeElement != self) {
        this.fields[i].value = '';
        return;
      }
    }
  }

  formChange(): void {
    if (!this.suppressChange)
      this.calculate();
  }

  calculate() {
    this.updateErrors(false);

    let out_control: Field | null = null;
    for (let i = 0; i != this.fields.length; ++i) {
      if (this.fields[i].readOnly ||
          this.fields[i].value == '') {
        if (out_control == null) {
          out_control = this.fields[i];
        } else {
          out_control = null;
          break;
        }
      }
    }

    if (!out_control) {
      // We might be here if there were multiple possible outputs found.
      // Wipe values and readonly state for all of them.
      for (let i = 0; i != this.fields.length; ++i) {
        if (this.fields[i].readOnly) {
          this.fields[i].readOnly = false;
          this.fields[i].value = '';
        }
      }
      this.equationSnippet = this.fields[this.fields.length - 1].equationSnippet(this.eqPrinter);
      return;
    }

    out_control.readOnly = true;
    out_control.value = '';

    if (this.hasErrors())
      return;

    this.updateVars();
    this.equationSnippet = out_control.equationSnippet(this.eqPrinter);

    let result = out_control.term.getValue();
    if (result == null) {
      this.internalError = 'calculation returned null';
      return;
    }
    if (isCalculateError(result)) {
      this.internalError = result;
      return;
    }
    if (!result.d.equal(out_control.unit.d)) {
      this.internalError = 'dimension mismatch';
      return;
    }

    out_control.value = printNum(result.n / out_control.unit.n);
  }
}

@Component({
  selector: 'app-inhalecalc',
  templateUrl: './inhalecalc.component.html',
  styleUrls: ['./inhalecalc.component.css'],
})
export class InhaleCalcComponent implements AfterViewInit {
  variableMap: Map<Variable, string> = new Map();
  eqPrinter: EquationPrinter = new EquationPrinter(this.variableMap);

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

  conversionForm: Form = new Form(this.eqPrinter, this.concenVolVol, this.molarMass, this.concenMassVol);

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

  inhalationForm: Form = new Form(this.eqPrinter, this.concen, this.intake, this.weight, this.dose);

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

    this.conversionForm.equationSnippet = this.concenMassVol.equationSnippet(this.eqPrinter);

    let inhalationEq = new Equation(Equation.div(Equation.mul(this.concen.var, this.intake.var), Equation.mul(this.weight.var, this.dose.var)), Equation.constantFromNumber(1));
    this.concen.term = (<Equation>inhalationEq.solve(this.concen.var)).RHS;
    this.intake.term = (<Equation>inhalationEq.solve(this.intake.var)).RHS;
    this.weight.term = (<Equation>inhalationEq.solve(this.weight.var)).RHS;
    this.dose.term = (<Equation>inhalationEq.solve(this.dose.var)).RHS;

    this.variableMap.set(this.concen.var, 'Concentration');
    this.variableMap.set(this.intake.var, 'Intake');
    this.variableMap.set(this.weight.var, 'Body weight');
    this.variableMap.set(this.dose.var, 'Dose');

    this.inhalationForm.equationSnippet = this.dose.equationSnippet(this.eqPrinter);
  }
}
