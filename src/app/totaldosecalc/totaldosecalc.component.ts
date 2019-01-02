import { Component, ElementRef, ViewChild, isDevMode } from '@angular/core';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons';

import { SdCalcRowComponent } from '../sd-calc-row/sd-calc-row.component';
import { SdCalculationLogComponent } from '../sd-calculation-log/sd-calculation-log.component';
import { SdSelectComponent } from '../sd-select/sd-select.component';

import { Dimension, ScalarAndDimension, isCalculateError } from '../shared/dimension';
import { Term, Equation, EquationPrinter, Variable } from '../shared/equation';
import { SdInputPositiveNumber, printNum } from '../shared/number-util';

import { Field } from '../shared/field';
import { Form } from '../shared/form';

class Concentration extends Field {
  get label(): string { return 'Concentration'; }
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
  get unit(): ScalarAndDimension {
    return this.CONCEN_UNITS[this.units!.selectedName];
  }
}

class Intake extends Field {
  get label(): string { return 'Intake'; }
  readonly VOLUME = Dimension.initLength().exp(3);
  readonly VOLUME_TIME = this.VOLUME.div(Dimension.initTime());
  readonly MASS_TIME = Dimension.initMass().div(Dimension.initTime());
  readonly INTAKE_UNITS: {[index: string]: ScalarAndDimension} = {
    'L/day': new ScalarAndDimension(1, this.VOLUME_TIME),
    'mL/day': new ScalarAndDimension(0.001, this.VOLUME_TIME),
    'kg/day': new ScalarAndDimension(1000, this.MASS_TIME),
    'g/day': new ScalarAndDimension(1, this.MASS_TIME),
  }
  get unit(): ScalarAndDimension {
    return this.INTAKE_UNITS[this.units!.selectedName];
  }
}

class SubstanceDensity extends Field {
  get label(): string { return 'Substance density'; }
  readonly VOLUME = Dimension.initLength().exp(3);
  readonly DENSITY_UNITS: {[index: string]: ScalarAndDimension} = {
    'g/mL': new ScalarAndDimension(1000, Dimension.initMass().div(this.VOLUME)),
    'g/L': new ScalarAndDimension(1, Dimension.initMass().div(this.VOLUME)),
    'kg/m³': new ScalarAndDimension(1, Dimension.initMass().div(this.VOLUME)),
    'g/cm³': new ScalarAndDimension(1000, Dimension.initMass().div(this.VOLUME)),
  };
  get unit(): ScalarAndDimension {
    return this.DENSITY_UNITS[this.units!.selectedName];
  }
}

class MolarMass extends Field {
  get label(): string { return 'Molar mass of substance'; }
  get logColumnName(): string { return 'Molar mass'; }
  get equationVarName(): string { return 'Molar mass'; }
  get unitName(): string { return 'g/mol'; }
  recip: boolean = false;
  recipVar: Variable = new Variable;
  recipTerm: Term;
  get var(): Variable { return this.recip ? this.recipVar : this.mVar; }
  get otherVar(): Variable { return this.recip ? this.mVar : this.recipVar; }
  get term(): Term { return this.recip ? this.recipTerm : this.mTerm; }
  set term(t: Term) { /* assert recip is false */ this.mTerm = t; }

  readonly ONE = new ScalarAndDimension(1, null);
  // Update our 'var' from the text in 'value'.
  updateVar(): void {
    this.otherVar.setValue(this.ONE);
    super.updateVar();
  }

  readonly G_MOL = new ScalarAndDimension(1, Dimension.initMass().div(Dimension.initMolarMass()));
  get unit(): ScalarAndDimension {
    // g/mol
    return this.G_MOL;
  }
}

class SolutionDensity extends Field {
  get label(): string { return 'Solvent or media density'; }
  recip: boolean = false;
  recipVar: Variable = new Variable;
  recipTerm: Term;
  get var() { return this.recip ? this.recipVar : this.mVar; }
  get otherVar() { return this.recip ? this.mVar : this.recipVar; }
  get term(): Term { return this.recip ? this.recipTerm : this.mTerm; }
  set term(t: Term) { /* assert recip is false */ this.mTerm = t; }

