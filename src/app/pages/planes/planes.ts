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
  suscripcionActual: any = null;
  procesandoPlanId: number | null = null;

  constructor(
    private planService: PlanService,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {}

  formatearPrecio(valor: number | string): string {
    const precio = Number(valor);
    if (!Number.isFinite(precio)) return '0';

    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio);
  }

  async ngOnInit() {
    try {
      this.planes = await this.planService.obtenerPlanes();
      if (this.auth.estaAutenticado()) {
        this.suscripcionActual = await this.planService.obtenerSuscripcion().catch(() => null);
      }
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

    if (this.suscripcionActual) {
      await this.programarCambioPlan(idPlan);
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

  esPlanActual(idPlan: number): boolean {
    return Number(this.suscripcionActual?.id_plan) === Number(idPlan);
  }

  esPlanPendiente(idPlan: number): boolean {
    return Number(this.suscripcionActual?.id_plan_pendiente) === Number(idPlan);
  }

  textoBoton(plan: any): string {
    if (this.procesandoPlanId === plan.id_plan) return 'Procesando...';
    if (this.esPlanPendiente(plan.id_plan)) return 'Cambio programado';
    if (this.esPlanActual(plan.id_plan)) {
      return this.suscripcionActual?.id_plan_pendiente ? 'Conservar este plan' : 'Plan actual';
    }
    return this.suscripcionActual ? 'Cambiar a este plan' : 'Suscribirme';
  }

  botonDeshabilitado(plan: any): boolean {
    if (this.procesandoPlanId !== null) return true;
    if (this.esPlanPendiente(plan.id_plan)) return true;
    return this.esPlanActual(plan.id_plan) && !this.suscripcionActual?.id_plan_pendiente;
  }

  private async programarCambioPlan(idPlan: number): Promise<void> {
    const plan = this.planes.find(item => Number(item.id_plan) === Number(idPlan));
    const cancelarCambio = this.esPlanActual(idPlan) && this.suscripcionActual?.id_plan_pendiente;
    const confirmacion = await Swal.fire({
      icon: 'question',
      title: cancelarCambio ? '¿Conservar tu plan actual?' : `¿Cambiar al ${plan?.nombre_plan || 'plan seleccionado'}?`,
      text: cancelarCambio
        ? 'Se cancelará el cambio que tenías programado.'
        : 'El cambio se aplicará en tu próxima renovación. Hasta entonces conservarás los beneficios del plan actual.',
      showCancelButton: true,
      confirmButtonText: cancelarCambio ? 'Sí, conservarlo' : 'Programar cambio',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#3180ab'
    });
    if (!confirmacion.isConfirmed) return;

    this.procesandoPlanId = idPlan;
    try {
      const respuesta = await this.planService.cambiarPlan(idPlan);
      await Swal.fire('Cambio registrado', respuesta.message, 'success');
      this.suscripcionActual = await this.planService.obtenerSuscripcion();
    } catch (error: any) {
      await Swal.fire({
        icon: 'warning',
        title: 'No fue posible cambiar el plan',
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
