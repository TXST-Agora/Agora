import express, { type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ENV } from './config/env.js';
import sessionRoutes from './routes/session.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: ENV.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/healthz', (_req: Request, res: Response) => res.status(200).send('ok'));
app.use('/api/v1/session', sessionRoutes);
app.use('/api/session', sessionRoutes);

export default app;
