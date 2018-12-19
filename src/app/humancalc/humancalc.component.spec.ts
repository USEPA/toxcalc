import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HumanCalcComponent } from './humancalc.component';

describe('HumanCalcComponent', () => {
  let component: HumanCalcComponent;
  let fixture: ComponentFixture<HumanCalcComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HumanCalcComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HumanCalcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
