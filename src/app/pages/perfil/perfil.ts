import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { UsuarioService } from '../../services/usuario.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
// IMPORTANTE: Importamos el environment
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(private usuarioService: UsuarioService, private router: Router) {}

  async ngOnInit() {
    try {
      const data = await this.usuarioService.obtenerPerfil();
      this.usuario = data.usuario;
      this.suscripcion = data.suscripcion;
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
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
      title: '¿Deseas cancelar tu suscripción?',
      text: 'Perderás acceso a los beneficios del plan actual.',
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
        Swal.fire('Suscripción cancelada', data.message, 'success');
        this.suscripcion = null; 
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