import { Injectable } from '@angular/core';
// IMPORTANTE: Importamos el environment para que la URL sea dinámica
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlanService {
  // Usamos la URL base definida en el environment
  private apiUrl = `${environment.apiUrl}/planes`;
  private pagosUrl = `${environment.apiUrl}/pagos`;

  async obtenerPlanes() {
    try {
      const res = await fetch(this.apiUrl);
      if (!res.ok) throw new Error('Error al obtener planes');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'No fue posible iniciar la suscripción');
      return data;
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

  async cambiarPlan(id_plan: number) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${environment.apiUrl}/suscripciones/cambiar-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ id_plan }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'No fue posible programar el cambio de plan.');
    return data;
  }

  async obtenerEstadoPago() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${this.pagosUrl}/estado`, {
      headers: { 'Authorization': token ? `Bearer ${token}` : '' }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'No fue posible consultar el pago');
    return data;
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
