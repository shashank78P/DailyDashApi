import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Meets, MeetDocument } from './schema/meet.schema';
import mongoose, { Model } from 'mongoose';
import { MeetingParticipants, MeetingParticipantsDocument } from './schema/meetingParticipants.schema';
import { allowedMeetingLength, createMeetingDto } from './type';
import { Users, UsersDocument } from 'src/users/schema/users.schema';
import { ChatsService } from 'src/chats/chats.service';

@UsePipes(ValidationPipe)
@Injectable()
export class MeetService {
    constructor(
        private jwtService: JwtService,
        private readonly UsersService: UsersService,
        private readonly chatService: ChatsService,
        @InjectModel(Meets.name) private MeetModel: Model<MeetDocument>,
        // @InjectModel(Users.name) private UsersModel: Model<UsersDocument>,
        @InjectModel(MeetingParticipants.name) private MeetingParticipants: Model<MeetingParticipantsDocument>,
    ) { }


    async createMeeting(user: any, data: createMeetingDto) {
        try {
            const { title, description, meetingDate, meetingLength, participantsList, whoCanJoin } = data;

            if (!allowedMeetingLength.includes(meetingLength)) {
                throw new BadRequestException("Requiredments not statisfied")
            }

            const meet = await this.MeetModel.insertMany([
                {
                    title,
                    description,
                    meetingDate,
                    meetingLength,
                    whoCanJoin,
                    createdBy: user?._id
                }
            ])

            if (whoCanJoin !== "MANUALLY_ADDED") {
                return meet;
            }

            if (!Array.isArray(meet)) {
                throw new BadRequestException("Something went wrong, please try after some minutes!!")
            }

            const meetingId = meet?.[0]?._id

            await Promise.all(
                participantsList?.map(async (participant: string, i: number) => {
                    await this.MeetingParticipants.insertMany([
                        {
                            participantId: new mongoose.Types.ObjectId(participant),
                            belongsTo: meetingId
                        }
                    ])
                })
            )
            return meet;

        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getMeetingDetails(user: any, meetingId: string) {
        try {
            if (!meetingId) {
                throw new BadRequestException("Requirements are not satisfied")
            }
            return await this.MeetModel.aggregate(
                [
                    {
                        $match: {
                            _id: new mongoose.Types.ObjectId(meetingId)
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            as: "user",
                        },
                    },
                    {
                        $unwind: "$user",
                    },
                    {
                        $addFields: {
                            createrName: {
                                $concat: [
                                    {
                                        $ifNull: ["$user.firstName", ""],
                                    },
                                    " ",
                                    {
                                        $ifNull: ["$user.firstLast", ""],
                                    },
                                ],
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "meetingparticipants",
                            localField: "_id",
                            foreignField: "belongsTo",
                            as: "participants",
                        },
                    },
                    {
                        $addFields: {
                            participantsCount: {
                                $size: "$participants",
                            },
                        },
                    },
                    {
                        $project: {
                            title: 1,
                            description: 1,
                            meetingDate: 1,
                            whoCanJoin: 1,
                            createdAt: 1,
                            createdBy: 1,
                            createrName: 1,
                            participantsCount: 1,
                            meetingLength: 1,
                        },
                    },
                ])
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async AddParticipantsToRoom(user: any, meetingId: string) {
        try {
            console.log(user)
            console.log(meetingId)
            const meetingDetails = await this.MeetModel.findOne({ _id: new mongoose.Types.ObjectId(meetingId) })
            console.log(meetingDetails)

            if (!meetingDetails) {
                throw new NotFoundException("No meeting with this id")
            }

            const isAlreadyAdded = await this.MeetingParticipants.findOne({ belongsTo: new mongoose.Types.ObjectId(meetingId), participantId: new mongoose.Types.ObjectId(user?.userId), isAttended: true })

            if (meetingDetails?.whoCanJoin == "MANUALLY_ADDED" || isAlreadyAdded) {
                await this.MeetingParticipants.updateOne({
                    belongsTo: new mongoose.Types.ObjectId(meetingId),
                    participantId: new mongoose.Types.ObjectId(user?.userId)
                },
                    {
                        $set: {
                            isAttended: true,
                            isInMeeting: true,
                        }
                    }
                )
                return await this.MeetingParticipants.findOne({ belongsTo: new mongoose.Types.ObjectId(meetingId), participantId: new mongoose.Types.ObjectId(user?.userId),})
            }
            if (meetingDetails?.whoCanJoin == "ONLY_OF_MY_CONTACT") {
                const isInContact = await this.chatService.isUserIsMyContact(String(meetingDetails?.createdBy), user?._id)
                if (!isInContact) {
                    throw new BadRequestException("U don't have a access to join")
                }
            }
            const result = await this.MeetingParticipants.insertMany([
                {
                    participantId: new mongoose.Types.ObjectId(user?.userId),
                    isAttended: true,
                    isInMeeting: true,
                    belongsTo: new mongoose.Types.ObjectId(meetingId)
                }
            ])
            console.log(result)
            return result?.[0]
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getAllParticipantsId(userId, meetingId) {
        try {
            if (!meetingId) {
                throw new BadRequestException("Requirements are not statisfied");
            }
            return await this.MeetingParticipants.find(
                {
                    belongsTo: new mongoose.Types.ObjectId(meetingId),
                    participantId: { $ne: new mongoose.Types.ObjectId(userId) },
                    isInMeeting: true
                },
                {
                    participantId: 1,
                }
            )
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getAllActiveOrNonActiveParticipants(user: any, meetingId , isActive : string) {
        try {
            if (!meetingId) {
                throw new BadRequestException("Requirements are not statisfied");
            }
            console.log(user?._id)
            return await this.MeetingParticipants.aggregate(
                [
                    {
                        $match: {
                            belongsTo: new mongoose.Types.ObjectId(meetingId),
                            participantId: { $ne: user._id },
                            isInMeeting: (isActive.toString() === "true")
                        },
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "participantId",
                            foreignField: "_id",
                            as: "user",
                        },
                    },
                    {
                        $unwind: "$user",
                    },
                    {
                        $project: {
                            participantId: 1,
                            belongsTo: 1,
                            isAttended: 1,
                            isInMeeting: 1,
                            createdAt: 1,
                            userName: {
                                $concat: [
                                    {
                                        $ifNull: ["$user.firstName", " "],
                                    },
                                    " ",
                                    {
                                        $ifNull: ["$user.lastName", " "],
                                    },
                                ],
                            },
                            userPic: "$user.profilePic",
                            emial: "$user.email",
                        },
                    },
                ]
            )
        } catch (err: any) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async leaveMeetingRoom(userId: string, meetingId: string) {
        try {
            console.log(userId)
            return await this.MeetingParticipants.updateOne(
                {
                    belongsTo : new mongoose.Types.ObjectId(meetingId),
                    participantId : new mongoose.Types.ObjectId(userId),
                },
                {
                    $set : {
                        isInMeeting : false,
                        updatedAt : new Date()
                    }
                }
            )
        } catch (err) {
            new InternalServerErrorException(err?.message)
        }
    }
}
