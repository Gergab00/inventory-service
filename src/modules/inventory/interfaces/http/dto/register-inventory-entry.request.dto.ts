import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class MoneyRequestDto {
  @ApiProperty({ example: 9500 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly amount!: number;

  @ApiProperty({ example: 'MXN' })
  @IsString()
  @IsNotEmpty()
  readonly currency!: string;
}

export class SourceReferenceRequestDto {
  @ApiProperty({ example: 'purchase-order' })
  @IsString()
  @IsNotEmpty()
  readonly type!: string;

  @ApiProperty({ example: 'PO-001' })
  @IsString()
  @IsNotEmpty()
  readonly id!: string;
}

export class RegisterInventoryEntryRequestDto {
  @ApiProperty({ example: 'prd_01JX9X7Q8N8K3YB1P0A6S4C2D1' })
  @IsString()
  @IsNotEmpty()
  readonly productId!: string;

  @ApiProperty({ example: 'wh_01JX9XB92E4S9P3Q8T6N1R5M7K' })
  @IsString()
  @IsNotEmpty()
  readonly warehouseId!: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly quantity!: number;

  @ApiProperty({ type: MoneyRequestDto })
  @IsObject()
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  readonly unitCost!: MoneyRequestDto;

  @ApiProperty({ type: SourceReferenceRequestDto })
  @IsObject()
  @ValidateNested()
  @Type(() => SourceReferenceRequestDto)
  readonly sourceReference!: SourceReferenceRequestDto;
}
