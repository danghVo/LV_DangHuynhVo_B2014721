import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ServiceHealth } from 'src/decorator/serviec-healths';
import { Role } from 'src/guard/Role/role.decorator';
import { RoleGuard } from 'src/guard/Role/role.guard';
import checkResponseError from 'src/utils/checkResponseError';
import { LoggerUtil } from 'src/utils/Logger';

@ServiceHealth
@Controller('classManagement')
export class ClassManagementGatewayController {
  constructor(
    @Inject('CLASSMANAGEMENT_SERVICE')
    private readonly classManagementService: ClientProxy,
  ) {}

  async isAlive() {
    return await lastValueFrom(
      this.classManagementService.send({ cmd: 'ping' }, {}),
    );
  }

  @Get('/:classUuid/joinClass')
  async joinClass(
    @Req() req: Request & { user: { uuid: string } },
    @Param('classUuid') classUuid: string,
    @Body('password') password: string,
  ) {
    LoggerUtil.log(
      `${req.user.uuid} joining ${classUuid}`,
      'ClassManamagement:JoinClass',
    );
    const response = this.classManagementService.send(
      { cmd: 'join-class' },
      { studentUuid: req.user.uuid, classUuid: classUuid, password },
    );

    await checkResponseError(response, {
      context: 'ClassManamagement:JoinClass',
    });

    return { data: await lastValueFrom(response) };
  }

  @Get('/:classUuid/responseJoinRequest')
  async responseJoinRequest(
    @Req() req: Request & { user: { uuid: string } },
    @Param('classUuid') classUuid: string,
    @Body() payload: { approve: boolean; studentUuid: string },
  ) {
    LoggerUtil.log(
      `${req.user.uuid} response join request of ${payload.studentUuid}`,
      'ClassManamagement:ResponseJoinRequest',
    );
    const response = this.classManagementService.send(
      { cmd: 'response-join-request' },
      { ownerUuid: req.user.uuid, classUuid, ...payload },
    );

    await checkResponseError(response, {
      context: 'ClassManamagement:ResponseJoinRequest',
    });

    return { data: await lastValueFrom(response) };
  }

  @Post('/:classUuid/addMember')
  @Role('TEACHER')
  @UseGuards(RoleGuard)
  async addMemeber(
    @Req() req: Request & { user: { uuid: string } },
    @Body('email') email: string,
    @Param('classUuid') classUuid: string,
  ) {
    LoggerUtil.log(
      `Add ${email} to ${classUuid} `,
      'ClassManamagement:AddMember',
    );
    const response = this.classManagementService.send(
      { cmd: 'add-member' },
      { email, ownerUuid: req.user.uuid, classUuid },
    );

    await checkResponseError(response, {
      context: 'ClassManamagement:AddMember',
    });

    return { data: await lastValueFrom(response) };
  }

  @Patch('/:classUuid/removeMember')
  @Role('TEACHER')
  @UseGuards(RoleGuard)
  async removeMember(
    @Req() req: Request & { user: { uuid: string } },
    @Param('classUuid') classUuid: string,
    @Body('studentUuid') studentUuid: string,
  ) {
    LoggerUtil.log(
      `Remove ${studentUuid} from ${classUuid}`,
      'ClassManamagement:RemoveMember',
    );
    const response = this.classManagementService.send(
      { cmd: 'remove-member' },
      { studentUuid, ownerUuid: req.user.uuid, classUuid: classUuid },
    );

    await checkResponseError(response, {
      context: 'ClassManamagement:RemoveMember',
    });

    return { data: await lastValueFrom(response) };
  }

  @Get('/:classUuid/leaveClass')
  async leaveClass(
    @Param('classUuid') classUuid: string,
    @Req() req: Request & { user: { uuid: string } },
  ) {
    LoggerUtil.log(
      `${req.user.uuid} leave ${classUuid} `,
      'ClassManamagement:LeaveClass',
    );
    const response = this.classManagementService.send(
      { cmd: 'leave-class' },
      {
        studentUuid: req.user.uuid,
        classUuid,
      },
    );

    await checkResponseError(response, {
      context: 'ClassManamagement:LeaveClass',
    });

    return { data: await lastValueFrom(response) };
  }
}
