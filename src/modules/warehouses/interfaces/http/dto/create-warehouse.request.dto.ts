import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateWarehouseRequestDto {
  @ApiProperty({ example: 'CDMX-01' })
  @IsString()
  @IsNotEmpty()
  readonly code!: string;

  @ApiProperty({ example: 'Almacén CDMX' })
  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  @ApiProperty({ example: 1, description: 'Tiempo de procesamiento interno en días.' })
  @IsInt()
  @Min(0)
  readonly processingTimeDays!: number;
}
