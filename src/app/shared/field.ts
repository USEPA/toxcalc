// ToxCalc! by Safe Dose © 2018-2021. See LICENSE file for details.
// SPDX-License-Identifier: GPL-3.0-or-later

import { ElementRef } from '@angular/core';

import { SdCalcRowComponent } from '../sd-calc-row/sd-calc-row.component';
import { SdJustificationComponent } from '../sd-justification/sd-justification.component';
import { SdSelectComponent } from '../sd-select/sd-select.component';

import { ScalarAndDimension } from './dimension';

import { Term, EquationPrinter, Variable } from './equation';

import { removeSoftHyphen } from './string-util';

export abstract class Field {
  input: ElementRef<HTMLInputElement> | null = null;
  units: SdSelectComponent | null = null;
  row: SdCalcRowComponent;
  justification: SdJustificationComponent | null = null;

  protected mVar: Variable = new Variable;
  public get var(): Variable { return this.mVar; }
  protected mTerm: Term;
  public get term(): Term { return this.mTerm; }
  public set term(t: Term) { this.mTerm = t; }
  abstract get unit(): ScalarAndDimension;

  output = false;
  markAsOutput(): void { this.output = true; }
  unmarkAsOutput(): void { this.output = false; }
  isMarkedAsOutput(): boolean { return this.output; }

  clear(): void {
    this.row.errorText = '';
    this.unmarkAsOutput();
    this.value = '';
  }

  value_ = '';
  get value(): string { return this.value_; }
  set value(v: string) { this.value_ = v; }
  get hasError(): boolean { return this.row.errorText !== ''; }
  abstract get label(): string;
  get logColumnName(): string { return this.label; }
  get equationVarName(): string { return removeSoftHyphen(this.logColumnName); }
  get logValue(): string { return [this.value, this.unitName, this.isMarkedAsOutput() ? '(calculated)' : ''].filter(txt => txt.length > 0).join(' '); }
  get unitName(): string { return this.units!.selectedName; }

  // Only look for errors that are certainly wrong given the state of this field,
  // ignoring the state of the of the rest of the form.
  updateErrorState(): void {
    if (this.isMarkedAsOutput() || this.value === '') {
      this.row.errorText = '';
      return;
    }
    if (this.value.match(/.*\..*\..*/)) {
      this.row.errorText = 'One decimal point maximum.';
      return;
    }
    const value = parseFloat(this.value);
    if (isNaN(value)) {
      this.row.errorText = 'Must be a number.';
      return;
    }
    if (value <= 0) {
      this.row.errorText = 'Must be greater than zero.';
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
    if (this.value === '') {
      this.var.setValue(null);
      return;
    }
    this.var.setValue(new ScalarAndDimension(parseFloat(this.value) * this.unit.n, this.unit.d));
  }

  equationSnippet(eqPrinter: EquationPrinter) {
    return eqPrinter.print(this.var, this.term);
  }
}
