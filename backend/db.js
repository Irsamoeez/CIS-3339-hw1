import mongoose from 'mongoose';
import Student from './models/Student.js';
import Course from './models/Course.js';
import Enrollment from './models/Enrollment.js';

const RETRY_DELAY_MS = 5000;
const models = [Student, Course, Enrollment];

mongoose.set('strictQuery', true);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Creates every collection and index the app needs. Safe to run on every startup:
 * existing collections/indexes are left alone, missing ones are created.
 * This is what lets the app start against an empty or nonexistent database.
 */
async function initializeDatabase() {
    for (const model of models) {
        await model.createCollection();
        await model.createIndexes();
    }
}

/**
 * Connects to MongoDB, retrying until it succeeds so the server can start
 * before MongoDB is up. API routes return 503 until the connection is ready.
 */
export async function connectToDatabase(uri) {
    let attempt = 0;

    mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected.'));
    mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected.'));

    while (true) {
        attempt += 1;
        try {
            await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
            await initializeDatabase();
            const { host, port, name } = mongoose.connection;
            console.log(`Connected to MongoDB at ${host}:${port}/${name} (collections and indexes ready).`);
            return;
        } catch (error) {
            console.error(
                `Could not connect to MongoDB (attempt ${attempt}): ${error.message}\n` +
                `  Is MongoDB Community Edition running? Retrying in ${RETRY_DELAY_MS / 1000}s...`
            );
            await mongoose.disconnect().catch(() => {});
            await sleep(RETRY_DELAY_MS);
        }
    }
}

export function isDatabaseReady() {
    return mongoose.connection.readyState === 1;
}

export function disconnectFromDatabase() {
    return mongoose.disconnect();
}
