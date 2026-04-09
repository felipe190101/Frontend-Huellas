import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForOf } from '@angular/common';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-planes',
  standalone: true,
  imports: [FormsModule, NgForOf, CommonModule],
  templateUrl: './admin-planes.html',
  styleUrls: ['./admin-planes.css']
})
export class AdminPlanes implements OnInit {
  // Usamos la URL del environment
  private apiUrl = `${environment.apiUrl}/admin/planes`;

  planes: any[] = [];
  nuevoPlan = {
    nombre_plan: '',
    descripcion: '',
    almacenamiento_max: 0,
    beneficiarios_max: 0,
    precio_mensual: 0,
    precio_anual: 0,
    estado: 'activo'
  };

  async ngOnInit() {
    await this.obtenerPlanes();
  }

  async obtenerPlanes() {
    try {
      const resp = await fetch(this.apiUrl, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      this.planes = await resp.json();
    } catch (err) {
      console.error('Error al obtener planes:', err);
    }
  }

  async agregarPlan() {
    try {
      const resp = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(this.nuevoPlan)
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message);

      Swal.fire({
        icon: 'success',
        title: 'Plan agregado',
        text: data.message,
        confirmButtonColor: '#3180ab'
      });

      this.nuevoPlan = {
        nombre_plan: '',
        descripcion: '',
        almacenamiento_max: 0,
        beneficiarios_max: 0,
        precio_mensual: 0,
        precio_anual: 0,
        estado: 'activo'
      };

      this.obtenerPlanes();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo crear el plan',
        confirmButtonColor: '#3180ab'
      });
    }
  }

  async guardarCambios(plan: any) {
    try {
      const resp = await fetch(`${this.apiUrl}/${plan.id_plan}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(plan)
      });

      const data = await resp.json();
      if (resp.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Plan actualizado',
          text: data.message,
          confirmButtonColor: '#3180ab'
        });
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo actualizar el plan',
        confirmButtonColor: '#3180ab'
      });
    }
  }

  async eliminarPlan(id: number) {
    Swal.fire({
      title: '¿Eliminar plan?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3180ab',
      confirmButtonText: 'Sí, eliminar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const resp = await fetch(`${this.apiUrl}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });

          const data = await resp.json();
          if (resp.ok) {
            this.planes = this.planes.filter(p => p.id_plan !== id);
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: data.message,
              confirmButtonColor: '#3180ab'
            });
          } else throw new Error(data.message);
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.message || 'No se pudo eliminar el plan',
            confirmButtonColor: '#3180ab'
          });
        }
      }
    });
  }
}