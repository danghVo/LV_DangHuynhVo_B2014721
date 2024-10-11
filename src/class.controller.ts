import { Body, Controller } from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto, UpdateClassDto } from './dto';
import { MessagePattern } from '@nestjs/microservices';

@Controller('class')
export class ClassController {
  constructor(private classService: ClassService) {}

  @MessagePattern({ cmd: 'ping' })
  async ping() {
    return 'Pong';
  }

  @MessagePattern({ cmd: 'check-class' })
  async checkClass(@Body() payload: { classUuid: string }) {
    return (await this.classService.checkClass(payload.classUuid)) !== null;
  }

  @MessagePattern({ cmd: 'get-classes-uuid' })
  async getUuidOfClasses() {
    return await this.classService.getUuidOfClasses();
  }

  @MessagePattern({ cmd: 'create-class' })
  async createClass(@Body() createClassDto: CreateClassDto) {
    return await this.classService.createClass(
      createClassDto,
      createClassDto.userUuid,
    );
  }

  @MessagePattern({ cmd: 'get-all-own-classes' })
  async getAllClassesOfTeacher(@Body() payload: { teacherUuid: string }) {
    const response = await this.classService.getAllOwnClasses(
      payload.teacherUuid,
    );

    return response;
  }

  @MessagePattern({ cmd: 'get-classed' })
  async getClasses(
    @Body() payload: { userUuid: string; filter: 'JOINED' | 'PENDING' | 'ALL' },
  ) {
    return await this.classService.getClassesByFilter(
      payload.userUuid,
      payload.filter,
    );
  }

  @MessagePattern({ cmd: 'update-class' })
  async updateClassInfor(@Body() updateClassDto: UpdateClassDto) {
    return await this.classService.updateClass(
      updateClassDto.userUuid,
      updateClassDto,
      updateClassDto.classUuid,
    );
  }

  @MessagePattern({ cmd: 'get-class-detail' })
  async getClassDetail(
    @Body() payload: { userUuid: string; classUuid: string },
  ) {
    return await this.classService.getClassDetail(
      payload.userUuid,
      payload.classUuid,
    );
  }

  @MessagePattern({ cmd: 'get-members-of-class' })
  async getMembersOfClass(
    @Body() payload: { userUuid: string; classUuid: string },
  ) {
    return await this.classService.getMembersOfClass(
      payload.classUuid,
      payload.userUuid,
    );
  }

  @MessagePattern({ cmd: 'delete-class' })
  async deleteClass(@Body() payload: { userUuid: string; classUuid: string }) {
    return await this.classService.deleteClass(
      payload.userUuid,
      payload.classUuid,
    );
  }

  @MessagePattern({ cmd: 'get-calendar' })
  async getCalender(@Body() payload: { classUuid: string }) {
    return await this.classService.getCalender(payload.classUuid);
  }
}
