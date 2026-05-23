export interface SignupDto {
  verificationToken: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameTa: string;
  lastNameTa: string;
  email: string;
  phone?: string;
  password: string;
}
