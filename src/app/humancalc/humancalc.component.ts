import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

import { SPECIES_CONVERSION } from '../toxicology/HED_FACTORS';

import { SdCalcRowComponent } from '../sd-calc-row/sd-calc-row.component';
import { SdSelectComponent } from '../sd-select/sd-select.component';
import { Dimension, ScalarAndDimension, isCalculateError } from '../shared/dimension';
import { Term, Equation, EquationPrinter, Variable } from '../shared/equation';

import { printNum } from '../shared/number-util';

abstract class Field {
  input: ElementRef<HTMLInputElement> | null = null;
  units: SdSelectComponent | null = null;
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

class Species extends Field {
  get value() { return this.select.value.species; }
  set value(unused) {}
  select: SdSelectComponent;
  updateErrorState(): void {}
  private readonly UNIT = new ScalarAndDimension(1, Dimension.initUnit());
  get unit(): ScalarAndDimension { return this.UNIT; }
  updateVar() {
    this.var.setValue(new ScalarAndDimension(this.select.value.factor, this.unit.d));
  }
}

class AnimalDose extends Field {
  private readonly PER_DAY = new ScalarAndDimension(1, Dimension.initTime().recip());
  get unit(): ScalarAndDimension { return this.PER_DAY; }
}

class HumanEquivalentDose extends Field {
  private readonly PER_DAY = new ScalarAndDimension(1, Dimension.initTime().recip());
  get unit(): ScalarAndDimension { return this.PER_DAY; }
}

//

class AnimalWeight extends Field {
  private readonly KG = new ScalarAndDimension(1000, Dimension.initMass());
  get unit(): ScalarAndDimension { return this.KG; }
}

class ConversionFactor extends Field {
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
          this.fields[i].input &&
          this.fields[i].input!.nativeElement != self) {
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

  fdaMethodForm = new Form(this.eqPrinter, this.animalSpecies, this.animalDose, this.humanEquivalentDose);

  @ViewChild('weightAnimalDoseRow') weightAnimalDoseRow: SdCalcRowComponent;
  @ViewChild('weightAnimalDoseInput') weightAnimalDoseInput: ElementRef<HTMLInputElement>;
  weightAnimalDose: AnimalDose = new AnimalDose;

  @ViewChild('animalWeightRow') animalWeightRow: SdCalcRowComponent;
  @ViewChild('animalWeightInput') animalWeightInput: ElementRef<HTMLInputElement>;
  animalWeight: AnimalWeight = new AnimalWeight;

  @ViewChild('humanWeightRow') humanWeightRow: SdCalcRowComponent;
  @ViewChild('humanWeightInput') humanWeightInput: ElementRef<HTMLInputElement>;
  humanWeight: AnimalWeight = new AnimalWeight;

  @ViewChild('conversionFactorRow') conversionFactorRow: SdCalcRowComponent;
  @ViewChild('conversionFactorSelect') conversionFactorSelect: SdSelectComponent;
  conversionFactor: ConversionFactor = new ConversionFactor;

  @ViewChild('weightHumanDoseRow') weightHumanDoseRow: SdCalcRowComponent;
  @ViewChild('weightHumanDoseInput') weightHumanDoseInput: ElementRef<HTMLInputElement>;
  weightHumanEquivalentDose: HumanEquivalentDose = new HumanEquivalentDose;

  weightMethodForm = new Form(this.eqPrinter, this.weightAnimalDose, this.animalWeight, this.humanWeight, this.conversionFactor, this.weightHumanEquivalentDose);

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
    {display: 'FDA Standard (0.33)', value: (1/3)},
    {display: 'EPA Standard (0.25)', value: (1/4)}
  ];

  constructor() {
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
