import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductImageInputDto {
  @ApiProperty({ example: 'https://cdn.example.com/image-1.jpg' })
  @IsString()
  @IsNotEmpty()
  readonly url!: string;

  @ApiProperty({ example: 'primary' })
  @IsString()
  @IsNotEmpty()
  readonly role!: string;
}

export class UpdateProductImagesRequestDto {
  @ApiProperty({ type: [ProductImageInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  readonly images!: ProductImageInputDto[];
}
