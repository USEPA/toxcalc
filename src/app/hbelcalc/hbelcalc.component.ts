import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons';

import { SdCalcRowComponent } from '../sd-calc-row/sd-calc-row.component';
import { SdSelectComponent } from '../sd-select/sd-select.component';
import { Dimension, ScalarAndDimension, isCalculateError } from '../shared/dimension';
import { Field } from '../shared/field';
import { Form } from '../shared/form';
import { Term, Equation, EquationPrinter, Variable } from '../shared/equation';

import { printNum } from '../shared/number-util';

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
  get unitName(): string {
    return this.enabled ? 'kg' : '';
  }
  private readonly KG = new ScalarAndDimension(1000, Dimension.initMass());
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension {
    return this.enabled ? this.KG : this.UNIT;
  }

  get logValue(): string {
    // super.logValue is inlined here, see:
    // https://github.com/Microsoft/TypeScript/issues/338
    return this.enabled ? [this.value, this.unitName].filter(txt => txt.length > 0).join(' ') : 'n/a';
  }

  customValue: string = '';
  customSpeciesName: string = '';
  custom: boolean = true;
  selectedValue: string = '';
  get selectedName(): string {
    if (this.selected == 'custom') { return 'custom'; }
    return this.options[parseInt(this.selected)].label;
  }
  get value(): string {
    if (!this.enabled)
      return '1';
    if (this.custom)
      return this.customValue;
    return this.selectedValue;
  }
  set value(new_value: string) { this.customValue = new_value; }

  // TODO: this should be in field, and its readOnly property should be removed
  // or replaced with this 'output'.
  output: boolean = false;
  markAsOutput(): void { this.output = true; }
  unmarkAsOutput(): void { this.output = false; }
  isMarkedAsOutput(): boolean { return this.output; }

  selected: string = 'custom';

  readonly options = [
    {label: '50 kg (ICH Q3C default)', value: 50, bold: true},
    {label: '60 kg', value: 60, bold: false},
    {label: '70 kg', value: 70, bold: false},
    {label: '80 kg', value: 80, bold: false},
  ];

  enabled: boolean = true;
  disable(variableMap: Map<Variable, string>): void {
    this.enabled = false;
    variableMap.set(this.var, '');
  }
  enable(variableMap: Map<Variable, string>): void {
    this.enabled = true;
    variableMap.set(this.var, this.equationVarName);
  }
}

class Species extends Field {
  get label(): string { return 'F1: Interspecies Extrapolation'; }
  get logColumnName(): string { return 'F1'; }
  get unitName(): string { return ''; }
  get logValue(): string {
    if (this.custom) {
      if (this.customSpeciesName == '') {
        return `custom (${this.customValue})`;
      }
      return `${this.customSpeciesName} (${this.customValue})`;
    }
    return `${this.selectedName} (${this.selectedValue})`;
  }
  updateErrorState(): void {
    if (!this.custom) return;
    super.updateErrorState();
  }
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
  customValue: string = '';
  customSpeciesName: string = '';
  custom: boolean = true;
  selectedValue: string = '';
  get selectedName() {
    if (this.selected == 'custom') { return 'custom'; }
    return this.options[parseInt(this.selected)].label;
  }
  get value(): string { return this.custom ? this.customValue : this.selectedValue; }
  set value(new_value: string) { this.customValue = new_value; }

  // TODO: this should be in field, and its readOnly property should be removed
  // or replaced with this 'output'.
  output: boolean = false;
  markAsOutput(): void { this.output = true; }
  unmarkAsOutput(): void { this.output = false; }
  isMarkedAsOutput(): boolean { return this.output; }

  selected: string = 'custom';

  readonly options = [
    {label: 'human equivalent dose (no F1 required)', value: 1},
    {label: 'human', value: 1},
    {label: 'dog', value: 2},
    {label: 'rabbit', value: 2.5},
    {label: 'monkey', value: 3},
    {label: 'rat', value: 5},
    {label: 'mouse', value: 12},
    {label: 'other species', value: 10},
  ];
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
  get logValue(): string {
    if (this.custom) {
      return this.customValue;
    }
    return this.options()[parseInt(this.selected)].label + ' (' + this.selectedValue + ')';
  }
  options(): {label: string; value: number}[] {
    switch (this.species) {
      case 'mouse':
      case 'rat':
        return this.mouseRatOptions;
      case 'rabbit':
        return this.rabbitOptions;
      case 'cat':
      case 'dog':
      case 'monkey':
        return this.catDogMonkeyOptions;
      default:
        return this.unknownSpeciesOptions;
    }
  }
  updateErrorState(): void {
    if (!this.custom) return;
    super.updateErrorState();
  }
  species: string = 'custom';
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
  // The value shown in the custom box.
  customValue: string = '';
  // Whether 'custom value' is the currently selected radio button.
  custom: boolean = true;
  // The value, if custom is not active.
  selectedValue: string = '';
  get value(): string { return this.custom ? this.customValue : this.selectedValue; }
  set value(new_value: string) { /* assert (this.custom) */ this.customValue = new_value; }

