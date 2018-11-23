import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SdProductListComponent } from './sd-product-list.component';

describe('SdProductListComponent', () => {
  let component: SdProductListComponent;
  let fixture: ComponentFixture<SdProductListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SdProductListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SdProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
