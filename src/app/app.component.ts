import { Component } from '@angular/core';

import { UnitService } from './shared/unit.service';
import { ValidationService } from './shared/validation.service';
import { CalcService } from './shared/calc.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    providers: [
        CalcService,
        UnitService,
        ValidationService
    ]
})
export class AppComponent {
    title = 'app works!';
}
