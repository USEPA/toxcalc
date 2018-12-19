import { ElementRef } from '@angular/core';

import { SdCalcRowComponent } from '../sd-calc-row/sd-calc-row.component';
import { SdSelectComponent } from '../sd-select/sd-select.component';

import { ScalarAndDimension } from './dimension';

import { Term, EquationPrinter, Variable } from './equation';

export abstract class Field {
  input: ElementRef<HTMLInputElement> | null = null;
  units: SdSelectComponent | null = null;
  row: SdCalcRowComponent;
  protected mVar: Variable = new Variable;
  public get var(): Variable { return this.mVar; }
  protected mTerm: Term;
  public get term(): Term { return this.mTerm; }
  public set term(t: Term) { this.mTerm = t; }
  readonly unit: ScalarAndDimension;
  readOnly: boolean = false;
  value: string = '';
  get hasError(): boolean { return this.row.errorText != ''; }

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
  readonly ONE = new ScalarAndDimension(1, null);
  updateVar(): void {
    if (!this.row.show) {
      this.var.setValue(this.ONE);
      return;
    }
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