export type WarehouseStatus = 'active' | 'inactive';

export interface WarehousePrimitives {
  id: string;
  code: string;
  name: string;
  processingTimeDays: number;
  status: WarehouseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseParams {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly processingTimeDays: number;
  readonly status?: WarehouseStatus;
}

export interface UpdateWarehouseParams {
  readonly code?: string;
  readonly name?: string;
  readonly processingTimeDays?: number;
  readonly status?: WarehouseStatus;
}

export class Warehouse {
  private constructor(private props: WarehousePrimitives) {}

  static create(params: CreateWarehouseParams): Warehouse {
    const now = new Date().toISOString();

    return new Warehouse({
      id: Warehouse.requireText('id', params.id),
      code: Warehouse.requireText('code', params.code),
      name: Warehouse.requireText('name', params.name),
      processingTimeDays: Warehouse.requireProcessingTimeDays(
        params.processingTimeDays,
      ),
      status: params.status ?? 'active',
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(primitives: WarehousePrimitives): Warehouse {
    return new Warehouse({ ...primitives });
  }

  update(params: UpdateWarehouseParams): void {
    if (params.code !== undefined) {
      this.props.code = Warehouse.requireText('code', params.code);
    }

    if (params.name !== undefined) {
      this.props.name = Warehouse.requireText('name', params.name);
    }

    if (params.processingTimeDays !== undefined) {
      this.props.processingTimeDays = Warehouse.requireProcessingTimeDays(
        params.processingTimeDays,
      );
    }

    if (params.status !== undefined) {
      this.props.status = params.status;
    }

    this.touch();
  }

  deactivate(): void {
    this.props.status = 'inactive';
    this.touch();
  }

  toPrimitives(): WarehousePrimitives {
    return { ...this.props };
  }

  private touch(): void {
    this.props.updatedAt = new Date().toISOString();
  }

  private static requireText(fieldName: string, value: string): string {
    const normalizedValue = value.trim();

    if (normalizedValue.length === 0) {
      throw new Error(`Warehouse ${fieldName} is required.`);
    }

    return normalizedValue;
  }

  private static requireProcessingTimeDays(value: number): number {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error('Warehouse processingTimeDays must be an integer >= 0.');
    }

    return value;
  }
}
