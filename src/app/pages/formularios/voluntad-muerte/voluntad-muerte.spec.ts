import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoluntadMuerte } from './voluntad-muerte';

describe('VoluntadMuerte', () => {
  let component: VoluntadMuerte;
  let fixture: ComponentFixture<VoluntadMuerte>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoluntadMuerte]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoluntadMuerte);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
