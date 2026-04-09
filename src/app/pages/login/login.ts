import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.services';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  credenciales = {
    correo: '',
    contrasena: ''
  };

  constructor(private auth: AuthService, private router: Router) {}

  async iniciarSesion() {
    try {
      const response = await this.auth.login(this.credenciales.correo, this.credenciales.contrasena);

      // ✅ Guardar usuario y token en localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('usuario', JSON.stringify(response.usuario));

      // ✅ Obtener nombre y rol
      const nombre = response.usuario.nombre;
      const rol = response.usuario.nombre_rol;

      Swal.fire({
        icon: 'success',
        title: `¡Bienvenido, ${nombre}!`,
        text: 'Inicio de sesión exitoso.',
        confirmButtonColor: '#3180ab',
      }).then(() => {
        // ✅ Redirigir según rol
        if (rol === 'admin') {
          this.router.navigate(['/admin/usuarios']);
        } else {
          this.router.navigate(['/perfil']);
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
}
