import { ToxUnit } from './tox-unit';

export class Toxicology {
    //TODO: remove these, replace with instance of ToxUnit
    dose: number;
    concen: number;
    intake: number;
    weight: number;


    toxUnit: ToxUnit;
    inputData: number;

    constructor(toxUnit: ToxUnit, inputData: number) { }

    //TODO: remove
    foundValue = {'variable': '', 'value': null};
}
