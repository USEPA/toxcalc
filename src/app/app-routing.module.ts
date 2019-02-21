import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LandingComponent } from './landing/landing.component';
import { TotalDoseCalcComponent } from './totaldosecalc/totaldosecalc.component';
import { HumanCalcComponent } from './humancalc/humancalc.component';
import { InhaleCalcComponent } from './inhalecalc/inhalecalc.component';
import { HbelCalcComponent } from './hbelcalc/hbelcalc.component';
import { BioavailCalcComponent } from './bioavailcalc/bioavailcalc.component';
import { DefinitionsComponent } from './definitions/definitions.component';
import { DisclaimerComponent } from './disclaimer/disclaimer.component';
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
  { path: 'disclaimer', component: DisclaimerComponent },
  { path: 'examples', component: ExamplesComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
