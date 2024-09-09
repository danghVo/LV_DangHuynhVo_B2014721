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
import { HierarchicalDto } from 'src/dto/clustering/Hierarchical';
import { KmeansDto } from 'src/dto/clustering/kmeans.dto';
import { decodedBase64 } from 'src/Util/DecodedBase64';
import { LoggerUtil } from 'src/Util/Logger';
import { RedisPub } from 'src/Util/RedisPub';
import { RedisSub } from 'src/Util/RedisSub';

@Controller('clustering')
export class ClusteringGatewayController {
  private redisSub: RedisSub;
  private redisPub: RedisPub;

  constructor() {
    // @Inject("CLUSTERING_SERVICE") private readonly clusteringClient: ClientProxy
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

  @Public()
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

      const response = await this.redisSub.subscribe('kmeans response');

      return {
        message: 'Send success',
        data: JSON.parse(decodedBase64(response)),
      };
    } catch (error) {
      LoggerUtil.error(error, 'Kmeans Process');
      return { message: error };
    }
  }

  @Public()
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

      const response = await this.redisSub.subscribe('hierarchical response');

      return {
        message: 'Send success',
        data: JSON.parse(decodedBase64(response)),
      };
    } catch (error) {
      LoggerUtil.error(error, 'Hierarchical Process');
      return { message: error };
    }
  }
}
