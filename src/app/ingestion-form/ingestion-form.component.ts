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
    concenUnit: Toxicology;
    intakeUnit: Toxicology;
    weightUnit: Toxicology;
    doseUnit: Toxicology;
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
            intake: [null, this.validationService.nonNegative],
            weight: [null, this.validationService.nonNegative],
            dose: [null, this.validationService.nonNegative]
        }, {validator: this.validationService.coreValidation('concen', 'intake', 'weight', 'dose')}); //ensures 3 fields have values
    }

    ngOnInit() {
        this.pastToxicology = [];
        this.createForm();
        //this.toxicology = new Toxicology();//TODO: remove
        this.concenUnit = new Toxicology(new ToxUnit(UnitTypes.CONCENTRATION, new ToxRatio('mg/L', 1)), null);
        this.intakeUnit = new Toxicology(new ToxUnit(UnitTypes.INTAKE_RATE, new ToxRatio('L/day', 1)), null);
        this.weightUnit = new Toxicology(new ToxUnit(UnitTypes.BODY_WEIGHT, new ToxRatio('kg', 1)), null);
        this.doseUnit = new Toxicology(new ToxUnit(UnitTypes.DOSE, new ToxRatio('mg/kg BW/day', 1)), null);
    }
    //TODO: change calculate function to accept new Toxicology object style
    calculate(): void {
        let solution = this.calcService.newCalculate(
            this.ingestionForm.get('concen').value,
            this.ingestionForm.get('intake').value,
            this.ingestionForm.get('weight').value,
            this.ingestionForm.get('dose').value
        );

        this.concenUnit.inputData = solution[0];
        this.intakeUnit.inputData = solution[1];
        this.weightUnit.inputData = solution[2];
        this.doseUnit.inputData = solution[3];

        //this.toxicology = this.calcService.calculate(this.toxicology);
        //let variable = this.toxicology.foundValue.variable;
        //console.log(variable);
        //let value = this.toxicology.foundValue.value;
        //console.log(value);

        this.ingestionForm.patchValue({
            concen: this.concenUnit.inputData,
            intake: this.intakeUnit.inputData,
            weight: this.weightUnit.inputData,
            dose: this.doseUnit.inputData
        });
        this.submitted = true;
    }

    clear(): void {
        this.ingestionForm.reset();
        this.submitted = false;
    }

}
