import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SdSelectComponent } from './sd-select.component';

describe('SdSelectComponent', () => {
  let component: SdSelectComponent;
  let fixture: ComponentFixture<SdSelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SdSelectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SdSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
