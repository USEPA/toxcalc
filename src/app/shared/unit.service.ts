import { Injectable } from '@angular/core';
import math from 'mathjs';

declare let math;

@Injectable()
export class UnitService {

    constructor() { }

    standardConcen(value: number, topUnits: string, bottomUnits: string): number {
        return this.standardConcenWeightVol(value, topUnits, bottomUnits);
    }

    standardConcenWeightVol(value: number, topUnits: string, bottomUnits: string): number {
        let input = math.unit(value, topUnits + '/' + bottomUnits);
        console.log(input);
        return 1;
    }

}
