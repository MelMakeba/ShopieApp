export interface RequestPasswordReset {
  email: string;
}

export interface ResetPassword {
  token: string;
  password: string;
}

export interface RequestResetResponse {
  message: string;
  token?: string;
}

export interface ResetPasswordResponse {
  message: string;
}
