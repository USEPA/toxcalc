import { UnitTypes } from './unit-types.enum';
import { ToxRatio } from './tox-ratio';

export class ToxUnit {
    unitType: UnitTypes;
    ratio: ToxRatio;

    constructor(unitType: UnitTypes, ratio: ToxRatio) { }
}
