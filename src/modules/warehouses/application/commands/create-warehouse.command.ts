export interface CreateWarehouseCommand {
  readonly code: string;
  readonly name: string;
  readonly processingTimeDays: number;
}
