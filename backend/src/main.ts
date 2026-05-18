import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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
    await prisma.user.update({
      where: { username },
      data: { role: 'super_admin', password: hashedPassword },
    });
    console.log(`✅ "${username}" upgraded to super admin`);
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
  app.enableCors();
  app.setGlobalPrefix('api');

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
