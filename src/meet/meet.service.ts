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
import MeetingDetailsQuery, { getParticipantsQuery, individualMeetingDetails } from './Query';

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
            ]);

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

    async updateMeeting(user: any, data: createMeetingDto, meetingId: string) {
        try {
            const { title, description, meetingDate, meetingLength, participantsEmail, whoCanJoin } = data;

            if (!allowedMeetingLength.includes(meetingLength) || !meetingId) {
                throw new BadRequestException("Requiredments not statisfied");
            }
            console.log(user?._id)

            const isHeCreated = await this.MeetModel.findOne({
                _id: new mongoose.Types.ObjectId(meetingId),
                createdBy: user?._id,
            })

            if (!isHeCreated) {
                throw new NotFoundException("You don't have an access to edit")
            }

            console.log(data);
            const meet = await this.MeetModel.updateOne(
                {
                    _id: new mongoose.Types.ObjectId(meetingId),
                },
                {
                    $set: {
                        title,
                        description,
                        meetingDate,
                        meetingLength,
                        whoCanJoin,
                        createdBy: user?._id
                    }
                }
            )

            console.log(meet);


            Promise.all(participantsEmail?.map(async (email: string) => {
                console.log(email)
                const participantsDetails = await this.UsersService?.getUserByEmail(email)
                console.log(participantsDetails)
                console.log(participantsDetails)
                if (!participantsDetails) {
                    const result = await this.UsersService.inviteUser(user, { email, invitedBy: user?._id, belongsTo: meetingId?.toString() })
                    console.log("invite")
                    console.log(result)
                } else {
                    const isHeExitsBefore = await this?.MeetingParticipants?.findOne({
                        belongsTo: new mongoose.Types.ObjectId(meetingId),
                        participantId: participantsDetails?._id
                    })
                    console.log(isHeExitsBefore)
                    if (!isHeExitsBefore) {
                        await this.MeetingParticipants.insertMany([
                            {
                                belongsTo : new mongoose.Types.ObjectId(meetingId),
                                participantId : participantsDetails?._id
                            }
                        ])
                        await this.sendMeetingInvitationMail(email, meetingId, participantsDetails, isHeCreated)
                    }
                }
            }))
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
                    ...getParticipantsQuery
                ]
            )
        } catch (err: any) {
            throw new InternalServerErrorException(err?.message)
        }
    }
    async getAllAddedParticipants(user: any, meetingId) {
        try {
            if (!meetingId) {
                throw new BadRequestException("Requirements are not statisfied");
            }
            console.log(user?._id)
            const addParticipants = await this.MeetingParticipants.aggregate(
                [
                    {
                        $match: {
                            belongsTo: new mongoose.Types.ObjectId(meetingId),
                            // participantId: { $ne: user?._id },
                        },
                    },
                    ...getParticipantsQuery
                ]
            )
            const invitedParticipants = await this.UsersService.getInvitedUserBasedOnBelongsTo(user, meetingId)

            return {
                addParticipants,
                invitedParticipants
            }

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

    async sendMeetingInvitationMail(email: string, meetingId: string, userDetails: any, meet: any) {
        let text = "";
        let subject = `Meeting invitation`
        this.MailService.sendMail(email, subject, text, "MeetingInvite", {
            link: `${process.env.FRONT_END}/meet/room?id=${meetingId}}`,
            createdBy: userDetails?.firstName + " " + userDetails?.lastName,
            title: meet?.title,
            description: meet?.description ?? " ",
            meetingDate: new Date(meet?.meetingDate),
            meetingLength: meet?.meetingLength,
            email
        });
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
                        await this.UsersService.inviteUser(user, { email, invitedBy: user?._id, belongsTo: meetingId })
                    }
                    await this.sendMeetingInvitationMail(email, meetingId, userDetails, meet)
                })
            )
        } catch (err: any) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async isUserInMeeting(userId, meetingId) {
        try {
            console.log(userId, meetingId)
            if (!(userId && meetingId)) {
                return false
            }

            const isInMeeting = await this.MeetingParticipants.findOne({
                belongsTo: new mongoose.Types.ObjectId(meetingId),
                participantId: new mongoose.Types.ObjectId(userId),
                isInMeeting: true
            })

            console.log(isInMeeting)

            return isInMeeting ? true : false;
        } catch (err) {
            console.log(err?.message)
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getAListOfAllUserInMetting(userId: string) {
        try {
            console.log(userId)
            if (!(userId)) {
                return []
            }

            const userIsInMeetingList = await this.MeetingParticipants.find({
                participantId: new mongoose.Types.ObjectId(userId),
                isInMeeting: true
            })

            return userIsInMeetingList;
        } catch (err) {
            console.log(err?.message)
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getScheduledMeetingListOfMine(user: any, limit: number, page: number, search: string, sortBy: string, sortOrder: number, status: string) {
        try {
            const query: any = [{ meetingId: { $ne: null } }]
            if (search) {
                const regx = new RegExp(search , "i");
                const d = {
                    $or: [
                        { title: { $regex: regx } },
                        { description: { $regex: regx } },
                        { meetingDate: { $regex: regx } },
                        { whoCanJoin: { $regex: regx } },
                        { createdAt: { $regex: regx } },
                        { createdBy: { $regex: regx } },
                        { createrName: { $regex: regx } },
                        { participantsCount: { $regex: regx } },
                        { meetingLength: { $regex: regx } },
                        { meetingLengthPararmeter: { $regex: regx } },
                        { meetingEndingAt: { $regex: regx } },
                        { meetingStatus: { $regex: regx } },
                        { meetingId: { $regex: regx } },
                    ],
                }
                console.log(d)
                query.push(d)
            }

            // const sortByQuery = []
            // if (sortBy) {
            //     let q = {}
            //     q[sortBy] = sortOrder
            //     sortByQuery.push({ $sort: q })
            // }

            if (status && status !== "All") {
                query?.push({ meetingStatus: status })
            }

            const finalQuery = [
                {
                    $match:
                        { participantId: user?._id }
                },
                ...MeetingDetailsQuery,
                {
                    $match:
                    {
                        $and: query
                    },
                },
            ]

            console.log(query)

            const count = await this.MeetingParticipants.aggregate(
                [
                    ...finalQuery,
                    {
                        $sort : {
                            meetingDate : -1
                        }
                    },
                    {
                        $count: "count"
                    }
                ],
                { allowDiskUse: true },
            )

            const totalCount = count?.[0]?.["count"] ?? 0
            const skipingNumber = Number(limit) * Number(page);

            const result = await this.MeetingParticipants.aggregate(
                [
                    ...finalQuery,
                    {
                        $sort : {
                            meetingDate : -1
                        }
                    },
                    {
                        $skip: Number(skipingNumber) ?? 0
                    },
                    {
                        $limit: Number(limit)
                    }
                ],
                { allowDiskUse: true },
            )

            const finalResult = { total: totalCount, }

            if (result?.[0]) {
                finalResult["data"] = result
            }
            if (page - 1 >= 0) {
                finalResult["prev"] = page - 1
            }
            if ((page + 1) * limit <= totalCount) {
                finalResult["next"] = page + 1
            }

            return finalResult

        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getIndividualMeetingDetails(user : any , meetingId : string){
        try{
            const result =  await this.MeetModel.aggregate([
                {
                    $match : {
                        _id : new mongoose.Types.ObjectId(meetingId)
                    }
                },
                ...individualMeetingDetails
            ])

            return result?.[0] ?? {}
        }catch(err){
            throw new InternalServerErrorException(err?.message)
        }
    }
}
