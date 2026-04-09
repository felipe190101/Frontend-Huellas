import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    const userData = token ? JSON.parse(atob(token.split('.')[1])) : null;

    if (userData?.rol === 'admin') return true;

    this.router.navigate(['/']);
    return false;
  }
}
