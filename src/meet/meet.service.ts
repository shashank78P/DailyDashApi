import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Meets, MeetDocument } from './schema/meet.schema';
import mongoose, { Model } from 'mongoose';
import { MeetingParticipants, MeetingParticipantsDocument } from './schema/meetingParticipants.schema';
import { allowedMeetingLength, createMeetingDto, invitePeopleForMeetingDto } from './type';
import { Users, UsersDocument } from 'src/users/schema/users.schema';
import { ChatsService } from 'src/chats/chats.service';
import { MailServiceService } from 'src/mail-service/mail-service.service';

@UsePipes(ValidationPipe)
@Injectable()
export class MeetService {
    constructor(
        private jwtService: JwtService,
        private readonly UsersService: UsersService,
        private readonly chatService: ChatsService,
        private readonly MailService: MailServiceService,
        @InjectModel(Meets.name) private MeetModel: Model<MeetDocument>,
        // @InjectModel(Users.name) private UsersModel: Model<UsersDocument>,
        @InjectModel(MeetingParticipants.name) private MeetingParticipants: Model<MeetingParticipantsDocument>,
    ) { }


    async createMeeting(user: any, data: createMeetingDto) {
        try {
            const { title, description, meetingDate, meetingLength, participantsEmail, whoCanJoin } = data;

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

            if (!Array.isArray(meet)) {
                throw new BadRequestException("Something went wrong, please try after some minutes!!")
            }

            const meetingId = meet?.[0]?._id

            await this.MeetingParticipants.insertMany([
                {
                    participantId: user?._id,
                    belongsTo: meetingId
                }
            ])

            if (whoCanJoin !== "MANUALLY_ADDED") {
                return meet;
            }

            await this.invitePeopleForMeeting(user, participantsEmail, meetingId)
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
            const { whoCanJoin, createdBy } = await this.MeetModel.findOne({ _id: new mongoose.Types.ObjectId(meetingId) })

            if (whoCanJoin == "ONLY_OF_MY_CONTACT") {
                const isAllowed = await this.chatService.isUserIsMyContact(createdBy?.toString(), user?._id?.toString())
                if (!isAllowed) {
                    throw new NotFoundException("You don't have a access for his meeting")
                }
            }
            else if (whoCanJoin == "MANUALLY_ADDED") {
                const result = await this.MeetingParticipants.findOne({ participantId: user?._id, belongsTo: new mongoose.Types.ObjectId(meetingId) })
                if (!result) {
                    throw new NotFoundException("You don't have a access for his meeting")
                }
            }

            return await this.MeetModel.aggregate(
                [
                    {
                        $match: {
                            _id: new mongoose.Types.ObjectId(meetingId)
                        }
                    },
                    {
                        $addFields: {
                            meetingLength: {
                                $split: ["$meetingLength", " "],
                            },
                        },
                    },
                    {
                        $addFields: {
                            meetingLength: {
                                $convert: {
                                    input: {
                                        $first: "$meetingLength",
                                    },
                                    to: "int",
                                },
                            },
                            meetingLengthPararmeter: {
                                $last: "$meetingLength",
                            },
                        },
                    },
                    {
                        $addFields: {
                            meetingEndingAt: {
                                $dateAdd: {
                                    startDate: "$meetingDate",
                                    unit: {
                                        $switch: {
                                            branches: [
                                                {
                                                    case: {
                                                        $eq: [
                                                            "$meetingLengthPararmeter",
                                                            "min",
                                                        ],
                                                    },
                                                    then: "minute",
                                                },
                                                {
                                                    case: {
                                                        $eq: [
                                                            "$meetingLengthPararmeter",
                                                            "day",
                                                        ],
                                                    },
                                                    then: "day",
                                                },
                                                {
                                                    case: {
                                                        $eq: [
                                                            "$meetingLengthPararmeter",
                                                            "hr",
                                                        ],
                                                    },
                                                    then: "hour",
                                                },
                                                {
                                                    case: {
                                                        $eq: [
                                                            "$meetingLengthPararmeter",
                                                            "sec",
                                                        ],
                                                    },
                                                    then: "second",
                                                },
                                                {
                                                    case: {
                                                        $eq: [
                                                            "$meetingLengthPararmeter",
                                                            "mon",
                                                        ],
                                                    },
                                                    then: "month",
                                                },
                                            ],
                                            default: "hour",
                                        },
                                    },
                                    amount: "$meetingLength",
                                },
                            },
                        },
                    },
                    {
                        $addFields: {
                            meetingStatus: {
                                $switch: {
                                    branches: [
                                        {
                                            case: {
                                                $gt: [
                                                    new Date(),
                                                    "$meetingEndingAt",
                                                ],
                                            },
                                            then: "Completed",
                                        },
                                        {
                                            case: {
                                                $lt: [new Date(), "$meetingDate"],
                                            },
                                            then: "Not Started",
                                        },
                                        {
                                            case: {
                                                $and: [
                                                    {
                                                        $lte: [
                                                            new Date(),
                                                            "$meetingEndingAt",
                                                        ],
                                                    },
                                                    {
                                                        $gte: [
                                                            new Date(),
                                                            "$meetingDate",
                                                        ],
                                                    },
                                                ],
                                            },
                                            then: "On Going",
                                        },
                                    ],
                                    default: "Error",
                                },
                            },
                        },
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
                            meetingLengthPararmeter: 1,
                            meetingEndingAt: 1,
                            meetingStatus: 1,
                        },
                    },
                ]
            )
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

            if (meetingDetails?.whoCanJoin == "MANUALLY_ADDED") {
                const isExist = await this.MeetingParticipants.findOne({ belongsTo: new mongoose.Types.ObjectId(meetingId), participantId: new mongoose.Types.ObjectId(user?.userId), })
                if (!isExist) {
                    throw new NotFoundException("You are not allowed for meeting!!!")
                }
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
                return await this.MeetingParticipants.findOne({ belongsTo: new mongoose.Types.ObjectId(meetingId), participantId: new mongoose.Types.ObjectId(user?.userId), })
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

    async getAllActiveOrNonActiveParticipants(user: any, meetingId, isActive: string) {
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
                    belongsTo: new mongoose.Types.ObjectId(meetingId),
                    participantId: new mongoose.Types.ObjectId(userId),
                },
                {
                    $set: {
                        isInMeeting: false,
                        updatedAt: new Date()
                    }
                }
            )
        } catch (err) {
            new InternalServerErrorException(err?.message)
        }
    }

    async invitePeopleForMeeting(user, participantsEmail, meetingId) {
        try {

            const meet = await this.MeetModel.findOne({ _id: new mongoose.Types.ObjectId(meetingId), createdBy: user?._id })

            if (!meet) {
                throw new BadRequestException("You dont't have a acces to invite")
            }
            const userDetails = await this.UsersService.getUserById(user?._id?.toString())
            await Promise.all(
                participantsEmail?.map(async (email: string, i: number) => {
                    const tempUser = await this.UsersService.getUserByEmail(email)
                    if (tempUser) {
                        await this.MeetingParticipants.insertMany([
                            {
                                participantId: tempUser?._id,
                                belongsTo: meetingId
                            }
                        ])
                    }
                    else {
                        await this.UsersService.inviteUser(user, { email, invitedBy: user?._id })
                    }
                    let text = "";
                    let subject = `Meeting invitation`
                    this.MailService.sendMail(email, subject, text, "MeetingInvite", {
                        link: `${"http://localhost:3000/meet/room?id=" + meetingId}`,
                        createdBy: userDetails?.firstName + " " + userDetails?.lastName,
                        title: meet?.title,
                        description: meet?.description ?? " ",
                        meetingDate: new Date(meet?.meetingDate),
                        meetingLength: meet?.meetingLength,
                        email
                    });
                })
            )
        } catch (err: any) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async isUserInMeeting(userId , meetingId){
        try {
            console.log(userId , meetingId)
            if(!(userId && meetingId) ){
                return false
            }

            const isInMeeting = await this.MeetingParticipants.findOne({ 
                belongsTo : new mongoose.Types.ObjectId(meetingId),
                participantId : new mongoose.Types.ObjectId(userId),
                isInMeeting : true
             })

             console.log(isInMeeting)
             
             return isInMeeting ? true : false;
        } catch (err) {
            console.log(err?.message)
            throw new InternalServerErrorException(err?.message)
        }
    }
    
    async getAListOfAllUserInMetting(userId : string){
        try {
            console.log(userId)
            if(!(userId) ){
                return []
            }

            const userIsInMeetingList = await this.MeetingParticipants.find({
                participantId : new mongoose.Types.ObjectId(userId),
                isInMeeting : true
             })

             return userIsInMeetingList;
        } catch (err) {
            console.log(err?.message)
            throw new InternalServerErrorException(err?.message)
        }
    }
}