  readonly ONE = new ScalarAndDimension(1, null);
  // Update our 'var' from the text in 'value'.
  updateVar(): void {
    this.otherVar.setValue(this.ONE);
    super.updateVar();
  }

  readonly VOLUME = Dimension.initLength().exp(3);
  readonly DENSITY_UNITS: {[index: string]: ScalarAndDimension} = {
    'g/mL': new ScalarAndDimension(1000, Dimension.initMass().div(this.VOLUME)),
    'g/L': new ScalarAndDimension(1, Dimension.initMass().div(this.VOLUME)),
    'kg/m³': new ScalarAndDimension(1, Dimension.initMass().div(this.VOLUME)),
    'g/cm³': new ScalarAndDimension(1000, Dimension.initMass().div(this.VOLUME)),
  };
  get unit(): ScalarAndDimension {
    return this.DENSITY_UNITS[this.units!.selectedName];
  }
}

class BodyWeight extends Field {
  get label(): string { return 'Body weight'; }
  readonly KG_UNIT = new ScalarAndDimension(1000, Dimension.initMass());
  readonly G_UNIT = new ScalarAndDimension(1, Dimension.initMass());
  get unit(): ScalarAndDimension {
    return this.units!.selectedName == 'g' ? this.G_UNIT : this.KG_UNIT;
  }
}

class Dose extends Field {
  get label(): string { return 'Dose'; }
  readonly DOSE_UNITS: {[index: string]: ScalarAndDimension} = {
    'mg/kg BW/day': new ScalarAndDimension(0.000001, Dimension.initTime().recip()),
    'µg/kg BW/day': new ScalarAndDimension(0.000000001, Dimension.initTime().recip()),
    'mol/kg BW/day': new ScalarAndDimension(0.001, Dimension.initMolarMass().div(Dimension.initMass()).div(Dimension.initTime())),
    'mmol/kg BW/day': new ScalarAndDimension(0.000001, Dimension.initMolarMass().div(Dimension.initMass()).div(Dimension.initTime())),
  }
  get unit(): ScalarAndDimension {
    return this.DOSE_UNITS[this.units!.selectedName];
  }
}

class TotalDoseCalcForm extends Form {
  constructor(eqPrinter: EquationPrinter, fields: Field[]) {
    super(eqPrinter, fields);
    this.equationSnippet = '\\text{Dose} = \\frac{\\text{Concentration} \\times \\text{Intake}}{\\text{Body weight}}';
  }
  underConstructionShow: boolean = false;
  hasErrors(): boolean {
    return this.underConstructionShow || super.hasErrors();
  }
}

@Component({
  selector: 'app-totaldosecalc',
  templateUrl: './totaldosecalc.component.html',
  styleUrls: ['./totaldosecalc.component.css']
})
export class TotalDoseCalcComponent {
  @ViewChild('calculationLog') calculationLog: SdCalculationLogComponent;
  @ViewChild('concenRow') concenRow: SdCalcRowComponent;
  @ViewChild('concenInput') concenInput: ElementRef<HTMLInputElement>;
  @ViewChild('concenUnits') concenUnits: SdSelectComponent;
  @ViewChild('intakeRow') intakeRow: SdCalcRowComponent;
  @ViewChild('intakeInput') intakeInput: ElementRef<HTMLInputElement>;
  @ViewChild('intakeUnits') intakeUnits: SdSelectComponent;
  @ViewChild('substanceDensityRow') substanceDensityRow: SdCalcRowComponent;
  @ViewChild('substanceDensityInput') substanceDensityInput: ElementRef<HTMLInputElement>;
  @ViewChild('substanceDensityUnits') substanceDensityUnits: SdSelectComponent;
  @ViewChild('molarMassRow') molarMassRow: SdCalcRowComponent;
  @ViewChild('molarMassInput') molarMassInput: ElementRef<HTMLInputElement>;
  @ViewChild('solutionDensityRow') solutionDensityRow: SdCalcRowComponent;
  @ViewChild('solutionDensityInput') solutionDensityInput: ElementRef<HTMLInputElement>;
  @ViewChild('solutionDensityUnits') solutionDensityUnits: SdSelectComponent;
  @ViewChild('bodyWeightRow') bodyWeightRow: SdCalcRowComponent;
  @ViewChild('bodyWeightInput') bodyWeightInput: ElementRef<HTMLInputElement>;
  @ViewChild('bodyWeightUnits') bodyWeightUnits: SdSelectComponent;
  @ViewChild('doseRow') doseRow: SdCalcRowComponent;
  @ViewChild('doseInput') doseInput: ElementRef<HTMLInputElement>;
  @ViewChild('doseUnits') doseUnits: SdSelectComponent;

