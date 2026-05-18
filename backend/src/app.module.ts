import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ChannelsModule } from './channels/channels.module';
import { TokensModule } from './tokens/tokens.module';
import { LogsModule } from './logs/logs.module';
import { GatewayModule } from './gateway/gateway.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    PrismaModule,
    ChannelsModule,
    TokensModule,
    LogsModule,
    GatewayModule,
    ConversationsModule,
    AuthModule,
    UsersModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
