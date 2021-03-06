// ToxCalc! by Safe Dose © 2018-2021. See LICENSE file for details.
// SPDX-License-Identifier: GPL-3.0-or-later

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LandingComponent } from './landing/landing.component';
import { TotalDoseCalcComponent } from './totaldosecalc/totaldosecalc.component';
import { HumanCalcComponent } from './humancalc/humancalc.component';
import { InhaleCalcComponent } from './inhalecalc/inhalecalc.component';
import { HbelCalcComponent } from './hbelcalc/hbelcalc.component';
import { BioavailCalcComponent } from './bioavailcalc/bioavailcalc.component';
import { DefinitionsComponent } from './definitions/definitions.component';
import { LicenseComponent } from './license/license.component';
import { ExamplesComponent } from './examples/examples.component';
import { TermsclickthroughComponent } from './termsclickthrough/termsclickthrough.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: TermsclickthroughComponent },
  { path: 'landing', component: LandingComponent },
  { path: 'TotalDoseCalc', component: TotalDoseCalcComponent },
  { path: 'HumanCalc', component: HumanCalcComponent },
  { path: 'InhaleCalc', component: InhaleCalcComponent },
  { path: 'HBELCalc', component: HbelCalcComponent },
  { path: 'BioavailCalc', component: BioavailCalcComponent },
  { path: 'definitions', component: DefinitionsComponent },
  { path: 'examples', component: ExamplesComponent },
  { path: 'license', component: LicenseComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
