import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

import { CalcService } from '../shared/calc.service';
import { ValidationService } from '../shared/validation.service';

import { SPECIES_CONVERSION } from '../toxicology/HED_FACTORS';

@Component({
    selector: 'app-allometry-form',
    templateUrl: './allometry-form.component.html',
    styleUrls: ['./allometry-form.component.css']
})
export class AllometryFormComponent implements OnInit {

    @Input() animalDose: number;
    @Input() animalWeight: number;
    humanDose: number;
    speciesOptions = SPECIES_CONVERSION;
    humanWeight: number;
    conversionFactor: number;

    weightNeeded = {required: true};

    submitted = false;

    conversionFactorOptions = [
        {display: 'FDA Standard (0.33)', value: (1/3)},
        {display: 'EPA Standard (0.25)', value: (1/4)}
    ];

    allometryForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private calcService: CalcService,
        private validationService: ValidationService
    ) { }

    // syntax of fb.group
    // inputFieldName: [initialValue, [validator1, validator2...]],
    createForm() {
        this.allometryForm = this.fb.group({
            animalDose: [null, [Validators.required, this.validationService.nonNegative, this.validationService.nonZero]],
            animalWeight: [null, [this.validationService.conditionalRequired(this.weightNeeded), this.validationService.nonNegative]],
            conversionFactor: [''],
            animalSpecies: [''],
            humanDose: [null, this.validationService.nonNegative],
            humanWeight: [null, [this.validationService.conditionalRequired(this.weightNeeded), this.validationService.nonNegative]]
        });

        // only update some values
        this.allometryForm.patchValue({
            animalDose: this.animalDose,
            animalWeight: this.animalWeight,
            conversionFactor: this.conversionFactorOptions[0],
            animalSpecies: this.speciesOptions[0]
        });

        this.weightNeeded.required = true;
    }

    ngOnInit() {
        this.createForm();
    }

    onSpeciesChange(event: Event) {
        this.weightNeeded.required = !this.allometryForm.get('animalSpecies').value.factor;
        this.allometryForm.controls.animalWeight.updateValueAndValidity();
        this.allometryForm.controls.humanWeight.updateValueAndValidity();
        console.log(this.weightNeeded.required);
    }

    // TODO: move to calc service? integrate toxicology data structures?
    hedConversion() {
        this.animalDose = this.allometryForm.get('animalDose').value;
        if (this.weightNeeded.required) {
            this.animalWeight = this.allometryForm.get('animalWeight').value;
            this.humanWeight = this.allometryForm.get('humanWeight').value;
            this.conversionFactor = this.allometryForm.get('conversionFactor').value.value;

            let kRatio = this.animalWeight / this.humanWeight;

            this.humanDose = this.animalDose * Math.pow(kRatio, this.conversionFactor);
        } else {
            this.humanDose = this.animalDose / this.allometryForm.get('animalSpecies').value.factor;
        }

        this.submitted = true;

    }

    speciesConversion() {

    }

    clear() {
        this.animalDose = 0; // otherwise it would keep the old value
        this.animalWeight = 0;
        this.createForm();
        this.submitted = false;
    }
}
