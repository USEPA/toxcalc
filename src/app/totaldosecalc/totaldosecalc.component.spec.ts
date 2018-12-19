import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalDoseCalcComponent } from './totaldosecalc.component';

describe('TotalDoseCalcComponent', () => {
  let component: TotalDoseCalcComponent;
  let fixture: ComponentFixture<TotalDoseCalcComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TotalDoseCalcComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TotalDoseCalcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
