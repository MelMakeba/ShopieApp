export interface Login {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
  token: string;
}
