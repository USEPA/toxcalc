import { Component } from '@angular/core';

import { ValidationService } from './shared/validation.service';
import { CalcService } from './shared/calc.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    providers: [
        CalcService,
        ValidationService
    ]
})
export class AppComponent {
    formSelector = 1;
}
