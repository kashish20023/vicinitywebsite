import { Module } from '@nestjs/common';
import { AutomatedMessagesController } from './automated-messages.controller.js';
import { AutomatedMessagesService } from './automated-messages.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AutomatedMessagesController],
  providers: [AutomatedMessagesService],
  exports: [AutomatedMessagesService],
})
export class AutomatedMessagesModule {}
