import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    description: 'Estado técnico actual del servicio.',
    example: 'ok',
  })
  readonly status!: 'ok';

  @ApiProperty({
    description: 'Nombre del servicio que responde.',
    example: 'inventory-service',
  })
  readonly service!: string;

  @ApiProperty({
    description: 'Fecha y hora ISO-8601 en la que se emitió la respuesta.',
    example: '2026-04-10T15:30:00.000Z',
  })
  readonly timestamp!: string;
}
