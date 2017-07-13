import { Injectable, Inject } from '@angular/core';

import { Toxicology } from '../toxicology/toxicology';
import { ToxUnit } from '../toxicology/tox-unit';

@Injectable()
export class CalcService {

    calculateMultiplier(array: number[]): number {
        var multiplier = 1;
        if (array.length == 0) return multiplier;
        for (var i in array) {
            multiplier *= array[i];
        }
        return multiplier;
    }

    newCalculate(
        concen: number, 
        concenMultiplier: number, 
        intake: number, 
        intakeMultiplier: number, 
        weight: number,
        weightMultiplier: number,
        dose: number,
        doseMultiplier: number
    ): number[] {
        if (!concen) concen = dose * doseMultiplier * weight * weightMultiplier / (intake * intakeMultiplier * concenMultiplier);
        else if (!intake) intake = dose * doseMultiplier * weight * weightMultiplier / (concen * concenMultiplier * intakeMultiplier);
        else if (!weight) weight = concen * concenMultiplier * intake * intakeMultiplier / (dose * doseMultiplier * weightMultiplier);
        else if (!dose) dose = concen * concenMultiplier * intake * intakeMultiplier / (weight * weightMultiplier * doseMultiplier);
        return [concen, intake, weight, dose];
    }
}
