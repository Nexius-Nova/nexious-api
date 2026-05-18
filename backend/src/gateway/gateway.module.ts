import { Module } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { GatewayController } from './gateway.controller';
import { PlaygroundController } from './playground.controller';

@Module({
  providers: [GatewayService],
  controllers: [GatewayController, PlaygroundController],
})
export class GatewayModule {}
