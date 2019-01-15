import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

import { SdCalcRowComponent } from '../sd-calc-row/sd-calc-row.component';
import { SdSelectComponent } from '../sd-select/sd-select.component';
import { Dimension, ScalarAndDimension, isCalculateError } from '../shared/dimension';
import { Field } from '../shared/field';
import { Form } from '../shared/form';
import { Term, Equation, EquationPrinter, Variable } from '../shared/equation';

import { printNum } from '../shared/number-util';

// bcfForm

class BioavailabilityPDE extends Field {
  get label(): string { return '% bioavailability for PDE route'; }
  get equationVarName(): string { return '\\% bioavailability for PDE route'; }
  get unitName(): string { return ''; }
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
}

class BioavailabilityCriticalStudy extends Field {
  get label(): string { return '% bioavailability for critical study route'; }
  get equationVarName(): string { return '\\% bioavailability for critical study route'; }
  get unitName(): string { return ''; }
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
}

class Alpha extends Field {
  get label(): string { return 'Alpha or BCF'; }
  get unitName(): string { return ''; }
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
}

// pdeForm

class EffectLimit extends Field {
  private readonly PER_DAY = Dimension.initTime().recip();
  readonly UNITS: {[index: string]: ScalarAndDimension} = {
    'mg/kg BW/day': new ScalarAndDimension(0.000001, this.PER_DAY),
    'g/kg BW/day': new ScalarAndDimension(0.001, this.PER_DAY),
    'µg/kg BW/day': new ScalarAndDimension(0.000000001, this.PER_DAY),
  };

  get label(): string { return 'No/low effect level'; }
  get unitName(): string { return this.units!.selectedName; }
  get unit(): ScalarAndDimension { return this.units!.value; }
}

class BodyWeight extends Field {
  get label(): string { return 'Assumed human body weight'; }
  get unitName(): string { return 'kg'; }
  private readonly KG = new ScalarAndDimension(1000, Dimension.initMass());
  get unit(): ScalarAndDimension { return this.KG; }
}

class Species extends Field {
  get label(): string { return 'F1: Interspecies Extrapolation'; }
  get logColumnName(): string { return 'F1'; }
  get unitName(): string { return ''; }
  get value() { return this.select.value.factor; }
  set value(unused) {}
  get logValue(): string { return this.select.value.species + ' (' + printNum(this.select.value.factor) + ')'; }
  updateErrorState(): void {}
  select: SdSelectComponent;
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
}

class SafetyFactor extends Field {
  get label(): string { return 'F2: Interindividual variability'; }
  get logColumnName(): string { return 'F2'; }
  get unitName(): string { return ''; }
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
}

class StudyDurationFactor extends Field {
  get label(): string { return 'F3: Exposure duration adjustment'; }
  get logColumnName(): string { return 'F3'; }
  get unitName(): string { return ''; }
  get value() { return this.select.value; }
  set value(unused) {}
  get logValue(): string { return this.select.selectedName + ' (' + printNum(this.select.value) + ')'; }
  updateErrorState(): void {}
  select: SdSelectComponent;
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
}

class SevereToxicityFactor extends Field {
  get label(): string { return 'F4: Severe toxicity adjustment'; }
  get logColumnName(): string { return 'F4'; }
  get unitName(): string { return ''; }
  get value() { return this.select.value; }
  set value(unused) {}
  get logValue(): string { return this.select.selectedName + ' (' + printNum(this.select.value) + ')'; }
  updateErrorState(): void {}
  select: SdSelectComponent;
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
}

class NoNoelFactor extends Field {
  get label(): string { return 'F5: LO(A)EL to NO(A)EL extrapolation'; }
  get logColumnName(): string { return 'F5'; }
  get unitName(): string { return ''; }
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
}

class PDE extends Field {
  get label(): string { return 'Permissible daily exposure'; }
  private readonly MASS_TIME = Dimension.initMass().div(Dimension.initTime());
  readonly UNITS: {[index: string]: ScalarAndDimension} = {
    'mg/day': new ScalarAndDimension(0.001, this.MASS_TIME),
    'g/day': new ScalarAndDimension(0.1, this.MASS_TIME),
    'µg/day': new ScalarAndDimension(0.000001, this.MASS_TIME),
  };
  get unitName(): string { return this.units!.selectedName; }
  get unit(): ScalarAndDimension { return this.units!.value; }
}

@Component({
  selector: 'app-hbelcalc',
  templateUrl: './hbelcalc.component.html',
  styleUrls: ['./hbelcalc.component.css']
})
export class HbelCalcComponent {
  variableMap: Map<Variable, string> = new Map();
  eqPrinter: EquationPrinter = new EquationPrinter(this.variableMap);

