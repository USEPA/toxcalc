import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

import { SdCalcRowComponent } from '../sd-calc-row/sd-calc-row.component';
import { SdSelectComponent } from '../sd-select/sd-select.component';
import { Dimension, ScalarAndDimension, isCalculateError } from '../shared/dimension';
import { Field } from '../shared/field';
import { Form } from '../shared/form';
import { Term, Equation, EquationPrinter, Variable } from '../shared/equation';

import { printNum } from '../shared/number-util';

class EffectLimit extends Field {
  get label(): string { return 'No/low effect limit'; }
  get unitName(): string { return 'mg/kg BW/day'; }
  private readonly PER_DAY = new ScalarAndDimension(1, Dimension.initTime().recip());
  get unit(): ScalarAndDimension { return this.PER_DAY; }
}

class BodyWeight extends Field {
  get label(): string { return 'Body weight'; }
  get unitName(): string { return 'kg'; }
  private readonly KG = new ScalarAndDimension(1000, Dimension.initMass());
  get unit(): ScalarAndDimension { return this.KG; }
}

class Species extends Field {
  get label(): string { return 'Species'; }
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
  get label(): string { return 'Safety factor'; }
  get unitName(): string { return ''; }
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
}

class StudyDurationFactor extends Field {
  get label(): string { return 'Study duration factor'; }
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
  get label(): string { return 'Severe toxicity factor'; }
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
  get label(): string { return 'No-NOEL Factor'; }
  get unitName(): string { return ''; }
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
}

class PDE extends Field {
  get label(): string { return 'Permissible Daily Exposure'; }
  get unitName(): string { return 'mg/day'; }
  private readonly MG_DAY = new ScalarAndDimension(0.001, Dimension.initMass().div(Dimension.initTime()));
  get unit(): ScalarAndDimension { return this.MG_DAY; }
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
  pde: PDE = new PDE;

  form = new Form(this.eqPrinter, [this.effectLimit, this.bodyWeight, this.species, this.safetyFactor, this.studyDurationFactor, this.severeToxicityFactor, this.noNoelFactor, this.pde]);

  constructor() {
    let eq = new Equation(Equation.div(Equation.mul(this.effectLimit.var, this.bodyWeight.var), Equation.mul(this.species.var, this.safetyFactor.var, this.studyDurationFactor.var, this.severeToxicityFactor.var, this.noNoelFactor.var, this.pde.var)), Equation.constantFromNumber(1));
    this.effectLimit.term = (<Equation>eq.solve(this.effectLimit.var)).RHS;
    this.bodyWeight.term = (<Equation>eq.solve(this.bodyWeight.var)).RHS;
    // this.species.term = (<Equation>eq.solve(this.species.var)).RHS;
    this.safetyFactor.term = (<Equation>eq.solve(this.safetyFactor.var)).RHS;
    this.studyDurationFactor.term = (<Equation>eq.solve(this.studyDurationFactor.var)).RHS;
    this.severeToxicityFactor.term = (<Equation>eq.solve(this.severeToxicityFactor.var)).RHS;
    this.noNoelFactor.term = (<Equation>eq.solve(this.noNoelFactor.var)).RHS;
    this.pde.term = (<Equation>eq.solve(this.pde.var)).RHS;

    this.variableMap.set(this.effectLimit.var, this.effectLimit.label);
    this.variableMap.set(this.bodyWeight.var, this.bodyWeight.label);
    this.variableMap.set(this.species.var, this.species.label);
    this.variableMap.set(this.safetyFactor.var, this.safetyFactor.label);
    this.variableMap.set(this.studyDurationFactor.var, this.studyDurationFactor.label);
    this.variableMap.set(this.severeToxicityFactor.var, this.severeToxicityFactor.label);
    this.variableMap.set(this.noNoelFactor.var, this.noNoelFactor.label);
    this.variableMap.set(this.pde.var, this.pde.label);

    this.form.equationSnippet = this.pde.equationSnippet(this.eqPrinter);
  }

  ngAfterViewInit() {
    this.effectLimit.row = this.effectLimitRow;
    this.effectLimit.input = this.effectLimitInput;
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
  }

  isMouseOrRat: boolean = true;

  changeSpecies(): void {
    this.isMouseOrRat =
        (this.speciesSelect.selectedName == 'rat' ||
         this.speciesSelect.selectedName == 'mouse');
  }

  changeStudyDurationFactor(): void {}

  changeSevereToxicityFactor(): void {}

  readonly speciesOptions = [
    {species: 'rat', factor: 5},
    {species: 'mouse', factor: 12},
    {species: 'dog', factor: 2},
    {species: 'rabbit', factor: 2.5},
    {species: 'monkey', factor: 3},
    {species: 'other', factor: 10},
  ];
}
