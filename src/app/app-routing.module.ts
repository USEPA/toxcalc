import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LandingComponent } from './landing/landing.component';
import { AllometryFormComponent } from './ingestion-form/allometry-form.component';
import { IngestionFormComponent } from './ingestion-form/ingestion-form.component';
import { InhalationFormComponent } from './inhalation-form/inhalation-form.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: LandingComponent },
  { path: 'ingestion', component: IngestionFormComponent },
  { path: 'allometry', component: AllometryFormComponent },
  { path: 'inhalation', component: InhalationFormComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
