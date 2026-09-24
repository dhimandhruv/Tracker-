// Prisma 7 CLI configuration.
//
// Prisma 7 no longer loads .env by itself and no longer reads the connection
// string from schema.prisma, so both happen here.
//
// The CLI gets the DIRECT (unpooled) connection: migrations open a session and
// run DDL, which cannot go through Neon's PgBouncer pooler. The running app
// uses the pooled URL instead, in src/lib/prisma.ts.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL_UNPOOLED"],
  },
});
