import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons';

import { SPECIES_CONVERSION } from '../toxicology/HED_FACTORS';

import { SdCalcRowComponent } from '../sd-calc-row/sd-calc-row.component';
import { SdSelectComponent } from '../sd-select/sd-select.component';
import { Dimension, ScalarAndDimension, isCalculateError } from '../shared/dimension';
import { Field } from '../shared/field';
import { Form } from '../shared/form';
import { Term, Equation, EquationPrinter, Variable } from '../shared/equation';

import { printNum } from '../shared/number-util';

class Species extends Field {
  get label(): string { return 'Species of animal'; }
  get unitName(): string { return ''; }
  get value() { return this.select.value.species; }
  set value(unused) {}
  get equationVarName(): string { return printNum(this.select ? this.select.value.factor : this.options[0].factor); }
  get logValue(): string { return this.select.value.species + ' (' + printNum(this.select.value.factor) + ')'; }
  select: SdSelectComponent;
  updateErrorState(): void {}
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
  updateVar() {
    this.var.setValue(new ScalarAndDimension(this.select.value.factor, this.unit.d));
  }

  readonly options = SPECIES_CONVERSION;
}

class AnimalDose extends Field {
  get label(): string { return 'Animal dose administered'; }
  get unitName(): string { return 'mg/kg BW/day'; }
  private readonly PER_DAY = new ScalarAndDimension(0.000001, Dimension.initTime().recip());
  get unit(): ScalarAndDimension { return this.PER_DAY; }
}

class HumanEquivalentDose extends Field {
  get label(): string { return 'Human equivalent dose'; }
  get unitName(): string { return 'mg/kg BW/day'; }
  private readonly PER_DAY = new ScalarAndDimension(0.000001, Dimension.initTime().recip());
  get unit(): ScalarAndDimension { return this.PER_DAY; }
}

//

class AnimalWeight extends Field {
  constructor(readonly label: string) { super(); }
  get unitName(): string { return this.units!.selectedName; }
  private readonly G = new ScalarAndDimension(1, Dimension.initMass());
  private readonly KG = new ScalarAndDimension(1000, Dimension.initMass());
  get unit(): ScalarAndDimension {
    return this.units!.selectedName === 'g' ? this.G : this.KG;
  }
}

class ConversionFactor extends Field {
  get label(): string { return 'Use the conversion factor recommended by'; }
  get logColumnName(): string { return 'Conversion factor'; }
  get equationVarName(): string { return (!this.select || this.select.value === this.options[0]) ? '0.33' : '0.25'; }
  get logValue(): string { return this.select.value.logvalue; }
  get value() { return this.select.value.display; }
  set value(unused) {}
  select: SdSelectComponent;
  updateErrorState(): void {}
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
  updateVar() {
    this.var.setValue(new ScalarAndDimension(this.select.value.value, this.unit.d));
  }

  readonly options = [
    {display: 'FDA Standard (0.33)', value: (1 / 3), logvalue: '0.33 (FDA standard)'},
    {display: 'EPA Standard (0.25)', value: (1 / 4), logvalue: '0.25 (EPA standard)'}
  ];
}

@Component({
    selector: 'app-humancalc',
    templateUrl: './humancalc.component.html',
    styleUrls: ['./humancalc.component.css']
})
export class HumanCalcComponent implements AfterViewInit {
  variableMap: Map<Variable, string> = new Map();
  eqPrinter: EquationPrinter = new EquationPrinter(this.variableMap);

  @ViewChild('animalSpeciesRow') animalSpeciesRow: SdCalcRowComponent;
  @ViewChild('animalSpeciesSelect') animalSpeciesSelect: SdSelectComponent;
  animalSpecies: Species = new Species;

  @ViewChild('animalDoseRow') animalDoseRow: SdCalcRowComponent;
  @ViewChild('animalDoseInput') animalDoseInput: ElementRef<HTMLInputElement>;
  animalDose: AnimalDose = new AnimalDose;

  @ViewChild('humanDoseRow') humanDoseRow: SdCalcRowComponent;
  @ViewChild('humanDoseInput') humanDoseInput: ElementRef<HTMLInputElement>;
  humanEquivalentDose: HumanEquivalentDose = new HumanEquivalentDose;

  fdaMethodForm = new Form(this.eqPrinter, [this.animalSpecies, this.animalDose, this.humanEquivalentDose]);

  @ViewChild('weightAnimalDoseRow') weightAnimalDoseRow: SdCalcRowComponent;
  @ViewChild('weightAnimalDoseInput') weightAnimalDoseInput: ElementRef<HTMLInputElement>;
  weightAnimalDose: AnimalDose = new AnimalDose;

  @ViewChild('animalWeightRow') animalWeightRow: SdCalcRowComponent;
  @ViewChild('animalWeightUnits') animalWeightUnits: SdSelectComponent;
  @ViewChild('animalWeightInput') animalWeightInput: ElementRef<HTMLInputElement>;
  animalWeight: AnimalWeight = new AnimalWeight('Body weight of animal');

