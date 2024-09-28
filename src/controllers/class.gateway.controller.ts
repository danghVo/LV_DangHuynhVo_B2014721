import { response } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Inject,
  Logger,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { Public } from 'src/decorator/public.decorator';
import { ServiceHealth } from 'src/decorator/serviec-healths';
import { CreateClassDto, UpdateClassDto } from 'src/dto/class';
import { Role } from 'src/guard/Role/role.decorator';
import { RoleGuard } from 'src/guard/Role/role.guard';
import checkResponseError from 'src/utils/checkResponseError';
import { LoggerUtil } from 'src/utils/Logger';

@ServiceHealth
@Controller('class')
export class ClassGatewayController {
  constructor(
    @Inject('CLASS_SERVICE') private readonly classService: ClientProxy,
  ) {}

  async isAlive() {
    return await lastValueFrom(this.classService.send({ cmd: 'ping' }, {}));
  }

  @Get('all')
  @Public()
  getUuidOfClasses() {
    return this.classService.send({ cmd: 'get-classes-uuid' }, {});
  }

  @Role('TEACHER')
  @UseGuards(RoleGuard)
  @Get('own/all')
  async getAllClassesOfTeacher(
    @Req() req: Request & { user: { uuid: string } },
  ) {
    LoggerUtil.log('Get all classes of teacher', 'Class:GetAllOwnClasses');

    const response = this.classService.send(
      { cmd: 'get-all-own-classes' },
      { teacherUuid: req.user.uuid },
    );

    await checkResponseError(response, { context: 'Class:GetAllOwnClasses' });

    return { data: await lastValueFrom(response) };
  }

  @Get('join/all')
  async getClasses(
    @Req() req: Request & { user: { uuid: string } },
    @Param('filter') filter: string,
  ) {
    LoggerUtil.log(
      `Get all classes having ${req.user.uuid}`,
      'Class:GetAllClassesOfUser',
    );

    const response = this.classService.send(
      { cmd: 'get-all-classes-of-user' },
      { userUuid: req.user.uuid, filter },
    );

    await checkResponseError(response, {
      context: 'Class:GetAllClassesOfUser',
    });

    return { data: await lastValueFrom(response) };
  }

  @Post('/')
  @Role('TEACHER')
  @UseGuards(RoleGuard)
  async createClass(
    @Body() createClassDto: CreateClassDto,
    @Req() req: Request & { user: { uuid: string } },
  ) {
    LoggerUtil.log(`${req.user.uuid} create class`, 'Class:CreateClass');
    const response = this.classService.send(
      { cmd: 'create-class' },
      { ...createClassDto, userUuid: req.user.uuid },
    );

    await checkResponseError(response, { context: 'Class:CreateClass' });

    return { data: await lastValueFrom(response) };
  }

  @Patch(':classUuid')
  @Role('TEACHER')
  @UseGuards(RoleGuard)
  async updateClassInfor(
    @Body() updateClassDto: UpdateClassDto,
    @Param('classUuid') classUuid: string,
    @Req() req: Request & { user: { uuid: string } },
  ) {
    LoggerUtil.log(
      `${req.user.uuid} update class ${classUuid}`,
      'Class:UpdateClass',
    );

    const response = this.classService.send(
      { cmd: 'update-class' },
      { ...updateClassDto, userUuid: req.user.uuid, classUuid: classUuid },
    );

    await checkResponseError(response, { context: 'Class:UpdateClass' });

    return { data: await lastValueFrom(response) };
  }

  @Get('/:classUuid')
  async getClassDetail(
    @Param('classUuid') classUuid: string,
    @Req() req: Request & { user: { uuid: string } },
  ) {
    LoggerUtil.log(
      `${req.user.uuid} get detail of class ${classUuid}`,
      'Class:GetClassDetail',
    );

    const response = this.classService.send(
      { cmd: 'get-class-detail' },
      {
        userUuid: req.user.uuid,
        classUuid,
      },
    );

    await checkResponseError(response, { context: 'Class:GetClassDetail' });

    return { data: await lastValueFrom(response) };
  }

  @Get('/:classUuid/members')
  async getMembersOfClass(
    @Param('classUuid') classUuid: string,
    @Req() req: Request & { user: { uuid: string } },
  ) {
    LoggerUtil.log(
      `${req.user.uuid} get members of class ${classUuid}`,
      'Class:GetMembersOfClass',
    );

    const response = this.classService.send(
      { cmd: 'get-members-of-class' },
      { userUuid: req.user.uuid, classUuid },
    );

    await checkResponseError(response, { context: 'Class:GetMembersOfClass' });

    return { data: await lastValueFrom(response) };
  }

  @Delete(':classUuid')
  @Role('TEACHER')
  @UseGuards(RoleGuard)
  async deleteClass(
    @Param('classUuid') classUuid: string,
    @Req() req: Request & { user: { uuid: string } },
  ) {
    LoggerUtil.log(
      `${req.user.uuid} delete class ${classUuid}`,
      'Class:DeleteClass',
    );

    const response = this.classService.send(
      { cmd: 'delete-class' },
      { userUuid: req.user.uuid, classUuid },
    );

    await checkResponseError(response, { context: 'Class:DeleteClass' });

    return { data: await lastValueFrom(response) };
  }

  @Get(':classUuid/calendar')
  async getCalender(
    @Req() req: Request & { user: { uuid: string } },
    @Param('classUuid') classUuid: string,
  ) {
    LoggerUtil.log(
      `${req.user.uuid} get calendar of class ${classUuid}`,
      'Class:GetCalendar',
    );

    const response = this.classService.send(
      { cmd: 'get-calendar' },
      { classUuid },
    );

    await checkResponseError(response, { context: 'Class:GetCalendar' });

    return { data: await lastValueFrom(response) };
  }
}
