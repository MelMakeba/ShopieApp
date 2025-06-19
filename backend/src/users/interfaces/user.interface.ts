export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: Date;
  lastLogin?: Date;
}
