import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.services';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  tipoAcceso: 'titular' | 'beneficiario' = 'titular';
  credenciales = {
    correo: '',
    contrasena: ''
  };

  constructor(private auth: AuthService, private router: Router) {}

  get etiquetaIdentificador(): string {
    return this.tipoAcceso === 'beneficiario' ? 'Nombre de usuario' : 'Correo electrónico';
  }

  get placeholderIdentificador(): string {
    return this.tipoAcceso === 'beneficiario' ? 'Ingresa tu nombre de usuario' : 'nombre@correo.com';
  }

  async iniciarSesion() {
    try {
      const response = this.tipoAcceso === 'beneficiario'
        ? await this.auth.loginBeneficiario(this.credenciales.correo, this.credenciales.contrasena)
        : await this.auth.login(this.credenciales.correo, this.credenciales.contrasena);

      // ✅ Guardar usuario y token en localStorage
      localStorage.setItem('token', response.token);
      const usuario = response.usuario || response.beneficiario;
      localStorage.setItem('usuario', JSON.stringify(usuario));

      // ✅ Obtener nombre y rol
      const nombre = usuario.nombre;
      const rol = usuario.nombre_rol || usuario.rol;

      Swal.fire({
        icon: 'success',
        title: `¡Bienvenido, ${nombre}!`,
        text: 'Inicio de sesión exitoso.',
        confirmButtonColor: '#3180ab',
      }).then(() => {
        // ✅ Redirigir según rol
        if (rol === 'admin') {
          this.router.navigate(['/admin/usuarios']);
        } else if (rol === 'beneficiario') {
          this.router.navigate(['/beneficiario']);
        } else {
          this.router.navigate(['/archivos']);
        }
      });

    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error de inicio de sesión',
        text: err.message || 'Credenciales incorrectas',
        confirmButtonColor: '#3180ab',
      });
    }
  }

  irARegistro() {
    this.router.navigate(['/registro']);
  }

  cambiarTipoAcceso(tipo: 'titular' | 'beneficiario') {
    this.tipoAcceso = tipo;
    this.credenciales.correo = '';
    this.credenciales.contrasena = '';
  }
}