  // TODO: this should be in field, and its readOnly property should be removed
  // or replaced with this 'output'.
  output: boolean = false;
  markAsOutput(): void { this.output = true; }
  unmarkAsOutput(): void { this.output = false; }
  isMarkedAsOutput(): boolean { return this.output; }

  selected: string = 'custom';

  readonly mouseRatOptions = [
    {label: 'one half lifetime (1 year)', value: 1},
    {label: 'whole period of organogenesis in a reproductive study', value: 1},
    {label: '≥ 6-month study', value: 2},
    {label: '≥ 3-month study', value: 5},
    {label: 'shorter duration studies', value: 10}];
  readonly rabbitOptions = [
    {label: 'one half lifetime (1 year)', value: 1},
    {label: 'whole period of organogenesis in a reproductive study', value: 1},
    {label: '≥ 3.5-year study', value: 2},
    {label: '≥ 2-year study', value: 5},
    {label: 'shorter duration studies', value: 10}];
  readonly catDogMonkeyOptions = [
    {label: 'one half lifetime (7 years)', value: 1},
    {label: 'whole period of organogenesis in a reproductive study', value: 1},
    {label: '≥ 3.5-year study', value: 2},
    {label: '≥ 2-year study', value: 5},
    {label: 'shorter duration studies', value: 10}];
  readonly unknownSpeciesOptions = [
    {label: 'one half lifetime (1 year for rodents or rabbits; 7 years for cats, dogs and monkeys)', value: 1},
    {label: 'whole period of organogenesis in a reproductive study', value: 1},
    {label: '≥ 6-month study in rodents, or ≥ 3.5-year study in non-rodents', value: 2},
    {label: '≥ 3-month study in rodents, or ≥ 2-year study in non-rodents', value: 5},
    {label: 'shorter duration studies', value: 10}];
}

class SevereToxicityFactor extends Field {
  get label(): string { return 'F4: Severe toxicity adjustment'; }
  get logColumnName(): string { return 'F4'; }
  get unitName(): string { return ''; }
  get logValue(): string {
    if (this.custom) {
      return this.customValue;
    }
    return this.options[parseInt(this.selected)].label + ' (' + this.selectedValue + ')';
  }
  updateErrorState(): void {
    if (!this.custom) return;
    super.updateErrorState();
  }
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }

  // The value shown in the custom box.
  customValue: string = '';
  // Whether 'custom value' is the currently selected radio button.
  custom: boolean = true;
  // The value, if custom is not active.
  selectedValue: string = '';
  get value(): string { return this.custom ? this.customValue : this.selectedValue; }
  set value(new_value: string) { /* assert (this.custom) */ this.customValue = new_value; }

  // TODO: this should be in field, and its readOnly property should be removed
  // or replaced with this 'output'.
  output: boolean = false;
  markAsOutput(): void { this.output = true; }
  unmarkAsOutput(): void { this.output = false; }
  isMarkedAsOutput(): boolean { return this.output; }

  selected: string = 'custom';

  readonly options = [
    {label: 'fetal toxicity associated with maternal toxicity', value: 1},
    {label: 'fetal toxicity without maternal toxicity', value: 5},
    {label: 'teratogenic effect with maternal toxicity', value: 5},
    {label: 'teratogenic effect without maternal toxicity', value: 10},
  ];
}

class NoNoelFactor extends Field {
  get label(): string { return 'F5: LOEL to NOEL extrapolation'; }
  get logColumnName(): string { return 'F5'; }
  get unitName(): string { return ''; }
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
}

