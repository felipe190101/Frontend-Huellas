import { Injectable } from '@angular/core';
// IMPORTANTE: Importamos el environment para que la URL sea dinámica
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  // Usamos la URL base definida en el environment
  private apiUrl = `${environment.apiUrl}/usuarios`;

  async obtenerPerfil() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${this.apiUrl}/perfil`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Error al obtener el perfil');
    }
    return await res.json(); // Devuelve { usuario, suscripcion }
  }

  async actualizarPerfil(datos: any) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${this.apiUrl}/perfil`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Error al actualizar el perfil');
    }
    return await res.json();
  }

  async cancelarSuscripcion() {
    const token = localStorage.getItem('token');
    // Reemplazamos localhost por environment.apiUrl para la ruta de suscripciones
    const res = await fetch(`${environment.apiUrl}/suscripciones/cancelar`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al cancelar la suscripción');
    return data;
  }
}