  variableMap: Map<Variable, string> = new Map();
  eqPrinter: EquationPrinter = new EquationPrinter(this.variableMap);
  equationSnippet: string = '\\text{Dose} = \\frac{\\text{Concentration} \\times \\text{Intake}}{\\text{Body weight}}';

  concen: Concentration = new Concentration;
  intake: Intake = new Intake;
  substanceDensity: SubstanceDensity = new SubstanceDensity;
  molarMass: MolarMass = new MolarMass;
  solutionDensity: SolutionDensity = new SolutionDensity;
  bodyWeight: BodyWeight = new BodyWeight;
  dose: Dose = new Dose;

  form: TotalDoseCalcForm = new TotalDoseCalcForm(this.eqPrinter, [this.concen, this.intake, this.substanceDensity, this.molarMass, this.solutionDensity, this.bodyWeight, this.dose]);

  constructor() {
    library.add(faFilePdf);

    let calcEq = new Equation(Equation.div(Equation.mul(this.concen.var, this.intake.var, this.substanceDensity.var, this.molarMass.var, this.solutionDensity.var), Equation.mul(this.molarMass.recipVar, this.solutionDensity.recipVar, this.bodyWeight.var, this.dose.var)), Equation.constantFromNumber(1));
    this.concen.term = (<Equation>calcEq.solve(this.concen.var)).RHS;
    this.intake.term = (<Equation>calcEq.solve(this.intake.var)).RHS;
    this.substanceDensity.term = (<Equation>calcEq.solve(this.substanceDensity.var)).RHS;
    this.molarMass.term = (<Equation>calcEq.solve(this.molarMass.var)).RHS;
    this.solutionDensity.term = (<Equation>calcEq.solve(this.solutionDensity.var)).RHS;
    this.molarMass.recipTerm = (<Equation>calcEq.solve(this.molarMass.recipVar)).RHS;
    this.solutionDensity.recipTerm = (<Equation>calcEq.solve(this.solutionDensity.recipVar)).RHS;
    this.bodyWeight.term = (<Equation>calcEq.solve(this.bodyWeight.var)).RHS;
    this.dose.term = (<Equation>calcEq.solve(this.dose.var)).RHS;

    this.variableMap.set(this.concen.var, this.concen.equationVarName);
    this.variableMap.set(this.intake.var, this.intake.equationVarName);
    this.variableMap.set(this.bodyWeight.var, this.bodyWeight.equationVarName);
    this.variableMap.set(this.dose.var, this.dose.equationVarName);
  }

