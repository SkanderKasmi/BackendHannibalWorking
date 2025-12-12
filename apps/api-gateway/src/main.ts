import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { API_GATEWAY_PORT } from '@app/common/constants';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    skipMissingProperties: false,
    forbidNonWhitelisted: true,
  }));
  
  app.setGlobalPrefix('api');

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Replit DevSecOps API')
    .setDescription('The Replit DevSecOps Microservices API description')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('infrastructure', 'Infrastructure management')
    .addTag('agents', 'Agent management')
    .addTag('monitor', 'Monitoring and metrics')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Set up Swagger UI
  SwaggerModule.setup('api/docs', app, document);

  // Save Swagger JSON to file for API Management import
  fs.writeFileSync('./swagger-spec.json', JSON.stringify(document, null, 2));
  
  await app.listen(API_GATEWAY_PORT, '0.0.0.0');
  console.log(`API Gateway is running on http://0.0.0.0:${API_GATEWAY_PORT}`);
  console.log(`Swagger Docs available at http://0.0.0.0:${API_GATEWAY_PORT}/api/docs`);
}
bootstrap();
