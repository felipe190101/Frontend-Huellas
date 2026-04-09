import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminPlanes } from './admin-planes';

describe('AdminPlanes', () => {
  let component: AdminPlanes;
  let fixture: ComponentFixture<AdminPlanes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPlanes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminPlanes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
