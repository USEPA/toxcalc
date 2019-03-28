import { isDevMode } from '@angular/core';

import { SdCalculationLogComponent } from '../sd-calculation-log/sd-calculation-log.component';

import { Field } from './field';
import { isCalculateError } from './dimension';
import { EquationPrinter } from './equation';
import { printNum } from './number-util';

export class Form {
  constructor(public eqPrinter: EquationPrinter, public fields: Field[]) {}

  updateVars(): void {
    this.fields.forEach(function(f: Field) {
      f.updateVar();
    });
  }

  updateErrors(required: boolean): void {
    this.fields.filter(f => f.row.show).forEach(function(f: Field) {
      f.updateErrorState();
      if (required && !f.hasError && f.value === '') {
        f.row.errorText = 'Please fill in a number.';
      }
    });
  }

  hasErrors(): boolean {
    return this.fields.filter(f => f.row.show).some(function (f: Field) { return f.hasError; } );
  }

  internalError = '';

  equationSnippet = '';

  clear(): void {
    this.internalError = '';
    this.fields.forEach(function(f: Field) {
      f.clear();
    });
    this.equationSnippet = this.fields[this.fields.length - 1].equationSnippet(this.eqPrinter);
  }

  calculate(): void {
    this.updateErrors(false);

    let out_control: Field | null = null;
    const fields = this.fields.filter(f => f.row.show);
    for (let i = 0; i !== fields.length; ++i) {
      if (fields[i].isMarkedAsOutput() || fields[i].value === '') {
        if (out_control == null) {
          out_control = fields[i];
        } else {
          out_control = null;
          break;
        }
      }
    }

    if (!out_control) {
      // We might be here if there were multiple possible outputs found.
      // Wipe values and readonly state for all of them.
      for (let i = 0; i !== fields.length; ++i) {
        if (fields[i].isMarkedAsOutput()) {
          fields[i].unmarkAsOutput();
          fields[i].value = '';
        }
      }
      this.equationSnippet = fields[fields.length - 1].equationSnippet(this.eqPrinter);
      return;
    }

    out_control.markAsOutput();
    out_control.value = '';

    if (this.hasErrors()) {
      return;
    }

    this.updateVars();
    this.equationSnippet = out_control.equationSnippet(this.eqPrinter);

    const result = out_control.term.getValue();
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
      if (isDevMode()) {
        console.log(result.n);
        console.log(result.d);
        console.log(out_control.unit.n);
        console.log(out_control.unit.d);
      }
      return;
    }

    out_control.value = printNum(result.n / out_control.unit.n);
  }

  calculateAndLog(calculationLog: SdCalculationLogComponent): void {
    this.updateErrors(true);
    if (!this.hasErrors()) {
      calculationLog.append(
          this.fields.map(f => f.justification ? [f.logColumnName, 'Justification'] : [f.logColumnName]).reduce((accumulator, currentValue) => accumulator.concat(currentValue)),
          this.fields.map(f => f.justification ? [f.row.show ? f.logValue : 'n/a', f.justification.justification] : [f.row.show ? f.logValue : 'n/a']).reduce((accumulator, currentValue) => accumulator.concat(currentValue)));
    }
  }
}
