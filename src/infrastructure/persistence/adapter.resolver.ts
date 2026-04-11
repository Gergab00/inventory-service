import type { DatabaseType } from '../config/environment-variables';

interface ResolvePersistenceAdapterOptions<TAdapter> {
  readonly adapterName: string;
  readonly databaseType: DatabaseType;
  readonly inMemoryAdapter: TAdapter;
  readonly mongodbAdapter?: TAdapter;
}

export function resolvePersistenceAdapter<TAdapter>(
  options: ResolvePersistenceAdapterOptions<TAdapter>,
): TAdapter {
  if (options.databaseType === 'in-memory') {
    return options.inMemoryAdapter;
  }

  if (options.databaseType === 'mongodb' && options.mongodbAdapter !== undefined) {
    return options.mongodbAdapter;
  }

  throw new Error(
    `Persistence adapter "${options.databaseType}" for ${options.adapterName} is not implemented yet.`,
  );
}
