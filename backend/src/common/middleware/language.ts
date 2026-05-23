import type { Request, Response, NextFunction } from 'express';
import { supportedLanguage } from '../utils/translation.js';

declare global {
  namespace Express {
    interface Locals {
      lang: string;
    }
  }
}

export function language(req: Request, res: Response, next: NextFunction): void {
  const acceptLang = req.headers['accept-language'] || 'en';
  const lang = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase() || 'en';
  res.locals.lang = supportedLanguage(lang);
  next();
}
