import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { Toxicology } from '../toxicology/toxicology';
import { CalcService } from '../shared/calc.service';
import { ValidationService } from '../shared/validation.service';
import { ToxUnit } from '../toxicology/tox-unit';
import { ToxRatio } from '../toxicology/tox-ratio';
import { UnitTypes } from '../toxicology/unit-types.enum';
import { CONCEN_RATIOS_MASS_VOL, CONCEN_RATIOS_VOL_VOL, INTAKE_RATIOS, WEIGHT_RATIOS } from '../toxicology/UNIT_LISTS';


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
    toxicology: Toxicology; //TODO: remove
    concenTox: Toxicology;
    intakeTox: Toxicology;
    weightTox: Toxicology;
    doseTox: Toxicology;
    concenUnitsMassVolOptions = CONCEN_RATIOS_MASS_VOL;
    concenUnitsVolVolOptions = CONCEN_RATIOS_VOL_VOL;
    intakeUnitsOptions = INTAKE_RATIOS;
    weightUnitsOptions = WEIGHT_RATIOS;
    submitted = false;
    pastToxicology: Toxicology[]; //TODO: find a way to implement history

    concenModifiers: number[];
    intakeModifiers: number[];
    weightModifiers: number[];

    concenUnitsTypeOptions = ['mass/volume', 'volume/volume', 'mol/volume', 'mass/mass'];

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
            substanceDensity: [null], //TODO: write validation function to determine if required
            intake: [null, this.validationService.nonNegative],
            intakeUnits: [''],//, Validators.required],
            weight: [null, this.validationService.nonNegative],
            weightUnits: [''],//, Validators.required],
            dose: [null, this.validationService.nonNegative]
        }, {validator: this.validationService.coreValidation('concen', 'intake', 'weight', 'dose')}); //ensures 3 fields have values
        //initialize dropdowns:
        this.ingestionForm.patchValue({
            concenUnitsType: this.concenUnitsTypeOptions[0],
            concenUnitsMassVol: this.concenUnitsMassVolOptions[0],
            concenUnitsVolVol: this.concenUnitsVolVolOptions[0],
            intakeUnits: this.intakeUnitsOptions[0],
            weightUnits: this.weightUnitsOptions[0]
        });
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
        }

        this.intakeModifiers.push(this.ingestionForm.get('intakeUnits').value.value);
        this.weightModifiers.push(this.ingestionForm.get('weightUnits').value.value);

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
    }

    clear(): void {
        this.createForm();
        this.submitted = false;
    }

}
