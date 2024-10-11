import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  Param,
  Post,
  Req,
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

  @Get('/results/:resultUuid')
  async getResults(
    @Req() req: Request & { user: { uuid: string } },
    @Param('resultUuid') resultUuid: string,
  ) {
    try {
      LoggerUtil.log('Received Results Request', 'Get Results Process');
      await this.redisPub.publish(
        'get-user-results',
        JSON.stringify({ resultUuid, userUuid: req.user.uuid }),
      );

      const responseInBase64 = await this.redisSub.subscribe(
        'get-user-results response',
      );
      const repsonse = decodedBase64(responseInBase64);

      if (!repsonse.startsWith('{')) {
        return { data: repsonse };
      }

      return {
        data: JSON.parse(repsonse),
      };
    } catch (error) {
      LoggerUtil.error(error, 'Get Results Process');
      return { data: error };
    }
  }

  @Delete('/results/:resultUuid')
  async deleteResults(
    @Req() req: Request & { user: { uuid: string } },
    @Param('resultUuid') resultUuid: string,
  ) {
    try {
      LoggerUtil.log('Received Results Request', 'Delete Results Process');
      await this.redisPub.publish(
        'delete-user-results',
        JSON.stringify({ resultUuid, userUuid: req.user.uuid }),
      );

      const responseInBase64 = await this.redisSub.subscribe(
        'delete-user-results response',
      );
      const repsonse = decodedBase64(responseInBase64);

      if (!repsonse.startsWith('{')) {
        return { data: repsonse };
      }

      return {
        data: JSON.parse(repsonse),
      };
    } catch (error) {
      LoggerUtil.error(error, 'Delete Results Process');
      return { data: error };
    }
  }

  @Post('/kmeans/elbow')
  @UseInterceptors(FileInterceptor('csvFile'))
  async kmeansElbow(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user: { uuid: string } },
  ) {
    try {
      LoggerUtil.log('Received Kmeans Elbow Request', 'Kmeans Elbow Process');

      await this.redisPub.publish(
        'kmeans-elbow',
        JSON.stringify({
          buffer: file.buffer.toString('base64'),
          userUuid: req.user.uuid,
        }),
      );

      const responseInBase64 = await this.redisSub.subscribe(
        'kmeans-elbow response',
      );
      const repsonse = decodedBase64(responseInBase64);

      if (!repsonse.startsWith('{')) {
        return { data: repsonse };
      }

      return {
        data: JSON.parse(repsonse),
      };
    } catch (error) {
      LoggerUtil.error(error, 'Kmeans Elbow Process');
      return { data: error };
    }
  }

  @Post('/kmeans')
  @UseInterceptors(FileInterceptor('csvFile'))
  async kmeans(
    @Body() payload: KmeansDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user: { uuid: string } },
  ) {
    try {
      LoggerUtil.log('Received Kmeans Request', 'Kmeans Process');

      await this.redisPub.publish(
        'kmeans',
        JSON.stringify({
          ...payload,
          buffer: file.buffer.toString('base64'),
          userUuid: req.user.uuid,
        }),
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
    @Req() req: Request & { user: { uuid: string } },
  ) {
    try {
      LoggerUtil.log('Received Hierarchical Request', 'Hierarchical Process');

      await this.redisPub.publish(
        'hierarchical',
        JSON.stringify({
          ...payload,
          buffer: file.buffer.toString('base64'),
          userUuid: req.user.uuid,
        }),
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
