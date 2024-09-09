import { response } from 'express';
import { Logger } from '@nestjs/common';
import * as redis from 'redis';

export class RedisSub {
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

  async subscribe(channels: string | Array<string>): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        this.client.pSubscribe(channels, (message: string, channel: string) => {
          Logger.log(`Received message from channel: ${channel}`, 'Subscribe');

          if (typeof message !== 'undefined') {
            this.client.pUnsubscribe();
            resolve(message);
          }
        });
      });
    } catch (error) {
      Logger.error(error, 'Subscribe Error');
    }
  }
}
