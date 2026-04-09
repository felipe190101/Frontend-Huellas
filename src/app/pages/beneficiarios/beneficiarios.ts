import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
// IMPORTANTE: Importamos el environment
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-beneficiarios',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './beneficiarios.html',
  styleUrls: ['./beneficiarios.css']
})
export class Beneficiarios implements OnInit {
  beneficiarios: any[] = [];
  beneficiario = {
    id_beneficiario: null,
    nombre: '',
    apellido: '',
    tipo_documento: '',
    documento: '',
    correo: '',
    telefono: '',
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
      this.beneficiarios = await resp.json();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los beneficiarios', 'error');
    }
  }

  mostrarModal = false;

  abrirFormulario(beneficiario?: any) {
    this.modoEdicion = !!beneficiario;
    this.beneficiario = beneficiario
      ? { ...beneficiario }
      : {
          id_beneficiario: null,
          nombre: '',
          apellido: '',
          tipo_documento: '',
          documento: '',
          correo: '',
          telefono: '',
          relacion: ''
        };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
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
        body: JSON.stringify(this.beneficiario)
      });
      if (!resp.ok) throw new Error('Error al crear beneficiario');
      Swal.fire('✅ Éxito', 'Beneficiario agregado correctamente', 'success');
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
        body: JSON.stringify(this.beneficiario)
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