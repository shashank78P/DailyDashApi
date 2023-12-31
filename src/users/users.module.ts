import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from "@nestjs/mongoose"
import { Users, UsersSchema } from './schema/users.schema';
import { PassportModule } from '@nestjs/passport';
import { InviteUsers, InviteUsersSchema } from './schema/inviteUser.schema';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: "jwt"
    }),
    MongooseModule.forFeature([{ name: Users.name, schema: UsersSchema }]),
    MongooseModule.forFeature([{ name: InviteUsers.name, schema: InviteUsersSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule { }
