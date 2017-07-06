import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { IngestionFormComponent } from './ingestion-form/ingestion-form.component';
import { CalcService } from './shared/calc.service';
import { ValidationService } from './shared/validation.service';
import { UnitService } from './shared/unit.service';

@NgModule({
  declarations: [
    AppComponent,
    IngestionFormComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    HttpModule
  ],
    providers: [
        CalcService,
        ValidationService,
        UnitService
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
