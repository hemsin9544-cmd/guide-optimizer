import "dotenv/config";
import { defineConfig, env } from "prisma/config";

type Env = {
  DATABASE_URL?: string;
};

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url:
      env<Env>("DATABASE_URL") ||
      "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
