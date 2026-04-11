import type { DatabaseType } from '../config/environment-variables';

interface ResolvePersistenceAdapterOptions<TAdapter> {
  readonly adapterName: string;
  readonly databaseType: DatabaseType;
  readonly inMemoryAdapter: TAdapter;
}

export function resolvePersistenceAdapter<TAdapter>(
  options: ResolvePersistenceAdapterOptions<TAdapter>,
): TAdapter {
  if (options.databaseType === 'in-memory') {
    return options.inMemoryAdapter;
  }

  throw new Error(
    `Persistence adapter "${options.databaseType}" for ${options.adapterName} is not implemented yet.`,
  );
}
