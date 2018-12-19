import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LandingComponent } from './landing/landing.component';
import { TotaldosecalcComponent } from './totaldosecalc/totaldosecalc.component';
import { HumanCalcComponent } from './humancalc/humancalc.component';
import { InhaleCalcComponent } from './inhalecalc/inhalecalc.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: LandingComponent },
  { path: 'TotalDoseCalc', component: TotaldosecalcComponent },
  { path: 'HumanCalc', component: HumanCalcComponent },
  { path: 'InhaleCalc', component: InhaleCalcComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
