import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsclickthroughComponent } from './termsclickthrough.component';

describe('TermsclickthroughComponent', () => {
  let component: TermsclickthroughComponent;
  let fixture: ComponentFixture<TermsclickthroughComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TermsclickthroughComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TermsclickthroughComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