  @ViewChild('humanWeightRow') humanWeightRow: SdCalcRowComponent;
  @ViewChild('humanWeightUnits') humanWeightUnits: SdSelectComponent;
  @ViewChild('humanWeightInput') humanWeightInput: ElementRef<HTMLInputElement>;
  humanWeight: AnimalWeight = new AnimalWeight('Body weight of human');

  @ViewChild('conversionFactorRow') conversionFactorRow: SdCalcRowComponent;
  @ViewChild('conversionFactorSelect') conversionFactorSelect: SdSelectComponent;
  conversionFactor: ConversionFactor = new ConversionFactor;

  @ViewChild('weightHumanDoseRow') weightHumanDoseRow: SdCalcRowComponent;
  @ViewChild('weightHumanDoseInput') weightHumanDoseInput: ElementRef<HTMLInputElement>;
  weightHumanEquivalentDose: HumanEquivalentDose = new HumanEquivalentDose;

  weightMethodForm = new Form(this.eqPrinter, [this.weightAnimalDose, this.animalWeight, this.humanWeight, this.conversionFactor, this.weightHumanEquivalentDose]);

  ngAfterViewInit() {
    this.animalSpecies.select = this.animalSpeciesSelect;
    this.animalSpecies.row = this.animalSpeciesRow;
    this.animalDose.input = this.animalDoseInput;
    this.animalDose.row = this.animalDoseRow;
    this.humanEquivalentDose.input = this.humanDoseInput;
    this.humanEquivalentDose.row = this.humanDoseRow;

    this.weightAnimalDose.input = this.weightAnimalDoseInput;
    this.weightAnimalDose.row = this.weightAnimalDoseRow;
    this.animalWeight.input = this.animalWeightInput;
    this.animalWeight.units = this.animalWeightUnits;
    this.animalWeight.row = this.animalWeightRow;
    this.humanWeight.input = this.humanWeightInput;
    this.humanWeight.units = this.humanWeightUnits;
    this.humanWeight.row = this.humanWeightRow;
    this.conversionFactor.select = this.conversionFactorSelect;
    this.conversionFactor.row = this.conversionFactorRow;
    this.weightHumanEquivalentDose.input = this.weightHumanDoseInput;
    this.weightHumanEquivalentDose.row = this.weightHumanDoseRow;
  }

  constructor() {
    library.add(faFilePdf);

    const fdaMethodEq = new Equation(Equation.div(this.animalDose.var, Equation.mul(this.animalSpecies.var, this.humanEquivalentDose.var)), Equation.constantFromNumber(1));
    // Skip animalSpecies, it's never an output.
    this.animalDose.term = (<Equation>fdaMethodEq.solve(this.animalDose.var)).RHS;
    this.humanEquivalentDose.term = (<Equation>fdaMethodEq.solve(this.humanEquivalentDose.var)).RHS;

    this.variableMap.set(this.animalSpecies.var, this.animalSpecies.equationVarName);
    this.variableMap.set(this.animalDose.var, this.animalDose.equationVarName);
    this.variableMap.set(this.humanEquivalentDose.var, this.humanEquivalentDose.equationVarName);

    this.fdaMethodForm.equationSnippet = this.humanEquivalentDose.equationSnippet(this.eqPrinter);

    const weightMethodEq = new Equation(Equation.div(Equation.mul(this.weightAnimalDose.var, Equation.exp(Equation.div(this.animalWeight.var, this.humanWeight.var), this.conversionFactor.var)), this.weightHumanEquivalentDose.var), Equation.constantFromNumber(1));
    this.weightAnimalDose.term = (<Equation>weightMethodEq.solve(this.weightAnimalDose.var)).RHS;
    this.animalWeight.term = (<Equation>weightMethodEq.solve(this.animalWeight.var)).RHS;
    this.humanWeight.term = (<Equation>weightMethodEq.solve(this.humanWeight.var)).RHS;
    // Skip conversionFactor, it's never an output.
    this.weightHumanEquivalentDose.term = (<Equation>weightMethodEq.solve(this.weightHumanEquivalentDose.var)).RHS;

    this.variableMap.set(this.weightAnimalDose.var, this.weightAnimalDose.equationVarName);
    this.variableMap.set(this.animalWeight.var, this.animalWeight.equationVarName);
    this.variableMap.set(this.humanWeight.var, this.humanWeight.equationVarName);
    this.variableMap.set(this.conversionFactor.var, this.conversionFactor.equationVarName);
    this.variableMap.set(this.weightHumanEquivalentDose.var, this.weightHumanEquivalentDose.equationVarName);

    this.weightMethodForm.equationSnippet = this.weightHumanEquivalentDose.equationSnippet(this.eqPrinter);
  }

  changeSpecies(): void {
    this.variableMap.set(this.animalSpecies.var, this.animalSpecies.equationVarName);
    this.fdaMethodForm.calculate();
  }

  changeConversionFactor(): void {
    this.variableMap.set(this.conversionFactor.var, this.conversionFactor.equationVarName);
    this.weightMethodForm.calculate();
  }

  changeAnimalWeightUnits(): void {
    this.weightMethodForm.calculate();
  }

  changeHumanWeightUnits(): void {
    this.weightMethodForm.calculate();
  }
}
