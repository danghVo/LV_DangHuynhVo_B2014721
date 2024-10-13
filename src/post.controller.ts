import {
  Body,
  Controller,
  Param,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto, CommentDto } from './dto';
import { SubmitExerciseDto } from './dto/submitExercise.dto';
import { MarkScoreDto } from './dto/markScore.dto';
import { MessagePattern } from '@nestjs/microservices';
import { File } from './type/generate';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller()
export class PostController {
  constructor(private post: PostService) {}

  @MessagePattern({ cmd: 'get-all-post' })
  async getAllPost(@Body('classUuid') classUuid: string) {
    return await this.post.getAllPosted(classUuid);
  }

  @MessagePattern({ cmd: 'create-post' })
  async createPost(
    @Body()
    body: {
      createPostDto: CreatePostDto;
      classUuid: string;
      ownerUuid: string;
      files: File[];
    },
  ) {
    return await this.post.createPost(body);
  }

  @MessagePattern({ cmd: 'update-post' })
  async updatePost(
    @Body()
    body: {
      updatePostDto: UpdatePostDto;
      postUuid: string;
      files: File[];
    },
  ) {
    return await this.post.updatePost(
      body.postUuid,
      body.updatePostDto,
      body.files,
    );
  }

  @MessagePattern({ cmd: 'delete-post' })
  async deletePost(@Body('postUuid') postUuid: string) {
    return await this.post.deletePost(postUuid);
  }

  // exercise
  @MessagePattern({ cmd: 'get-all-exercise' })
  async getAllExercise(@Body('classUuid') classUuid: string) {
    return await this.post.getAllExercise(classUuid);
  }

  @MessagePattern({ cmd: 'get-exercise' })
  async getExercise(@Body() body: { postUuid: string; userUuid: string }) {
    return await this.post.getExercise(body.postUuid, body.userUuid);
  }

  @MessagePattern({ cmd: 'get-all-submit' })
  async getAllSubmit(@Param('postUuid') postUuid: string) {
    return await this.post.getAllSubmit(postUuid);
  }

  @MessagePattern({ cmd: 'get-scores' })
  async markScore(@Body() body: { markScoreDto: MarkScoreDto }) {
    return await this.post.markScore(body);
  }

  @MessagePattern({ cmd: 'submit-exercise' })
  async submitExercise(
    @Body()
    body: {
      submitExerciseDto: SubmitExerciseDto;
      files: File[];
    },
  ) {
    return await this.post.submitExercise(body);
  }

  @MessagePattern({ cmd: 'get-vote' })
  async getVote(@Body() body: { voteUuid: string; userVotedUuid: string }) {
    return await this.post.getVoteData(body.voteUuid, body.userVotedUuid);
  }

  @MessagePattern({ cmd: 'vote' })
  async vote(
    @Body()
    body: {
      optionUuid: string;
      voteUuid: string;
      userVotedUuid: string;
    },
  ) {
    return await this.post.chooseOption(body);
  }

  @MessagePattern({ cmd: 'get-comments' })
  async getComments(@Body('postUuid') postUuid: string) {
    return await this.post.getComments(postUuid);
  }

  @MessagePattern({ cmd: 'post-comment' })
  async comment(
    @Body()
    body: {
      commentDto: CommentDto;
      postUuid: string;
      userCommentedUuid: string;
    },
  ) {
    return await this.post.comment(body);
  }

  @MessagePattern({ cmd: 'get-task-in-date' })
  async getTaskInDate(@Body() payload: { classUuid: string; date: string }) {
    return await this.post.getTaskInDate(payload);
  }

  @MessagePattern({ cmd: 'check-post-exist' })
  async checkExistPost(@Param('postUuid') postUuid: string) {
    return await this.post.checkPostExist(postUuid);
  }
}
