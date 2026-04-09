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