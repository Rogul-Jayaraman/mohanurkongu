import express from 'express';

/**
 * CORS wrapper for Express route handlers.
 * Adds permissive Access‑Control headers and handles OPTIONS pre‑flight.
 * Intended for serverless (Vercel) deployments where the generic cors
 * middleware is not sufficient.
 */
export const withCors =
  (handler: (req: express.Request, res: express.Response) => any) =>
  async (req: express.Request, res: express.Response) => {
    // Allow any origin – adjust to a whitelist if required later
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,DELETE,PATCH,OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type,Authorization'
    );

    // Handle pre‑flight OPTIONS request
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    return handler(req, res);
  };
