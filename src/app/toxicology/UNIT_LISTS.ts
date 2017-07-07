import { ToxRatio } from './tox-ratio';

export const CONCEN_RATIOS_MASS_VOL: ToxRatio[] = [
    {units: 'mg/L', value: 1},
    {units: 'g/L', value: 1000},
    {units: '\u03BCg/L', value: 0.001},
    {units: 'ppm (w/v)', value: 1},
    {units: 'ppb (w/v)', value: 0.001},
    {units: '% (w/v)', value: 10000}
];

export const CONCEN_RATIOS_VOL_VOL: ToxRatio[] = [
    new ToxRatio('mL/L', 1000),
    new ToxRatio('\u03BCL/L', 1),
    new ToxRatio('\u03BCL/mL', 1000)
];

export const INTAKE_RATIOS: ToxRatio[] = [
    new ToxRatio('L/day', 1),
    new ToxRatio('mL/day', 0.001)
];

export const WEIGHT_RATIOS: ToxRatio[] = [
    new ToxRatio('kg', 1),
    new ToxRatio('g', 0.001)
];
