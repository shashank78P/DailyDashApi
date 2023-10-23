import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { MeetController } from './meet.controller';
import { MeetService } from './meet.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Meets, MeetsSchema } from './schema/meet.schema';
import { MeetingParticipants, MeetingParticipantsSchema } from './schema/meetingParticipants.schema';
import { ChatsModule } from 'src/chats/chats.module';

@Module({
    imports: [
        PassportModule.register({
            defaultStrategy: "jwt"
        }),
        UsersModule,
        ChatsModule,
        MongooseModule.forFeature([{name : Meets.name , schema : MeetsSchema}]),
        MongooseModule.forFeature([{name : MeetingParticipants.name , schema : MeetingParticipantsSchema}]),
        JwtModule.register(
            {
                secret: "DailyDash51",
                signOptions: {
                    expiresIn: "1d",
                }
            }
        ),
    ],
    controllers: [MeetController],
    providers: [MeetService],
    exports : [MeetService ]
})
export class MeetsModule { }
