import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the committed .env file from the project root, regardless of the current working directory.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export const config = {
    port: Number(process.env.PORT) || 3000,
    mongoUri: process.env.MONGODB_URI,
    distDir: path.resolve(__dirname, '..', 'frontend', 'dist'),
};

if (!config.mongoUri) {
    console.error('MONGODB_URI is not defined. Add it to the .env file in the project root.');
    process.exit(1);
}
