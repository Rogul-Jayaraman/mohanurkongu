export interface SignupDto {
  verificationToken: string;
  firstNameEn: string;
  lastNameEn: string;
  firstNameTa: string;
  lastNameTa: string;
  phone?: string;
  password: string;
}
