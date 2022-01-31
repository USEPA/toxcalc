// ToxCalc! by Safe Dose © 2018-2021. See LICENSE file for details.
// SPDX-License-Identifier: GPL-3.0-or-later

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';

import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faFilePdf, faQuestionCircle, faFileDownload, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

import { AppComponent } from './app.component';
import { InhaleCalcComponent } from './inhalecalc/inhalecalc.component';
import { HumanCalcComponent } from './humancalc/humancalc.component';
import { HbelCalcComponent } from './hbelcalc/hbelcalc.component';
import { FormsModule } from '@angular/forms';
import { SdProductListComponent, SdProductListItem, SdProductListItemDescription, SdProductListItemTitle } from './sd-product-list/sd-product-list.component';
import { LandingComponent } from './landing/landing.component';
import { SdSelectComponent, SdSelectItem, SdSelectGroup } from './sd-select/sd-select.component';
import { SdCalcRowComponent, SdCalcRowLabel, SdCalcRowInput, SdCalcRowHelp } from './sd-calc-row/sd-calc-row.component';
import { TotalDoseCalcComponent } from './totaldosecalc/totaldosecalc.component';
import { SdInputPositiveNumber, SdInputPositiveNumberLeft } from './shared/number-util';
import { SdInternalCalcErrorComponent } from './sd-internal-calc-error/sd-internal-calc-error.component';
import { SdKatexDirective } from './sd-katex.directive';
import { DefinitionsComponent } from './definitions/definitions.component';
import { SdCalculationLogComponent } from './sd-calculation-log/sd-calculation-log.component';
import { SdJustificationComponent } from './sd-justification/sd-justification.component';
import { BioavailCalcComponent } from './bioavailcalc/bioavailcalc.component';
import { ExamplesComponent } from './examples/examples.component';
import { TermsclickthroughComponent } from './termsclickthrough/termsclickthrough.component';
import { LicenseComponent } from './license/license.component';

@NgModule({
  declarations: [
    AppComponent,
    BioavailCalcComponent,
    DefinitionsComponent,
    InhaleCalcComponent,
    HumanCalcComponent,
    HbelCalcComponent,
    LandingComponent,
    SdCalcRowComponent,
    SdCalcRowHelp,
    SdCalcRowInput,
    SdCalcRowLabel,
    SdCalculationLogComponent,
    SdInputPositiveNumber,
    SdInputPositiveNumberLeft,
    SdInternalCalcErrorComponent,
    SdJustificationComponent,
    SdKatexDirective,
    SdProductListComponent,
    SdProductListItem,
    SdProductListItemDescription,
    SdProductListItemTitle,
    SdSelectComponent,
    SdSelectItem,
    SdSelectGroup,
    TotalDoseCalcComponent,
    ExamplesComponent,
    TermsclickthroughComponent,
    LicenseComponent,
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
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faFilePdf);
    library.addIcons(faQuestionCircle);
    library.addIcons(faFileDownload);
    library.addIcons(faTrashAlt);
  }
}
