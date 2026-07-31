import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

type TipoReclamacion = 'salud' | 'muerte';

@Component({ selector: 'app-reclamacion', standalone: true, imports: [CommonModule], templateUrl: './reclamacion.html', styleUrls: ['./reclamacion.css'] })
export class Reclamacion {
  tipo: TipoReclamacion;
  enviando = false; error = ''; exito = '';
  archivos: Record<string, File | null> = {};

  constructor(route: ActivatedRoute, private router: Router) { this.tipo = route.snapshot.data['tipo'] as TipoReclamacion; }
  get titulo() { return this.tipo === 'salud' ? 'Reclamación de salud' : 'Reclamación por fallecimiento'; }
  get documentoPrincipal() { return this.tipo === 'salud' ? { campo: 'historia_clinica', etiqueta: 'Historia clínica' } : { campo: 'certificado_defuncion', etiqueta: 'Certificado de defunción' }; }

  seleccionarArchivo(evento: Event, campo: string) {
    this.archivos[campo] = (evento.target as HTMLInputElement).files?.[0] || null;
  }

  async enviar() {
    const requeridos = [this.documentoPrincipal.campo, 'cedula_beneficiario', 'cedula_titular'];
    if (requeridos.some((campo) => !this.archivos[campo])) { this.error = 'Adjunta los tres documentos requeridos para enviar la reclamación.'; return; }
    this.enviando = true; this.error = ''; this.exito = '';
    const datos = new FormData();
    requeridos.forEach((campo) => datos.append(campo, this.archivos[campo] as File));
    try {
      Swal.fire({
        title: 'Enviando reclamación',
        text: 'Estamos cargando y procesando tus documentos. Por favor espera.',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      });
      const respuesta = await fetch(`${environment.apiUrl}/reclamaciones/${this.tipo}`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }, body: datos });
      const contenido = await respuesta.json();
      if (!respuesta.ok) throw new Error(contenido.message || 'No fue posible enviar la reclamación');
      Swal.close();
      this.exito = contenido.message; this.archivos = {};
      await Swal.fire({
        icon: 'success',
        title: 'Reclamación enviada',
        text: 'Tu solicitud fue enviada correctamente y se procederá a revisar la documentación adjunta.',
        confirmButtonColor: '#3180ab',
      });
    } catch (error: any) { Swal.close(); this.error = error.message || 'No fue posible enviar la reclamación'; }
    finally { this.enviando = false; }
  }

  volver() { this.router.navigate(['/beneficiario']); }
}
