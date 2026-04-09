import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import Swal from 'sweetalert2';
// IMPORTANTE: Importamos el environment para que la URL cambie sola entre Local y Vercel
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './admin-usuarios.html',
  styleUrls: ['./admin-usuarios.css']
})
export class AdminUsuarios implements OnInit {
  // Definimos la base de la URL usando el environment
  private baseUrl = environment.apiUrl;

  usuarios: any[] = [];
  roles: any[] = [];

  ngOnInit() {
    this.obtenerUsuarios();
    this.obtenerRoles();
  }

  async obtenerUsuarios() {
    try {
      const resp = await fetch(`${this.baseUrl}/admin/usuarios`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!resp.ok) throw new Error(`Error ${resp.status}`);

      const data = await resp.json();
      this.usuarios = data;
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
    }
  }

  async obtenerRoles() {
    try {
      const resp = await fetch(`${this.baseUrl}/roles`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      this.roles = await resp.json();
    } catch (err) {
      console.error(err);
    }
  }

  async actualizarRol(usuario: any, event: Event) {
    const select = event.target as HTMLSelectElement;
    const nuevoRol = select.value;

    if (!nuevoRol) {
      console.error('⚠️ No se seleccionó un rol válido');
      return;
    }

    try {
      const resp = await fetch(`${this.baseUrl}/admin/usuarios/${usuario.id_persona}/rol`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ id_rol: nuevoRol })
      });

      const data = await resp.json();

      if (resp.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Rol actualizado',
          text: `El rol de ${usuario.nombre} se ha actualizado correctamente`,
          confirmButtonColor: '#3180ab'
        });
        this.obtenerUsuarios(); 
      } else {
        throw new Error(data.message || 'Error al actualizar rol');
      }

    } catch (err) {
      console.error('Error al actualizar rol:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el rol.',
        confirmButtonColor: '#3180ab'
      });
    }
  }

  async eliminarUsuario(id_persona: number) {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3180ab',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      try {
        const resp = await fetch(`${this.baseUrl}/admin/usuarios/${id_persona}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await resp.json();

        if (resp.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Usuario eliminado',
            text: data.message,
            confirmButtonColor: '#3180ab'
          });
          this.obtenerUsuarios(); 
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message || 'No se pudo eliminar el usuario',
            confirmButtonColor: '#3180ab'
          });
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un problema con el servidor',
          confirmButtonColor: '#3180ab'
        });
      }
    }
  }

  async liberarInformacion(idTitular: number) {
    const token = localStorage.getItem("token");

    Swal.fire({
      title: 'Liberando información...',
      text: 'Enviando correos a los beneficiarios',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await fetch(
        `${this.baseUrl}/admin/liberar-informacion/${idTitular}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error inesperado');
      }

      Swal.fire({
        icon: 'success',
        title: 'Información liberada',
        text: data.message || 'Los correos fueron enviados correctamente.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#2e7d32'
      });

    } catch (error: any) {
      console.error("❌ Error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error al liberar información',
        text: error.message || 'No fue posible completar la operación.',
        confirmButtonText: 'Cerrar'
      });
    }
  }

  confirmarLiberacion(usuario: any) {
    Swal.fire({
      title: 'Liberar información',
      html: `
        <p>Estás a punto de liberar la información del titular:</p>
        <strong>${usuario.nombre} ${usuario.apellido}</strong>
        <br><br>
        <span style="color:#d33">
          ⚠️ Esta acción enviará correos a los beneficiarios con acceso a sus archivos.
        </span>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, liberar información',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#aaa',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.liberarInformacion(usuario.id_persona);
      }
    });
  }
}