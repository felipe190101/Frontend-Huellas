import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import intlTelInput, { type Iso2, type Iti } from 'intl-tel-input';

@Component({
  selector: 'app-telefono-internacional',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './telefono-internacional.html',
  styleUrls: ['./telefono-internacional.css']
})
export class TelefonoInternacional implements AfterViewInit, OnChanges, OnDestroy {
  @Input()
  set pais(value: string) {
    this._pais = value || 'CO';
    this.sincronizarDesdeModelo();
  }
  get pais(): string {
    return this._pais;
  }

  @Input()
  set codigoPais(value: string) {
    this._codigoPais = value || '+57';
    this.sincronizarDesdeModelo();
  }
  get codigoPais(): string {
    return this._codigoPais;
  }

  @Input()
  set nacional(value: string) {
    this._nacional = value || '';
    this.sincronizarDesdeModelo();
  }
  get nacional(): string {
    return this._nacional;
  }

  @Input()
  set telefonoE164(value: string) {
    this._telefonoE164 = value || '';
    this.sincronizarDesdeModelo();
  }
  get telefonoE164(): string {
    return this._telefonoE164;
  }

  @Output() paisChange = new EventEmitter<string>();
  @Output() codigoPaisChange = new EventEmitter<string>();
  @Output() nacionalChange = new EventEmitter<string>();
  @ViewChild('telefonoInput') telefonoInput!: ElementRef<HTMLInputElement>;

  private instancia: Iti | null = null;
  private _pais = 'CO';
  private _codigoPais = '+57';
  private _nacional = '';
  private _telefonoE164 = '';
  private vistaLista = false;

  ngAfterViewInit(): void {
    this.instancia = intlTelInput(this.telefonoInput.nativeElement, {
      initialCountry: this.pais.toLowerCase() as Iso2,
      separateDialCode: true,
      formatAsYouType: false
    });
    this.vistaLista = true;
    this.sincronizarDesdeModelo();
    this.telefonoInput.nativeElement.addEventListener('countrychange', () => this.actualizarPais());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.instancia) return;
    if (changes['pais'] || changes['codigoPais'] || changes['nacional'] || changes['telefonoE164']) {
      this.sincronizarDesdeModelo();
    }
  }

  actualizarNumero(): void {
    const numero = this.telefonoInput.nativeElement.value.replace(/\D/g, '');
    this.nacionalChange.emit(numero);
  }

  private actualizarPais(): void {
    const pais = this.instancia?.getSelectedCountry();
    if (!pais?.iso2 || !pais.dialCode) return;
    const paisIso = pais.iso2.toUpperCase();
    const codigo = `+${pais.dialCode}`;
    this._pais = paisIso;
    this._codigoPais = codigo;
    this.paisChange.emit(paisIso);
    this.codigoPaisChange.emit(codigo);
    this.actualizarNumero();
  }

  private sincronizarDesdeModelo(): void {
    if (!this.instancia || !this.vistaLista) return;

    if (this.telefonoE164) {
      this.instancia.setNumber(this.telefonoE164);
      queueMicrotask(() => this.actualizarPais());
      return;
    }

    this.instancia.setSelectedCountry(this.pais.toLowerCase() as Iso2);
    this.telefonoInput.nativeElement.value = this.nacional;
    this.actualizarNumero();
  }

  ngOnDestroy(): void {
    this.instancia?.destroy();
  }
}
