import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.services';
import { PlanService } from '../../services/plan.service';

@Component({
  selector: 'app-planes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './planes.html',
  styleUrls: ['./planes.css']
})
export class Planes implements OnInit {
  planes: any[] = [];
  procesandoPlanId: number | null = null;

  constructor(
    private planService: PlanService,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    try {
      this.planes = await this.planService.obtenerPlanes();
      if (this.route.snapshot.queryParamMap.get('resultado_pago')) {
        await this.mostrarResultadoPago();
      }
    } catch (error) {
      console.error(error);
    }
  }

  async adquirirPlan(idPlan: number) {
    if (!this.auth.estaAutenticado()) {
      await Swal.fire({
        icon: 'info',
        title: 'Inicia sesión',
        text: 'Debes iniciar sesión para adquirir un plan.',
        confirmButtonColor: '#3180ab'
      });
      return;
    }

    this.procesandoPlanId = idPlan;
    Swal.fire({
      title: 'Preparando pago seguro',
      text: 'Te conectaremos con Mercado Pago.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const respuesta = await this.planService.adquirirPlan(idPlan);
      if (!respuesta.checkout_url) throw new Error('Mercado Pago no devolvió el enlace de pago.');
      window.location.assign(respuesta.checkout_url);
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'No fue posible iniciar el pago',
        text: error?.message || 'Inténtalo nuevamente.',
        confirmButtonColor: '#3180ab'
      });
    } finally {
      this.procesandoPlanId = null;
    }
  }

  private async mostrarResultadoPago() {
    try {
      const pago = await this.planService.obtenerEstadoPago();
      const activo = pago.estado === 'activa' || pago.estado === 'authorized';
      await Swal.fire({
        icon: activo ? 'success' : 'info',
        title: activo ? 'Suscripción activa' : 'Pago en validación',
        text: activo
          ? 'Tu plan ya está activo.'
          : 'Mercado Pago está procesando la autorización. La activación se reflejará al recibir la confirmación.',
        confirmButtonColor: '#3180ab'
      });
    } catch {
      // El listado debe seguir disponible aunque falle la consulta del estado.
    }
  }
}
