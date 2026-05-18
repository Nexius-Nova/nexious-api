import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TokensService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: number) {
    const where: any = { userId: userId || -1 };
    return this.prisma.token.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.token.findUnique({ where: { id } });
  }

  async create(data: any) {
    const { id, createdAt, updatedAt, ...rest } = data;
    return this.prisma.token.create({
      data: {
        ...rest,
        key: `sk-${uuidv4()}`,
      },
    });
  }

  async update(id: number, data: any) {
    const { id: _, createdAt, updatedAt, ...rest } = data;
    return this.prisma.token.update({ where: { id }, data: rest });
  }

  async remove(id: number) {
    return this.prisma.token.delete({ where: { id } });
  }

  async findByKey(key: string) {
    return this.prisma.token.findUnique({ where: { key } });
  }
}
