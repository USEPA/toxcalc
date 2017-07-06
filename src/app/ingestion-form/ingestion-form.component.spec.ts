import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IngestionFormComponent } from './ingestion-form.component';

describe('IngestionFormComponent', () => {
  let component: IngestionFormComponent;
  let fixture: ComponentFixture<IngestionFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IngestionFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IngestionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
