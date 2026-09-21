import { Module } from '@nestjs/common';
import { IngredientsController } from './controllers/ingredients.controller';
import { IngredientsService } from './services/ingredients.service';

@Module({
  controllers: [IngredientsController],
  providers: [IngredientsService],
  exports: [IngredientsService],
})
export class IngredientsModule {}
