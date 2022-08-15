import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent implements OnInit {
  loginError: string = '';
  isLoading: boolean = false;
  loginForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  subscription!: Subscription;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  isFieldInvalid(field: string) {
    return (
      !this.loginForm.get(field)!.valid && this.loginForm.get(field)!.dirty
    );
  }
  onSubmit() {
    if (!this.loginForm.valid) {
      Object.keys(this.loginForm.controls).forEach((key) => {
        this.loginForm.get(key)?.markAsDirty({ onlySelf: true });
      });

      return;
    }

    this.isLoading = true;
    const name = this.loginForm.get('name')?.value;
    const password = this.loginForm.get('password')?.value;

    this.subscription = this.authService.login(name, password).subscribe({
      next: ({ name, authorized }: { name: string; authorized: boolean }) => {
        if (authorized) {
          this.router.navigate(['/']);
        }
      },
      error: (e: HttpErrorResponse) => {
        this.isLoading = false;
        if (e.status === 401) {
          this.loginError = 'Wrong password';
        } else {
          this.loginError = 'Something went wrong. Please try again';
        }
      },
    });
  }
}
