import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { config } from './config.js';
import { connectToDatabase, disconnectFromDatabase, isDatabaseReady } from './db.js';
import { apiNotFound, errorHandler, requireDatabase } from './middleware/errors.js';
import studentRoutes from './routes/students.js';
import courseRoutes from './routes/courses.js';
import enrollmentRoutes from './routes/enrollments.js';

const app = express();
app.use(express.json());

// ---------- REST API ----------
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: isDatabaseReady() ? 'connected' : 'unavailable' });
});

app.use('/api', requireDatabase);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api', apiNotFound);

// ---------- Vue production build ----------
const indexHtml = path.join(config.distDir, 'index.html');

app.use(express.static(config.distDir));

// History-mode fallback: any other GET (e.g. /courses after a refresh) returns index.html
// so Vue Router can render the right view instead of a 404.
app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
    }
    if (!fs.existsSync(indexHtml)) {
        return res
            .status(503)
            .type('text/plain')
            .send('The frontend has not been built yet. Run "npm run build", then restart with "npm start".');
    }
    res.sendFile(indexHtml);
});

app.use(errorHandler);

// ---------- Startup ----------
const server = app.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
    if (!fs.existsSync(indexHtml)) {
        console.warn('Frontend build not found. Run "npm run build" to generate frontend/dist.');
    }
});

connectToDatabase(config.mongoUri);

async function shutdown(signal) {
    console.log(`${signal} received, shutting down...`);
    server.close();
    await disconnectFromDatabase().catch(() => {});
    process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
