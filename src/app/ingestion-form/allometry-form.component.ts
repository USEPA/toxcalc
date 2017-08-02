import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

import { CalcService } from '../shared/calc.service';
import { ValidationService } from '../shared/validation.service';

declare let Math;

@Component({
    selector: 'app-allometry-form',
    templateUrl: './allometry-form.component.html',
    styleUrls: ['./allometry-form.component.css']
})
export class AllometryFormComponent implements OnInit {

    animalDose: number;
    animalWeight: number;
    humanDose: number;
    humanWeight: number;
    conversionFactor;

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

    createForm() {
        this.allometryForm = this.fb.group({
            animalDose: [null, [Validators.required, this.validationService.nonNegative]],
            animalWeight: [null, [Validators.required, this.validationService.nonNegative]],
            conversionFactor: [''],
            humanDose: [null, this.validationService.nonNegative],
            humanWeight: [null, [Validators.required, this.validationService.nonNegative]]
        });

        this.allometryForm.patchValue({
            conversionFactor: this.conversionFactorOptions[0]
        });
    }

    ngOnInit() {
        this.createForm();
    }

    hedConversion() {
        this.animalDose = this.allometryForm.get('animalDose').value;
        this.animalWeight = this.allometryForm.get('animalWeight').value;
        this.humanWeight = this.allometryForm.get('humanWeight').value;
        this.conversionFactor = this.allometryForm.get('conversionFactor').value.value;

        let kRatio = this.animalWeight / this.humanWeight;

        this.humanDose = this.animalDose * Math.pow(kRatio, this.conversionFactor);

        this.submitted = true;

    }

}
