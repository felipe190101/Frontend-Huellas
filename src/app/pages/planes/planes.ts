import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { PlanService } from '../../services/plan.service';
import { AuthService } from '../../services/auth.services';
import { CommonModule } from '@angular/common';
// IMPORTANTE: Importamos el environment
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-planes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './planes.html',
  styleUrls: ['./planes.css']
})
export class Planes implements OnInit {
  planes: any[] = [];

  constructor(private planService: PlanService, private auth: AuthService) {}

  async ngOnInit() {
    try {
      this.planes = await this.planService.obtenerPlanes();
    } catch (err) {
      console.error(err);
    }
  }

  async adquirirPlan(id_plan: number) {
    if (!this.auth.estaAutenticado()) {
      Swal.fire({
        icon: 'info',
        title: 'Inicia sesión',
        text: 'Debes iniciar sesión para adquirir un plan.',
        confirmButtonColor: '#3180ab'
      });
      return;
    }

    try {
      const resp = await this.planService.adquirirPlan(id_plan);

      if (resp.message === 'Plan adquirido exitosamente.') {
        Swal.fire({
          icon: 'success',
          title: '¡Plan adquirido!',
          text: 'Tu suscripción se ha activado correctamente.',
          confirmButtonColor: '#3180ab'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: resp.message,
          confirmButtonColor: '#3180ab'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo procesar la solicitud.',
        confirmButtonColor: '#3180ab'
      });
    }
  }
}