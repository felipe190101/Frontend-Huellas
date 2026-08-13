import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { UsuarioService } from '../../services/usuario.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
// IMPORTANTE: Importamos el environment
import { environment } from '../../../environments/environment';
import { LegalService } from '../../services/legal.service';
import { TelefonoInternacional } from '../../shared/telefono-internacional/telefono-internacional';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TelefonoInternacional],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css'],
})
export class Perfil implements OnInit {
  // Definimos la base de la URL usando el environment
  private baseUrl = environment.apiUrl;

  usuario: any = {};
  suscripcion: any = null;
  saludSubido = false;
  muerteSubido = false;
  aceptaTerminosPendiente = false;
  versionTerminos = '';
  cargandoTerminos = false;
  mostrarOpcionCancelar = false;
  resumenArchivos = { total: 0, imagenes: 0, audios: 0, videos: 0, documentos: 0 };
  almacenamiento = { limite_bytes: 0, usado_bytes: 0, disponible_bytes: 0 };

  constructor(private usuarioService: UsuarioService, private router: Router, private legalService: LegalService) {}

  async ngOnInit() {
    try {
      const data = await this.usuarioService.obtenerPerfil();
      this.usuario = data.usuario;
      this.usuario.telefono_pais = this.usuario.telefono_pais || 'CO';
      this.usuario.telefono_codigo_pais = this.usuario.telefono_codigo_pais || '+57';
      this.usuario.telefono_nacional = this.usuario.telefono_nacional || '';
      this.suscripcion = data.suscripcion;
      this.almacenamiento = data.almacenamiento || this.almacenamiento;
      await this.cargarResumenArchivos();
      if (!this.usuario.acepta_terminos) await this.cargarTerminosVigentes();
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    }
  }

  async cargarResumenArchivos() {
    try {
      const respuesta = await fetch(`${this.baseUrl}/archivos`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (!respuesta.ok) return;
      const archivos = await respuesta.json();
      this.resumenArchivos.total = archivos.length;
      archivos.forEach((archivo: any) => {
        const tipo = String(archivo.tipo || '').toLowerCase();
        if (tipo.includes('imagen')) this.resumenArchivos.imagenes++;
        else if (tipo.includes('audio')) this.resumenArchivos.audios++;
        else if (tipo.includes('video')) this.resumenArchivos.videos++;
        else this.resumenArchivos.documentos++;
      });
    } catch {
      // El perfil sigue disponible aunque el resumen de archivos no se pueda consultar.
    }
  }

  get almacenamientoPlan(): number {
    return Number(this.suscripcion?.almacenamiento_max || 0);
  }

  get renovacionAutomatica(): boolean {
    const estadoPago = String(this.suscripcion?.estado_pago || '').toLowerCase();
    return !['cancelada', 'cancelled', 'canceled', 'pausada', 'paused'].includes(estadoPago);
  }

  get textoRenovacion(): string {
    return this.renovacionAutomatica
      ? 'Renovación automática'
      : 'Renovación automática cancelada';
  }

  get espacioUsadoGB(): string { return (Number(this.almacenamiento.usado_bytes) / 1024 ** 3).toFixed(2); }
  get espacioDisponibleGB(): string { return (Number(this.almacenamiento.disponible_bytes) / 1024 ** 3).toFixed(2); }
  get porcentajeUso(): number {
    const limite = Number(this.almacenamiento.limite_bytes);
    return limite ? Math.min(100, (Number(this.almacenamiento.usado_bytes) / limite) * 100) : 0;
  }

  async cargarTerminosVigentes() {
    this.cargandoTerminos = true;
    try {
      const terminos = await this.legalService.obtenerTerminos();
      this.versionTerminos = terminos.version;
    } catch (error: any) {
      Swal.fire('Error', error.message || 'No se pudieron cargar los términos vigentes.', 'error');
    } finally {
      this.cargandoTerminos = false;
    }
  }

  async aceptarTerminos() {
    if (!this.aceptaTerminosPendiente || !this.versionTerminos) return;
    try {
      await this.legalService.aceptarTerminos(this.versionTerminos);
      this.usuario.acepta_terminos = true;
      this.usuario.version_terminos = this.versionTerminos;
      this.usuario.fecha_aceptacion_terminos = new Date().toISOString();
      this.aceptaTerminosPendiente = false;
      Swal.fire('Éxito', 'La aceptación de los términos fue registrada correctamente.', 'success');
    } catch (error: any) {
      Swal.fire('Error', error.message || 'No fue posible registrar la aceptación.', 'error');
    }
  }

  async actualizarPerfil() {
    try {
      await this.usuarioService.actualizarPerfil(this.usuario);
      Swal.fire('Éxito', 'Perfil actualizado correctamente', 'success');
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    }
  }

  async cancelarSuscripcion() {
    const confirmacion = await Swal.fire({
      title: '¿Deseas cancelar la renovación automática?',
      text: 'Conservarás los beneficios hasta la fecha de vencimiento y no se realizarán nuevos cobros.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, conservar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3180ab'
    });

    if (confirmacion.isConfirmed) {
      try {
        const data = await this.usuarioService.cancelarSuscripcion();
        this.suscripcion = { ...this.suscripcion, estado_pago: 'cancelada' };
        this.mostrarOpcionCancelar = false;
        Swal.fire('Renovación cancelada', data.message, 'success');
      } catch (error: any) {
        Swal.fire('Error', error.message, 'error');
      }
    }
  }

  irAFormulario(tipo: string) {
    if (tipo === 'salud') {
      this.router.navigate(['/formulario/salud']);
    } else if (tipo === 'muerte') {
      this.router.navigate(['/formulario/muerte']);
    }
  }

  async subirArchivo(event: any, tipo: string) {
    const file = event.target.files[0];
    if (!file) return;

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();

    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('tipo', tipo);
    formData.append('nombre', nombreCompleto || 'Usuario');
    formData.append('id_usuario', usuario.id_persona || '');

    try {
      Swal.fire({
        title: 'Subiendo archivo...',
        text: 'Por favor espera mientras se carga tu archivo.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Reemplazamos localhost por la variable dinámica
      const resp = await fetch(`${this.baseUrl}/voluntades/subir`, {
        method: 'POST',
        body: formData
      });

      Swal.close();

      if (!resp.ok) throw new Error('Error al subir el archivo');
      const data = await resp.json();

      Swal.fire({
        icon: 'success',
        title: 'Archivo cargado correctamente',
        text: `El formulario de ${tipo} fue subido correctamente.`,
        confirmButtonColor: '#3180ab'
      });

      if (tipo === 'salud') this.usuario.formulario_salud_subido = 1;
      else if (tipo === 'muerte') this.usuario.formulario_muerte_subido = 1;

    } catch (err) {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al subir el archivo.',
        confirmButtonColor: '#3180ab'
      });
    }
  }
}
