import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Db, MongoClient } from 'mongodb';
import type { EnvironmentVariables } from '../../config/environment-variables';

@Injectable()
export class MongoConnectionService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient | null = null;
  private database: Db | null = null;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  async onModuleInit(): Promise<void> {
    const databaseType = this.configService.getOrThrow('DATABASE_TYPE');

    if (databaseType !== 'mongodb') {
      return;
    }

    const uri = this.configService.getOrThrow<string>('MONGODB_URI');
    const dbName = this.configService.getOrThrow<string>('MONGODB_DB_NAME');

    this.client = new MongoClient(uri);
    await this.client.connect();
    this.database = this.client.db(dbName);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client !== null) {
      await this.client.close();
    }

    this.client = null;
    this.database = null;
  }

  getClient(): MongoClient {
    if (this.client === null) {
      throw new Error('MongoClient is not initialized.');
    }

    return this.client;
  }

  getDatabase(): Db {
    if (this.database === null) {
      throw new Error('Mongo database is not initialized.');
    }

    return this.database;
  }
}
