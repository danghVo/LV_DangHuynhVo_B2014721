import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/decorator/public.decorator';
import { LoggerUtil } from 'src/utils/Logger';
import { CreatePostDto } from 'src/dto/post/createPost.dto';
import { CommentDto, UpdatePostDto } from 'src/dto/post';
import { Role } from 'src/guard/Role/role.decorator';
import { RoleGuard } from 'src/guard/Role/role.guard';
import { MarkScoreDto } from 'src/dto/post/markScore.dto';
import { SubmitExerciseDto } from 'src/dto/post/submitExercise.dto';
import checkResponseError from 'src/utils/checkResponseError';
import { lastValueFrom } from 'rxjs';

@Controller('post')
export class PostGatewayController {
  constructor(
    @Inject('POST_SERVICE') private readonly postService: ClientProxy,
    @Inject('CLASS_SERVICE') private readonly classService: ClientProxy,
    @Inject('USER_SERVICE') private readonly userService: ClientProxy,
  ) {}

  @Get('/all/:classUuid')
  getAllPost(@Param('classUuid') classUuid: string) {
    return this.postService.send({ cmd: 'get-all-post' }, { classUuid });
  }

  @Role('TEACHER')
  @UseInterceptors(FilesInterceptor('files'))
  @UseGuards(RoleGuard)
  @Post('/:classUuid')
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @Param('classUuid') classUuid: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request & { user: { uuid: string } },
  ) {
    LoggerUtil.log(
      `${req.user.uuid} creating post in ${classUuid}`,
      'PostGateway:CreatePost',
    );

    if (
      !this.classService.send({ cmd: 'check-class' }, { classUuid }) ||
      !this.userService.send({ cmd: 'check-user' }, { userUuid: req.user.uuid })
    ) {
      return { data: { error: 'Resource not found' } };
    }

    const response = await lastValueFrom(
      this.postService.send(
        { cmd: 'create-post' },
        { createPostDto, classUuid, ownerUuid: req.user.uuid, files },
      ),
    );

    await checkResponseError(response, { context: 'PostGateway:CreatePost' });

    return { data: response };
  }

  @Role('TEACHER')
  @UseGuards(RoleGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @Patch('/:classUuid/:postUuid')
  async updatePost(
    @Body() updatePostDto: UpdatePostDto,
    @Param('postUuid') postUuid: string,
    @Param('classUuid') classUuid: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request & { user: { uuid: string } },
  ) {
    LoggerUtil.log(
      `${req.user.uuid} updating post in ${classUuid}`,
      'PostGateway:UpdatePost',
    );

    if (
      !this.classService.send({ cmd: 'check-class' }, { classUuid }) ||
      !this.userService.send({ cmd: 'check-user' }, { userUuid: req.user.uuid })
    ) {
      return { data: { error: 'Resource not found' } };
    }

    const response = await lastValueFrom(
      this.postService.send(
        { cmd: 'update-post' },
        { updatePostDto, postUuid, files },
      ),
    );

    await checkResponseError(response, { context: 'PostGateway:UpdatePost' });

    return { data: response };
  }

  @Role('TEACHER')
  @UseGuards(RoleGuard)
  @Delete('/:classUuid/:postUuid')
  async deletePost(
    @Param('postUuid') postUuid: string,
    @Param('classUuid') classUuid: string,
    @Req() req: Request & { user: { uuid: string } },
  ) {
    LoggerUtil.log(
      `${req.user.uuid} deleting post in ${classUuid}`,
      'PostGateway:DeletePost',
    );

    if (
      !this.classService.send({ cmd: 'check-class' }, { classUuid }) ||
      !this.userService.send({ cmd: 'check-user' }, { userUuid: req.user.uuid })
    ) {
      return { data: { error: 'Resource not found' } };
    }

    const response = await lastValueFrom(
      this.postService.send({ cmd: 'delete-post' }, { postUuid }),
    );

    await checkResponseError(response, { context: 'PostGateway:DeletePost' });

    return { data: response };
  }

  // exercise
  @Public()
  @Get('all/exercises/:classUuid')
  async getAllExercise(@Param('classUuid') classUuid: string) {
    LoggerUtil.log(
      `Getting all exercise in ${classUuid}`,
      'PostGateway:GetAllExercise',
    );
    const response = await lastValueFrom(
      this.postService.send({ cmd: 'get-all-exercise' }, { classUuid }),
    );

    await checkResponseError(response, {
      context: 'PostGateway:GetAllExercise',
    });

    return { data: response };
  }

  @Get('/exercise/:postUuid')
  async getExercise(
    @Param('postUuid') postUuid: string,
    @Req() req: Request & { user: { uuid: string } },
  ) {
    LoggerUtil.log(
      `${req.user.uuid} getting exercise ${postUuid}`,
      'PostGateway:GetExercise',
    );
    const response = await lastValueFrom(
      this.postService.send(
        { cmd: 'get-exercise' },
        { postUuid, userUuid: req.user.uuid },
      ),
    );
    await checkResponseError(response, { context: 'PostGateway:GetExercise' });

    return { data: response };
  }

  @Role('TEACHER')
  @UseGuards(RoleGuard)
  @Get('/submit/:postUuid')
  async getAllSubmit(@Param('postUuid') postUuid: string) {
    LoggerUtil.log(
      `Getting all submit in ${postUuid}`,
      'PostGateway:GetAllSubmit',
    );
    const response = await lastValueFrom(
      this.postService.send({ cmd: 'get-all-submit' }, { postUuid }),
    );

    await checkResponseError(response, { context: 'PostGateway:GetAllSubmit' });

    return { data: response };
  }

  @Role('TEACHER')
  @UseGuards(RoleGuard)
  @Patch('/:classUuid/submit/mark/')
  async markScore(
    @Param('classUuid') classUuid: string,
    @Body() markScoreDto: MarkScoreDto,
    @Req() req: Request & { user: { uuid: string } },
  ) {
    LoggerUtil.log(
      `${req.user.uuid} markting score for ${markScoreDto.submitUuid}`,
      'PostGateway:MarkScore',
    );

    if (
      !this.classService.send({ cmd: 'check-class' }, { classUuid }) ||
      !this.userService.send({ cmd: 'check-user' }, { userUuid: req.user.uuid })
    ) {
      return { data: { error: 'Resource not found' } };
    }

    const response = await lastValueFrom(
      this.postService.send({ cmd: 'get-scores' }, { markScoreDto }),
    );

    await checkResponseError(response, { context: 'PostGateway:MarkScore' });

    return { data: response };
  }

  @UseInterceptors(FilesInterceptor('files'))
  @Post('/submit/:postUuid')
  async submitExercise(
    @Param('postUuid') postUuid: string,
    @Req() req: Request & { user: { uuid: string } },
    @Body() submitExerciseDto: SubmitExerciseDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    LoggerUtil.log(
      `${req.user.uuid} submitting exercise for ${postUuid}`,
      'PostGateway:SubmitExercise',
    );
    const response = await lastValueFrom(
      this.postService.send(
        { cmd: 'submit-exercise' },
        { submitExerciseDto, files },
      ),
    );

    await checkResponseError(response, {
      context: 'PostGateway:SubmitExercise',
    });

    return { data: response };
  }

  @Get('/vote/:voteUuid')
  async getVote(
    @Param('voteUuid') voteUuid: string,
    @Req() req: Request & { user: { uuid: string } },
  ) {
    LoggerUtil.log(
      `${req.user.uuid} getting vote ${voteUuid}`,
      'PostGateway:GetVote',
    );

    const response = await lastValueFrom(
      this.postService.send(
        { cmd: 'get-vote' },
        { voteUuid, userVotedUuid: req.user.uuid },
      ),
    );

    await checkResponseError(response, { context: 'PostGateway:GetVote' });

    return { data: response };
  }

  @Put('/vote/:voteUuid')
  async vote(
    @Param('voteUuid') voteUuid: string,
    @Req() req: Request & { user: { uuid: string } },
    @Body() body: { optionUuid: string | null },
  ) {
    LoggerUtil.log(
      `${req.user.uuid} voting for ${voteUuid}`,
      'PostGateway:Vote',
    );
    const response = await lastValueFrom(
      this.postService.send(
        { cmd: 'vote' },
        { voteUuid, userVotedUuid: req.user.uuid, optionUuid: body.optionUuid },
      ),
    );

    await checkResponseError(response, { context: 'PostGateway:Vote' });

    return { data: response };
  }

  @Get('/comment/:postUuid')
  async getComments(@Param('postUuid') postUuid: string) {
    LoggerUtil.log(
      `Getting comments for ${postUuid}`,
      'PostGateway:GetComments',
    );
    const response = await lastValueFrom(
      this.postService.send({ cmd: 'get-comments' }, { postUuid }),
    );

    await checkResponseError(response, { context: 'PostGateway:GetComments' });

    return { data: response };
  }

  @Post('/comment/:postUuid')
  async comment(
    @Param('postUuid') postUuid: string,
    @Req() req: Request & { user: { uuid: string } },
    @Body() commentDto: CommentDto,
  ) {
    LoggerUtil.log(
      `${req.user.uuid} commenting on ${postUuid}`,
      'PostGateway:Comment',
    );
    const response = await lastValueFrom(
      this.postService.send(
        { cmd: 'post-comment' },
        { commentDto, postUuid, userCommentedUuid: req.user.uuid },
      ),
    );
    await checkResponseError(response, { context: 'PostGateway:Comment' });

    return { data: response };
  }

  @Get(':classUuid/task')
  async getTaskInDate(
    @Query() query: { date: string },
    @Param('classUuid') classUuid: string,
  ) {
    LoggerUtil.log(`Getting task in ${classUuid}`, 'PostGateway:GetTaskInDate');
    const response = await lastValueFrom(
      this.postService.send(
        { cmd: 'get-task-in-date' },
        { classUuid, date: query.date },
      ),
    );
    await checkResponseError(response, {
      context: 'PostGateway:GetTaskInDate',
    });

    return { data: response };
  }

  @Get(':postUuid/check')
  async checkExistPost(@Param('postUuid') postUuid: string) {
    LoggerUtil.log(`Checking post ${postUuid}`, 'PostGateway:CheckExistPost');
    const response = await lastValueFrom(
      this.postService.send({ cmd: 'check-post-exist' }, { postUuid }),
    );
    await checkResponseError(response, {
      context: 'PostGateway:CheckExistPost',
    });

    return { data: response };
  }
}
