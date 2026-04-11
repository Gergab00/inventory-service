import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { HealthResponseDto } from './interfaces/http/dto/health-response.dto';

@ApiTags('system')
@ApiSecurity('api_key')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtiene un mensaje base del servicio',
    description: 'Endpoint simple para confirmar que el servicio está accesible.',
  })
  @ApiOkResponse({
    description: 'Mensaje de bienvenida del servicio.',
    schema: {
      type: 'string',
      example: 'Hello World!',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Consulta el estado técnico del servicio',
    description:
      'Endpoint liviano para validar disponibilidad desde Scalar o monitoreo básico.',
  })
  @ApiOkResponse({
    description: 'Estado actual del servicio.',
    type: HealthResponseDto,
  })
  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      service: 'inventory-service',
      timestamp: new Date().toISOString(),
    };
  }
}
