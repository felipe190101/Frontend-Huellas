import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
// IMPORTANTE: Importamos el environment
import { environment } from '../../../environments/environment';
import { LegalService } from '../../services/legal.service';
import { TelefonoInternacional } from '../../shared/telefono-internacional/telefono-internacional';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, TelefonoInternacional],
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
    telefono_pais: 'CO',
    telefono_codigo_pais: '+57',
    telefono_nacional: '',
    direccion: '',
    fecha_nacimiento: '',
    contrasena: ''
  };

  confirmarContrasena = '';
  aceptaTerminos = false;
  versionTerminos = '';
  cargandoTerminos = true;
  contrasenasCoinciden = true;
  nivelSeguridad = '';
  mensajeSeguridad = '';
  registrando = false;

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

  constructor(private router: Router, private legalService: LegalService) {}

  async ngOnInit() {
    try {
      const terminos = await this.legalService.obtenerTerminos();
      this.versionTerminos = terminos.version;
    } catch (error) {
      console.error('Error al consultar términos:', error);
      Swal.fire('Error', 'No se pudieron cargar los términos vigentes. Inténtalo de nuevo más tarde.', 'error');
    } finally {
      this.cargandoTerminos = false;
    }
  }

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

    if (!this.aceptaTerminos || !this.versionTerminos) {
      Swal.fire('Aceptación requerida', 'Debes aceptar los términos y condiciones vigentes para crear tu cuenta.', 'error');
      return;
    }

    try {
      this.registrando = true;
      Swal.fire({
        title: 'Creando cuenta...',
        text: 'Estamos registrando tu información.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // Reemplazamos la URL de localhost por la variable dinámica
      const respuesta = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...this.usuario, acepta_terminos: true, version_terminos: this.versionTerminos })
      });

      const data = await respuesta.json().catch(() => ({}));
      Swal.close();

      if (respuesta.ok) {
        await Swal.fire({
          icon: 'success',
          title: '¡Registro exitoso!',
          text: data.message || 'Tu cuenta ha sido creada correctamente.',
          confirmButtonColor: '#3180ab'
        });
        await this.router.navigate(['/login']);

        this.usuario = {
          nombre: '',
          apellido: '',
          tipo_documento: '',
          documento: '',
          correo: '',
          telefono_pais: 'CO',
          telefono_codigo_pais: '+57',
          telefono_nacional: '',
          direccion: '',
          fecha_nacimiento: '',
          contrasena: ''
        };
        this.confirmarContrasena = '';
        this.aceptaTerminos = false;
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
      Swal.close();
      console.error('Error al conectar con el backend:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor.',
        confirmButtonColor: '#3180ab'
      });
    } finally {
      this.registrando = false;
    }
  }
}
