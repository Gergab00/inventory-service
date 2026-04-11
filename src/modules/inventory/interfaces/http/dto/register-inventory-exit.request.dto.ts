import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  NotEquals,
  ValidateNested,
} from 'class-validator';
import {
  MoneyRequestDto,
  SourceReferenceRequestDto,
} from './register-inventory-entry.request.dto';

export class InventoryReferenceRequestDto {
  @ApiProperty({ example: 'order' })
  @IsString()
  @IsNotEmpty()
  readonly type!: string;

  @ApiProperty({ example: 'ORD-01' })
  @IsString()
  @IsNotEmpty()
  readonly id!: string;
}

export class RegisterInventoryExitRequestDto {
  @ApiProperty({ example: 'prd_01JX9X7Q8N8K3YB1P0A6S4C2D1' })
  @IsString()
  @IsNotEmpty()
  readonly productId!: string;

  @ApiProperty({ example: 'wh_01JX9XB92E4S9P3Q8T6N1R5M7K' })
  @IsString()
  @IsNotEmpty()
  readonly warehouseId!: string;

  @ApiProperty({ example: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly quantity!: number;

  @ApiProperty({ type: InventoryReferenceRequestDto })
  @ValidateNested()
  @Type(() => InventoryReferenceRequestDto)
  readonly reference!: InventoryReferenceRequestDto;
}

export class RegisterInventoryAdjustmentRequestDto {
  @ApiProperty({ example: 'prd_01JX9X7Q8N8K3YB1P0A6S4C2D1' })
  @IsString()
  @IsNotEmpty()
  readonly productId!: string;

  @ApiProperty({ example: 'wh_01JX9XB92E4S9P3Q8T6N1R5M7K' })
  @IsString()
  @IsNotEmpty()
  readonly warehouseId!: string;

  @ApiProperty({ example: -2, description: 'Puede ser positivo o negativo, excepto cero.' })
  @Type(() => Number)
  @IsInt()
  @Min(-999999)
  @Max(999999)
  @NotEquals(0)
  readonly quantity!: number;

  @ApiProperty({ example: 'inventory-count' })
  @IsString()
  @IsNotEmpty()
  readonly reason!: string;

  @ApiPropertyOptional({ type: MoneyRequestDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  readonly unitCost?: MoneyRequestDto;

  @ApiPropertyOptional({ type: SourceReferenceRequestDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SourceReferenceRequestDto)
  readonly sourceReference?: SourceReferenceRequestDto;
}
