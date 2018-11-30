import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TotaldosecalcComponent } from './totaldosecalc.component';

describe('TotaldosecalcComponent', () => {
  let component: TotaldosecalcComponent;
  let fixture: ComponentFixture<TotaldosecalcComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TotaldosecalcComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TotaldosecalcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
