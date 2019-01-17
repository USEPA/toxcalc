import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SdJustificationComponent } from './sd-justification.component';

describe('SdJustificationComponent', () => {
  let component: SdJustificationComponent;
  let fixture: ComponentFixture<SdJustificationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SdJustificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SdJustificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
