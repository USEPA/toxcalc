import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppComponent } from './app.component';
import { InhaleCalcComponent } from './inhalecalc/inhalecalc.component';
import { HumanCalcComponent } from './humancalc/humancalc.component';
import { FormsModule } from '@angular/forms';
import { SdProductListComponent, SdProductListItem, SdProductListItemDescription, SdProductListItemTitle } from './sd-product-list/sd-product-list.component';
import { LandingComponent } from './landing/landing.component';
import { SdReturnToCalculatorsComponent } from './sd-return-to-calculators/sd-return-to-calculators.component';
import { SdSelectComponent, SdSelectItem, SdSelectGroup } from './sd-select/sd-select.component';
import { SdCalcRowComponent, SdCalcRowLabel, SdCalcRowInput, SdCalcRowHelp } from './sd-calc-row/sd-calc-row.component';
import { TotalDoseCalcComponent } from './totaldosecalc/totaldosecalc.component';
import { SdInputPositiveNumber } from './shared/number-util';
import { SdInternalCalcErrorComponent } from './sd-internal-calc-error/sd-internal-calc-error.component';
import { SdKatexDirective } from './sd-katex.directive';
import { DefinitionsComponent } from './definitions/definitions.component';

@NgModule({
  declarations: [
    AppComponent,
    DefinitionsComponent,
    InhaleCalcComponent,
    HumanCalcComponent,
    LandingComponent,
    SdCalcRowComponent,
    SdCalcRowHelp,
    SdCalcRowInput,
    SdCalcRowLabel,
    SdInputPositiveNumber,
    SdInternalCalcErrorComponent,
    SdKatexDirective,
    SdProductListComponent,
    SdProductListItem,
    SdProductListItemDescription,
    SdProductListItemTitle,
    SdReturnToCalculatorsComponent,
    SdSelectComponent,
    SdSelectItem,
    SdSelectGroup,
    TotalDoseCalcComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    FontAwesomeModule,
    FormsModule,
    NgbModule,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
