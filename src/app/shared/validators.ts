import { FormGroup } from '@angular/forms';

export function validEntries(concenKey: string, intakeKey: string, weightKey: string, doseKey: string) {
    return (group: FormGroup): {[key: string]: any} => {
        let concen = group.controls[concenKey];
        let intake = group.controls[intakeKey];
        let weight = group.controls[weightKey];
        let dose = group.controls[doseKey];

        return {invalidEntries: true};
    }
}
