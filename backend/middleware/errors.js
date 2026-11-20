import mongoose from 'mongoose';
import { isDatabaseReady } from '../db.js';

const FIELD_LABELS = {
    studentId: 'student ID',
    courseId: 'course ID',
};

/** Returns 503 for API calls while MongoDB is unavailable instead of hanging. */
export function requireDatabase(req, res, next) {
    if (!isDatabaseReady()) {
        return res.status(503).json({ error: 'The database is not available right now. Please try again shortly.' });
    }
    next();
}

/** Rejects malformed MongoDB ObjectIds in :id route params with a clear 400. */
export function validateObjectId(req, res, next) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid id.' });
    }
    next();
}

export function apiNotFound(req, res) {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
}

/** Central error handler: turns known errors into JSON responses with proper status codes. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Request body must be valid JSON.' });
    }

    if (err instanceof mongoose.Error.ValidationError) {
        const details = Object.fromEntries(
            Object.entries(err.errors).map(([field, error]) => [
                field,
                error.name === 'CastError' ? `Invalid value for ${FIELD_LABELS[field] ?? field}.` : error.message,
            ])
        );
        return res.status(400).json({ error: Object.values(details).join(' '), details });
    }

    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({ error: `Invalid value for ${FIELD_LABELS[err.path] ?? err.path}.` });
    }

    // MongoDB duplicate key (unique index violation) - covers race conditions the pre-checks can't.
    if (err?.code === 11000) {
        const fields = Object.keys(err.keyPattern ?? err.keyValue ?? {});
        if (fields.includes('student') && fields.includes('course')) {
            return res.status(409).json({ error: 'This student is already enrolled in this course.' });
        }
        const field = fields[0];
        const label = FIELD_LABELS[field] ?? field ?? 'value';
        return res.status(409).json({
            error: `A record with this ${label} already exists.`,
            details: field ? { [field]: `This ${label} is already in use.` } : undefined,
        });
    }

    if (['MongooseServerSelectionError', 'MongoServerSelectionError', 'MongoNetworkError'].includes(err?.name)) {
        return res.status(503).json({ error: 'The database is not available right now. Please try again shortly.' });
    }

    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error.' });
}
