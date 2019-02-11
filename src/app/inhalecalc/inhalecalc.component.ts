import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

import { ToxRatio } from '../toxicology/tox-ratio';

import { SdCalcRowComponent } from '../sd-calc-row/sd-calc-row.component';
import { SdCalculationLogComponent } from '../sd-calculation-log/sd-calculation-log.component';
import { SdSelectComponent } from '../sd-select/sd-select.component';

import { Dimension, ScalarAndDimension, isCalculateError } from '../shared/dimension';
import { Term, Equation, EquationPrinter, Variable } from '../shared/equation';

import { Field } from '../shared/field';
import { Form } from '../shared/form';

import { printNum } from '../shared/number-util';

import { CONCEN_RATIOS_INHALATION, INTAKE_RATIOS_INHALATION, WEIGHT_RATIOS, DOSE_RATIOS_INHALATION, SATP_RATIO } from '../toxicology/UNIT_LISTS';

// Conversion form fields.

class ConcenVolVol extends Field {
  get label(): string { return 'Air concentration (v/v)'; }
  get unit(): ScalarAndDimension {
    return new ScalarAndDimension(this.units!.value.value, Dimension.initUnit());
  }
}

class MolarMass extends Field {
  get label(): string { return 'Molar mass'; }
  get unitName(): string { return 'g/mol'; }
  private readonly G_MOL = new ScalarAndDimension(1, Dimension.initMass().div(Dimension.initMolarMass()));
  get unit(): ScalarAndDimension { return this.G_MOL; }
}

class ConcenMassVol extends Field {
  get label(): string { return 'Air concentration (m/v)'; }
  private readonly VOLUME = Dimension.initLength().exp(3);
  private readonly MASS_VOLUME = Dimension.initMass().div(this.VOLUME);
  get unit(): ScalarAndDimension {
    return new ScalarAndDimension(this.units!.value.value, this.MASS_VOLUME);
  }
}

// Inhalation form fields.

class Concen extends Field {
  get label(): string { return 'Air concentration'; }
  private readonly VOLUME = Dimension.initLength().exp(3);
  private readonly MASS_VOLUME = Dimension.initMass().div(this.VOLUME);
  get unit(): ScalarAndDimension {
    return new ScalarAndDimension(this.units!.value.value, this.MASS_VOLUME);
  }
}

class Intake extends Field {
  get label(): string { return 'In­take'; }
  get unitName(): string { return 'm³/day'; }
  private readonly VOLUME = Dimension.initLength().exp(3);
  private readonly VOLUME_TIME = this.VOLUME.div(Dimension.initTime());
  get unit(): ScalarAndDimension {
    return new ScalarAndDimension(1, this.VOLUME_TIME);
  }
}

class Weight extends Field {
  get label(): string { return 'Body weight'; }
  get unit(): ScalarAndDimension {
    return new ScalarAndDimension(this.units!.value.value, Dimension.initMass());
  }
}

class Dose extends Field {
  get label(): string { return 'Dose'; }
  get unit(): ScalarAndDimension {
    return new ScalarAndDimension(this.units!.value.value, Dimension.initTime().recip());
  }
}

@Component({
  selector: 'app-inhalecalc',
  templateUrl: './inhalecalc.component.html',
  styleUrls: ['./inhalecalc.component.css'],
})
export class InhaleCalcComponent implements AfterViewInit {
  @ViewChild('calculationLog') calculationLog: SdCalculationLogComponent;

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

  conversionForm: Form = new Form(this.eqPrinter, [this.concenVolVol, this.molarMass, this.concenMassVol]);

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

  inhalationForm: Form = new Form(this.eqPrinter, [this.concen, this.intake, this.weight, this.dose]);

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

    this.variableMap.set(this.concenVolVol.var, this.concenVolVol.equationVarName);
    this.variableMap.set(this.molarMass.var, this.molarMass.equationVarName);
    this.variableMap.set(this.concenMassVol.var, this.concenMassVol.equationVarName);

    this.conversionForm.equationSnippet = this.concenMassVol.equationSnippet(this.eqPrinter);

    let inhalationEq = new Equation(Equation.div(Equation.mul(this.concen.var, this.intake.var), Equation.mul(this.weight.var, this.dose.var)), Equation.constantFromNumber(1));
    this.concen.term = (<Equation>inhalationEq.solve(this.concen.var)).RHS;
    this.intake.term = (<Equation>inhalationEq.solve(this.intake.var)).RHS;
    this.weight.term = (<Equation>inhalationEq.solve(this.weight.var)).RHS;
    this.dose.term = (<Equation>inhalationEq.solve(this.dose.var)).RHS;

    this.variableMap.set(this.concen.var, this.concen.equationVarName);
    this.variableMap.set(this.intake.var, this.intake.equationVarName);
    this.variableMap.set(this.weight.var, this.weight.equationVarName);
    this.variableMap.set(this.dose.var, this.dose.equationVarName);

    this.inhalationForm.equationSnippet = this.dose.equationSnippet(this.eqPrinter);
  }
}
