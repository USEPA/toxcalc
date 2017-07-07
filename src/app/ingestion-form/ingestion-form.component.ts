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
    intakeUnitOptions = INTAKE_RATIOS;
    weightUnitsOptions = WEIGHT_RATIOS;
    submitted = false;
    pastToxicology: Toxicology[]; //TODO: use to implement history

    ingestionForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private calcService: CalcService,
        private validationService: ValidationService
    ) { }

    createForm() {
        this.ingestionForm = this.fb.group({
            concen: [null, this.validationService.nonNegative],
            concenUnits: [this.concenUnitsMassVolOptions[0], Validators.required], //TODO: set initial value (how???), properly bind selection
            intake: [null, this.validationService.nonNegative],
            weight: [null, this.validationService.nonNegative],
            dose: [null, this.validationService.nonNegative]
        }, {validator: this.validationService.coreValidation('concen', 'intake', 'weight', 'dose')}); //ensures 3 fields have values
    }

    ngOnInit() {
        this.pastToxicology = [];
        this.createForm();
        //this.toxicology = new Toxicology();//TODO: remove
        this.concenTox = new Toxicology(new ToxUnit(UnitTypes.CONCENTRATION, new ToxRatio('mg/L', 1)), null);
        this.intakeTox = new Toxicology(new ToxUnit(UnitTypes.INTAKE_RATE, new ToxRatio('L/day', 1)), null);
        this.weightTox = new Toxicology(new ToxUnit(UnitTypes.BODY_WEIGHT, new ToxRatio('kg', 1)), null);
        this.doseTox = new Toxicology(new ToxUnit(UnitTypes.DOSE, new ToxRatio('mg/kg BW/day', 1)), null);
        //const selectedConcenUnit = this.concenUnitsMassVolOptions.find(concenUnits => concenUnits.value
    }

    calculate(): void {
        let solution = this.calcService.newCalculate(
            this.ingestionForm.get('concen').value,
            this.ingestionForm.get('intake').value,
            this.ingestionForm.get('weight').value,
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
    }

    clear(): void {
        this.ingestionForm.reset();
        this.submitted = false;
    }

}