class ExtraFactors extends Field {
  get label(): string { return 'Additional modifying factor'; }
  get unitName(): string { return ''; }
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }

  get value(): string {
    return this.enabled ? this.textValue : '1';
  }
  set value(new_value: string) { this.textValue = new_value; }

  get logValue(): string {
    // super.logValue is inlined here, see:
    // https://github.com/Microsoft/TypeScript/issues/338
    return this.enabled ? [this.value, this.unitName].filter(txt => txt.length > 0).join(' ') : 'n/a';
  }

  enabled: boolean = true;
  textValue: string = '';
  saveText: string = '';
  disable(variableMap: Map<Variable, string>): void {
    this.enabled = false;
    this.saveText = this.textValue;
    this.textValue = '';
    variableMap.set(this.var, '');
  }
  enable(variableMap: Map<Variable, string>): void {
    this.enabled = true;
    this.textValue = this.saveText;
    this.saveText = '';
    variableMap.set(this.var, this.equationVarName);
  }
  clear(): void {
    this.saveText = '';
    super.clear();
  }
}

class Alpha extends Field {
  get label(): string { return 'Alpha or BCF'; }
  get unitName(): string { return ''; }
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }

  get value(): string {
    return this.enabled ? this.textValue : '1';
  }
  set value(new_value: string) { this.textValue = new_value; }

  get logValue(): string {
    // super.logValue is inlined here, see:
    // https://github.com/Microsoft/TypeScript/issues/338
    return this.enabled ? [this.value, this.unitName].filter(txt => txt.length > 0).join(' ') : 'n/a';
  }

  enabled: boolean = true;
  textValue: string = '';
  saveText: string = '';
  disable(variableMap: Map<Variable, string>): void {
    this.enabled = false;
    this.saveText = this.textValue;
    this.textValue = '';
    variableMap.set(this.var, '');
  }
  enable(variableMap: Map<Variable, string>): void {
    this.enabled = true;
    this.textValue = this.saveText;
    this.saveText = '';
    variableMap.set(this.var, this.equationVarName);
  }
  clear(): void {
    this.saveText = '';
    super.clear();
  }
}

class PDE extends Field {
  get label(): string { return 'Permissible daily exposure'; }
  readonly MASS_TIME = Dimension.initMass().div(Dimension.initTime());
  readonly PER_TIME = Dimension.initUnit().div(Dimension.initTime());
  readonly UNITS: {[index: string]: ScalarAndDimension} = {
    'mg/day': new ScalarAndDimension(0.001, this.MASS_TIME),
    'g/day': new ScalarAndDimension(0.1, this.MASS_TIME),
    'µg/day': new ScalarAndDimension(0.000001, this.MASS_TIME),
    'mg/kg BW/day': new ScalarAndDimension(0.000001, this.PER_TIME),
    'g/kg BW/day': new ScalarAndDimension(0.001, this.PER_TIME),
    'µg/kg BW/day': new ScalarAndDimension(0.000000001, this.PER_TIME),
  };
  get unitName(): string { return this.units!.selectedName; }
  get unit(): ScalarAndDimension { return this.units!.value; }
}

class PDEForm extends Form {
  constructor(eqPrinter: EquationPrinter, fields: Field[], public factorFields: Field[]) {
    super(eqPrinter, fields);
  }

  updateFactorVars(): void {
    this.factorFields.forEach(function(f: Field) {
      f.updateVar();
    });
  }

  updateFactorErrors(): void {
    this.factorFields.filter(f => f.row.show).forEach(function(f: Field) {
      f.updateErrorState();
    });
  }

  hasFactorErrors(): boolean {
    return this.factorFields.filter(f => f.row.show).some(function (f: Field) { return f.hasError; } );
  }

  calculate(): void {
    this.updateFactorErrors();
    if (!this.hasFactorErrors()) {
      this.updateFactorVars();
    }

    super.calculate();
  }
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
  @ViewChild('speciesInput') speciesInput: ElementRef<HTMLInputElement>;
  species: Species = new Species;

  @ViewChild('safetyFactorRow') safetyFactorRow: SdCalcRowComponent;
  @ViewChild('safetyFactorInput') safetyFactorInput: ElementRef<HTMLInputElement>;
  safetyFactor: SafetyFactor = new SafetyFactor;

  @ViewChild('studyDurationFactorRow') studyDurationFactorRow: SdCalcRowComponent;
  @ViewChild('studyDurationFactorInput') studyDurationFactorInput: ElementRef<HTMLInputElement>;
  studyDurationFactor: StudyDurationFactor = new StudyDurationFactor;

