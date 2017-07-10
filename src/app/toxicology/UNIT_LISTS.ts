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
    {units: 'mL/L', value: 1000},
    {units: '\u03BCL/L', value: 1},
    {units: '\u03BCL/mL', value: 1000}
];

export const INTAKE_RATIOS: ToxRatio[] = [
    {units: 'L/day', value: 1},
    {units: 'mL/day', value: 0.001}
];

export const WEIGHT_RATIOS: ToxRatio[] = [
    {units: 'kg', value: 1},
    {units: 'g', value: 0.001}
];
