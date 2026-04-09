import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoluntadSalud } from './voluntad-salud';

describe('VoluntadSalud', () => {
  let component: VoluntadSalud;
  let fixture: ComponentFixture<VoluntadSalud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoluntadSalud]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoluntadSalud);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
