// ToxCalc! by Safe Dose © 2018-2021. See LICENSE file for details.
// SPDX-License-Identifier: GPL-3.0-or-later

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BioavailcalcComponent } from './bioavailcalc.component';

describe('BioavailcalcComponent', () => {
  let component: BioavailcalcComponent;
  let fixture: ComponentFixture<BioavailcalcComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BioavailcalcComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BioavailcalcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
