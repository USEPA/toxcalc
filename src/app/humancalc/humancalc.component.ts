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
  get logValue(): string { return this.select.value.species + ' (' + printNum(this.select.value.factor) + ')'; }
  select: SdSelectComponent;
  updateErrorState(): void {}
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
  updateVar() {
    this.var.setValue(new ScalarAndDimension(this.select.value.factor, this.unit.d));
  }
}

class AnimalDose extends Field {
  get label(): string { return 'Animal dose administered'; }
  get unitName(): string { return 'mg/kg BW/day'; }
  private readonly PER_DAY = new ScalarAndDimension(1, Dimension.initTime().recip());
  get unit(): ScalarAndDimension { return this.PER_DAY; }
}

class HumanEquivalentDose extends Field {
  get label(): string { return 'Human equivalent dose'; }
  get unitName(): string { return 'mg/kg BW/day'; }
  private readonly PER_DAY = new ScalarAndDimension(1, Dimension.initTime().recip());
  get unit(): ScalarAndDimension { return this.PER_DAY; }
}

//

class AnimalWeight extends Field {
  constructor(readonly label: string) { super(); }
  get unitName(): string { return 'kg'; }
  private readonly KG = new ScalarAndDimension(1000, Dimension.initMass());
  get unit(): ScalarAndDimension { return this.KG; }
}

class ConversionFactor extends Field {
  get label(): string { return 'Use the conversion factor recommended by'; }
  get unitName(): string { return this.select.value.logunit; }
  get value() { return this.select.value.display; }
  set value(unused) {}
  select: SdSelectComponent;
  updateErrorState(): void {}
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
  updateVar() {
    this.var.setValue(new ScalarAndDimension(this.select.value.value, this.unit.d));
  }
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
  @ViewChild('animalWeightInput') animalWeightInput: ElementRef<HTMLInputElement>;
  animalWeight: AnimalWeight = new AnimalWeight('Body weight of animal');

  @ViewChild('humanWeightRow') humanWeightRow: SdCalcRowComponent;
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
    this.animalWeight.row = this.animalWeightRow;
    this.humanWeight.input = this.humanWeightInput;
    this.humanWeight.row = this.humanWeightRow;
    this.conversionFactor.select = this.conversionFactorSelect;
    this.conversionFactor.row = this.conversionFactorRow;
    this.weightHumanEquivalentDose.input = this.weightHumanDoseInput;
    this.weightHumanEquivalentDose.row = this.weightHumanDoseRow;
  }

  speciesOptions = SPECIES_CONVERSION;

  conversionFactorOptions = [
    {display: 'FDA Standard (0.33)', value: (1/3), logvalue: '0.33', logunit: '(FDA standard)'},
    {display: 'EPA Standard (0.25)', value: (1/4), logvalue: '0.25', logunit: '(EPA standard)'}
  ];

  constructor() {
    library.add(faFilePdf);

    let fdaMethodEq = new Equation(Equation.div(this.animalDose.var, Equation.mul(this.animalSpecies.var, this.humanEquivalentDose.var)), Equation.constantFromNumber(1));
    // Skip animalSpecies, it's never an output.
    this.animalDose.term = (<Equation>fdaMethodEq.solve(this.animalDose.var)).RHS;
    this.humanEquivalentDose.term = (<Equation>fdaMethodEq.solve(this.humanEquivalentDose.var)).RHS;

    this.variableMap.set(this.animalSpecies.var, printNum(SPECIES_CONVERSION[0].factor));
    this.variableMap.set(this.animalDose.var, 'Animal dose administered');
    this.variableMap.set(this.humanEquivalentDose.var, 'Human equivalent dose');

    this.fdaMethodForm.equationSnippet = this.humanEquivalentDose.equationSnippet(this.eqPrinter);

    let weightMethodEq = new Equation(Equation.div(Equation.mul(this.weightAnimalDose.var, Equation.exp(Equation.div(this.animalWeight.var, this.humanWeight.var), this.conversionFactor.var)), this.weightHumanEquivalentDose.var), Equation.constantFromNumber(1));
    this.weightAnimalDose.term = (<Equation>weightMethodEq.solve(this.weightAnimalDose.var)).RHS;
    this.animalWeight.term = (<Equation>weightMethodEq.solve(this.animalWeight.var)).RHS;
    this.humanWeight.term = (<Equation>weightMethodEq.solve(this.humanWeight.var)).RHS;
    // Skip conversionFactor, it's never an output.
    this.weightHumanEquivalentDose.term = (<Equation>weightMethodEq.solve(this.weightHumanEquivalentDose.var)).RHS;

    this.variableMap.set(this.weightAnimalDose.var, 'Animal dose administered');
    this.variableMap.set(this.animalWeight.var, 'Body weight of animal');
    this.variableMap.set(this.humanWeight.var, 'Body weight of human');
    this.variableMap.set(this.conversionFactor.var, '0.33');
    this.variableMap.set(this.weightHumanEquivalentDose.var, 'Human equivalent dose');

    this.weightMethodForm.equationSnippet = this.weightHumanEquivalentDose.equationSnippet(this.eqPrinter);
  }

  changeSpecies(): void {
    this.variableMap.set(this.animalSpecies.var, printNum(this.animalSpecies.select.value.factor));
    this.fdaMethodForm.formChange();
  }

  changeConversionFactor(): void {
    this.variableMap.set(this.conversionFactor.var, this.conversionFactor.select.value === this.conversionFactorOptions[0] ? '0.33' : '0.25');
    this.weightMethodForm.formChange();
  }
}
