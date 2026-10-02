import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

// To avoid errors in build time if the env variable is missing, we can conditionally connect
const client = postgres(connectionString || 'postgres://placeholder:5432/placeholder');
export const db = drizzle(client);
