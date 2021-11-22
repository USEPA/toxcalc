// ToxCalc! by Safe Dose © 2018-2021. See LICENSE file for details.
// SPDX-License-Identifier: GPL-3.0-or-later

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SdCalcRowComponent } from './sd-calc-row.component';

describe('SdCalcRowComponent', () => {
  let component: SdCalcRowComponent;
  let fixture: ComponentFixture<SdCalcRowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SdCalcRowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SdCalcRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
