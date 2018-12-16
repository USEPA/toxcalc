import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InhaleCalcComponent } from './inhalecalc.component';

describe('InhaleCalcComponent', () => {
  let component: InhaleCalcComponent;
  let fixture: ComponentFixture<InhaleCalcComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InhaleCalcComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InhaleCalcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
