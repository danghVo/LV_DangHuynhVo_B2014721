import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/decorator/public.decorator';
import { HierarchicalDto } from 'src/dto/clustering/hierarchical';
import { KmeansDto } from 'src/dto/clustering/kmeans.dto';
import { decodedBase64 } from 'src/utils/DecodedBase64';
import { LoggerUtil } from 'src/utils/Logger';
import { RedisPub } from 'src/utils/RedisPub';
import { RedisSub } from 'src/utils/RedisSub';

@Controller('clustering')
export class ClusteringGatewayController {
  private redisSub: RedisSub;
  private redisPub: RedisPub;

  constructor() {
    this.redisSub = new RedisSub();
    this.redisPub = new RedisPub();
  }

  @Get('/hello')
  @Public()
  async hello() {
    try {
      LoggerUtil.log('Received Hello Request', 'Hello Process');
      await this.redisPub.publish('clustering', 'hello');

      return { message: 'Send success' };
    } catch (error) {
      LoggerUtil.error(error, 'Hello Process');
      return { message: error };
    }
  }

  @Post('/kmeans')
  @UseInterceptors(FileInterceptor('csvFile'))
  async kmeans(
    @Body() payload: KmeansDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      LoggerUtil.log('Received Kmeans Request', 'Kmeans Process');

      await this.redisPub.publish(
        'kmeans',
        JSON.stringify({ ...payload, buffer: file.buffer.toString('base64') }),
      );

      const responseInBase64 = await this.redisSub.subscribe('kmeans response');
      const repsonse = decodedBase64(responseInBase64);

      if (!repsonse.startsWith('{')) {
        return { data: repsonse };
      }

      return {
        data: JSON.parse(repsonse),
      };
    } catch (error) {
      LoggerUtil.error(error, 'Kmeans Process');
      return { data: error };
    }
  }

  @Post('/hierarchical')
  @UseInterceptors(FileInterceptor('csvFile'))
  async hierarchical(
    @Body() payload: HierarchicalDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      LoggerUtil.log('Received Hierarchical Request', 'Hierarchical Process');

      await this.redisPub.publish(
        'hierarchical',
        JSON.stringify({ ...payload, buffer: file.buffer.toString('base64') }),
      );

      const responseInBase64 = await this.redisSub.subscribe(
        'hierarchical response',
      );
      const repsonse = decodedBase64(responseInBase64);

      if (!repsonse.startsWith('{')) {
        return { data: repsonse };
      }

      return {
        message: 'Success',
        data: JSON.parse(repsonse),
      };
    } catch (error) {
      LoggerUtil.error(error, 'Hierarchical Process');
      return { data: error };
    }
  }
}
