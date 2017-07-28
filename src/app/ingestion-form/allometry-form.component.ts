import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

import { CalcService } from '../shared/calc.service';
import { ValidationService } from '../shared/validation.service';

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

    constructor(
        private fb: FormBuilder,
        private calcService: CalcService,
        private validationService: ValidationService
    ) { }

    ngOnInit() {
    }

}
