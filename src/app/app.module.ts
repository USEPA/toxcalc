import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { IngestionFormComponent } from './ingestion-form/ingestion-form.component';
import { CalcService } from './shared/calc.service';
import { ValidationService } from './shared/validation.service';
import { InhalationFormComponent } from './inhalation-form/inhalation-form.component';

@NgModule({
  declarations: [
    AppComponent,
    IngestionFormComponent,
    InhalationFormComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    HttpModule
  ],
    providers: [
        CalcService,
        ValidationService
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
