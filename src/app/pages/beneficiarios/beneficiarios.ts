import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
// IMPORTANTE: Importamos el environment
import { environment } from '../../../environments/environment';
import { TelefonoInternacional } from '../../shared/telefono-internacional/telefono-internacional';

@Component({
  selector: 'app-beneficiarios',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, TelefonoInternacional],
  templateUrl: './beneficiarios.html',
  styleUrls: ['./beneficiarios.css']
})
export class Beneficiarios implements OnInit {
  beneficiarios: any[] = [];
  beneficiario = {
    id_beneficiario: null,
    nombre: '',
    apellido: '',
    correo: '',
    tipo_documento: '',
    documento: '',
    telefono_pais: '',
    telefono_codigo_pais: '',
    telefono_nacional: '',
    telefono_e164: '',
    relacion: ''
  };
  modoEdicion = false;
  // Usamos la URL base del environment
  private apiUrl = `${environment.apiUrl}/beneficiarios`;

  async ngOnInit() {
    await this.obtenerBeneficiarios();
  }

  // ✅ Obtener beneficiarios del titular
  async obtenerBeneficiarios() {
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(this.apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error('Error al obtener beneficiarios');
      const data = await resp.json();
      this.beneficiarios = (Array.isArray(data) ? data : []).map((beneficiario: any) => ({
        ...beneficiario,
        telefono_e164: beneficiario.telefono_e164 || this.formatearTelefono(beneficiario)
      }));
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los beneficiarios', 'error');
    }
  }

  mostrarModal = false;

  abrirFormulario(beneficiario?: any) {
    this.modoEdicion = !!beneficiario;
    const nombreCompleto = String(beneficiario?.nombre_completo || '').trim();
    const partesNombre = nombreCompleto.split(/\s+/).filter(Boolean);
    const nombreDesdeCompleto = partesNombre.length > 1 ? partesNombre.slice(0, -1).join(' ') : nombreCompleto;
    const apellidoDesdeCompleto = partesNombre.length > 1 ? partesNombre.slice(-1).join(' ') : '';

    this.beneficiario = beneficiario
      ? {
          ...beneficiario,
          nombre: beneficiario.nombre || nombreDesdeCompleto,
          apellido: beneficiario.apellido || apellidoDesdeCompleto,
          telefono_e164: beneficiario.telefono_e164 || '',
          telefono_pais: beneficiario.telefono_pais || 'CO',
          telefono_codigo_pais: beneficiario.telefono_codigo_pais || '+57',
          telefono_nacional: beneficiario.telefono_nacional || ''
        }
      : {
          id_beneficiario: null,
          nombre: '',
          apellido: '',
          tipo_documento: '',
          documento: '',
          correo: '',
          telefono_e164: '',
          telefono_pais: 'CO',
          telefono_codigo_pais: '+57',
          telefono_nacional: '',
          relacion: ''
        };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  formatearTelefono(beneficiario: any): string {
    if (beneficiario?.telefono_e164) return beneficiario.telefono_e164;
    if (beneficiario?.telefono_codigo_pais && beneficiario?.telefono_nacional) {
      return `${beneficiario.telefono_codigo_pais} ${beneficiario.telefono_nacional}`;
    }
    if (beneficiario?.telefono) return beneficiario.telefono;
    return '—';
  }

  private datosBeneficiario() {
    const { telefono_e164, ...datos } = this.beneficiario as any;
    return datos;
  }

  async guardarBeneficiario() {
    if (this.modoEdicion) await this.actualizarBeneficiario();
    else await this.crearBeneficiario();
    this.cerrarModal();
  }

  // ✅ Crear nuevo beneficiario
  async crearBeneficiario() {
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(this.datosBeneficiario())
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || data.mensaje || 'Error al crear beneficiario');

      const correoEnviado = data?.notificacionCorreo?.enviado === true;
      const correoNoDisponible = data?.notificacionCorreo?.motivo === 'sin_correo';
      const mensajeCorreo = correoEnviado
        ? 'Además, se le envió un correo electrónico al beneficiario.'
        : correoNoDisponible
          ? 'El beneficiario no tiene correo registrado, así que no se pudo enviar la notificación.'
          : 'No se pudo confirmar el envío del correo al beneficiario.';

      Swal.fire('✅ Éxito', `Beneficiario agregado correctamente. ${mensajeCorreo}`, 'success');
      await this.obtenerBeneficiarios();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo agregar el beneficiario', 'error');
    }
  }

  // ✅ Actualizar beneficiario
  async actualizarBeneficiario() {
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`${this.apiUrl}/${this.beneficiario.id_beneficiario}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(this.datosBeneficiario())
      });
      if (!resp.ok) throw new Error('Error al actualizar beneficiario');
      Swal.fire('✅ Éxito', 'Beneficiario actualizado correctamente', 'success');
      await this.obtenerBeneficiarios();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo actualizar el beneficiario', 'error');
    }
  }

  // ✅ Eliminar beneficiario
  async eliminarBeneficiario(id_beneficiario: number) {
    Swal.fire({
      title: '¿Eliminar beneficiario?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          const resp = await fetch(`${this.apiUrl}/${id_beneficiario}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!resp.ok) throw new Error('Error al eliminar beneficiario');
          Swal.fire('✅ Eliminado', 'Beneficiario eliminado correctamente', 'success');
          await this.obtenerBeneficiarios();
        } catch (error) {
          console.error(error);
          Swal.fire('Error', 'No se pudo eliminar el beneficiario', 'error');
        }
      }
    });
  }
}
