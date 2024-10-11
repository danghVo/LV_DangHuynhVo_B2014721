import { Body, Controller } from '@nestjs/common';
import { ClassManagementService } from './classManagement.service';
import { MessagePattern } from '@nestjs/microservices';
import {
  AddMemberPayload,
  JoinClassPayload,
  RemoveMemberPayload,
  ResponseJoinRequestPayload,
  LeaveClassPayload,
} from './type/classManagement.type';

@Controller('class-management')
export class ClassManagementController {
  constructor(private classManagementService: ClassManagementService) {}

  @MessagePattern({ cmd: 'join-class' })
  async joinClass(@Body() payload: JoinClassPayload) {
    return await this.classManagementService.joinClass(payload);
  }

  @MessagePattern({ cmd: 'response-join-request' })
  async responseJoinRequest(@Body() payload: ResponseJoinRequestPayload) {
    return await this.classManagementService.responseJoinRequest(payload);
  }

  @MessagePattern({ cmd: 'add-member' })
  async addMember(@Body() payload: AddMemberPayload) {
    return await this.classManagementService.addMember(payload);
  }

  @MessagePattern({ cmd: 'remove-member' })
  async removeMembe(@Body() payload: RemoveMemberPayload) {
    return await this.classManagementService.removeMember(payload);
  }

  @MessagePattern({ cmd: 'leave-class' })
  async leaveClass(@Body() payload: LeaveClassPayload) {
    return await this.classManagementService.leaveClass(payload);
  }
}
