import { Injectable } from '@angular/core';
// IMPORTANTE: Importamos el environment para que la URL cambie según el entorno
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Usamos la URL base definida en el archivo de environment
  private apiUrl = `${environment.apiUrl}/auth`;
  private usuarioActual: any = null;

  async login(correo: string, contrasena: string) {
    const res = await fetch(`${this.apiUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena }),
    });

    if (!res.ok) {
      // Manejo de error si la respuesta no es 200 OK
      const errorData = await res.json();
      throw new Error(errorData.message || 'Error al iniciar sesión');
    }

    const data = await res.json();
    return data;
  }

  async loginBeneficiario(nombre_usuario: string, contrasena: string) {
    const res = await fetch(`${environment.apiUrl}/cuenta-beneficiario/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre_usuario, contrasena }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'No fue posible iniciar sesión');
    return data;
  }

  async activarCuentaBeneficiario(token: string, contrasena: string) {
    const res = await fetch(`${environment.apiUrl}/cuenta-beneficiario/activar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, contrasena }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'No fue posible activar la cuenta');
    return data;
  }

  async obtenerPerfilBeneficiario() {
    const res = await fetch(`${environment.apiUrl}/cuenta-beneficiario/perfil`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'No fue posible obtener el perfil');
    return data;
  }

  getUsuario() {
    if (!this.usuarioActual) {
      const user = localStorage.getItem('usuario');
      this.usuarioActual = user ? JSON.parse(user) : null;
    }
    return this.usuarioActual;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.usuarioActual = null;
  }

  estaAutenticado(): boolean {
    // Verifica la existencia del token para permitir acceso a rutas protegidas
    return !!localStorage.getItem('token');
  }
}
