import { Injectable } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

@Injectable()
export class ValidationService {

    constructor() { }

    countTruthy(...args: any[]): number {
        var count = 0;
        for (var arg in args) {
            if (args[arg]) count++;
        }
        return count;
    }

    coreValidation(concenKey: string, intakeKey: string, weightKey: string, doseKey: string) {
        return (group: FormGroup): {[key: string]: any} => {
            let concen = group.controls[concenKey].value;
            let intake = group.controls[intakeKey].value;
            let weight = group.controls[weightKey].value;
            let dose = group.controls[doseKey].value;

            if (this.countTruthy(concen, intake, weight, dose) != 3) {
                console.log('core validation error detected');
                return {invalidValues: true};
            }
        }
    }

    validateBases(concenBaseKey: string, intakeBaseKey: string) {
        return (group: FormGroup): {[key: string]: any} => {
            let concenBase = group.controls[concenBaseKey].value;
            let intakeBase = group.controls[intakeBaseKey].value;

            if ((concenBase === 'mass/mass' || concenBase === 'mol/mass') && intakeBase === 'volume/time') {
                console.log('base error detected');
                return {invalidBases: true};
            }
        }
    }

    validateModifiers(control: FormControl, required: boolean): {[key: string]: any} {
        if (!control.value && required) {
            return {invalidModifier: true};
        }
    }

    nonNegative(control: FormControl): {[key: string]: any} {
        if (control.value && control.value < 0) {
            console.log('negative value detected');
            return {invalidNegative: true};
        }
    }

}
