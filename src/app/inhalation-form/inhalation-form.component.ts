import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { CalcService } from '../shared/calc.service';
import { ValidationService } from '../shared/validation.service';

import { Toxicology } from '../toxicology/toxicology';
import { ToxUnit } from '../toxicology/tox-unit';
import { ToxRatio } from '../toxicology/tox-ratio';
import { UnitTypes } from '../toxicology/unit-types.enum';

import { CONCEN_RATIOS_INHALATION, INTAKE_RATIOS_INHALATION, WEIGHT_RATIOS, DOSE_RATIOS_INHALATION, SATP_RATIO } from '../toxicology/UNIT_LISTS';

@Component({
    selector: 'app-inhalation-form',
    templateUrl: './inhalation-form.component.html',
    styleUrls: ['./inhalation-form.component.css'],
    providers: [
        CalcService,
        ValidationService
    ]
})
export class InhalationFormComponent implements OnInit {
    inhalationSubmitted = false;
    conversionSubmitted = false;
    //should probably rework the data model
    concenTox: Toxicology;
    intakeTox: Toxicology;
    weightTox: Toxicology;
    doseTox: Toxicology;

    concenUnitsVolVolOptions: ToxRatio[] = [
        {units: 'ppm', value: 1},
        {units: 'ppb', value: 0.001},
        {units: '%', value: 10000}
    ];

    concenUnitsMassVolOptions: ToxRatio[] = [
        {units: 'mg/m3', value: 1},
        {units: '\u03BCg/m3', value: 0.001},
        {units: 'mg/L', value: 1000},
        {units: '\u03BCg/L', value: 1}
    ];
    //TODO: move above to separate file

    concenUnitsOptions = CONCEN_RATIOS_INHALATION;
    intakeUnitsOptions = INTAKE_RATIOS_INHALATION;
    weightUnitsOptions = WEIGHT_RATIOS;
    doseUnitsOptions = DOSE_RATIOS_INHALATION;

    //molarMassNeeded = {required: true};

    concenModifiers: number[];
    intakeModifiers: number[];
    weightModifiers: number[];
    doseModifiers: number[];

    inhalationForm: FormGroup;
    conversionForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private calcService: CalcService,
        private validationService: ValidationService
    ) { }

    createConversionForm() {

        this.conversionForm = this.fb.group({
            concenVolVol: [null, this.validationService.nonNegative],
            concenUnitsVolVol: [''],
            concenMassVol: [null, this.validationService.nonNegative],
            concenUnitsMassVol: [''],
            molarMass: [null, Validators.compose([
                this.validationService.nonNegative,
                Validators.required
            ])]
        })

        this.conversionForm.patchValue({
            concenUnitsVolVol: this.concenUnitsVolVolOptions[0],
            concenUnitsMassVol: this.concenUnitsMassVolOptions[0]
        });
    }

    createInhalationForm() {

        this.inhalationForm = this.fb.group({
            concen: [null, this.validationService.nonNegative],
            concenUnits: [''],
            /*molarMass: [null, Validators.compose([
                this.validationService.nonNegative,
                this.validationService.conditionalRequired(this.molarMassNeeded)
            ])],*/
            intake: [null, this.validationService.nonNegative],
            intakeUnits: [''],
            weight: [null, this.validationService.nonNegative],
            weightUnits: [''],
            dose: [null, this.validationService.nonNegative],
            doseUnits: ['']
        }, {
            validator: this.validationService.coreValidation('concen', 'intake', 'weight', 'dose')
        })

        this.inhalationForm.patchValue({
            concenUnits: this.concenUnitsMassVolOptions[0],
            intakeUnits: this.intakeUnitsOptions[0],
            weightUnits: this.weightUnitsOptions[0],
            doseUnits: this.doseUnitsOptions[0]
        });

        //this.molarMassNeeded.required = true;
    }

    ngOnInit() {
        console.log('creating conversion form...');
        this.createConversionForm();
        console.log('conversion form created');

        console.log('creating inhalation form...');
        this.createInhalationForm();
        console.log('inhalation form created');

        this.concenTox = new Toxicology(new ToxUnit(UnitTypes.CONCENTRATION, new ToxRatio('ppm', 1)));
        this.intakeTox = new Toxicology(new ToxUnit(UnitTypes.INTAKE_RATE, new ToxRatio('m3/day', 1)));
        this.weightTox = new Toxicology(new ToxUnit(UnitTypes.BODY_WEIGHT, new ToxRatio('kg', 1)));
        this.doseTox = new Toxicology(new ToxUnit(UnitTypes.DOSE, new ToxRatio('mg/kg BW/day', 1)));

        this.concenModifiers = [];
        this.intakeModifiers = [];
        this.weightModifiers = [];
        this.doseModifiers = [];
    }

    calculate(): void {

        this.concenModifiers.push(this.inhalationForm.get('concenUnits')!.value.value);
        /*if (this.molarMassNeeded.required) {
            this.concenModifiers.push(this.inhalationForm.get('molarMass')!.value);
            this.concenModifiers.push(1/SATP_RATIO);
        }*/

        this.intakeModifiers.push(this.inhalationForm.get('intakeUnits')!.value.value);
        this.weightModifiers.push(this.inhalationForm.get('weightUnits')!.value.value);
        this.doseModifiers.push(this.inhalationForm.get('doseUnits')!.value.value);

        let concenMultiplier = this.calcService.calculateMultiplier(this.concenModifiers);
        let intakeMultiplier = this.calcService.calculateMultiplier(this.intakeModifiers);
        let weightMultiplier = this.calcService.calculateMultiplier(this.weightModifiers);
        let doseMultiplier = this.calcService.calculateMultiplier(this.doseModifiers);

        let response = this.calcService.calculate(
            this.inhalationForm.get('concen')!.value,
            concenMultiplier,
            this.inhalationForm.get('intake')!.value,
            intakeMultiplier,
            this.inhalationForm.get('weight')!.value,
            weightMultiplier,
            this.inhalationForm.get('dose')!.value,
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

        this.inhalationSubmitted = true;
    }
    //TODO: rename variables, move to calc.service
    convert() {
        let ratio1 = this.conversionForm.get('concenUnitsVolVol')!.value.value;
        let ratio2 = this.conversionForm.get('concenUnitsMassVol')!.value.value;
        let val1 = this.conversionForm.get('concenVolVol')!.value;
        let val2 = this.conversionForm.get('concenMassVol')!.value;
        let molMass = this.conversionForm.get('molarMass')!.value;
        if (!val1) {
            val1 = val2 * ratio2 * SATP_RATIO /  (molMass * ratio1);
            this.conversionForm.patchValue({
                concenVolVol: val1
            });
        } else if (!val2) {
            val2 = val1 * ratio1 * molMass / (SATP_RATIO * ratio2);
            this.conversionForm.patchValue({
                concenMassVol: val2
            });
            this.inhalationForm.patchValue({
                concen: val2,
                concenUnits: this.conversionForm.get('concenUnitsMassVol')!.value
            });
            this.inhalationSubmitted = false;
        }
    }

    clearConversion(): void {
        this.createConversionForm();
        this.conversionSubmitted = false;
    }

    clearInhalation(): void {
        this.createInhalationForm();
        this.inhalationSubmitted = false;
    }

}
