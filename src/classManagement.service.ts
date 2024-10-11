import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  AddMemberPayload,
  JoinClassPayload,
  RemoveMemberPayload,
  ResponseJoinRequestPayload,
  LeaveClassPayload,
} from './type/classManagement.type';
import { AwsService } from './utils/aws.service';
import { PrismaService } from './utils/prisma.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';

@Injectable()
export class ClassManagementService {
  private aws: AwsService;
  private prisma: PrismaService;

  constructor(
    @Inject('API_GATEWAY') private readonly apiGatewayClient: ClientProxy,
  ) {
    this.aws = new AwsService();
    this.prisma = new PrismaService();
  }

  private async setUpClassForUser(classUuid: string, userUuid: string) {
    const allPostInClass = await this.prisma.post.findMany({
      where: {
        classUuid,
      },
      include: {
        voteData: true,
      },
    });

    const allExercise = allPostInClass.filter(
      (post) => post.type === 'Exercise',
    );
    const allVote = allPostInClass.filter((post) => post.type === 'Vote');

    if (allExercise.length > 0) {
      for await (const exercise of allExercise) {
        await this.prisma.userAssignExercise.create({
          data: {
            userUuid,
            postUuid: exercise.uuid,
            feedback: '',
            score: 0,
          },
        });
      }
    }

    if (allVote.length > 0) {
      for await (const vote of allVote) {
        await this.prisma.userChooesOption.create({
          data: {
            voteUuid: vote.voteData.uuid,
            userUuid,
          },
        });
      }
    }
  }

  async joinClass({ password, classUuid, studentUuid }: JoinClassPayload) {
    const userExist = await this.prisma.user.findUnique({
      where: {
        uuid: studentUuid,
      },
    });

    if (!userExist) {
      throw new RpcException({
        error: 'Người dùng không tồn tại',
        status: 404,
      });
    }

    const classExist = await this.prisma.class.findUnique({
      where: { uuid: classUuid },
      select: {
        password: true,
        requireApprove: true,
      },
    });

    if (classExist.password) {
      const verify = classExist.password === password;

      if (!verify) {
        throw new RpcException({ error: 'Mật khẩu không đúng', status: 400 });
      }
    }

    try {
      await this.prisma.userJoinClass.create({
        data: {
          userUuid: studentUuid,
          classUuid,
          status: classExist.requireApprove ? 'PENDING' : 'JOINED',
        },
      });

      if (!classExist.requireApprove) {
        await this.setUpClassForUser(classUuid, studentUuid);
      }

      return { status: classExist.requireApprove ? 'PENDING' : 'JOINED' };
    } catch (error) {
      console.error(error);

      throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }

  async responseJoinRequest({
    ownerUuid,
    classUuid,
    studentUuid,
    approve,
  }: ResponseJoinRequestPayload) {
    try {
      const classExist = await this.prisma.class.findUnique({
        where: {
          uuid: classUuid,
        },
      });

      if (classExist.ownerUuid !== ownerUuid) {
        throw new RpcException({
          error: 'Không có quyền truy cập',
          status: 403,
        });
      }

      if (approve) {
        const userJoinClass = await this.prisma.userJoinClass.update({
          where: {
            userUuid_classUuid: {
              userUuid: studentUuid,
              classUuid,
            },
          },
          data: {
            status: 'JOINED',
          },
        });

        await this.setUpClassForUser(classUuid, userJoinClass.userUuid);

        // this.socket.server.emit(`${studentUuid}/requestClass`, () => {
        //   return true;
        // });

        this.apiGatewayClient.send('forwarding', {
          to: `${studentUuid}/requestClass`,
          payload: { message: 'Chấp thuận' },
        });

        return { message: 'Chấp thuận' };
      } else {
        await this.prisma.userJoinClass.delete({
          where: {
            userUuid_classUuid: {
              userUuid: studentUuid,
              classUuid,
            },
          },
        });

        return { message: 'Không chấp thuận' };
      }
    } catch (error) {
      console.error(error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({ error: 'Lớp không tồn tại', status: 404 });
        }
      } else throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }

  async addMember({ ownerUuid, classUuid, email }: AddMemberPayload) {
    try {
      const classExist = await this.prisma.class.findUnique({
        where: {
          uuid: classUuid,
        },
      });

      if (classExist.ownerUuid !== ownerUuid) {
        throw new RpcException({
          error: 'Không có quyền truy cập',
          status: 403,
        });
      }

      const userExist = await this.prisma.user.findUniqueOrThrow({
        where: { email },
        select: {
          uuid: true,
        },
      });

      await this.prisma.userJoinClass.upsert({
        where: {
          userUuid_classUuid: {
            userUuid: userExist.uuid,
            classUuid,
          },
        },
        create: {
          userUuid: userExist.uuid,
          classUuid,
          status: 'JOINED',
        },
        update: {
          status: 'JOINED',
        },
      });

      await this.setUpClassForUser(classUuid, userExist.uuid);

      return { message: 'Thêm thành viên thành công' };
    } catch (error) {
      console.error(error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({
            error: 'Người dùng không tồn tại',
            status: 404,
          });
        }
      } else throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }

  async removeMember({
    ownerUuid,
    classUuid,
    studentUuid,
  }: RemoveMemberPayload) {
    try {
      const classExist = await this.prisma.class.findUnique({
        where: {
          uuid: classUuid,
        },
      });

      if (classExist.ownerUuid !== ownerUuid) {
        throw new RpcException({
          error: 'Không có quyền truy cập',
          status: 403,
        });
      }

      await this.prisma.userJoinClass.delete({
        where: {
          userUuid_classUuid: {
            userUuid: studentUuid,
            classUuid,
          },
        },
      });

      await this.prisma.userAssignExercise.deleteMany({
        where: {
          userUuid: studentUuid,
        },
      });

      await this.prisma.userChooesOption.deleteMany({
        where: {
          userUuid: studentUuid,
        },
      });

      return { message: 'Xóa thành viên thành công' };
    } catch (error) {
      console.error(error);

      throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }

  async leaveClass({ studentUuid, classUuid }: LeaveClassPayload) {
    try {
      await this.prisma.userJoinClass.delete({
        where: {
          userUuid_classUuid: {
            userUuid: studentUuid,
            classUuid,
          },
        },
      });

      const userAssigns = await this.prisma.userAssignExercise.findMany({
        where: {
          userUuid: studentUuid,
          post: {
            classUuid,
          },
        },
        select: {
          assignFiles: true,
        },
      });

      for await (const assign of userAssigns) {
        await this.aws.deleteFiles(assign.assignFiles.map((file) => file.uuid));
      }

      await this.prisma.userAssignExercise.deleteMany({
        where: {
          userUuid: studentUuid,
          post: {
            classUuid,
          },
        },
      });

      await this.prisma.userChooesOption.deleteMany({
        where: {
          userUuid: studentUuid,
          Vote: {
            post: {
              classUuid,
            },
          },
        },
      });

      return { message: 'Rời lớp thành công' };
    } catch (error) {
      console.error(error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({ error: 'Lớp không tồn tại', status: 404 });
        }
      }
      throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }
}
