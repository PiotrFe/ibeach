import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent implements OnInit {
  loginForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {}

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

    const name = this.loginForm.get('name')?.value;
    const password = this.loginForm.get('password')?.value;

    this.authService.login(name, password).subscribe({
      next: (loggedIn) => {
        if (loggedIn) {
          this.router.navigate(['/']);
        }
      },
    });
  }
}
