import { response } from 'express';
import { Logger } from '@nestjs/common';
import * as redis from 'redis';

export class RedisPub {
  private client: redis.RedisClientType;

  constructor() {
    this.client = redis.createClient({
      url: 'redis://localhost:6379',
      pingInterval: 1000,
    });
    this.connect();
  }

  private async connect() {
    await this.client.connect();
    (await this.client.ping()) === 'PONG';

    Logger.log('Connected to Redis', 'Redis Connection');
  }

  async publish(channel: string, message: string): Promise<any> {
    try {
      // pattern in publish

      await this.client.PUBLISH(channel, message);
    } catch (error) {
      Logger.error(error, 'Redis Publish Error');
    }
  }
}
