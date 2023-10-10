import { Module } from '@nestjs/common';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { MongooseModule } from '@nestjs/mongoose';
// import { Users, UsersSchema } from 'src/users/schema/users.schema';
import { chats, chatsSchema } from './schema/chat.schema';
import { UsersService } from 'src/users/users.service';
import { PassportModule } from '@nestjs/passport';
import { Users, UsersSchema } from 'src/users/schema/users.schema';
import { UsersModule } from 'src/users/users.module';
import { ChatInitiated, ChatInitiatedSchema } from './schema/ChatInitiated.schema';
import { GroupMember, GroupMemeberSchema } from './schema/GroupMember.scheme';

@Module({
  imports : [
    PassportModule.register({
      defaultStrategy: "jwt"
    }),
    UsersModule,
    MongooseModule.forFeature([{ name: chats.name, schema: chatsSchema }]),
    MongooseModule.forFeature([{ name: ChatInitiated.name, schema: ChatInitiatedSchema }]),
    MongooseModule.forFeature([{ name: GroupMember.name, schema: GroupMemeberSchema }]),
  ],
  controllers: [ChatsController],
  providers: [ChatsService],
  exports : [ChatsService]
})
export class ChatsModule {}