  @ViewChild('severeToxicityFactorRow') severeToxicityFactorRow: SdCalcRowComponent;
  @ViewChild('severeToxicityFactorInput') severeToxicityFactorInput: ElementRef<HTMLInputElement>;
  severeToxicityFactor: SevereToxicityFactor = new SevereToxicityFactor;

  @ViewChild('noNoelFactorRow') noNoelFactorRow: SdCalcRowComponent;
  @ViewChild('noNoelFactorInput') noNoelFactorInput: ElementRef<HTMLInputElement>;
  noNoelFactor: NoNoelFactor = new NoNoelFactor;

  @ViewChild('extraFactorsRow') extraFactorsRow: SdCalcRowComponent;
  @ViewChild('extraFactorsInput') extraFactorsInput: ElementRef<HTMLInputElement>;
  extraFactors: ExtraFactors = new ExtraFactors;

  @ViewChild('alphaRow') alphaRow: SdCalcRowComponent;
  @ViewChild('alphaInput') alphaInput: ElementRef<HTMLInputElement>;
  alpha: Alpha = new Alpha;

  @ViewChild('pdeRow') pdeRow: SdCalcRowComponent;
  @ViewChild('pdeInput') pdeInput: ElementRef<HTMLInputElement>;
  @ViewChild('pdeUnits') pdeUnits: SdSelectComponent;
  pde: PDE = new PDE;

  pdeForm = new PDEForm(this.eqPrinter, [this.effectLimit, this.bodyWeight, this.species, this.safetyFactor, this.studyDurationFactor, this.severeToxicityFactor, this.noNoelFactor, this.extraFactors, this.alpha, this.pde], [this.species, this.safetyFactor, this.studyDurationFactor, this.severeToxicityFactor, this.noNoelFactor, this.extraFactors, this.alpha]);

  constructor() {
    library.add(faFilePdf);

    // pdeForm
    this.compositeFactorsTerm = Equation.mul(this.species.var, this.safetyFactor.var, this.studyDurationFactor.var, this.severeToxicityFactor.var, this.noNoelFactor.var, this.extraFactors.var, this.alpha.var);
    let eq = new Equation(Equation.div(Equation.mul(this.effectLimit.var, this.bodyWeight.var), Equation.mul(this.compositeFactorsTerm, this.pde.var)), Equation.constantFromNumber(1));
    this.effectLimit.term = (<Equation>eq.solve(this.effectLimit.var)).RHS;
    this.bodyWeight.term = (<Equation>eq.solve(this.bodyWeight.var)).RHS;
    this.species.term = (<Equation>eq.solve(this.species.var)).RHS;
    this.safetyFactor.term = (<Equation>eq.solve(this.safetyFactor.var)).RHS;
    this.studyDurationFactor.term = (<Equation>eq.solve(this.studyDurationFactor.var)).RHS;
    this.severeToxicityFactor.term = (<Equation>eq.solve(this.severeToxicityFactor.var)).RHS;
    this.noNoelFactor.term = (<Equation>eq.solve(this.noNoelFactor.var)).RHS;
    this.extraFactors.term = (<Equation>eq.solve(this.extraFactors.var)).RHS;
    this.alpha.term = (<Equation>eq.solve(this.alpha.var)).RHS;
    this.pde.term = (<Equation>eq.solve(this.pde.var)).RHS;

    this.variableMap.set(this.effectLimit.var, this.effectLimit.equationVarName);
    this.variableMap.set(this.bodyWeight.var, this.bodyWeight.equationVarName);
    this.variableMap.set(this.species.var, this.species.equationVarName);
    this.variableMap.set(this.safetyFactor.var, this.safetyFactor.equationVarName);
    this.variableMap.set(this.studyDurationFactor.var, this.studyDurationFactor.equationVarName);
    this.variableMap.set(this.severeToxicityFactor.var, this.severeToxicityFactor.equationVarName);
    this.variableMap.set(this.noNoelFactor.var, this.noNoelFactor.equationVarName);
    this.variableMap.set(this.extraFactors.var, this.extraFactors.equationVarName);
    this.variableMap.set(this.alpha.var, this.alpha.equationVarName);
    this.variableMap.set(this.pde.var, this.pde.equationVarName);

    this.pdeForm.equationSnippet = this.pde.equationSnippet(this.eqPrinter);
  }

