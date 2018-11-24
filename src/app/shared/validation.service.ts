import { Injectable } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors } from '@angular/forms';

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
        return (control: AbstractControl): ValidationErrors => {
            let group = <FormGroup>control;
            let concen = group.controls[concenKey].value;
            let intake = group.controls[intakeKey].value;
            let weight = group.controls[weightKey].value;
            let dose = group.controls[doseKey].value;

            if (this.countTruthy(concen, intake, weight, dose) != 3) {
                return {invalidValues: true};
            }
        }
    }

    validateBases(concenBaseKey: string, intakeBaseKey: string) {
        return (control: AbstractControl): ValidationErrors => {
            let group = <FormGroup>control;
            let concenBase = group.controls[concenBaseKey].value;
            let intakeBase = group.controls[intakeBaseKey].value;

            if (concenBase === 'volume/volume' && intakeBase === 'mass/time') {
                return {invalidBases: true};
            }
        }
    }

    conditionalRequired(condition: any) {
        return (abstract_control: AbstractControl): ValidationErrors => {
            let control = <FormControl>abstract_control;
            if (condition.required && !control.value) {
                return {required: true};
            }
        }
    }

    nonNegative(control: AbstractControl): ValidationErrors {
        if (control.value && control.value < 0) {
            console.log('negative value detected');
            return {invalidNegative: true};
        }
    }

    nonZero(control: AbstractControl): ValidationErrors {
        if (control.value === 0) {
            console.log('value cannot be zero');
            return {invalidZero: true};
        }
    }

}
