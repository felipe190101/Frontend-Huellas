import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import emailjs from '@emailjs/browser';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contacto.html',
  styleUrl: './contacto.css'
})
export class Contacto {
  formData = {
    nombre: '',
    correo: '',
    tipo: '',
    mensaje: ''
  };


// Correo destinatario según el tipo de solicitud
  /*private destinatarios: Record<string, string> = {
    reclamacion_salud: 'salud@huellaslegados.com',
    reclamacion_muerte: 'fallecimientos@huellaslegados.com'
  };*/

  enviarFormulario() {

    const serviceID = 'service_q242he5';
    const publicKey = 'NqdJQLh13LmtmuzfW';

    const tipo = this.formData.tipo;

    // Plantillas diferentes por tipo
    const templateMap: Record<string, string> = {
      reclamacion_salud: 'template_56yhu25',
      reclamacion_muerte: 'template_m6lfejn'
    };

      // 🧠 Mapa de nombres legibles
    const tipoLegible: Record<string, string> = {
      reclamacion_salud: 'Reclamación salud',
      reclamacion_muerte: 'Reclamación muerte',
      peticion: 'Petición',
      queja: 'Queja'
    };


    const tipoTexto = tipoLegible[tipo];

    const templateID = templateMap[tipo];

    if (!templateID) {
    Swal.fire({
      icon: 'warning',
      title: 'Selecciona un tipo de solicitud',
      text: 'Por favor elige una opción antes de enviar tu mensaje.',
      confirmButtonColor: '#3180ab'
    });
    return;
  }

    const templateParams = {
      from_name: this.formData.nombre,
      reply_to: this.formData.correo,
      message: this.formData.mensaje,
      tipo: tipoTexto
    };

    emailjs
    .send(serviceID, templateID, templateParams, publicKey)
    .then(() => {
      Swal.fire({
        icon: 'success',
        title: '¡Mensaje enviado!',
        text: 'Tu mensaje fue enviado correctamente. Te contactaremos pronto.',
        confirmButtonColor: '#3180ab'
      });
      this.formData = { nombre: '', correo: '', tipo: '', mensaje: '' };
    })
    .catch((err) => {
      console.error('Error al enviar email:', err);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Hubo un problema al enviar el mensaje. Intenta más tarde.',
        confirmButtonColor: '#3180ab'
      });
    });
  }
}