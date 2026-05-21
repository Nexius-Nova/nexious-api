import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import * as bcrypt from 'bcrypt';

async function seedSuperAdmin(prisma: PrismaService) {
  const existing = await prisma.user.findFirst({
    where: { role: 'super_admin' },
  });
  if (existing) {
    console.log(`ℹ️  Super admin "${existing.username}" already exists`);
    return;
  }

  const username = process.env.SUPER_ADMIN_USERNAME;
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  // Only seed when all required env vars are provided; no hardcoded defaults
  if (!username || !email || !password) {
    console.log(
      'ℹ️  SUPER_ADMIN_USERNAME, SUPER_ADMIN_EMAIL, and SUPER_ADMIN_PASSWORD not all set — skipping super admin seed',
    );
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if a user with this username already exists (e.g., first registered user)
  const sameUser = await prisma.user.findUnique({ where: { username } });
  if (sameUser) {
    // Only upgrade the role; do NOT overwrite the user's existing password
    await prisma.user.update({
      where: { username },
      data: { role: 'super_admin' },
    });
    console.log(`✅ "${username}" upgraded to super admin (password unchanged)`);
    return;
  }

  await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role: 'super_admin',
    },
  });
  console.log(`✅ Super admin "${username}" created`);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- Security Headers (Helmet) ---
  app.use(helmet());

  // --- CORS with configurable origins ---
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim());
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // --- Rate Limiting ---
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      message: {
        error: { message: 'Too many requests', type: 'rate_limit' },
      },
    }),
  );

  // --- Compression (gzip) ---
  app.use(compression());

  // --- Body parsing ---
  app.use(json({ limit: '10mb' }));

  app.setGlobalPrefix('api');

  // --- Graceful shutdown hooks ---
  app.enableShutdownHooks();

  // Enable request validation with DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Seed super admin
  const prisma = app.get(PrismaService);
  await prisma.$connect();
  await seedSuperAdmin(prisma);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