  ngAfterViewInit() {
    this.effectLimit.row = this.effectLimitRow;
    this.effectLimit.input = this.effectLimitInput;
    this.effectLimit.units = this.effectLimitUnits;
    this.bodyWeight.row = this.bodyWeightRow;
    this.bodyWeight.input = this.bodyWeightInput;
    this.species.row = this.speciesRow;
    this.species.input = this.speciesInput;
    this.safetyFactor.row = this.safetyFactorRow;
    this.safetyFactor.input = this.safetyFactorInput;
    this.studyDurationFactor.row = this.studyDurationFactorRow;
    this.studyDurationFactor.input = this.studyDurationFactorInput;
    this.severeToxicityFactor.row = this.severeToxicityFactorRow;
    this.severeToxicityFactor.input = this.severeToxicityFactorInput;
    this.noNoelFactor.row = this.noNoelFactorRow;
    this.noNoelFactor.input = this.noNoelFactorInput;
    this.extraFactors.row = this.extraFactorsRow;
    this.extraFactors.input = this.extraFactorsInput;
    this.alpha.row = this.alphaRow;
    this.alpha.input = this.alphaInput;
    this.pde.row = this.pdeRow;
    this.pde.input = this.pdeInput;
    this.pde.units = this.pdeUnits;

    this.ready = true;
  }

  changePdeUnits(): void {
    const PER_TIME = Dimension.initUnit().div(Dimension.initTime());
    if (this.pde.units!.value.d.equal(PER_TIME)) {
      this.bodyWeight.disable(this.variableMap);
    } else {
      this.bodyWeight.enable(this.variableMap);
    }
    this.pdeForm.formChange();
  }

  bodyWeightClick(i: number): void {
    this.bodyWeight.custom = false;
    this.bodyWeight.customValue = '';
    this.bodyWeight.row.errorText = '';

    this.bodyWeight.selectedValue = printNum(this.bodyWeight.options[i].value);

    this.pdeForm.formChange();
  }

  bodyWeightClickCustom(): void {
    this.bodyWeight.custom = true;
    this.pdeForm.formChange();
  }

  speciesClick(i: number): void {
    this.species.custom = false;
    this.species.customValue = '';
    this.species.customSpeciesName = '';
    this.species.row.errorText = '';

    this.species.selectedValue = printNum(this.species.options[i].value);
    this.studyDurationFactor.species = this.species.options[i].label;

    this.pdeForm.formChange();
  }

  speciesClickCustom(): void {
    this.species.custom = true;
    this.studyDurationFactor.species = 'custom';
    this.pdeForm.formChange();
  }

  studyDurationFactorClick(value: number): void {
    this.studyDurationFactor.custom = false;
    this.studyDurationFactor.customValue = '';
    this.studyDurationFactor.row.errorText = '';

    this.studyDurationFactor.selectedValue = printNum(value);

    this.pdeForm.formChange();
  }

  studyDurationFactorClickCustom(): void {
    this.studyDurationFactor.custom = true;
    this.pdeForm.formChange();
  }

  severeToxicityFactorClick(value: number): void {
    this.severeToxicityFactor.custom = false;
    this.severeToxicityFactor.customValue = '';
    this.severeToxicityFactor.row.errorText = '';

    this.severeToxicityFactor.selectedValue = printNum(value);

    this.pdeForm.formChange();
  }

  severeToxicityFactorClickCustom(): void {
    this.severeToxicityFactor.custom = true;
    this.pdeForm.formChange();
  }

  alphaDisable(): void {
    if (this.alpha.enabled) {
      this.alpha.disable(this.variableMap);
    } else {
      this.alpha.enable(this.variableMap);
    }
  }

  extraFactorsDisable(): void {
    if (this.extraFactors.enabled) {
      this.extraFactors.disable(this.variableMap);
    } else {
      this.extraFactors.enable(this.variableMap);
    }
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

  ready: boolean = false;
  compositeFactorsTerm: Term;
  getCompositeFactorsValue(): string {
    if (!this.ready) return '';
    let result = this.compositeFactorsTerm.getValue();
    if (result == null) return '';
    if (isCalculateError(result)) return '';
    return printNum(result.n);
  }
  getCompositeFactorsTooHigh(): boolean {
    if (!this.ready) return false;
    let result = this.compositeFactorsTerm.getValue();
    if (result == null) return false;
    if (isCalculateError(result)) return false;
    return result.n > 5000;
  }
}
