import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.services';

@Component({ selector: 'app-portal-beneficiario', standalone: true, imports: [CommonModule], templateUrl: './portal-beneficiario.html', styleUrls: ['./portal-beneficiario.css'] })
export class PortalBeneficiario implements OnInit {
  perfil: any = null;
  titular: any = null;
  cargando = true;
  constructor(private auth: AuthService, private router: Router) {}
  async ngOnInit() {
    const usuario = this.auth.getUsuario();
    const rol = usuario?.rol || usuario?.nombre_rol;
    if (!usuario || rol !== 'beneficiario') return void this.router.navigate(['/login']);
    try {
      const respuesta = await this.auth.obtenerPerfilBeneficiario();
      this.perfil = respuesta?.beneficiario || respuesta?.perfil || respuesta;
      this.titular = respuesta?.titular || respuesta?.titular_asociado || respuesta?.titularAsociado || this.perfil?.titular || null;
    }
    catch { this.auth.logout(); this.router.navigate(['/login']); }
    finally { this.cargando = false; }
  }
  cerrarSesion() { this.auth.logout(); this.router.navigate(['/login']); }
}
