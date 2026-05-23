export interface LoginDto {
  identifier: string;
  password: string;
  portal?: 'USER' | 'ADMIN';
}
