import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LandingComponent } from './landing/landing.component';
import { TotalDoseCalcComponent } from './totaldosecalc/totaldosecalc.component';
import { HumanCalcComponent } from './humancalc/humancalc.component';
import { InhaleCalcComponent } from './inhalecalc/inhalecalc.component';
import { DefinitionsComponent } from './definitions/definitions.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: LandingComponent },
  { path: 'TotalDoseCalc', component: TotalDoseCalcComponent },
  { path: 'HumanCalc', component: HumanCalcComponent },
  { path: 'InhaleCalc', component: InhaleCalcComponent },
  { path: 'definitions', component: DefinitionsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
