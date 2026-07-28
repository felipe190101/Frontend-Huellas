import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface TerminosVigentes {
  version: string;
  contenido?: string;
}

@Injectable({ providedIn: 'root' })
export class LegalService {
  private readonly apiUrl = `${environment.apiUrl}/legal`;

  async obtenerTerminos(): Promise<TerminosVigentes> {
    const respuesta = await fetch(`${this.apiUrl}/terminos`);
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.message || 'No se pudieron consultar los términos vigentes.');
    return { version: data.version_terminos ?? data.version, contenido: data.contenido ?? data.terminos };
  }

  async aceptarTerminos(version_terminos: string): Promise<void> {
    const token = localStorage.getItem('token');
    const respuesta = await fetch(`${this.apiUrl}/aceptacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ acepta_terminos: true, version_terminos })
    });
    const data = await respuesta.json();
    if (!respuesta.ok) throw new Error(data.message || 'No fue posible registrar la aceptación.');
  }
}
