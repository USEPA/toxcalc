import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LandingComponent } from './landing/landing.component';
import { TotalDoseCalcComponent } from './totaldosecalc/totaldosecalc.component';
import { HumanCalcComponent } from './humancalc/humancalc.component';
import { InhaleCalcComponent } from './inhalecalc/inhalecalc.component';
import { HbelCalcComponent } from './hbelcalc/hbelcalc.component';
import { DefinitionsComponent } from './definitions/definitions.component';
import { DisclaimerComponent } from './disclaimer/disclaimer.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: LandingComponent },
  { path: 'TotalDoseCalc', component: TotalDoseCalcComponent },
  { path: 'HumanCalc', component: HumanCalcComponent },
  { path: 'InhaleCalc', component: InhaleCalcComponent },
  { path: 'HBELCalc', component: HbelCalcComponent },
  { path: 'definitions', component: DefinitionsComponent },
  { path: 'disclaimer', component: DisclaimerComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
