import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { CalcService } from '../shared/calc.service';
import { ValidationService } from '../shared/validation.service';

import { Toxicology } from '../toxicology/toxicology';
import { ToxUnit } from '../toxicology/tox-unit';
import { ToxRatio } from '../toxicology/tox-ratio';
import { UnitTypes } from '../toxicology/unit-types.enum';

@Component({
    selector: 'app-inhalation-form',
    templateUrl: './inhalation-form.component.html',
    styleUrls: ['./inhalation-form.component.css']
})
export class InhalationFormComponent implements OnInit {
    submitted = false;
    //should probably rework the data model
    concenTox: Toxicology;
    intakeTox: Toxicology;
    weightTox: Toxicology;
    doseTox: Toxicology;

    molarMassNeeded = {required: true};

    concenModifiers: number[];
    intakeModifiers: number[];
    weightModifiers: number[];
    doseModifiers: number[];

    STP_RATIO = 24.45; //move to another file
    inhalationForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private calcService: CalcService,
        private validationService: ValidationService
    ) { }

    createForm() {
        this.inhalationForm = this.fb.group({
            concen: [null, this.validationService.nonNegative],
            molarMass: [null, Validators.compose([
                this.validationService.nonNegative,
                this.validationService.conditionalRequired(this.molarMassNeeded)
            ])],
            intake: [null, this.validationService.nonNegative],
            weight: [null, this.validationService.nonNegative],
            dose: [null, this.validationService.nonNegative]
        }, {
            validator: this.validationService.coreValidation('concen', 'intake', 'weight', 'dose')
        })

        this.molarMassNeeded.required = true;
    }

    ngOnInit() {
        this.createForm();

        this.concenTox = new Toxicology(new ToxUnit(UnitTypes.CONCENTRATION, new ToxRatio('ppm', 1)), null);
        this.intakeTox = new Toxicology(new ToxUnit(UnitTypes.INTAKE_RATE, new ToxRatio('m3/day', 1)), null);
        this.weightTox = new Toxicology(new ToxUnit(UnitTypes.BODY_WEIGHT, new ToxRatio('kg', 1)), null);
        this.doseTox = new Toxicology(new ToxUnit(UnitTypes.DOSE, new ToxRatio('mg/kg BW/day', 1)), null);

        this.concenModifiers = [];
        this.intakeModifiers = [];
        this.weightModifiers = [];
        this.doseModifiers = [];
    }

    calculate(): void {
        
        if (this.molarMassNeeded.required) {
            this.concenModifiers.push(this.inhalationForm.get('molarMass').value);
            this.concenModifiers.push(1/24.45);
        }

        this.intakeModifiers.push(1);
        this.weightModifiers.push(1);
        this.doseModifiers.push(1);

        let concenMultiplier = this.calcService.calculateMultiplier(this.concenModifiers);
        let intakeMultiplier = this.calcService.calculateMultiplier(this.intakeModifiers);
        let weightMultiplier = this.calcService.calculateMultiplier(this.weightModifiers);
        let doseMultiplier = this.calcService.calculateMultiplier(this.doseModifiers);

        let response = this.calcService.newCalculate(
            this.inhalationForm.get('concen').value,
            concenMultiplier,
            this.inhalationForm.get('intake').value,
            intakeMultiplier,
            this.inhalationForm.get('weight').value,
            weightMultiplier,
            this.inhalationForm.get('dose').value,
            doseMultiplier
        );

        this.concenTox.inputData = response[0];
        this.intakeTox.inputData = response[1];
        this.weightTox.inputData = response[2];
        this.doseTox.inputData = response[3];

        this.inhalationForm.patchValue({
            concen: this.concenTox.inputData,
            intake: this.intakeTox.inputData,
            weight: this.weightTox.inputData,
            dose: this.doseTox.inputData
        });

        this.concenModifiers = [];
        this.intakeModifiers = [];
        this.weightModifiers = [];
        this.doseModifiers = [];

        this.submitted = true;
    }

    clear(): void {
        this.createForm();
        this.submitted = false;
    }

}
