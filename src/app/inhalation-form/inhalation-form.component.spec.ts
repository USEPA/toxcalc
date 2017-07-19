import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InhalationFormComponent } from './inhalation-form.component';

describe('InhalationFormComponent', () => {
  let component: InhalationFormComponent;
  let fixture: ComponentFixture<InhalationFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InhalationFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InhalationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
