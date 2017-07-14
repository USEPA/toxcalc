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
    {units: '\u03BCL/mL', value: 1000},
    {units: 'ppm (v/v)', value: 1},
    {units: 'ppb (v/v)', value: 0.001},
    {units: '% (v/v)', value: 10000}
];

export const CONCEN_RATIOS_MOL_VOL: ToxRatio[] = [
    {units: 'mol/L', value: 1000},
    {units: 'mmol/L', value: 1},
    {units: '\u03BCmol/L', value: 0.001}
];

export const CONCEN_RATIOS_MOL_MASS: ToxRatio[] = [
    {units: 'mol/kg', value: 1000},
    {units: 'mmol/kg', value: 1},
    {units: '\u03BCmol/kg', value: 0.001}
];

export const CONCEN_RATIOS_MASS_MASS: ToxRatio[] = [
    {units: 'mg/kg', value: 1},
    {units: '\u03BCg/kg', value: 0.001}
];

export const INTAKE_RATIOS_VOL_TIME: ToxRatio[] = [
    {units: 'L/day', value: 1},
    {units: 'mL/day', value: 0.001}
];

export const INTAKE_RATIOS_MASS_TIME: ToxRatio[] = [
    {units: 'kg/day', value: 1},
    {units: 'g/day', value: 0.001}
];

export const WEIGHT_RATIOS: ToxRatio[] = [
    {units: 'kg', value: 1},
    {units: 'g', value: 0.001}
];

export const DOSE_RATIOS: ToxRatio[] = [
    {units: 'mg/kg BW/day', value: 1},
    {units: '\u03BCg/kg BW/day', value: 0.001},
    {units: 'mol/kg BW/day', value: 1000},
    {units: 'mmol/kg BW/day', value: 1}
];
