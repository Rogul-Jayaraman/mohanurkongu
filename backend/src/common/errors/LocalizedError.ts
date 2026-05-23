import { AppError } from './AppError.js';
import { translate } from '../utils/translation.js';

export class LocalizedError extends AppError {
  constructor(statusCode: number, code: string, lang: string = 'en', details?: unknown) {
    const message = translate(code, lang);
    super(statusCode, code, message, details);
    this.name = 'LocalizedError';
  }
}
