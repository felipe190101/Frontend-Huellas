import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LegalService, TerminosVigentes } from '../../../services/legal.service';

@Component({
  selector: 'app-terminos-condiciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terminos-condiciones.html',
  styleUrls: ['./legal.css']
})
export class TerminosCondiciones implements OnInit {
  terminos: TerminosVigentes | null = null;
  constructor(private legalService: LegalService) {}
  async ngOnInit(): Promise<void> {
    try { this.terminos = await this.legalService.obtenerTerminos(); }
    catch (error) { console.error('Error al cargar términos:', error); }
  }
}