  ngAfterViewInit() {
    this.concen.input = this.concenInput;
    this.concen.units = this.concenUnits;
    this.concen.row = this.concenRow;
    this.intake.input = this.intakeInput;
    this.intake.units = this.intakeUnits;
    this.intake.row = this.intakeRow;
    this.substanceDensity.input = this.substanceDensityInput;
    this.substanceDensity.units = this.substanceDensityUnits;
    this.substanceDensity.row = this.substanceDensityRow;
    this.molarMass.input = this.molarMassInput;
    this.molarMass.row = this.molarMassRow;
    this.solutionDensity.input = this.solutionDensityInput;
    this.solutionDensity.units = this.solutionDensityUnits;
    this.solutionDensity.row = this.solutionDensityRow;
    this.bodyWeight.input = this.bodyWeightInput;
    this.bodyWeight.units = this.bodyWeightUnits;
    this.bodyWeight.row = this.bodyWeightRow;
    this.dose.input = this.doseInput;
    this.dose.units = this.doseUnits;
    this.dose.row = this.doseRow;
    this.updateEquation();
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

  readonly VOLUME_TIME = this.VOLUME.div(Dimension.initTime());
  readonly MASS_TIME = Dimension.initMass().div(Dimension.initTime());
  readonly INTAKE_UNITS: {[index: string]: ScalarAndDimension} = {
    'L/day': new ScalarAndDimension(1, this.VOLUME_TIME),
    'mL/day': new ScalarAndDimension(0.001, this.VOLUME_TIME),
    'kg/day': new ScalarAndDimension(1000, this.MASS_TIME),
    'g/day': new ScalarAndDimension(1, this.MASS_TIME),
  }

  readonly DENSITY_UNITS: {[index: string]: ScalarAndDimension} = {
    'g/mL': new ScalarAndDimension(1000, Dimension.initMass().div(this.VOLUME)),
    'g/L': new ScalarAndDimension(1, Dimension.initMass().div(this.VOLUME)),
    'kg/m³': new ScalarAndDimension(1, Dimension.initMass().div(this.VOLUME)),
    'g/cm³': new ScalarAndDimension(1000, Dimension.initMass().div(this.VOLUME)),
  };

  readonly DOSE_UNITS: {[index: string]: ScalarAndDimension} = {
    'mg/kg BW/day': new ScalarAndDimension(0.000001, Dimension.initTime().recip()),
    'µg/kg BW/day': new ScalarAndDimension(0.000000001, Dimension.initTime().recip()),
    'mol/kg BW/day': new ScalarAndDimension(0.001, Dimension.initMolarMass().div(Dimension.initMass()).div(Dimension.initTime())),
    'mmol/kg BW/day': new ScalarAndDimension(0.000001, Dimension.initMolarMass().div(Dimension.initMass()).div(Dimension.initTime())),
  }

  updateEquation(): void {
    this.variableMap.set(this.substanceDensity.var,
                         this.substanceDensity.row.show ? this.substanceDensity.equationVarName : '');
    this.variableMap.set(this.molarMass.var,
                         this.molarMass.row.show ? this.molarMass.equationVarName : '');
    this.variableMap.set(this.molarMass.otherVar, '');
    this.variableMap.set(this.solutionDensity.var,
                         this.solutionDensity.row.show ? this.solutionDensity.equationVarName : '');
    this.variableMap.set(this.solutionDensity.otherVar, '');
    this.form.equationSnippet = this.dose.equationSnippet(this.eqPrinter);
  }

  changeUnits(): void {
    // Concentration of volume/volume and intake of mass/time has units that
    // line up, but the calculation would not be correct without considering the
    // volume of solvent per mass.
    if (this.concenUnits.selectedGroupName == 'volume/volume' &&
        this.intakeUnits.selectedGroupName == 'mass/time') {
      this.substanceDensity.row.show = false;
      this.molarMass.row.show = false;
      this.solutionDensity.row.show = false;
      this.form.underConstructionShow = true;
      this.updateEquation();
      this.form.formChange();
      return;
    }

    // Substance density and reciprocal solution density are indistinguishable.
    // Handle the three cases of reciprocal solution density up front.
    if (this.concenUnits.selectedGroupName == 'mol/mass' &&
        this.intakeUnits.selectedGroupName == 'volume/time' &&
        (this.doseUnits.selectedName == 'mg/kg BW/day' ||
         this.doseUnits.selectedName == 'µg/kg BW/day')) {
      this.substanceDensity.row.show = false;
      this.molarMass.row.show = true;
      this.molarMass.recip = false;
      this.solutionDensity.row.show = true;
      this.solutionDensity.recip = false;
      this.form.underConstructionShow = false;
      this.updateEquation();
      this.form.formChange();
      return;
    }
    if (this.concenUnits.selectedGroupName == 'mol/mass' &&
        this.intakeUnits.selectedGroupName == 'volume/time' &&
        (this.doseUnits.selectedName == 'mol/kg BW/day' ||
         this.doseUnits.selectedName == 'mmol/kg BW/day')) {
      this.substanceDensity.row.show = false;
      this.molarMass.row.show = false;
      this.solutionDensity.row.show = true;
      this.solutionDensity.recip = false;
      this.form.underConstructionShow = false;
      this.updateEquation();
      this.form.formChange();
      return;
    }
    if (this.concenUnits.selectedGroupName == 'mass/mass' &&
        this.intakeUnits.selectedGroupName == 'volume/time') {
      this.substanceDensity.row.show = false;
      this.molarMass.row.show =
          this.doseUnits.selectedName == 'mol/kg BW/day' ||
          this.doseUnits.selectedName == 'mmol/kg BW/day';
      this.molarMass.recip = true;
      this.solutionDensity.row.show = true;
      this.solutionDensity.recip = false;
      this.form.underConstructionShow = false;
      this.updateEquation();
      this.form.formChange();
      return;
    }

    // Use dimensional analysis to determine which rows to show.
    let residual =
        this.concen.unit.d
            .mul(this.intake.unit.d)
            .div(this.bodyWeight.unit.d)
            .div(this.dose.unit.d)
            .recip();

    if (residual.unit()) {
      this.substanceDensity.row.show = false;
      this.molarMass.row.show = false;
      this.solutionDensity.row.show = false;
      this.form.underConstructionShow = false;
      this.updateEquation();
      this.form.formChange();
      return;
    }

    if (residual.equal(this.substanceDensity.unit.d)) {
      this.substanceDensity.row.show = true;
      this.molarMass.row.show = false;
      this.solutionDensity.row.show = false;
      this.form.underConstructionShow = false;
      this.updateEquation();
      this.form.formChange();
      return;
    }

    if (residual.equal(this.molarMass.unit.d)) {
      this.substanceDensity.row.show = false;
      this.molarMass.row.show = true;
      this.molarMass.recip = false;
      this.solutionDensity.row.show = false;
      this.form.underConstructionShow = false;
      this.updateEquation();
      this.form.formChange();
      return;
    }
    if (residual.equal(this.molarMass.unit.d.recip())) {
      this.substanceDensity.row.show = false;
      this.molarMass.row.show = true;
      this.molarMass.recip = true;
      this.solutionDensity.row.show = false;
      this.form.underConstructionShow = false;
      this.updateEquation();
      this.form.formChange();
      return;
    }

    if (residual.equal(this.solutionDensity.unit.d.recip())) {
      this.substanceDensity.row.show = false;
      this.molarMass.row.show = false;
      this.solutionDensity.row.show = true;
      this.solutionDensity.recip = true;
      this.form.underConstructionShow = false;
      this.updateEquation();
      this.form.formChange();
      return;
    }

    if (residual.equal(this.substanceDensity.unit.d.mul(this.molarMass.unit.d))) {
      this.substanceDensity.row.show = true;
      this.molarMass.row.show = true;
      this.molarMass.recip = false;
      this.solutionDensity.row.show = false;
      this.form.underConstructionShow = false;
      this.updateEquation();
      this.form.formChange();
      return;
    }
    if (residual.equal(this.substanceDensity.unit.d.div(this.molarMass.unit.d))) {
      this.substanceDensity.row.show = true;
      this.molarMass.row.show = true;
      this.molarMass.recip = true;
      this.solutionDensity.row.show = false;
      this.form.underConstructionShow = false;
      this.updateEquation();
      this.form.formChange();
      return;
    }

    if (residual.equal(this.solutionDensity.unit.d.recip().mul(this.molarMass.unit.d))) {
      this.substanceDensity.row.show = false
      this.molarMass.row.show = true;
      this.molarMass.recip = false;
      this.solutionDensity.row.show = true;
      this.solutionDensity.recip = true;
      this.form.underConstructionShow = false;
      this.updateEquation();
      this.form.formChange();
      return;
    }
    if (residual.equal(this.solutionDensity.unit.d.recip().mul(this.molarMass.unit.d.recip()))) {
      this.substanceDensity.row.show = false;
      this.molarMass.row.show = true;
      this.molarMass.recip = true;
      this.solutionDensity.row.show = true;
      this.solutionDensity.recip = true;
      this.form.underConstructionShow = false;
      this.updateEquation();
      this.form.formChange();
      return;
    }

    if (isDevMode())
      console.log(residual);

    this.form.underConstructionShow = true;
    this.updateEquation();
    this.form.formChange();
  }
}
