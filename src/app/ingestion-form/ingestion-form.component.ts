import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { Toxicology } from '../toxicology/toxicology';
import { CalcService } from '../shared/calc.service';
import { ValidationService } from '../shared/validation.service';
import { ToxUnit } from '../toxicology/tox-unit';
import { ToxRatio } from '../toxicology/tox-ratio';
import { UnitTypes } from '../toxicology/unit-types.enum';
import { CONCEN_RATIOS_MASS_VOL, CONCEN_RATIOS_VOL_VOL, CONCEN_RATIOS_MOL_VOL, CONCEN_RATIOS_MOL_MASS, CONCEN_RATIOS_MASS_MASS, INTAKE_RATIOS_VOL_TIME, INTAKE_RATIOS_MASS_TIME, WEIGHT_RATIOS, DOSE_RATIOS } from '../toxicology/UNIT_LISTS';

@Component({
    selector: 'app-ingestion-form',
    templateUrl: './ingestion-form.component.html',
    styleUrls: ['./ingestion-form.component.css'],
    providers: [
        CalcService,
        ValidationService
    ]
})
export class IngestionFormComponent implements OnInit {
    concenTox: Toxicology;
    intakeTox: Toxicology;
    weightTox: Toxicology;
    doseTox: Toxicology;
    concenUnitsMassVolOptions = CONCEN_RATIOS_MASS_VOL;
    concenUnitsVolVolOptions = CONCEN_RATIOS_VOL_VOL;
    concenUnitsMolVolOptions = CONCEN_RATIOS_MOL_VOL;
    concenUnitsMolMassOptions = CONCEN_RATIOS_MOL_MASS;
    concenUnitsMassMassOptions = CONCEN_RATIOS_MASS_MASS;
    intakeUnitsVolTimeOptions = INTAKE_RATIOS_VOL_TIME;
    intakeUnitsMassTimeOptions = INTAKE_RATIOS_MASS_TIME;
    weightUnitsOptions = WEIGHT_RATIOS;
    doseUnitsOptions = DOSE_RATIOS;
    molarMassNeeded = false;
    substanceDensityNeeded = false;
    solutionDensityNeeded = false;
    submitted = false;

    pastToxicology: Toxicology[]; //TODO: find a way to implement history

    concenModifiers: number[];
    intakeModifiers: number[];
    weightModifiers: number[];
    doseModifiers: number[];

    concenUnitsTypeOptions = ['mass/volume', 'volume/volume', 'mol/volume', 'mol/mass', 'mass/mass'];
    intakeUnitsTypeOptions = ['volume/time', 'mass/time'];

    ingestionForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private calcService: CalcService,
        private validationService: ValidationService
    ) { }

    createForm() {
        this.ingestionForm = this.fb.group({
            concen: [null, this.validationService.nonNegative],
            concenUnitsType: ['mass/volume'],
            concenUnitsMassVol: [''],//, Validators.required], 
            concenUnitsVolVol: [''],//, Validators.required],
            concenUnitsMolVol: [''],
            concenUnitsMolMass: [''],
            concenUnitsMassMass: [''],
            substanceDensity: [null, this.validationService.nonNegative],
            solutionDensity: [null, this.validationService.nonNegative],
            molarMass: [null, this.validationService.nonNegative], 
            intake: [null, this.validationService.nonNegative],
            intakeUnitsType: ['volume/time'],
            intakeUnitsVolTime: [''],//, Validators.required],
            intakeUnitsMassTime: [''],
            weight: [null, this.validationService.nonNegative],
            weightUnits: [''],//, Validators.required],
            dose: [null, this.validationService.nonNegative],
            doseUnits: ['']
        }, {
            validator: Validators.compose([
                this.validationService.coreValidation('concen', 'intake', 'weight', 'dose'),
                this.validationService.validateBases('concenUnitsType', 'intakeUnitsType')
            ])
        }); //ensures 3 fields have values, mass/mass isn't used with vol/time
        //initialize dropdowns:
        this.ingestionForm.patchValue({
            concenUnitsType: this.concenUnitsTypeOptions[0],
            concenUnitsMassVol: this.concenUnitsMassVolOptions[0],
            concenUnitsVolVol: this.concenUnitsVolVolOptions[0],
            concenUnitsMolVol: this.concenUnitsMolVolOptions[0],
            concenUnitsMolMass: this.concenUnitsMolMassOptions[0],
            concenUnitsMassMass: this.concenUnitsMassMassOptions[0],
            intakeUnitsVolTime: this.intakeUnitsVolTimeOptions[0],
            intakeUnitsMassTime: this.intakeUnitsMassTimeOptions[0],
            weightUnits: this.weightUnitsOptions[0],
            doseUnits: this.doseUnitsOptions[0]
        });

        //track changes (debugging)
        this.ingestionForm.valueChanges.subscribe(data => console.log('Form changes', data)); 
    }

    ngOnInit() {
        this.pastToxicology = [];
        this.createForm();
        this.concenTox = new Toxicology(new ToxUnit(UnitTypes.CONCENTRATION, new ToxRatio('mg/L', 1)), null);
        this.intakeTox = new Toxicology(new ToxUnit(UnitTypes.INTAKE_RATE, new ToxRatio('L/day', 1)), null);
        this.weightTox = new Toxicology(new ToxUnit(UnitTypes.BODY_WEIGHT, new ToxRatio('kg', 1)), null);
        this.doseTox = new Toxicology(new ToxUnit(UnitTypes.DOSE, new ToxRatio('mg/kg BW/day', 1)), null);
        
        
        this.concenModifiers = [];
        this.intakeModifiers = [];
        this.weightModifiers = [];
        this.doseModifiers = [];
    }

    xOr(first: boolean, second: boolean): boolean {
        return ((first && !second) || (!first && second));
    }

    onBaseChange(event: Event): void {
        /*switch (this.ingestionForm.get('concenUnitsType').value) {
            case 'mass/volume':
                this.substanceDensityNeeded = false;
                this.solutionDensityNeeded = false;
                this.molarMassNeeded = false;
                break;
            case 'volume/volume':
                this.substanceDensityNeeded = true;
                this.solutionDensityNeeded = false;
                this.molarMassNeeded = false;
                break;
            case 'mol/volume':
                this.substanceDensityNeeded = false;
                this.solutionDensityNeeded = false;
                this.molarMassNeeded = true;
                break;
            case 'mass/mass':
                this.substanceDensityNeeded = false;
                this.solutionDensityNeeded = true;
                this.molarMassNeeded = false;
                break;
        } TODO: remove */

        let concenUnitsType = this.ingestionForm.get('concenUnitsType').value;
        let intakeUnitsType = this.ingestionForm.get('intakeUnitsType').value;
        let doseUnitsType = this.ingestionForm.get('doseUnits').value.units;
        console.log(doseUnitsType);
        console.log(this.ingestionForm.get('weightUnits').value.units);
        this.molarMassNeeded = this.xOr((concenUnitsType === 'mol/volume' || concenUnitsType === 'mol/mass'), (doseUnitsType === 'mol/kg BW/day' || doseUnitsType === 'mmol/kg BW/day'));
        this.substanceDensityNeeded = (concenUnitsType === 'volume/volume' && intakeUnitsType === 'volume/time');
        this.solutionDensityNeeded = (((concenUnitsType === 'mass/mass' || concenUnitsType === 'mol/mass') && intakeUnitsType === 'volume/time') || (concenUnitsType === 'mass/volume' || concenUnitsType === 'mol/volume') && intakeUnitsType === 'mass/time'); // I'm not proud of this
    }

    calculate(): void {
        
        switch (this.ingestionForm.get('concenUnitsType').value) {
            case 'mass/volume':
                this.concenModifiers.push(this.ingestionForm.get('concenUnitsMassVol').value.value);
                break;
            case 'volume/volume':
                this.concenModifiers.push(this.ingestionForm.get('concenUnitsVolVol').value.value);
                break;
            case 'mol/volume':
                this.concenModifiers.push(this.ingestionForm.get('concenUnitsMolVol').value.value);
                break;
            case 'mol/mass':
                this.concenModifiers.push(this.ingestionForm.get('concenUnitsMolMass').value.value);
                break;
            case 'mass/mass':
                this.concenModifiers.push(this.ingestionForm.get('concenUnitsMassMass').value.value);
                break;
        }

        if (this.molarMassNeeded) {
            this.concenModifiers.push(this.ingestionForm.get('molarMass').value);
        }
        if (this.substanceDensityNeeded) {
            this.concenModifiers.push(this.ingestionForm.get('substanceDensity').value);
        }
        if (this.solutionDensityNeeded) {
            this.concenModifiers.push(this.ingestionForm.get('solutionDensity').value);
        }

        switch (this.ingestionForm.get('intakeUnitsType').value) {
            case 'volume/time':
                this.intakeModifiers.push(this.ingestionForm.get('intakeUnitsVolTime').value.value);
                break;
            case 'mass/time':
                this.intakeModifiers.push(this.ingestionForm.get('intakeUnitsMassTime').value.value);
                break;
        }

        this.weightModifiers.push(this.ingestionForm.get('weightUnits').value.value);
        this.doseModifiers.push(this.ingestionForm.get('doseUnits').value.value);

        let concenMultiplier = this.calcService.calculateMultiplier(this.concenModifiers);
        let intakeMultiplier = this.calcService.calculateMultiplier(this.intakeModifiers);
        let weightMultiplier = this.calcService.calculateMultiplier(this.weightModifiers);
        let doseMultiplier = this.calcService.calculateMultiplier(this.doseModifiers);

        let solution = this.calcService.newCalculate(
            this.ingestionForm.get('concen').value,
            concenMultiplier,
            this.ingestionForm.get('intake').value,
            intakeMultiplier,
            this.ingestionForm.get('weight').value,
            weightMultiplier,
            this.ingestionForm.get('dose').value,
            doseMultiplier
        );

        this.concenTox.inputData = solution[0];
        this.intakeTox.inputData = solution[1];
        this.weightTox.inputData = solution[2];
        this.doseTox.inputData = solution[3];

        this.ingestionForm.patchValue({
            concen: this.concenTox.inputData,
            intake: this.intakeTox.inputData,
            weight: this.weightTox.inputData,
            dose: this.doseTox.inputData
        });
        this.submitted = true;

        //clear modifiers so they don't affect next calculation:
        this.concenModifiers = [];
        this.intakeModifiers = [];
        this.weightModifiers = [];
        this.doseModifiers = [];
    }

    clear(): void {
        this.createForm();
        this.submitted = false;
    }
}
