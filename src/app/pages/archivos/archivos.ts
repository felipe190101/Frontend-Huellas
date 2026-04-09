import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { CommonModule, DatePipe } from '@angular/common';
// IMPORTANTE: Importamos el environment
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-archivos',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './archivos.html',
  styleUrls: ['./archivos.css']
})

export class Archivos implements OnInit {
  archivos: any[] = [];
  // Usamos la URL base del environment
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/archivos`;

  async ngOnInit() {
    await this.obtenerArchivos();
  }

  // ✅ Obtener archivos del titular
  async obtenerArchivos() {
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(this.apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!resp.ok) throw new Error('Error al obtener archivos');
      this.archivos = await resp.json();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los archivos', 'error');
    }
  }

  // ✅ Subir archivo (imagen, audio, video, documento)
  async subirArchivo(event: any, tipo: string) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('tipo', tipo);

    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    if (!usuario || !usuario.id_persona || !usuario.nombre) {
      Swal.fire('Error', 'No se encontró información del usuario', 'error');
      event.target.value = "";
      return;
    }

    formData.append('id_usuario', usuario.id_persona);
    formData.append('nombre', usuario.nombre);

    try {
      Swal.fire({
        title: 'Subiendo archivo...',
        text: 'Por favor espera mientras se carga tu archivo.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const resp = await fetch(`${this.apiUrl}/subir`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      Swal.close();

      if (!resp.ok) throw new Error('Error al subir el archivo');

      await this.obtenerArchivos();

      Swal.fire('✅ Éxito', 'Archivo subido correctamente', 'success');
      event.target.value = "";
    } catch (error) {
      console.error(error);
      Swal.close();
      Swal.fire('Error', 'Hubo un problema al subir el archivo', 'error');

      event.target.value = "";
    }
  }

  // ✅ Eliminar archivo
  async eliminarArchivo(id: number) {
    Swal.fire({
      title: '¿Eliminar archivo?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          const resp = await fetch(`${this.apiUrl}/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!resp.ok) throw new Error('Error al eliminar archivo');
          await this.obtenerArchivos();
          Swal.fire('✅ Eliminado', 'Archivo eliminado correctamente', 'success');
        } catch (error) {
          console.error(error);
          Swal.fire('Error', 'No se pudo eliminar el archivo', 'error');
        }
      }
    });
  }

  modalPermisosVisible = false;
  archivoSeleccionado: any = null;

  beneficiarios: any[] = [];
  beneficiariosSeleccionados: number[] = [];

  abrirPermisos(archivo: any) {
    this.archivoSeleccionado = archivo;
    this.modalPermisosVisible = true;

    this.cargarBeneficiarios();
    this.cargarPermisosActuales(archivo.id_archivo);
  }

  cargarBeneficiarios() {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("❌ No hay token en localStorage");
      this.beneficiarios = [];
      return;
    }

    fetch(`${this.baseUrl}/beneficiarios`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Error backend al obtener beneficiarios");
        }
        return res.json();
      })
      .then(data => {
        console.log("📦 Beneficiarios recibidos:", data);
        this.beneficiarios = Array.isArray(data) ? data : [];
      })
      .catch(err => {
        console.error("❌ Error cargando beneficiarios:", err);
        this.beneficiarios = [];
      });
  }

  cargarPermisosActuales(idArchivo: number) {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("❌ No hay token");
      this.beneficiariosSeleccionados = [];
      return;
    }

    // Nota: Aquí asumo que 'permisos' cuelga de la misma API base
    fetch(`${this.baseUrl.replace('/api', '')}/permisos/archivo/${idArchivo}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("No autorizado");
        }
        return res.json();
      })
      .then(data => {
        this.beneficiariosSeleccionados = data.data.map(
          (p: any) => p.id_beneficiario
        );
      })
      .catch(err => {
        console.error("❌ Error cargando permisos:", err);
        this.beneficiariosSeleccionados = [];
      });
  }


  toggleBeneficiario(idBeneficiario: number) {
    const idx = this.beneficiariosSeleccionados.indexOf(idBeneficiario);

    if (idx === -1) {
      this.beneficiariosSeleccionados.push(idBeneficiario);
    } else {
      this.beneficiariosSeleccionados.splice(idx, 1);
    }
  }

  guardarPermisos() {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Sesión expirada");
      return;
    }

    const payload = {
      id_archivo: this.archivoSeleccionado.id_archivo,
      beneficiarios: this.beneficiariosSeleccionados
    };

    fetch(`${this.baseUrl.replace('/api', '')}/permisos/asignar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error("Error guardando permisos");
        return res.json();
      })
      .then(() => {
        alert("Permisos actualizados correctamente");
        this.cerrarModal();
      })
      .catch(err => console.error(err));
  }


  cerrarModal() {
    this.modalPermisosVisible = false;
    this.archivoSeleccionado = null;
    this.beneficiariosSeleccionados = [];
  }
}