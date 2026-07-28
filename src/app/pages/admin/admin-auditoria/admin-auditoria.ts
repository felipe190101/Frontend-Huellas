import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';

interface RegistroAuditoria {
  id_auditoria: number;
  nombre_usuario?: string;
  correo_usuario?: string;
  rol?: string;
  accion?: string;
  ruta?: string;
  estado_http?: number;
  direccion_ip?: string;
  fecha_creacion?: string;
}

@Component({
  selector: 'app-admin-auditoria',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './admin-auditoria.html',
  styleUrls: ['./admin-auditoria.css']
})
export class AdminAuditoria implements OnInit {
  private readonly apiUrl = `${environment.apiUrl}/admin/auditoria`;

  registros: RegistroAuditoria[] = [];
  pagina = 1;
  readonly limite = 50;
  total = 0;
  cargando = false;
  error = '';

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.total / this.limite));
  }

  async ngOnInit(): Promise<void> {
    await this.obtenerRegistros();
  }

  async obtenerRegistros(): Promise<void> {
    this.cargando = true;
    this.error = '';

    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch(`${this.apiUrl}?pagina=${this.pagina}&limite=${this.limite}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.message || 'No fue posible cargar el historial de acciones.');
      }

      this.registros = data.registros ?? [];
      this.total = data.total ?? 0;
      this.pagina = data.pagina ?? this.pagina;
    } catch (error: any) {
      this.registros = [];
      this.error = error.message || 'Ocurrió un error al consultar la auditoría.';
    } finally {
      this.cargando = false;
    }
  }

  async cambiarPagina(pagina: number): Promise<void> {
    if (pagina < 1 || pagina > this.totalPaginas || pagina === this.pagina || this.cargando) return;
    this.pagina = pagina;
    await this.obtenerRegistros();
  }
}
