import { Component } from '@angular/core';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
// IMPORTANTE: Importamos el environment
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-voluntad-salud',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './voluntad-salud.html',
  styleUrls: ['./voluntad-salud.css']
})
export class VoluntadSalud {
  // Definimos la base de la URL usando el environment
  private baseUrl = environment.apiUrl;

  formulario = {
    servicio_medico: '',
    observacion_servicio: '',
    antecedentes_importantes: '',
    alergias: '',
    antecedentes_familiares: '',
    otros_antecedentes: '',
    eutanasia_pasiva: '',
    observacion_eutanasia: '',
    esfuerzos_vida: '',
    observacion_esfuerzos: '',
    muerte_siga_curso: '',
    observacion_muerte: '',
    morir_en_casa: '',
    observacion_casa: '',
    otros_deseos: '',
    voluntad_vejez: '',
    otros_vejez: '',
    creencias_religiosas: ''
  };

  async enviarFormulario() {
    try {
      // 🌀 Mostrar loader mientras guarda
      Swal.fire({
        title: 'Guardando formulario...',
        text: 'Por favor espera mientras se genera y guarda tu voluntad.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

      const body = {
        nombre: `${usuario.nombre} ${usuario.apellido}`,
        tipo: 'salud',
        datos: this.formulario
      };

      // Reemplazamos localhost por la variable dinámica
      const resp = await fetch(`${this.baseUrl}/voluntades/guardar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      Swal.close();

      if (!resp.ok) throw new Error('Error al enviar formulario');
      
      Swal.fire({
        icon: 'success',
        title: 'Formulario guardado correctamente',
        text: 'Tu voluntad de salud se ha almacenado exitosamente en Drive.',
        confirmButtonColor: '#3180ab'
      }).then(() => {
        window.location.href = '/perfil';
      });
    } catch (error) {
      Swal.close();
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo enviar el formulario. Inténtalo de nuevo.',
        confirmButtonColor: '#3180ab'
      });
    }
  }
}