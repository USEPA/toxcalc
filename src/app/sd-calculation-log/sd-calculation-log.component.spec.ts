// ToxCalc! by Safe Dose © 2018-2021. See LICENSE file for details.
// SPDX-License-Identifier: GPL-3.0-or-later

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SdCalculationLogComponent } from './sd-calculation-log.component';

describe('SdCalculationLogComponent', () => {
  let component: SdCalculationLogComponent;
  let fixture: ComponentFixture<SdCalculationLogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SdCalculationLogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SdCalculationLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
