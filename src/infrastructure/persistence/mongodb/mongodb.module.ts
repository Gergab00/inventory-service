import { Global, Module } from '@nestjs/common';
import { MONGO_CLIENT, MONGO_DATABASE } from './mongodb.tokens';
import { MongoConnectionService } from './mongo-connection.service';
import { MongoIndexesInitializer } from './mongo-indexes.initializer';
import { MongoSessionContext } from './mongodb-session.context';

@Global()
@Module({
  providers: [
    MongoConnectionService,
    MongoIndexesInitializer,
    MongoSessionContext,
    {
      provide: MONGO_CLIENT,
      useFactory: (connectionService: MongoConnectionService) =>
        connectionService.getClient(),
      inject: [MongoConnectionService],
    },
    {
      provide: MONGO_DATABASE,
      useFactory: (connectionService: MongoConnectionService) =>
        connectionService.getDatabase(),
      inject: [MongoConnectionService],
    },
  ],
  exports: [
    MongoConnectionService,
    MongoSessionContext,
    MONGO_CLIENT,
    MONGO_DATABASE,
  ],
})
export class MongoPersistenceModule {}
