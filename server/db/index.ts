import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

// Database credentials hardcoded with SSL
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://if_user:tH03X9e0Zkf6wpDzboAjCjQiXzPGJkgj@dpg-d52jc8m3jp1c73c56i1g-a.virginia-postgres.render.com/if";

const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
export const db = drizzle(pool, { schema });