  @ViewChild('effectLimitRow') effectLimitRow: SdCalcRowComponent;
  @ViewChild('effectLimitInput') effectLimitInput: ElementRef<HTMLInputElement>;
  @ViewChild('effectLimitUnits') effectLimitUnits: SdSelectComponent;
  effectLimit: EffectLimit = new EffectLimit;

  @ViewChild('bodyWeightRow') bodyWeightRow: SdCalcRowComponent;
  @ViewChild('bodyWeightInput') bodyWeightInput: ElementRef<HTMLInputElement>;
  bodyWeight: BodyWeight = new BodyWeight;

  @ViewChild('speciesRow') speciesRow: SdCalcRowComponent;
  @ViewChild('speciesSelect') speciesSelect: SdSelectComponent;
  species: Species = new Species;

  @ViewChild('safetyFactorRow') safetyFactorRow: SdCalcRowComponent;
  @ViewChild('safetyFactorInput') safetyFactorInput: ElementRef<HTMLInputElement>;
  safetyFactor: SafetyFactor = new SafetyFactor;

  @ViewChild('studyDurationFactorRow') studyDurationFactorRow: SdCalcRowComponent;
  @ViewChild('studyDurationFactorSelect') studyDurationFactorSelect: SdSelectComponent;
  studyDurationFactor: StudyDurationFactor = new StudyDurationFactor;

  @ViewChild('severeToxicityFactorRow') severeToxicityFactorRow: SdCalcRowComponent;
  @ViewChild('severeToxicityFactorSelect') severeToxicityFactorSelect: SdSelectComponent;
  severeToxicityFactor: SevereToxicityFactor = new SevereToxicityFactor;

  @ViewChild('noNoelFactorRow') noNoelFactorRow: SdCalcRowComponent;
  @ViewChild('noNoelFactorInput') noNoelFactorInput: ElementRef<HTMLInputElement>;
  noNoelFactor: NoNoelFactor = new NoNoelFactor;

  @ViewChild('pdeRow') pdeRow: SdCalcRowComponent;
  @ViewChild('pdeInput') pdeInput: ElementRef<HTMLInputElement>;
  @ViewChild('pdeUnits') pdeUnits: SdSelectComponent;
  pde: PDE = new PDE;

  pdeForm = new Form(this.eqPrinter, [this.effectLimit, this.bodyWeight, this.species, this.safetyFactor, this.studyDurationFactor, this.severeToxicityFactor, this.noNoelFactor, this.pde]);

  @ViewChild('bioavailabilityPDERow') bioavailabilityPDERow: SdCalcRowComponent;
  @ViewChild('bioavailabilityPDEInput') bioavailabilityPDEInput: ElementRef<HTMLInputElement>;
  bioavailabilityPDE: BioavailabilityPDE = new BioavailabilityPDE;

  @ViewChild('bioavailabilityCriticalStudyRow') bioavailabilityCriticalStudyRow: SdCalcRowComponent;
  @ViewChild('bioavailabilityCriticalStudyInput') bioavailabilityCriticalStudyInput: ElementRef<HTMLInputElement>;
  bioavailabilityCriticalStudy: BioavailabilityCriticalStudy = new BioavailabilityCriticalStudy;

  @ViewChild('alphaRow') alphaRow: SdCalcRowComponent;
  @ViewChild('alphaInput') alphaInput: ElementRef<HTMLInputElement>;
  alpha: Alpha = new Alpha;

  bcfForm = new Form(this.eqPrinter, [this.bioavailabilityPDE, this.bioavailabilityCriticalStudy, this.alpha]);

