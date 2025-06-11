import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from 'src/app/servicesclient/auth.service';


@Component({
  selector: 'app-login',
  templateUrl: './loginmarin.component.html',
  styleUrls: ['./loginmarin.component.scss'],
  standalone: true,
  imports:[FormsModule,CommonModule]
})
export class LoginMarinComponent {
  numero: string = '';
  code: string = '';
  message: string = '';
  isSuccess: boolean = false;
  step = 1;

  constructor(private authService: AuthService, private router: Router) {
    // Vérifier si l'utilisateur est déjà connecté
    if (this.isUserLoggedIn()) {
      this.router.navigate(['/marin/home']);
    }
  }

  private isUserLoggedIn(): boolean {
    const token = sessionStorage.getItem('access_token');
    if (!token) return false;

    try {
      // Vérifier si le token est un objet JSON valide avec une expiration
      const tokenData = JSON.parse(token);
      if (tokenData.expiry && new Date().getTime() > tokenData.expiry) {
        // Token expiré, nettoyer le storage
        this.clearStorages();
        return false;
      }
      return true;
    } catch {
      // Si le token n'est pas au format JSON attendu, le considérer comme invalide
      this.clearStorages();
      return false;
    }
  }

  private clearStorages(): void {
    sessionStorage.clear();
    localStorage.clear();
  }

  requestLogin(): void {
    this.authService.requestLogin(this.numero).subscribe({
      next: res => {
        this.message = res.message;
        this.isSuccess = true;
        this.step = 2;
        this.clearMessageAfterDelay();
      },
      error: err => {
        this.message = err.error.message || "Erreur lors de l'envoi du code";
        this.isSuccess = false;
        this.clearMessageAfterDelay();
      }
    });
  }

 verifyCode(): void {
  this.authService.verifyCode(this.numero, this.code).subscribe({
    next: res => {
      this.message = res.message;
      this.isSuccess = true;

        // Stocker le token d'accès dans sessionStorage avec expiration
        const tokenData = {
          value: res.access_token,
          expiry: new Date().getTime() + (24 * 60 * 60 * 1000) // 24 heures
        };
        sessionStorage.setItem('access_token', JSON.stringify(tokenData));
      
        // Stocker le refresh token dans sessionStorage
        sessionStorage.setItem('refresh_token', res.refresh_token);

        // Stocker les informations non sensibles dans localStorage
      if (res.role) {
        localStorage.setItem('role', res.role);
          localStorage.setItem('userId', res.userId.toString());
        }

        // Redirection selon le rôle
        if (res.role === 'marin') {
          console.log('Redirection vers /marin-home');
          this.router.navigate(['/marin/home']).then(
            success => console.log('Navigation réussie:', success),
            error => console.error('Erreur de navigation:', error)
          );
        } else {
          console.log('Rôle inconnu, redirection vers /login-marin');
        this.router.navigate(['/login-marin']);
      }
    },
    error: err => {
      this.message = err.error.message || 'Code incorrect';
      this.isSuccess = false;
      this.clearMessageAfterDelay();
    }
  });
}

  clearMessageAfterDelay(): void {
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
}
