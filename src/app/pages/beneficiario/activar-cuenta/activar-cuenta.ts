import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth.services';

@Component({
  selector: 'app-activar-cuenta-beneficiario', standalone: true,
  imports: [CommonModule, FormsModule], templateUrl: './activar-cuenta.html', styleUrls: ['./activar-cuenta.css']
})
export class ActivarCuentaBeneficiario {
  contrasena = ''; confirmarContrasena = ''; private token = '';
  nivelSeguridad = '';
  mensajeSeguridad = '';
  contrasenasCoinciden = true;
  cumpleRequisitos = {
    tieneMinus: false, tieneMayus: false, tieneNumero: false,
    tieneEspecial: false, longitudOk: false
  };
  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router) {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }
  verificarFortaleza(): void {
    const tieneMinus = /[a-z]/.test(this.contrasena);
    const tieneMayus = /[A-Z]/.test(this.contrasena);
    const tieneNumero = /\d/.test(this.contrasena);
    const tieneEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(this.contrasena);
    const longitudOk = this.contrasena.length >= 8;
    this.cumpleRequisitos = { tieneMinus, tieneMayus, tieneNumero, tieneEspecial, longitudOk };
    const puntos = [tieneMinus, tieneMayus, tieneNumero, tieneEspecial, longitudOk].filter(Boolean).length;
    if (puntos <= 2) { this.nivelSeguridad = 'debil'; this.mensajeSeguridad = 'Contraseña débil'; }
    else if (puntos <= 4) { this.nivelSeguridad = 'media'; this.mensajeSeguridad = 'Contraseña aceptable'; }
    else { this.nivelSeguridad = 'fuerte'; this.mensajeSeguridad = 'Contraseña segura'; }
    this.verificarCoincidencia();
  }

  verificarCoincidencia(): void {
    this.contrasenasCoinciden = this.contrasena === this.confirmarContrasena;
  }

  private contrasenaSegura(): boolean {
    const { tieneMinus, tieneMayus, tieneNumero, tieneEspecial, longitudOk } = this.cumpleRequisitos;
    return tieneMinus && tieneMayus && tieneNumero && tieneEspecial && longitudOk;
  }

  async activar() {
    if (!this.contrasenaSegura()) {
      return void Swal.fire({
        icon: 'error',
        title: 'Contraseña insegura',
        text: 'Debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.',
        confirmButtonColor: '#3180ab'
      });
    }
    if (!this.token) return void Swal.fire('Enlace inválido', 'No se encontró el token de activación.', 'error');
    if (this.contrasena !== this.confirmarContrasena) return void Swal.fire('Contraseñas diferentes', 'Verifica la confirmación.', 'warning');
    try {
      const respuesta = await this.auth.activarCuentaBeneficiario(this.token, this.contrasena);
      await Swal.fire('Cuenta activada', `Tu usuario es ${respuesta.nombre_usuario}. Ya puedes iniciar sesión.`, 'success');
      this.router.navigate(['/login']);
    } catch (error: any) { Swal.fire('No fue posible activar la cuenta', error.message || 'Intenta nuevamente.', 'error'); }
  }
}
