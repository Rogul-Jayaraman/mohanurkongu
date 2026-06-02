export interface StepProps {
  formData: any;
  updateField: (field: any, value: any) => void;
  onAction?: () => void;
  fieldErrors?: Record<string, string>;
  touchedFields?: Set<string>;
  markTouched?: (field: string) => void;
}
