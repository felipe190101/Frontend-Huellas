import { Injectable } from '@angular/core';
// IMPORTANTE: Importamos el environment para que la URL sea dinámica
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlanService {
  // Usamos la URL base definida en el environment
  private apiUrl = `${environment.apiUrl}/planes`;

  async obtenerPlanes() {
    try {
      const res = await fetch(this.apiUrl);
      if (!res.ok) throw new Error('Error al obtener planes');
      return await res.json();
    } catch (error) {
      console.error('Error en obtenerPlanes:', error);
      throw error;
    }
  }

  async adquirirPlan(id_plan: number) {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${this.apiUrl}/adquirir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ id_plan }),
      });
      return await res.json();
    } catch (error) {
      console.error('Error en adquirirPlan:', error);
      throw error;
    }
  }

  async obtenerSuscripcion() {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${this.apiUrl}/suscripcion`, {
        headers: { 
          'Authorization': token ? `Bearer ${token}` : '' 
        },
      });
      if (!res.ok) throw new Error('Error al obtener suscripción');
      return await res.json();
    } catch (error) {
      console.error('Error en obtenerSuscripcion:', error);
      throw error;
    }
  }
}