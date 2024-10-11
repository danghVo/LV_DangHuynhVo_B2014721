import { UpdateClassDto } from './dto/updateClass.dto';
import { Injectable } from '@nestjs/common';
import { CreateClassDto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from './utils/prisma.service';
import { AwsService } from './utils/aws.service';
import { RpcException } from '@nestjs/microservices';
// import { SocketGateway } from '../../common/socket/socket.gateway';

@Injectable()
export class ClassService {
  private prisma: PrismaService;
  private aws: AwsService;

  constructor() {
    this.prisma = new PrismaService();
    this.aws = new AwsService();
  }

  async checkClass(classUuid: string) {
    const classExist = await this.prisma.class.findUnique({
      where: {
        uuid: classUuid,
      },
    });

    return classExist;
  }

  async getUuidOfClasses() {
    try {
      // Get all classes logic here
      const allClasses = await this.prisma.class.findMany({
        select: {
          uuid: true,
        },
      });

      return allClasses;
    } catch (error) {
      console.error(error);

      throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }

  async getCalender(classUuid: string) {
    try {
      const allPostHaveExpired = await this.prisma.post.findMany({
        where: {
          classUuid,
          endInTime: { not: null },
        },
        select: {
          endInDate: true,
        },
      });

      const result = allPostHaveExpired.map((post) => post.endInDate);

      return result;
    } catch (error) {
      console.error(error);

      throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }

  async classesConvert<
    T extends { owner: { uuid: string; avatar: string }; theme: string },
  >(allSelectedClasses: T[]) {
    const classesConvert = [];

    const ownerUuids = allSelectedClasses.reduce(
      (accu, classItem) => ({ ...accu, [classItem.owner.uuid]: '' }),
      {},
    );

    for (const classItem of allSelectedClasses) {
      if (classItem.owner.avatar) {
        if (ownerUuids[classItem.owner.uuid] === '') {
          classItem.owner.avatar = await this.aws.getImage(
            classItem.owner.avatar,
          );
          ownerUuids[classItem.owner.uuid] = classItem.owner.avatar;
        } else {
          classItem.owner.avatar = ownerUuids[classItem.owner.uuid];
        }
      }

      classesConvert.push({
        ...classItem,
        theme: {
          from: classItem.theme.split(' ')[0].slice(6, -1),
          to: classItem.theme.split(' ')[1].slice(4, -1),
        },
      });
    }

    return classesConvert;
  }

  async getClassesByFilter(uuid: string, filter: 'JOINED' | 'PENDING' | 'ALL') {
    try {
      const allSelectedClasses = await this.prisma.class.findMany({
        where: {
          userJoinClass: {
            some: {
              userUuid: uuid,
              status: filter === 'ALL' ? undefined : filter,
            },
          },
        },
        select: {
          uuid: true,
          name: true,
          description: true,
          theme: true,
          owner: {
            select: {
              uuid: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      return await this.classesConvert(allSelectedClasses);
    } catch (error) {
      console.error(error);

      throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }

  async getAllOwnClasses(uuid: string) {
    try {
      // Get all classes of teacher logic here
      const allClasses = await this.prisma.class.findMany({
        where: {
          ownerUuid: uuid,
        },
        select: {
          uuid: true,
          name: true,
          description: true,
          theme: true,
          owner: {
            select: {
              uuid: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      return await this.classesConvert(allClasses);
    } catch (error) {
      console.error(error);

      throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }

  async getClassDetail(userUuid: string, classUuid: string) {
    const joinStatus = await this.prisma.userJoinClass.findUnique({
      where: {
        userUuid_classUuid: {
          userUuid,
          classUuid,
        },
      },
      select: {
        status: true,
      },
    });

    try {
      const classExist = await this.prisma.class.findUnique({
        where: {
          uuid: classUuid,
        },
        include: {
          owner: {
            select: {
              uuid: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          posts: {
            include: {
              voteData: {
                include: {
                  options: true,
                },
              },
              files: true,
            },
          },
        },
      });

      if (userUuid !== classExist.owner.uuid) {
        delete classExist.requireApprove;
      }

      if (classExist.owner.avatar) {
        classExist.owner.avatar = await this.aws.getImage(
          classExist.owner.avatar,
        );
      }

      return {
        ...classExist,
        status: joinStatus ? joinStatus.status : 'UNJOINED',
        isPassword: classExist.password ? true : false,
        showPassword:
          userUuid === classExist.ownerUuid ? classExist.password : undefined,
        isOwner: classExist.owner.uuid === userUuid,
        posts: joinStatus?.status !== 'JOINED' ? [] : classExist.posts,
        theme: {
          from: classExist.theme.split(' ')[0].slice(6, -1),
          to: classExist.theme.split(' ')[1].slice(4, -1),
        },
      };
    } catch (error) {
      console.error(error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({ error: 'Lớp không tồn tại', status: 404 });
        }
      } else throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }

  async getMembersOfClass(classUuid: string, ownerUuid: string) {
    try {
      const classExist = await this.prisma.class.findUnique({
        where: {
          uuid: classUuid,
        },
      });

      const members = await this.prisma.userJoinClass.findMany({
        where: {
          classUuid,
          status: ownerUuid !== classExist.ownerUuid ? 'JOINED' : undefined,
        },
        include: {
          user: {
            select: {
              uuid: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      const memberUuids = members.reduce(
        (accu, curr) => ({
          ...accu,
          [curr.user.uuid]: '',
        }),
        {},
      );

      for await (const member of members) {
        if (member.user.avatar) {
          if (memberUuids[member.user.uuid] === '') {
            member.user.avatar = await this.aws.getImage(member.user.avatar);
            memberUuids[member.user.uuid] = member.user.avatar;
          } else {
            member.user.avatar = memberUuids[member.user.uuid];
          }
        }
      }

      return members;
    } catch (error) {
      console.error(error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({ error: 'Lớp không tồn tại', status: 404 });
        }
      } else throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }

  async createClass(createClassDto: CreateClassDto, teacherUuid: string) {
    try {
      const newClass = await this.prisma.class.create({
        data: {
          name: createClassDto.name,
          ownerUuid: teacherUuid,
          description: createClassDto.description || null,
          theme: createClassDto.theme,
          textColor: createClassDto.textColor,
          password: createClassDto.password,
          userJoinClass: {
            create: {
              userUuid: teacherUuid,
              status: 'JOINED',
            },
          },
          requireApprove:
            createClassDto.requireApprove === 'true' ? true : false,
        },
      });

      return newClass;
    } catch (error) {
      console.error(error);

      throw new RpcException({ error: 'Có lỗi xảy ra', status: 500 });
    }
  }

  async updateClass(
    ownerUuid: string,
    updateClassDto: UpdateClassDto,
    classUuid: string,
  ) {
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

      delete updateClassDto.userUuid;
      delete updateClassDto.classUuid;

      const updatedClass = await this.prisma.class.update({
        where: {
          uuid: classUuid,
        },
        data: updateClassDto,
      });

      return updatedClass;
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

  async deleteClass(classUuid: string, ownerUuid: string) {
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

      await this.prisma.class.delete({
        where: {
          uuid: classUuid,
          ownerUuid: ownerUuid,
        },
      });

      return { message: 'Xóa lớp thành công' };
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
