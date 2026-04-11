import { resolvePersistenceAdapter } from './adapter.resolver';

describe('resolvePersistenceAdapter', () => {
  it('returns the in-memory adapter when DATABASE_TYPE is in-memory', () => {
    const inMemoryAdapter = { adapter: 'in-memory' };

    const resolvedAdapter = resolvePersistenceAdapter({
      adapterName: 'ProductRepository',
      databaseType: 'in-memory',
      inMemoryAdapter,
    });

    expect(resolvedAdapter).toBe(inMemoryAdapter);
  });

  it('throws a clear error when the selected adapter is not implemented yet', () => {
    expect(() =>
      resolvePersistenceAdapter({
        adapterName: 'ProductRepository',
        databaseType: 'mongodb',
        inMemoryAdapter: { adapter: 'in-memory' },
      }),
    ).toThrow('Persistence adapter "mongodb" for ProductRepository is not implemented yet.');
  });
});
