import { Controller, Get, Param, Query } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Get()
  async getAll(@Query('city') city?: string) {
    return this.workspacesService.findAll({ city });
  }

  @Get('featured')
  async getFeatured() {
    return this.workspacesService.getFeatured();
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.workspacesService.findBySlug(slug);
  }

  @Get('floors/:id/availability')
  async getFloorAvailability(
    @Param('id') id: string,
    @Query('startDateTime') startDateTime: string,
    @Query('endDateTime') endDateTime: string,
  ) {
    const start = startDateTime || new Date().toISOString();
    const end =
      endDateTime || new Date(Date.now() + 8 * 3600 * 1000).toISOString();
    return this.workspacesService.getFloorAvailability(id, start, end);
  }
}
