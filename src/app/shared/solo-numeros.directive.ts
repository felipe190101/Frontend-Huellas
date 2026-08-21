import { booleanAttribute, Directive, ElementRef, HostListener, Input, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({ selector: '[appSoloNumeros]', standalone: true })
export class SoloNumerosDirective {
  @Input({ transform: booleanAttribute }) appSoloNumeros = true;

  constructor(
    private elemento: ElementRef<HTMLInputElement>,
    @Optional() @Self() private control: NgControl
  ) {}

  @HostListener('keydown', ['$event'])
  bloquearTecla(evento: KeyboardEvent): void {
    if (!this.appSoloNumeros || evento.ctrlKey || evento.metaKey || evento.altKey) return;
    const permitidas = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (permitidas.includes(evento.key)) return;
    if (!/^\d$/.test(evento.key)) evento.preventDefault();
  }

  @HostListener('input')
  limpiarValor(): void {
    if (!this.appSoloNumeros) return;
    const input = this.elemento.nativeElement;
    const limpio = input.value.replace(/\D/g, '');
    if (input.value === limpio) return;
    input.value = limpio;
    const valorModelo = input.type === 'number'
      ? (limpio === '' ? null : Number(limpio))
      : limpio;
    this.control.control?.setValue(valorModelo, { emitEvent: false });
  }
}
