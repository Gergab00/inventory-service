import { Injectable } from '@nestjs/common';
import { Warehouse, WarehousePrimitives } from '../../domain/entities/warehouse.entity';
import type {
  ListWarehousesFilters,
  PaginatedWarehousesResult,
  WarehouseRepository,
} from '../../domain/ports/warehouse.repository.port';

@Injectable()
export class InMemoryWarehouseRepository implements WarehouseRepository {
  private readonly warehouses = new Map<string, WarehousePrimitives>();

  async save(warehouse: Warehouse): Promise<void> {
    const primitives = warehouse.toPrimitives();
    this.warehouses.set(primitives.id, primitives);
  }

  async findById(warehouseId: string): Promise<Warehouse | null> {
    const primitives = this.warehouses.get(warehouseId);

    return primitives ? Warehouse.reconstitute(primitives) : null;
  }

  async findByCode(code: string): Promise<Warehouse | null> {
    const normalizedCode = normalize(code);

    for (const primitives of this.warehouses.values()) {
      if (normalize(primitives.code) === normalizedCode) {
        return Warehouse.reconstitute(primitives);
      }
    }

    return null;
  }

  async findAll(
    filters: ListWarehousesFilters,
  ): Promise<PaginatedWarehousesResult> {
    const page = Math.max(filters.page, 1);
    const pageSize = Math.max(filters.pageSize, 1);

    const filteredWarehouses = Array.from(this.warehouses.values())
      .map((primitives) => Warehouse.reconstitute(primitives))
      .filter((warehouse) => matchesFilters(warehouse.toPrimitives(), filters))
      .sort((left, right) => {
        const leftCreatedAt = left.toPrimitives().createdAt;
        const rightCreatedAt = right.toPrimitives().createdAt;

        return leftCreatedAt.localeCompare(rightCreatedAt);
      });

    const total = filteredWarehouses.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const items = filteredWarehouses.slice(startIndex, startIndex + pageSize);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };
  }
}

function matchesFilters(
  warehouse: WarehousePrimitives,
  filters: ListWarehousesFilters,
): boolean {
  if (filters.code && !normalize(warehouse.code).includes(normalize(filters.code))) {
    return false;
  }

  if (filters.name && !normalize(warehouse.name).includes(normalize(filters.name))) {
    return false;
  }

  if (filters.status && warehouse.status !== filters.status) {
    return false;
  }

  return true;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
