import { Inject, Injectable } from '@nestjs/common';
import { GetProductByIdUseCase } from '../../../products/application/use-cases/get-product-by-id.use-case';
import { InventoryLot } from '../../domain/entities/inventory-lot.entity';
import { InventoryReferenceNotFoundError } from '../../domain/errors/inventory.errors';
import { INVENTORY_LOT_REPOSITORY } from '../../domain/ports/inventory.repository.port';
import type { InventoryLotRepository } from '../../domain/ports/inventory.repository.port';

@Injectable()
export class GetProductInventoryLotsUseCase {
  constructor(
    @Inject(INVENTORY_LOT_REPOSITORY)
    private readonly inventoryLotRepository: InventoryLotRepository,
    private readonly getProductByIdUseCase: GetProductByIdUseCase,
  ) {}

  async execute(productId: string): Promise<InventoryLot[]> {
    const product = await this.getProductByIdUseCase.execute(productId);

    if (product === null) {
      throw new InventoryReferenceNotFoundError('product', productId);
    }

    return this.inventoryLotRepository.findByProductId(productId);
  }
}
