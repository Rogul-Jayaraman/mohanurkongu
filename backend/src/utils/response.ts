import { Response } from 'express';

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export const sendSuccess = <T = unknown>(res: Response, data: T, statusCode: number = 200, _meta?: unknown): void => {
  res.status(statusCode).json({ success: true, data } satisfies ApiSuccess<T>);
};
