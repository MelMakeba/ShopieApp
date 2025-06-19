export interface Register {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}
