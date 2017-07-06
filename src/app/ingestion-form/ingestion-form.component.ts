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
    toxicology: Toxicology;
    submitted = false;
    pastToxicology: Toxicology[];

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
        }, {validator: this.validationService.coreValidation('concen', 'intake', 'weight', 'dose')});
    }

    ngOnInit() {
        this.pastToxicology = [];
        this.createForm();
        this.toxicology = new Toxicology();
    }

    calculate(): void {
        this.toxicology.concen = this.ingestionForm.get('concen').value;
        this.toxicology.intake = this.ingestionForm.get('intake').value;
        this.toxicology.weight = this.ingestionForm.get('weight').value;
        this.toxicology.dose = this.ingestionForm.get('dose').value;

        this.toxicology = this.calcService.calculate(this.toxicology);
        let variable = this.toxicology.foundValue.variable;
        console.log(variable);
        let value = this.toxicology.foundValue.value;
        console.log(value);
        this.ingestionForm.patchValue({
            concen: this.toxicology.concen,
            intake: this.toxicology.intake,
            weight: this.toxicology.weight,
            dose: this.toxicology.dose
        });
        this.submitted = true;
    }

    clear(): void {
        this.ingestionForm.reset();
        this.submitted = false;
    }

}
