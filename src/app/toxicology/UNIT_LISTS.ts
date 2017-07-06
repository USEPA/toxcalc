import { ToxRatio } from './tox-ratio';

export const CONCEN_RATIOS_MASS_VOL = [
    {MG_PER_LITRE: new ToxRatio('mg/L', 1)},
    {GRAM_PER_LITRE: new ToxRatio('g/L', 1000)},
    {MICROG_PER_LITRE: new ToxRatio('\u03BCg/L', 0.001)},
    {PPM_WEIGHT_VOL: new ToxRatio('ppm (w/v)', 1)},
    {PPB_wEIGHT_VOL: new ToxRatio('ppb (w/v)', 0.001)},
    {PERCENT_WEIGHT_VOL: new ToxRatio('% (w/v)', 10000)}
];

export const CONCEN_RATIOS_VOL_VOL = [
    {ML_PER_LITRE: new ToxRatio('mL/L', 1000)},
    {MICROL_PER_LITRE: new ToxRatio('\u03BCL/L', 1)},
    {MICROL_PER_ML: new ToxRatio('\u03BCL/mL', 1000)}
];

export const INTAKE_RATIOS = [
    {LITRE_PER_DAY: new ToxRatio('L/day', 1)},
    {ML_PER_DAY: new ToxRatio('mL/day', 0.001)}
];

export const WEIGHT_RATIOS = [
    {KILOGRAM: new ToxRatio('kg', 1)},
    {GRAM: new ToxRatio('g', 0.001)}
];
