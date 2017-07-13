import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { Toxicology } from '../toxicology/toxicology';
import { CalcService } from '../shared/calc.service';
import { ValidationService } from '../shared/validation.service';
import { ToxUnit } from '../toxicology/tox-unit';
import { ToxRatio } from '../toxicology/tox-ratio';
import { UnitTypes } from '../toxicology/unit-types.enum';
import { CONCEN_RATIOS_MASS_VOL, CONCEN_RATIOS_VOL_VOL, CONCEN_RATIOS_MOL_VOL, CONCEN_RATIOS_MASS_MASS, INTAKE_RATIOS_VOL_TIME, INTAKE_RATIOS_MASS_TIME, WEIGHT_RATIOS, DOSE_RATIOS } from '../toxicology/UNIT_LISTS';

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
            substanceDensity: [null, this.validationService.nonNegative], //TODO: write validation function to determine if required
            solutionDensity: [null, this.validationService.nonNegative],
            molarMass: [null, this.validationService.nonNegative], //TODO: write validation function to determine if required
            intake: [null, this.validationService.nonNegative],
            intakeUnitsType: ['volume/time'],
            intakeUnitsVolTime: [''],//, Validators.required],
            intakeUnitsMassTime: [''],
            weight: [null, this.validationService.nonNegative],
            weightUnits: [''],//, Validators.required],
            dose: [null, this.validationService.nonNegative],
            doseUnits: ['']
        }, {validator: this.validationService.coreValidation('concen', 'intake', 'weight', 'dose')}); //ensures 3 fields have values
        //initialize dropdowns:
        this.ingestionForm.patchValue({
            concenUnitsType: this.concenUnitsTypeOptions[0],
            concenUnitsMassVol: this.concenUnitsMassVolOptions[0],
            concenUnitsVolVol: this.concenUnitsVolVolOptions[0],
            concenUnitsMolVol: this.concenUnitsMolVolOptions[0],
            concenUnitsMassMass: this.concenUnitsMassMassOptions[0],
            intakeUnitsVolTime: this.intakeUnitsVolTimeOptions[0],
            intakeUnitsMassTime: this.intakeUnitsMassTimeOptions[0],
            weightUnits: this.weightUnitsOptions[0],
            doseUnits: this.doseUnitsOptions[0]
        });
        //track changes
        this.ingestionForm.valueChanges.subscribe(data => console.log('Form changes', data)); 
    }

    ngOnInit() {
        this.pastToxicology = [];
        this.createForm();
        //this.toxicology = new Toxicology();//TODO: remove
        this.concenTox = new Toxicology(new ToxUnit(UnitTypes.CONCENTRATION, new ToxRatio('mg/L', 1)), null);
        this.intakeTox = new Toxicology(new ToxUnit(UnitTypes.INTAKE_RATE, new ToxRatio('L/day', 1)), null);
        this.weightTox = new Toxicology(new ToxUnit(UnitTypes.BODY_WEIGHT, new ToxRatio('kg', 1)), null);
        this.doseTox = new Toxicology(new ToxUnit(UnitTypes.DOSE, new ToxRatio('mg/kg BW/day', 1)), null);
        
        
        this.concenModifiers = [];
        this.intakeModifiers = [];
        this.weightModifiers = [];
        this.doseModifiers = [];
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
        }*/
        let concenUnitsType = this.ingestionForm.get('concenUnitsType').value;
        let intakeUnitsType = this.ingestionForm.get('intakeUnitsType').value;
        this.molarMassNeeded = (concenUnitsType === 'mol/volume' || concenUnitsType === 'mol/mass');
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
                this.concenModifiers.push(this.ingestionForm.get('substanceDensity').value);
                break;
            case 'mol/volume':
                this.concenModifiers.push(this.ingestionForm.get('concenUnitsMolVol').value.value);
                this.concenModifiers.push(this.ingestionForm.get('molarMass').value);
                break;
            case 'mass/mass':
                this.concenModifiers.push(this.ingestionForm.get('concenUnitsMassMass').value.value);
                this.concenModifiers.push(this.ingestionForm.get('solutionDensity').value);
                break;
        }

        this.intakeModifiers.push(this.ingestionForm.get('intakeUnits').value.value);
        this.weightModifiers.push(this.ingestionForm.get('weightUnits').value.value);
        this.doseModifiers.push(this.ingestionForm.get('doseUnits').value.value);

        let concenMultiplier = this.calcService.calculateMultiplier(this.concenModifiers);
        let intakeMultiplier = this.calcService.calculateMultiplier(this.intakeModifiers);
        let weightMultiplier = this.calcService.calculateMultiplier(this.weightModifiers);

        let solution = this.calcService.newCalculate(
            this.ingestionForm.get('concen').value,
            concenMultiplier,
            this.ingestionForm.get('intake').value,
            intakeMultiplier,
            this.ingestionForm.get('weight').value,
            weightMultiplier,
            this.ingestionForm.get('dose').value
        );

        //alert(this.ingestionForm.get('concenUnits').value.value);

        this.concenTox.inputData = solution[0];
        this.intakeTox.inputData = solution[1];
        this.weightTox.inputData = solution[2];
        this.doseTox.inputData = solution[3];

        //this.toxicology = this.calcService.calculate(this.toxicology);
        //let variable = this.toxicology.foundValue.variable;
        //console.log(variable);
        //let value = this.toxicology.foundValue.value;
        //console.log(value);

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
