import { AuthService } from '../../../core/services/auth/auth.service'; // Fix import path
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  loading = false;
  errorMessage = '';
  token: string | null = null;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() : void {
    this.resetPasswordForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: [ '', Validators.required]
    }, {
      validator: this.passwordMatchValidator
    });

    this.token = this.route.snapshot.queryParamMap.get('token');
    
    if (!this.token) {
      this.errorMessage = 'Invalid or missing reset token. Please try again with a valid link.';
    }
  }



  passwordMatchValidator(form:FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      form.get ('confirmPassword')?.setErrors({ passwordMismatch: true});

    }
    else{
      form.get('confirmPassword')?.setErrors(null);
    }
  }



get f() { return this.resetPasswordForm.controls; }

onSubmit(): void {
  this.submitted = true;
  this.errorMessage = '';

  if (this.resetPasswordForm.invalid || !this.token) {
    return;
  }

  this.loading = true;
  this.authService.resetPassword(this.token, this.f['password'].value).subscribe({
    next: () => {
      this.router.navigate(['/login'], {
        queryParams: {passwordReset: true }
      });
    },
    error:error => {
      this.loading = false;
      this.errorMessage = error?.error?.message ||'Failed to reset password. Please try again'
    }
  });
}

}