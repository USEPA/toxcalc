import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

import { SdCalcRowComponent } from '../sd-calc-row/sd-calc-row.component';
import { SdJustificationComponent } from '../sd-justification/sd-justification.component';
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
  get selectedName() {
    if (this.selected == 'custom') { return 'custom'; }
    return this.options[parseInt(this.selected)].label;
  }
  get value() {
    if (!this.enabled)
      return '1';
    if (this.custom)
      return this.customValue;
    return this.selectedValue;
  }
  set value(new_value) { this.customValue = new_value; }

  // TODO: this should be in field, and its readOnly property should be removed
  // or replaced with this 'output'.
  output: boolean = false;
  markAsOutput(): void { this.output = true; }
  unmarkAsOutput(): void { this.output = false; }
  isMarkedAsOutput(): boolean { return this.output; }

  selected: string = 'custom';

  readonly options = [
    {label: '50 kg (ICH Q3C default)', value: 50},
    {label: '60 kg', value: 60},
    {label: '70 kg', value: 70},
    {label: '80 kg', value: 80},
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
  get value() { return this.custom ? this.customValue : this.selectedValue; }
  set value(new_value) { this.customValue = new_value; }

  // TODO: this should be in field, and its readOnly property should be removed
  // or replaced with this 'output'.
  output: boolean = false;
  markAsOutput(): void { this.output = true; }
  unmarkAsOutput(): void { this.output = false; }
  isMarkedAsOutput(): boolean { return this.output; }

  selected: string = 'custom';

  readonly options = [
    {label: 'rat', value: 5},
    {label: 'mouse', value: 12},
    {label: 'dog', value: 2},
    {label: 'rabbit', value: 2.5},
    {label: 'monkey', value: 3},
    {label: 'human', value: 1},
    {label: 'other', value: 10},
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
    return (this.isMouseOrRat ? this.mouseOrRatOptions : this.notMouseOrRatOptions)[parseInt(this.selected)].label + ' (' + this.selectedValue + ')';
  }
  updateErrorState(): void {
    if (!this.custom) return;
    super.updateErrorState();
  }
  isMouseOrRat: boolean = false;
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
  // The value shown in the custom box.
  customValue: string = '';
  // Whether 'custom value' is the currently selected radio button.
  custom: boolean = true;
  // The value, if custom is not active.
  selectedValue: string = '';
  get value() { return this.custom ? this.customValue : this.selectedValue; }
  set value(new_value) { /* assert (this.custom) */ this.customValue = new_value; }

  // TODO: this should be in field, and its readOnly property should be removed
  // or replaced with this 'output'.
  output: boolean = false;
  markAsOutput(): void { this.output = true; }
  unmarkAsOutput(): void { this.output = false; }
  isMarkedAsOutput(): boolean { return this.output; }

  selected: string = 'custom';

  readonly mouseOrRatOptions = [
    {label: 'whole period of organogenesis in a reproductive study', value: 1},
    {label: 'a 6-month study', value: 2},
    {label: 'a 3-month study', value: 5},
    {label: 'shorter duration studies', value: 10}];
  readonly notMouseOrRatOptions = [
    {label: 'whole period of organogenesis in a reproductive study', value: 1},
    {label: 'a 3.5-year study', value: 2},
    {label: 'a 2-year study', value: 5},
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
  get value() { return this.custom ? this.customValue : this.selectedValue; }
  set value(new_value) { /* assert (this.custom) */ this.customValue = new_value; }

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
  get label(): string { return 'F5: LO(A)EL to NO(A)EL extrapolation'; }
  get logColumnName(): string { return 'F5'; }
  get unitName(): string { return ''; }
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
}

class PDE extends Field {
  get label(): string { return 'Permissible daily exposure'; }
  private readonly MASS_TIME = Dimension.initMass().div(Dimension.initTime());
  private readonly PER_TIME = Dimension.initUnit().div(Dimension.initTime());
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
  @ViewChild('effectLimitJustification') effectLimitJustification: SdJustificationComponent;
  effectLimit: EffectLimit = new EffectLimit;

  @ViewChild('bodyWeightRow') bodyWeightRow: SdCalcRowComponent;
  @ViewChild('bodyWeightInput') bodyWeightInput: ElementRef<HTMLInputElement>;
  @ViewChild('bodyWeightJustification') bodyWeightJustification: SdJustificationComponent;
  bodyWeight: BodyWeight = new BodyWeight;

  @ViewChild('speciesRow') speciesRow: SdCalcRowComponent;
  @ViewChild('speciesInput') speciesInput: ElementRef<HTMLInputElement>;
  @ViewChild('speciesJustification') speciesJustification: SdJustificationComponent;
  species: Species = new Species;

  @ViewChild('safetyFactorRow') safetyFactorRow: SdCalcRowComponent;
  @ViewChild('safetyFactorInput') safetyFactorInput: ElementRef<HTMLInputElement>;
  @ViewChild('safetyFactorJustification') safetyFactorJustification: SdJustificationComponent;
  safetyFactor: SafetyFactor = new SafetyFactor;

  @ViewChild('studyDurationFactorRow') studyDurationFactorRow: SdCalcRowComponent;
  @ViewChild('studyDurationFactorInput') studyDurationFactorInput: ElementRef<HTMLInputElement>;
  @ViewChild('studyDurationFactorJustification') studyDurationFactorJustification: SdJustificationComponent;
  studyDurationFactor: StudyDurationFactor = new StudyDurationFactor;

  @ViewChild('severeToxicityFactorRow') severeToxicityFactorRow: SdCalcRowComponent;
  @ViewChild('severeToxicityFactorInput') severeToxicityFactorInput: ElementRef<HTMLInputElement>;
  @ViewChild('severeToxicityFactorJustification') severeToxicityFactorJustification: SdJustificationComponent;
  severeToxicityFactor: SevereToxicityFactor = new SevereToxicityFactor;

  @ViewChild('noNoelFactorRow') noNoelFactorRow: SdCalcRowComponent;
  @ViewChild('noNoelFactorInput') noNoelFactorInput: ElementRef<HTMLInputElement>;
  @ViewChild('noNoelFactorJustification') noNoelFactorJustification: SdJustificationComponent;
  noNoelFactor: NoNoelFactor = new NoNoelFactor;

  @ViewChild('pdeAlphaRow') pdeAlphaRow: SdCalcRowComponent;
  @ViewChild('pdeAlphaInput') pdeAlphaInput: ElementRef<HTMLInputElement>;
  @ViewChild('pdeAlphaJustification') pdeAlphaJustification: SdJustificationComponent;
  pdeAlpha: Alpha = new Alpha;

  @ViewChild('pdeRow') pdeRow: SdCalcRowComponent;
  @ViewChild('pdeInput') pdeInput: ElementRef<HTMLInputElement>;
  @ViewChild('pdeUnits') pdeUnits: SdSelectComponent;
  @ViewChild('pdeJustification') pdeJustification: SdJustificationComponent;
  pde: PDE = new PDE;

  pdeForm = new Form(this.eqPrinter, [this.effectLimit, this.bodyWeight, this.species, this.safetyFactor, this.studyDurationFactor, this.severeToxicityFactor, this.noNoelFactor, this.pdeAlpha, this.pde]);

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
    this.bcfForm.equationSnippet = this.alpha.equationSnippet(this.eqPrinter);

    // pdeForm
    this.compositeFactorsTerm = Equation.mul(this.species.var, this.safetyFactor.var, this.studyDurationFactor.var, this.severeToxicityFactor.var, this.noNoelFactor.var, this.pdeAlpha.var);
    let eq = new Equation(Equation.div(Equation.mul(this.effectLimit.var, this.bodyWeight.var), Equation.mul(this.compositeFactorsTerm, this.pde.var)), Equation.constantFromNumber(1));
    this.effectLimit.term = (<Equation>eq.solve(this.effectLimit.var)).RHS;
    this.bodyWeight.term = (<Equation>eq.solve(this.bodyWeight.var)).RHS;
    this.species.term = (<Equation>eq.solve(this.species.var)).RHS;
    this.safetyFactor.term = (<Equation>eq.solve(this.safetyFactor.var)).RHS;
    this.studyDurationFactor.term = (<Equation>eq.solve(this.studyDurationFactor.var)).RHS;
    this.severeToxicityFactor.term = (<Equation>eq.solve(this.severeToxicityFactor.var)).RHS;
    this.noNoelFactor.term = (<Equation>eq.solve(this.noNoelFactor.var)).RHS;
    this.pdeAlpha.term = (<Equation>eq.solve(this.pdeAlpha.var)).RHS;
    this.pde.term = (<Equation>eq.solve(this.pde.var)).RHS;

    this.variableMap.set(this.effectLimit.var, this.effectLimit.equationVarName);
    this.variableMap.set(this.bodyWeight.var, this.bodyWeight.equationVarName);
    this.variableMap.set(this.species.var, this.species.equationVarName);
    this.variableMap.set(this.safetyFactor.var, this.safetyFactor.equationVarName);
    this.variableMap.set(this.studyDurationFactor.var, this.studyDurationFactor.equationVarName);
    this.variableMap.set(this.severeToxicityFactor.var, this.severeToxicityFactor.equationVarName);
    this.variableMap.set(this.noNoelFactor.var, this.noNoelFactor.equationVarName);
    this.variableMap.set(this.pdeAlpha.var, this.pdeAlpha.equationVarName);
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
    this.effectLimit.justification = this.effectLimitJustification;
    this.bodyWeight.row = this.bodyWeightRow;
    this.bodyWeight.input = this.bodyWeightInput;
    this.bodyWeight.justification = this.bodyWeightJustification;
    this.species.row = this.speciesRow;
    this.species.input = this.speciesInput;
    this.species.justification = this.speciesJustification;
    this.safetyFactor.row = this.safetyFactorRow;
    this.safetyFactor.input = this.safetyFactorInput;
    this.safetyFactor.justification = this.safetyFactorJustification;
    this.studyDurationFactor.row = this.studyDurationFactorRow;
    this.studyDurationFactor.input = this.studyDurationFactorInput;
    this.studyDurationFactor.justification = this.studyDurationFactorJustification;
    this.severeToxicityFactor.row = this.severeToxicityFactorRow;
    this.severeToxicityFactor.input = this.severeToxicityFactorInput;
    this.severeToxicityFactor.justification = this.severeToxicityFactorJustification;
    this.noNoelFactor.row = this.noNoelFactorRow;
    this.noNoelFactor.input = this.noNoelFactorInput;
    this.noNoelFactor.justification = this.noNoelFactorJustification;
    this.pdeAlpha.row = this.pdeAlphaRow;
    this.pdeAlpha.input = this.pdeAlphaInput;
    this.pdeAlpha.justification = this.pdeAlphaJustification;
    this.pde.row = this.pdeRow;
    this.pde.input = this.pdeInput;
    this.pde.units = this.pdeUnits;
    this.pde.justification = this.pdeJustification;

    this.ready = true;
  }

  isMouseOrRat: boolean = false;

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
    this.isMouseOrRat =
        (this.species.options[i].label == 'rat' ||
         this.species.options[i].label == 'mouse');
    this.studyDurationFactor.isMouseOrRat = this.isMouseOrRat;

    this.pdeForm.formChange();
  }

  speciesClickCustom(): void {
    this.species.custom = true;
    this.isMouseOrRat = false;
    this.studyDurationFactor.isMouseOrRat = false;
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
    this.pdeForm.updateVars();
    let result = this.compositeFactorsTerm.getValue();
    if (result == null) return '';
    if (isCalculateError(result)) return '';
    return printNum(result.n);
  }
  getCompositeFactorsTooHigh(): boolean {
    if (!this.ready) return false;
    this.pdeForm.updateVars();
    let result = this.compositeFactorsTerm.getValue();
    if (result == null) return false;
    if (isCalculateError(result)) return false;
    return result.n > 5000;
  }
}
