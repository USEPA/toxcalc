import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

import { SdCalcRowComponent } from '../sd-calc-row/sd-calc-row.component';
import { SdSelectComponent } from '../sd-select/sd-select.component';
import { Dimension, ScalarAndDimension, isCalculateError } from '../shared/dimension';
import { Field } from '../shared/field';
import { Form } from '../shared/form';
import { Term, Equation, EquationPrinter, Variable } from '../shared/equation';

import { printNum } from '../shared/number-util';

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

@Component({
  selector: 'app-bioavailcalc',
  templateUrl: './bioavailcalc.component.html',
  styleUrls: ['./bioavailcalc.component.css']
})
export class BioavailCalcComponent implements AfterViewInit {
  variableMap: Map<Variable, string> = new Map();
  eqPrinter: EquationPrinter = new EquationPrinter(this.variableMap);

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
    const bcfeq = new Equation(Equation.div(this.bioavailabilityPDE.var, Equation.mul(this.bioavailabilityCriticalStudy.var, this.alpha.var)), Equation.constantFromNumber(1));
    this.bioavailabilityPDE.term = (<Equation>bcfeq.solve(this.bioavailabilityPDE.var)).RHS;
    this.bioavailabilityCriticalStudy.term = (<Equation>bcfeq.solve(this.bioavailabilityCriticalStudy.var)).RHS;
    this.alpha.term = (<Equation>bcfeq.solve(this.alpha.var)).RHS;
    this.variableMap.set(this.bioavailabilityPDE.var, this.bioavailabilityPDE.equationVarName);
    this.variableMap.set(this.bioavailabilityCriticalStudy.var, this.bioavailabilityCriticalStudy.equationVarName);
    this.variableMap.set(this.alpha.var, this.alpha.equationVarName);
    this.bcfForm.equationSnippet = this.alpha.equationSnippet(this.eqPrinter);
  }

  ngAfterViewInit() {
    this.bioavailabilityPDE.row = this.bioavailabilityPDERow;
    this.bioavailabilityPDE.input = this.bioavailabilityPDEInput;
    this.bioavailabilityCriticalStudy.row = this.bioavailabilityCriticalStudyRow;
    this.bioavailabilityCriticalStudy.input = this.bioavailabilityCriticalStudyInput;
    this.alpha.row = this.alphaRow;
    this.alpha.input = this.alphaInput;
  }
}
