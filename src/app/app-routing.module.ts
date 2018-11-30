import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LandingComponent } from './landing/landing.component';
import { TotaldosecalcComponent } from './totaldosecalc/totaldosecalc.component';
import { AllometryFormComponent } from './ingestion-form/allometry-form.component';
import { IngestionFormComponent } from './ingestion-form/ingestion-form.component';
import { InhalationFormComponent } from './inhalation-form/inhalation-form.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: LandingComponent },
  { path: 'TotalDoseCalc', component: TotaldosecalcComponent },
  { path: 'HumanCalc', component: AllometryFormComponent },
  { path: 'InhaleCalc', component: InhalationFormComponent },

  // DEPRECATED
  { path: 'ingestion', component: IngestionFormComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
