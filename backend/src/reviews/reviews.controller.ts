import { Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { assertAdmin } from '../admin';
import { CreateReviewDto, ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  @Get()
  findApproved() {
    return this.reviewsService.findApproved();
  }

  @Get('pending')
  findPending(@Headers() headers: Record<string, any>) {
    assertAdmin(headers);
    return this.reviewsService.findPending();
  }

  @Patch(':id/:status')
  moderate(
    @Param('id') id: string,
    @Param('status') status: string,
    @Headers() headers: Record<string, any>,
  ) {
    assertAdmin(headers);
    if (status !== 'approved' && status !== 'rejected') {
      throw new Error('Estado inválido');
    }
    return this.reviewsService.moderate(id, status);
  }
}
