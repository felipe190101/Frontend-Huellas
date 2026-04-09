import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Beneficiarios } from './beneficiarios';

describe('Beneficiarios', () => {
  let component: Beneficiarios;
  let fixture: ComponentFixture<Beneficiarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Beneficiarios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Beneficiarios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
