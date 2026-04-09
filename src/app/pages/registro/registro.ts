import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
// IMPORTANTE: Importamos el environment
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './registro.html',
  styleUrls: ['./registro.css']
})
export class Registro {
  // Definimos la URL usando el environment
  private apiUrl = `${environment.apiUrl}/usuarios`;

  usuario = {
    nombre: '',
    apellido: '',
    tipo_documento: '',
    documento: '',
    correo: '',
    telefono: '',
    direccion: '',
    fecha_nacimiento: '',
    contrasena: ''
  };

  confirmarContrasena = '';
  contrasenasCoinciden = true;
  nivelSeguridad = '';
  mensajeSeguridad = '';

  cumpleRequisitos: {
    tieneMinus: boolean;
    tieneMayus: boolean;
    tieneNumero: boolean;
    tieneEspecial: boolean;
    longitudOk: boolean;
  } = {
    tieneMinus: false,
    tieneMayus: false,
    tieneNumero: false,
    tieneEspecial: false,
    longitudOk: false
  };

  constructor(private router: Router) {}

  verificarFortaleza() {
    const contrasena = this.usuario.contrasena;

    const tieneMinus = /[a-z]/.test(contrasena);
    const tieneMayus = /[A-Z]/.test(contrasena);
    const tieneNumero = /\d/.test(contrasena);
    const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(contrasena);
    const longitudOk = contrasena.length >= 8;

    this.cumpleRequisitos = {
      tieneMinus,
      tieneMayus,
      tieneNumero,
      tieneEspecial,
      longitudOk
    };

    let puntos = 0;
    if (tieneMinus) puntos++;
    if (tieneMayus) puntos++;
    if (tieneNumero) puntos++;
    if (tieneEspecial) puntos++;
    if (longitudOk) puntos++;

    if (puntos <= 2) {
      this.nivelSeguridad = 'debil';
      this.mensajeSeguridad = 'Contraseña débil 😕';
    } else if (puntos === 3 || puntos === 4) {
      this.nivelSeguridad = 'media';
      this.mensajeSeguridad = 'Contraseña aceptable 🙂';
    } else {
      this.nivelSeguridad = 'fuerte';
      this.mensajeSeguridad = 'Contraseña segura 🔒';
    }

    this.verificarCoincidencia();
  }

  verificarCoincidencia() {
    this.contrasenasCoinciden =
      this.usuario.contrasena === this.confirmarContrasena;
  }

  async registrarUsuario() {
    const { tieneMinus, tieneMayus, tieneNumero, tieneEspecial, longitudOk } =
      this.cumpleRequisitos;

    if (!tieneMinus || !tieneMayus || !tieneNumero || !tieneEspecial || !longitudOk) {
      Swal.fire({
        icon: 'error',
        title: 'Contraseña insegura',
        html: `
          Tu contraseña debe cumplir con los siguientes requisitos:
          <ul style="text-align:left; margin:10px 0;">
            <li>✅ Mínimo 8 caracteres</li>
            <li>✅ Al menos una mayúscula y una minúscula</li>
            <li>✅ Al menos un número</li>
            <li>✅ Al menos un carácter especial (!@#$%^&*)</li>
          </ul>
        `,
        confirmButtonColor: '#3180ab'
      });
      return;
    }

    if (!this.contrasenasCoinciden) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden.',
        confirmButtonColor: '#3180ab'
      });
      return;
    }

    try {
      // Reemplazamos la URL de localhost por la variable dinámica
      const respuesta = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.usuario)
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        Swal.fire({
          icon: 'success',
          title: '¡Registro exitoso!',
          text: data.message || 'Tu cuenta ha sido creada correctamente.',
          confirmButtonColor: '#3180ab'
        }).then((result) => {
          if (result.isConfirmed) {
            this.router.navigate(['/login']);
          }
        });

        this.usuario = {
          nombre: '',
          apellido: '',
          tipo_documento: '',
          documento: '',
          correo: '',
          telefono: '',
          direccion: '',
          fecha_nacimiento: '',
          contrasena: ''
        };
        this.confirmarContrasena = '';
        this.nivelSeguridad = '';
        this.mensajeSeguridad = '';
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'No se pudo registrar el usuario.',
          confirmButtonColor: '#3180ab'
        });
      }
    } catch (error) {
      console.error('Error al conectar con el backend:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor.',
        confirmButtonColor: '#3180ab'
      });
    }
  }
}