  constructor() {
    let bcfeq = new Equation(Equation.div(this.bioavailabilityPDE.var, Equation.mul(this.bioavailabilityCriticalStudy.var, this.alpha.var)), Equation.constantFromNumber(1));
    this.bioavailabilityPDE.term = (<Equation>bcfeq.solve(this.bioavailabilityPDE.var)).RHS;
    this.bioavailabilityCriticalStudy.term = (<Equation>bcfeq.solve(this.bioavailabilityCriticalStudy.var)).RHS;
    this.alpha.term = (<Equation>bcfeq.solve(this.alpha.var)).RHS;
    this.variableMap.set(this.bioavailabilityPDE.var, this.bioavailabilityPDE.equationVarName);
    this.variableMap.set(this.bioavailabilityCriticalStudy.var, this.bioavailabilityCriticalStudy.equationVarName);
    this.variableMap.set(this.alpha.var, this.alpha.equationVarName);
    console.log(this.alpha.equationSnippet(this.eqPrinter));
    this.bcfForm.equationSnippet = this.alpha.equationSnippet(this.eqPrinter);

    // pdeForm
    let eq = new Equation(Equation.div(Equation.mul(this.effectLimit.var, this.bodyWeight.var), Equation.mul(this.species.var, this.safetyFactor.var, this.studyDurationFactor.var, this.severeToxicityFactor.var, this.noNoelFactor.var, this.pde.var)), Equation.constantFromNumber(1));
    this.effectLimit.term = (<Equation>eq.solve(this.effectLimit.var)).RHS;
    this.bodyWeight.term = (<Equation>eq.solve(this.bodyWeight.var)).RHS;
    // this.species.term = (<Equation>eq.solve(this.species.var)).RHS;
    this.safetyFactor.term = (<Equation>eq.solve(this.safetyFactor.var)).RHS;
    this.studyDurationFactor.term = (<Equation>eq.solve(this.studyDurationFactor.var)).RHS;
    this.severeToxicityFactor.term = (<Equation>eq.solve(this.severeToxicityFactor.var)).RHS;
    this.noNoelFactor.term = (<Equation>eq.solve(this.noNoelFactor.var)).RHS;
    this.pde.term = (<Equation>eq.solve(this.pde.var)).RHS;

    this.variableMap.set(this.effectLimit.var, this.effectLimit.equationVarName);
    this.variableMap.set(this.bodyWeight.var, this.bodyWeight.equationVarName);
    this.variableMap.set(this.species.var, this.species.equationVarName);
    this.variableMap.set(this.safetyFactor.var, this.safetyFactor.equationVarName);
    this.variableMap.set(this.studyDurationFactor.var, this.studyDurationFactor.equationVarName);
    this.variableMap.set(this.severeToxicityFactor.var, this.severeToxicityFactor.equationVarName);
    this.variableMap.set(this.noNoelFactor.var, this.noNoelFactor.equationVarName);
    this.variableMap.set(this.pde.var, this.pde.equationVarName);

    this.pdeForm.equationSnippet = this.pde.equationSnippet(this.eqPrinter);
  }

  ngAfterViewInit() {
    this.bioavailabilityPDE.row = this.bioavailabilityPDERow;
    this.bioavailabilityPDE.input = this.bioavailabilityPDEInput;
    this.bioavailabilityCriticalStudy.row = this.bioavailabilityCriticalStudyRow;
    this.bioavailabilityCriticalStudy.input = this.bioavailabilityCriticalStudyInput;
    this.alpha.row = this.alphaRow;
    this.alpha.input = this.alphaInput;

    this.effectLimit.row = this.effectLimitRow;
    this.effectLimit.input = this.effectLimitInput;
    this.effectLimit.units = this.effectLimitUnits;
    this.bodyWeight.row = this.bodyWeightRow;
    this.bodyWeight.input = this.bodyWeightInput;
    this.species.row = this.speciesRow;
    this.species.select = this.speciesSelect;
    this.safetyFactor.row = this.safetyFactorRow;
    this.safetyFactor.input = this.safetyFactorInput;
    this.studyDurationFactor.row = this.studyDurationFactorRow;
    this.studyDurationFactor.select = this.studyDurationFactorSelect;
    this.severeToxicityFactor.row = this.severeToxicityFactorRow;
    this.severeToxicityFactor.select = this.severeToxicityFactorSelect;
    this.noNoelFactor.row = this.noNoelFactorRow;
    this.noNoelFactor.input = this.noNoelFactorInput;
    this.pde.row = this.pdeRow;
    this.pde.input = this.pdeInput;
    this.pde.units = this.pdeUnits;
  }

  isMouseOrRat: boolean = true;

  changeUnits(): void {
    this.pdeForm.formChange();
  }

  changeSpecies(): void {
    this.isMouseOrRat =
        (this.speciesSelect.selectedName == 'rat' ||
         this.speciesSelect.selectedName == 'mouse');
    this.pdeForm.formChange();
  }

  changeStudyDurationFactor(): void {
    this.pdeForm.formChange();
  }

  changeSevereToxicityFactor(): void {
    this.pdeForm.formChange();
  }

  readonly speciesOptions = [
    {species: 'rat', factor: 5},
    {species: 'mouse', factor: 12},
    {species: 'dog', factor: 2},
    {species: 'rabbit', factor: 2.5},
    {species: 'monkey', factor: 3},
    {species: 'other', factor: 10},
  ];

  // Allow the template to iterate over unit labels filtered by dimension.
  iterUnits(table: {[index: string]: ScalarAndDimension}, d: Dimension | null): string[] {
    let results: string[] = [];
    Object.keys(table).forEach(function(key) {
      if (d == null || table[key].d.equal(d))
        results.push(key);
    });
    return results;
  }
}
