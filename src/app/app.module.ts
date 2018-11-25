import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AppRoutingModule } from './app-routing.module';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppComponent } from './app.component';
import { IngestionFormComponent } from './ingestion-form/ingestion-form.component';
import { CalcService } from './shared/calc.service';
import { ValidationService } from './shared/validation.service';
import { InhalationFormComponent } from './inhalation-form/inhalation-form.component';
import { AllometryFormComponent } from './ingestion-form/allometry-form.component';
import { FormsModule } from '@angular/forms';
import { SdProductListComponent, SdProductListItem, SdProductListItemDescription, SdProductListItemTitle } from './sd-product-list/sd-product-list.component';
import { LandingComponent } from './landing/landing.component';
import { SdReturnToCalculatorsComponent } from './sd-return-to-calculators/sd-return-to-calculators.component';
import { SdSelectComponent, SdSelectItem, SdSelectGroup } from './sd-select/sd-select.component';

@NgModule({
  declarations: [
    AppComponent,
    IngestionFormComponent,
    InhalationFormComponent,
    AllometryFormComponent,
    LandingComponent,
    SdProductListComponent,
    SdProductListItem,
    SdProductListItemDescription,
    SdProductListItemTitle,
    SdReturnToCalculatorsComponent,
    SdSelectComponent,
    SdSelectItem,
    SdSelectGroup
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    FontAwesomeModule,
    FormsModule,
    HttpModule,
    NgbModule,
    ReactiveFormsModule
  ],
    providers: [
        CalcService,
        ValidationService
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
