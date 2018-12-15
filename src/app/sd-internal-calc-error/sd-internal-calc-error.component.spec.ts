import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SdInternalCalcErrorComponent } from './sd-internal-calc-error.component';

describe('SdInternalCalcErrorComponent', () => {
  let component: SdInternalCalcErrorComponent;
  let fixture: ComponentFixture<SdInternalCalcErrorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SdInternalCalcErrorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SdInternalCalcErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
