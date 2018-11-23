import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SdReturnToCalculatorsComponent } from './sd-return-to-calculators.component';

describe('SdReturnToCalculatorsComponent', () => {
  let component: SdReturnToCalculatorsComponent;
  let fixture: ComponentFixture<SdReturnToCalculatorsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SdReturnToCalculatorsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SdReturnToCalculatorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
