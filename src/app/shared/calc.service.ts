import { Injectable, Inject } from '@angular/core';

import { Toxicology } from '../toxicology/toxicology';
import { ToxUnit } from '../toxicology/tox-unit';

@Injectable()
export class CalcService {

    calculateDose(toxicology: Toxicology): number {
        return toxicology.concen * toxicology.intake / toxicology.weight;
    }

    calculateConcen(toxicology: Toxicology): number {
        return toxicology.dose * toxicology.weight / toxicology.intake;
    }

    calculateIntake(toxicology: Toxicology): number {
        return toxicology.dose * toxicology.weight / toxicology.concen;
    }

    calculateWeight(toxicology: Toxicology): number {
        return toxicology.concen * toxicology.intake / toxicology.dose;
    }

    calculate(toxicology: Toxicology): Toxicology {
        if (!toxicology.dose) {
            toxicology.foundValue.variable = 'Dose';
            toxicology.dose = this.calculateDose(toxicology);
            toxicology.foundValue.value = toxicology.dose;
        } else if (!toxicology.concen) {
            toxicology.foundValue.variable = 'Concentration';
            toxicology.concen = this.calculateConcen(toxicology);
            toxicology.foundValue.value = toxicology.concen;
        } else if (!toxicology.intake) {
            toxicology.foundValue.variable = 'Intake ratio';
            toxicology.intake = this.calculateIntake(toxicology);
            toxicology.foundValue.value = toxicology.intake;
        } else if (!toxicology.weight) {
            toxicology.foundValue.variable = 'Body weight';
            toxicology.weight = this.calculateWeight(toxicology);
            toxicology.foundValue.value = toxicology.weight;
        }
        return toxicology;
    }

    //TODO: accept modifiers
    newCalculate(concen: number, intake: number, weight: number, dose: number): number[] {
        if (!concen) concen = dose * weight / intake;
        else if (!intake) intake = dose * weight / concen;
        else if (!weight) weight = concen * intake / dose;
        else if (!dose) dose = concen * intake / weight;
        return [concen, intake, weight, dose];
    }
}
