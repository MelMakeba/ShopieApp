import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsersService } from '../../../core/services/users/users.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  loading = true;
  submitting = false;
  passwordSubmitting = false;
  error = '';
  successMessage = '';
  passwordError = '';
  passwordSuccess = '';
  user: any = null;
  
  constructor(
    private formBuilder: FormBuilder,
    private userService: UsersService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserProfile();
  }

  initializeForms(): void {
    this.profileForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });

    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    }
  }

  loadUserProfile(): void {
    this.loading = true;
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
          phone: user.phone || ''
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading user profile', err);
        this.error = 'Failed to load user profile. Please try again.';
        this.loading = false;
      }
    });
  }

  onProfileSubmit(): void {
    if (this.profileForm.invalid) return;
    
    this.submitting = true;
    this.error = '';
    this.successMessage = '';
    
    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: (user) => {
        this.user = user;
        this.successMessage = 'Profile updated successfully!';
        this.submitting = false;
      },
      error: (err) => {
        console.error('Error updating profile', err);
        this.error = err?.error?.message || 'Failed to update profile. Please try again.';
        this.submitting = false;
      }
    });
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.invalid) return;
    
    this.passwordSubmitting = true;
    this.passwordError = '';
    this.passwordSuccess = '';
    
    this.userService.changePassword(
      this.passwordForm.get('currentPassword')?.value,
      this.passwordForm.get('newPassword')?.value
    ).subscribe({
      next: () => {
        this.passwordSuccess = 'Password changed successfully!';
        this.passwordForm.reset();
        this.passwordSubmitting = false;
      },
      error: (err: { error: { message: string; }; }) => {
        console.error('Error changing password', err);
        this.passwordError = err?.error?.message || 'Failed to change password. Please try again.';
        this.passwordSubmitting = false;
      }
    });
  }
}