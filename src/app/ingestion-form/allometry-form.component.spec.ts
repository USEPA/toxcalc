import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AllometryFormComponent } from './allometry-form.component';

describe('AllometryFormComponent', () => {
  let component: AllometryFormComponent;
  let fixture: ComponentFixture<AllometryFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AllometryFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllometryFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
