// Placeholder comment added for feature branch
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { withCors } from './api/_cors';
import bodyParser from 'body-parser';
import prisma from './config/prisma';
import { requestIdMiddleware } from './middlewares/request-id';
import { globalLimiter } from './middlewares/rate-limiter';
import { structuredLogger } from './middlewares/structured-logger';
import { otpStore } from './services/otp-store.service';

// Route imports
import authRoutes from "./routes/auth"
import profileRoutes from "./routes/profile"
import uploadRoutes from "./routes/upload"
import dashboardRoutes from "./routes/dashboard"
import horoscopeRouter from "./modules/horoscopes"
import shortlistRoutes from "./routes/shortlist"
import mandapamRoutes from "./routes/mandapam"
import adminMatrimonyRoutes from "./routes/adminMatrimony"
import settingsRoutes from "./routes/settings"
import analyticsRoutes from "./routes/analytics"
import publicRoutes from "./routes/public"

const app = express();
// CORS pre‑flight is handled by the cors middleware below
const PORT = process.env.PORT || 5001

if (process.env.VERCEL) {
  app.use((req, res, next) => {
    // Apply CORS for serverless deployment
    withCors((_req: express.Request, _res: express.Response) => next())(req, res);
  });
}

// Removed unused whitelist logic – using permissive origin handling via cors({origin:true})

app.use(cors({ origin: true, credentials: true, methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(requestIdMiddleware);
app.use(globalLimiter);
app.use(structuredLogger);

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/profiles", profileRoutes)
app.use("/api/uploads", uploadRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/horoscope", horoscopeRouter)
app.use("/api/shortlist", shortlistRoutes)
app.use("/api/admin/mandapam", mandapamRoutes)
app.use("/api/admin/matrimony", adminMatrimonyRoutes)
app.use("/api/admin/analytics", analyticsRoutes)
app.use("/api/settings", settingsRoutes)
app.use("/api/public", publicRoutes)

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: "Something went wrong!" })
})

// Only start the server when running outside Vercel (serverless)
if (!process.env.VERCEL) {
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`)
    });

    server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is already in use!`);
            process.exit(1);
        } else {
            console.error('❌ Server startup error:', err);
        }
    });

    // Graceful Shutdown: Ensure Prisma connections are closed when the process is killed
    const gracefulShutdown = async (signal?: string) => {
        console.log(`--- Graceful Shutdown Initiated (${signal || 'unknown'}) ---`);
        otpStore.destroy();
        try {
            await prisma.$disconnect();
            console.log('✅ Prisma disconnected from DB');
        } catch (err) {
            console.error('❌ Error disconnecting Prisma:', err);
        } finally {
            process.exit(0);
        }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('uncaughtException', (err) => {
        console.error('❌ Uncaught Exception:', err);
        gracefulShutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason) => {
        console.error('❌ Unhandled Rejection:', reason);
        gracefulShutdown('unhandledRejection');
    });
}

export default app;
