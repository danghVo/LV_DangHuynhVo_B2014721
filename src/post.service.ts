import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { CreatePostDto, UpdatePostDto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as moment from 'moment';
import { SubmitExerciseDto } from './dto/submitExercise.dto';
import { MarkScoreDto } from './dto/markScore.dto';
import { AwsService } from './utils/aws.service';
import { PrismaService } from './utils/prisma.service';
import saveFiles from './utils/saveFile';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { File } from './type/generate';

@Injectable()
export class PostService {
  private prisma: PrismaService;
  private aws: AwsService;

  constructor(
    @Inject('API_GATEWAY') private readonly apiGatewayClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {
    // private socket: SocketGateway, // private notification: NotificationService,
    this.prisma = new PrismaService();
    this.aws = new AwsService();
  }

  async checkPostExist(postUuid: string) {
    return await this.prisma.post.findUniqueOrThrow({
      where: {
        uuid: postUuid,
      },
      include: {
        files: true,
      },
    });
  }

  convertPostTime(post: any) {
    return {
      ...post,
      postInDate: undefined,
      postInTime: undefined,
      endInDate: undefined,
      endInTime: undefined,
      timePost: {
        time: post.postInTime,
        date: post.postInDate,
      },
      timeTaskEnd: {
        time: post.endInTime,
        date: post.endInDate,
      },
    };
  }

  async getAllPosted(classUuid: string) {
    try {
      const allPost = await this.prisma.post.findMany({
        where: {
          classUuid,
        },
        include: {
          files: true,
          voteData: {
            include: {
              options: true,
            },
          },
        },
      });

      let i = 0;
      for await (const post of allPost) {
        if (post.files.length > 0 && post.type === 'Announcement') {
          post.files = await this.aws.getFiles(post.files);
        }
        allPost[i++] = post;
      }

      return allPost
        .sort((a, b) => {
          if (moment(a.createdAt).isBefore(moment(b.createdAt))) {
            return 1;
          } else {
            return -1;
          }
        })
        .map((post) => this.convertPostTime(post));
    } catch (error) {
      console.error(error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({ error: 'Lớp không tồn tại', status: 404 });
        }
      }

      throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }

  async getAllExercise(classUuid: string) {
    try {
      const allExercises = await this.prisma.post.findMany({
        where: {
          classUuid,
          type: 'Exercise',
        },
      });

      return allExercises
        .sort((a, b) => {
          if (moment(a.createdAt).isBefore(moment(b.createdAt))) {
            return 1;
          } else {
            return -1;
          }
        })
        .map((exercise) => this.convertPostTime(exercise));
    } catch (error) {
      console.error(error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({ error: 'Lớp không tồn tại', status: 404 });
        }
      }

      throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }

  async getExercise(postUuid: string, userUuid: string) {
    try {
      const exercise = await this.prisma.post.findUniqueOrThrow({
        where: {
          uuid: postUuid,
        },
        include: {
          files: true,
          userAssignExercise: {
            where: {
              userUuid,
            },
            include: {
              assignFiles: true,
            },
          },
        },
      });

      if (exercise.files.length > 0) {
        exercise.files = await this.aws.getFiles(exercise.files);
      }

      return this.convertPostTime({
        ...exercise,
        userAssignExercise: undefined,
        assignment: {
          ...exercise.userAssignExercise[0],
          assignInTime: undefined,
          assignInDate: undefined,
          timeAssign: {
            time: exercise.userAssignExercise[0]?.assignInTime,
            date: exercise.userAssignExercise[0]?.assignInDate,
          },
        },
      });
    } catch (error) {
      console.error(error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({
            message: 'Bài tập không tồn tại',
            status: 404,
          });
        }
      }

      throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }

  async getTaskInDate({
    classUuid,
    date,
  }: {
    classUuid: string;
    date: string;
  }) {
    try {
      const posts = await this.prisma.post.findMany({
        where: {
          classUuid,
          endInDate: date,
        },
      });

      return posts;
    } catch (error) {
      console.error(error);
      throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }

  validPost(postDto: CreatePostDto) {
    if (postDto.type === 'Vote') {
      if (!postDto.voteData || !postDto.timeTaskEnd) {
        return 'Sai dữ liệu cho bài đăng loại bình chọn';
      }
    }
    if (postDto.type === 'Exercise') {
      if (postDto.voteData || !postDto.timeTaskEnd || !postDto.content) {
        return 'Sai dữ liệu cho bài đăng loại bài tập';
      }
    }
    if (postDto.type === 'Announcement') {
      if (postDto.voteData || !postDto.content) {
        return 'Sai dữ liệu cho bài đăng loại thông báo';
      }
    }
  }

  async createPost({ ownerUuid, classUuid, createPostDto, files }) {
    let voteData = null;
    if (createPostDto.voteData) {
      voteData = JSON.parse(createPostDto.voteData);
    }

    this.validPost(createPostDto);

    let timeTaskEnd: { time: string; date: string } | undefined;

    if (createPostDto.timeTaskEnd) {
      timeTaskEnd = JSON.parse(createPostDto.timeTaskEnd);
    }

    try {
      let post = await this.prisma.post.create({
        data: {
          class: {
            connect: {
              uuid: classUuid,
            },
          },
          title: createPostDto.title,
          content: createPostDto.content,
          type: createPostDto.type,
          endInTime:
            createPostDto.type === 'Announcement' ? null : timeTaskEnd.time,
          endInDate:
            createPostDto.type === 'Announcement' ? null : timeTaskEnd.date,
        },
      });

      if (files.length > 0) {
        createPostDto.files = await saveFiles(
          this.aws,
          createPostDto.hashFiles,
          files,
          post.uuid,
        );
      }

      const voteDataCreation = createPostDto.voteData
        ? {
            voteData: {
              create: {
                options: {
                  createMany: {
                    data: voteData.options.map((option) => option),
                  },
                },
              },
            },
          }
        : {};

      const newPost = await this.prisma.post.update({
        where: {
          uuid: post.uuid,
        },
        data: {
          class: {
            connect: {
              uuid: classUuid,
            },
          },
          files:
            files.length > 0
              ? {
                  createMany: {
                    data: createPostDto.files.map((file: any) => file),
                  },
                }
              : undefined,
          ...voteDataCreation,
        },
        select: {
          voteData: true,
          type: true,
          uuid: true,
          class: {
            select: {
              name: true,
            },
          },
        },
      });

      let userInClass = await this.prisma.user.findMany({
        where: {
          userJoinClass: {
            some: {
              classUuid,
            },
          },
        },
      });

      const students = userInClass.filter((user) => user.uuid !== ownerUuid);

      if (newPost.type === 'Exercise') {
        await this.prisma.userAssignExercise.createMany({
          data: students.map((student) => ({
            postUuid: newPost.uuid,
            userUuid: student.uuid,
            feedback: '',
            score: 0,
          })),
        });
      }

      if (newPost.type === 'Vote') {
        await this.prisma.userChooesOption.createMany({
          data: students.map((student) => ({
            voteUuid: newPost.voteData.uuid,
            userUuid: student.uuid,
          })),
        });
      }

      const now = moment(moment.now()).format('DD-MM-YYYY HH:mm');

      for await (const student of students) {
        // this.notificationClient.send(
        //   { cmd: 'create' },
        //   {
        //     userUuid: student.uuid,
        //     socketTo: classUuid,
        //     to: `/class/${classUuid}${newPost.type === 'Exercise' ? '/exercise/' : '/post#'}${newPost.uuid}`,
        //     from: newPost.class.name,
        //     type: 'post',
        //     createTime: {
        //       time: now.split(' ')[1],
        //       date: now.split(' ')[0],
        //     },
        //     messageType: newPost.type,
        //   },
        // );
      }

      return newPost;
    } catch (error) {
      console.error(error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return { error: 'Lớp không tồn tại', status: 404 };
        }
      } else if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }

  async deletePost(postUuid: string) {
    try {
      const postExist = await this.checkPostExist(postUuid);

      if (postExist.files.length > 0)
        await this.aws.deleteFiles(postExist.files.map((file) => file.uuid));

      await this.prisma.post.delete({
        where: {
          uuid: postUuid,
        },
      });

      return { message: 'Xóa bài đăng thành công' };
    } catch (error) {
      console.error(error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({
            error: 'Bài đăng không tồn tại',
            status: 404,
          });
        }
      }

      throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }

  async updatePost(
    postUuid: string,
    updatePostDto: UpdatePostDto,
    files: File[],
  ) {
    try {
      let warning: string;

      const postExist = await this.checkPostExist(postUuid);

      const filesUpdate = JSON.parse(
        updatePostDto.filesUpdate,
      ) as Array<string>;

      const filesDelete = postExist.files
        .filter(
          (file) =>
            filesUpdate.find((uuid) => uuid === file.uuid) === undefined,
        )
        .map((file) => file.uuid);

      if (filesDelete.length > 0) {
        await this.aws.deleteFiles(filesDelete);
        await this.prisma.file.deleteMany({
          where: {
            uuid: {
              in: filesDelete,
            },
          },
        });
      }

      if (files.length > 0) {
        const newFilesSaved = await saveFiles(
          this.aws,
          updatePostDto.hashFiles,
          files,
          postUuid,
        );

        await this.prisma.post.update({
          where: {
            uuid: postUuid,
          },
          data: {
            files: {
              createMany: {
                data: newFilesSaved.map((file: any) => file),
              },
            },
          },
        });
      }

      if (updatePostDto.content) {
        await this.prisma.post.update({
          where: {
            uuid: postUuid,
          },
          data: {
            content: updatePostDto.content,
          },
        });
      }

      if (updatePostDto.title) {
        await this.prisma.post.update({
          where: {
            uuid: postUuid,
          },
          data: {
            title: updatePostDto.title,
          },
        });
      }

      if (updatePostDto.timeTaskEnd) {
        const timeTaskEnd = JSON.parse(updatePostDto.timeTaskEnd);
        await this.prisma.post.update({
          where: {
            uuid: postUuid,
          },
          data: {
            endInTime: timeTaskEnd.time,
            endInDate: timeTaskEnd.date,
          },
        });
      }

      if (updatePostDto.voteData) {
        const voteData = JSON.parse(updatePostDto.voteData);
        const newOption = voteData.options.filter(
          (option) => option.uuid === undefined,
        );
        const oldOption = voteData.options.filter(
          (option) => option.uuid !== undefined,
        );

        await this.prisma.option.deleteMany({
          where: {
            uuid: { notIn: oldOption.map((option) => option?.uuid) },
          },
        });

        await this.prisma.voteData.update({
          where: {
            uuid: voteData.uuid,
          },
          data: {
            options: {
              createMany: {
                data: newOption.filter((option) => option.uuid === undefined),
              },
            },
          },
        });
      }

      return { warning, message: 'Cập nhật bài đăng thành công' };
    } catch (error) {
      console.error(error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({
            error: 'Bài đăng không tồn tại',
            status: 404,
          });
        }
      }

      throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }

  async getAllSubmit(postUuid: string) {
    try {
      const data = await this.prisma.userAssignExercise.findMany({
        where: {
          postUuid,
        },
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
          assignFiles: true,
        },
      });

      const res = data.filter((assign) => assign.assignInTime);

      let i = 0;
      for await (const assign of data) {
        if (assign.assignFiles.length > 0) {
          assign.assignFiles = await this.aws.getFiles(assign.assignFiles);
        }
        if (assign.user.avatar) {
          assign.user.avatar = await this.aws.getImage(assign.user.avatar);
        }

        res[i++] = assign;
      }

      return res.map((assign) => ({
        ...assign,
        assignInTime: undefined,
        assignInDate: undefined,
        timeAssign: {
          time: assign.assignInTime,
          date: assign.assignInDate,
        },
      }));
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({
            error: 'Bài đăng không tồn tại',
            status: 404,
          });
        }
      }

      throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }

  async submitExercise({
    submitExerciseDto,
    files,
  }: {
    submitExerciseDto: SubmitExerciseDto;
    files: File[];
  }) {
    try {
      let firstAssign = true;
      const timeAssignParse = JSON.parse(submitExerciseDto.timeAssign);

      const post = await this.prisma.post.findUniqueOrThrow({
        where: {
          uuid: submitExerciseDto.postUuid,
        },
        select: {
          uuid: true,
          endInDate: true,
          endInTime: true,
          class: {
            select: {
              uuid: true,
              ownerUuid: true,
            },
          },
        },
      });

      const assignExist = await this.prisma.userAssignExercise.findFirst({
        where: {
          postUuid: submitExerciseDto.postUuid,
          userUuid: submitExerciseDto.fromUserUuid,
        },
        include: {
          assignFiles: true,
        },
      });

      if (assignExist.assignFiles.length > 0) {
        firstAssign = false;
      }

      let filesSaved = await saveFiles(
        this.aws,
        submitExerciseDto.hashFiles,
        files,
        `${submitExerciseDto.postUuid}/${submitExerciseDto.fromUserUuid}/assign`,
      );

      const status = moment(post.endInDate + 'T' + post.endInTime).isBefore(
        moment(timeAssignParse.date + 'T' + timeAssignParse.time),
      )
        ? 'LATE'
        : 'ONTIME';

      await this.prisma.userAssignExercise.update({
        where: {
          uuid: submitExerciseDto.assignUuid,
          postUuid: submitExerciseDto.postUuid,
          userUuid: submitExerciseDto.fromUserUuid,
        },
        data: {
          assignInDate: timeAssignParse.date,
          assignInTime: timeAssignParse.time,
          assignFiles:
            filesSaved.length > 0
              ? { createMany: { data: filesSaved } }
              : undefined,
          status,
        },
      });

      const now = moment().format('DD-MM-YYYY HH:mm');

      if (firstAssign) {
        this.notificationClient.send(
          { cmd: 'create' },
          {
            userUuid: post.class.ownerUuid,
            socketTo: post.class.uuid,
            to: `/class/${post.class.uuid}/exercise/${post.uuid}`,
            from: 'Hệ thống',
            type: 'post',
            createTime: {
              time: now.split(' ')[1],
              date: now.split(' ')[0],
            },
            messageType: 'assign',
          },
        );
      }

      return { message: 'Nộp bài thành công' };
    } catch (error) {
      console.error(error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException('Không tìm thấy bài tập');
        }
      } else if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }

  async getVoteData(voteUuid: string, userVotedUuid: string) {
    try {
      const voteData = await this.prisma.voteData.findUnique({
        where: {
          uuid: voteUuid,
        },
        include: {
          UserChooesOption: true,
          options: true,
        },
      });

      const optionOfUser = await this.prisma.userChooesOption.findUnique({
        where: {
          userUuid_voteUuid: {
            userUuid: userVotedUuid,
            voteUuid,
          },
        },
        select: {
          optionUuid: true,
        },
      });

      const options = {};

      const total = voteData.UserChooesOption.filter(
        (choose) => choose.optionUuid,
      ).length;

      for (const option of voteData.options) {
        options[option.uuid] =
          (voteData.UserChooesOption.filter(
            (choose) => choose.optionUuid === option.uuid,
          ).length *
            100) /
          total;
      }

      return { options, choose: optionOfUser?.optionUuid || null };
    } catch (error) {
      console.error(error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException('Không tìm thấy bình chọn');
        }
      }

      throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }

  async chooseOption({ optionUuid, voteUuid, userVotedUuid }) {
    try {
      await this.prisma.voteData.findUniqueOrThrow({
        where: {
          uuid: voteUuid,
        },
      });

      await this.prisma.option.findUniqueOrThrow({
        where: {
          uuid: optionUuid,
        },
      });

      await this.prisma.userChooesOption.upsert({
        where: {
          userUuid_voteUuid: {
            userUuid: userVotedUuid,
            voteUuid,
          },
        },
        create: {
          voteUuid,
          userUuid: userVotedUuid,
          optionUuid,
        },
        update: {
          option: optionUuid
            ? { connect: { uuid: optionUuid } }
            : { disconnect: true },
        },
      });

      return await this.getVoteData(voteUuid, userVotedUuid);
      // return { message: 'Chọn lựa chọn thành công' };
    } catch (error) {
      console.error(error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException('Không tìm thấy bình chọn');
        }
      }

      throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }

  async markScore({ markScoreDto }: { markScoreDto: MarkScoreDto }) {
    try {
      const assign = await this.prisma.userAssignExercise.update({
        where: {
          uuid: markScoreDto.submitUuid,
        },
        data: {
          score: parseInt(markScoreDto.score),
          feedback: markScoreDto.feedback,
          isMarked: true,
        },
        select: {
          postUuid: true,
          userUuid: true,
          post: {
            select: {
              title: true,
              classUuid: true,
            },
          },
        },
      });

      const now = moment().format('DD-MM-YYYY HH:mm');

      this.notificationClient.send(
        { cmd: 'create' },
        {
          userUuid: assign.userUuid,
          socketTo: assign.userUuid,
          to: `/class/${assign.post.classUuid}/exercise/${assign.postUuid}`,
          from: assign.post.title,
          type: 'mark',
          createTime: {
            time: now.split(' ')[1],
            date: now.split(' ')[0],
          },
        },
      );

      return { message: 'Đã cập nhật điểm' };
    } catch (error) {
      console.error(error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException('Không tìm thấy bài tập');
        }
      }

      throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }

  async getComments(postUuid: string) {
    try {
      const comments = await this.prisma.comment.findMany({
        where: {
          postUuid,
        },
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
              role: true,
            },
          },
        },
      });

      const userUuids = comments.reduce(
        (accu, curr) => ({
          ...accu,
          [curr.user.avatar]: '',
        }),
        {},
      );

      for await (const comment of comments) {
        if (comment.user.avatar) {
          if (!userUuids[comment.user.avatar]) {
            comment.user.avatar = await this.aws.getImage(comment.user.avatar);
            userUuids[comment.user.avatar] = comment.user.avatar;
          } else {
            comment.user.avatar = userUuids[comment.user.avatar];
          }
        }
      }

      return comments.map((comment) => ({
        ...comment,
        createdInDate: undefined,
        createdInTime: undefined,
        createIn: {
          time: comment.createdInTime,
          date: comment.createdInDate,
        },
      }));
    } catch (error) {
      console.error(error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({
            error: 'Không tìm thấy bài đăng',
            status: 404,
          });
        }
      }

      throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }

  async comment({ postUuid, userCommentedUuid, commentDto }) {
    try {
      await this.checkPostExist(postUuid);

      await this.prisma.comment.create({
        data: {
          postUuid,
          userUuid: userCommentedUuid,
          createdInDate: commentDto.createIn.date,
          createdInTime: commentDto.createIn.time,
          content: commentDto.content,
        },
      });

      //   this.socket.server.emit(`${postUuid}/comments`, () => {
      //     return ;
      //   });

      this.apiGatewayClient.send('forwarding', {
        to: `${postUuid}/comments`,
        payload: { message: 'New comment' },
      });

      return { message: 'Bình luận thành công' };
    } catch (error) {
      console.error(error);

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new RpcException({
            error: 'Không tìm thấy bài đăng',
            status: 404,
          });
        }
      }

      throw new RpcException({ error: 'Lỗi không xác định', status: 500 });
    }
  }
}
