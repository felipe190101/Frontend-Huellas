import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Planes } from './pages/planes/planes';
import { Nosotros } from './pages/nosotros/nosotros';
import { Contacto } from './pages/contacto/contacto';
import { Registro } from './pages/registro/registro';
import { Login } from './pages/login/login';
import { Perfil } from './pages/perfil/perfil';
import { AdminGuard } from './guards/admin.guards';
import { AdminUsuarios } from './pages/admin/admin-usuarios/admin-usuarios';
import { AdminPlanes } from './pages/admin/admin-planes/admin-planes';
import { VoluntadSalud } from './pages/formularios/voluntad-salud/voluntad-salud';
import { Beneficiarios } from './pages/beneficiarios/beneficiarios';
import { Archivos } from './pages/archivos/archivos';
import { AdminAuditoria } from './pages/admin/admin-auditoria/admin-auditoria';
import { TerminosCondiciones } from './pages/legal/terminos-condiciones/terminos-condiciones';
import { PoliticaPrivacidad } from './pages/legal/politica-privacidad/politica-privacidad';

export const routes: Routes = [
  { path: '', component: Home },        // Home por defecto
  { path: 'planes', component: Planes},
  { path: 'nosotros', component: Nosotros },
  { path: 'contacto', component: Contacto },
  { path: 'terminos-y-condiciones', component: TerminosCondiciones },
  { path: 'politica-de-privacidad', component: PoliticaPrivacidad },
  { path: 'registro', component: Registro },
  { path: 'login', component: Login },
  { path: 'perfil', component: Perfil },
  { path: 'admin/usuarios', component: AdminUsuarios, canActivate: [AdminGuard] },
  { path: 'admin/planes', component: AdminPlanes, canActivate: [AdminGuard] },
  { path: 'admin/auditoria', component: AdminAuditoria, canActivate: [AdminGuard] },
  { path: 'formulario/salud', component: VoluntadSalud },
  { path: 'beneficiarios', component: Beneficiarios},
  { path: 'archivos', component: Archivos},
  { path: '**', redirectTo: '' }                 // Redirige cualquier ruta inválida al Home
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
