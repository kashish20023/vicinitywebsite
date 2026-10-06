import { Module } from '@nestjs/common';
import { DigitalPassService } from './digital-pass.service';
import { DigitalPassController } from './digital-pass.controller';

@Module({
  controllers: [DigitalPassController],
  providers: [DigitalPassService],
  exports: [DigitalPassService],
})
export class DigitalPassModule {}
