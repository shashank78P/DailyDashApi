import { BadRequestException, Injectable, InternalServerErrorException, UsePipes, ValidationPipe } from '@nestjs/common';
import { chats, chatsDocument } from './schema/chat.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Users, UsersDocument } from 'src/users/schema/users.schema';
import { UsersService } from 'src/users/users.service';
import { addChatDto, findUserToInitialChatDto, getAllChatDto } from './types';
import { ChatInitiated, ChatInitiatedDocument } from './schema/ChatInitiated.schema';

@UsePipes(ValidationPipe)
@Injectable()
export class ChatsService {
    constructor(
        private readonly UsersService: UsersService,
        @InjectModel(chats.name) private chatsModel: Model<chatsDocument>,
        @InjectModel(ChatInitiated.name) private ChatInitiatedModel: Model<ChatInitiatedDocument>,
    ) { }

    async findUserToInitialChat(data: findUserToInitialChatDto, user: any) {
        try {
            const { email } = data;
            let result = await this.UsersService.getUserByEmail(email);
            if (result && result?._id.toString() == user?.userId.toString()) {
                throw new BadRequestException("You con't intiated a chat");
            }

            let isAlreadyInitialted = await this.ChatInitiatedModel.findOne({
                $or: [
                    {
                        between: user?.userId.toString() + result?._id.toString()
                    },
                    {
                        between: result?._id.toString() + user?.userId.toString()
                    },
                ]
            })

            if (isAlreadyInitialted) {
                throw new BadRequestException("You have already intiated a chat");
            }

            const initiated = await this.ChatInitiatedModel.insertMany([{
                from: user?.userId,
                to: result?._id,
                between: user?.userId.toString() + result?._id.toString(),
                message: "initiated chat",
                isInitiated: true
            }])
            console.log(initiated)
            const chat = await this.chatsModel.insertMany([{
                from: user?.userId,
                to: result?._id,
                message: "initiated chat",
                isInitiated: true,
                belongsTo: initiated?.[0]?._id
            }])

            await this.ChatInitiatedModel.updateOne({ _id: initiated?.[0]?._id }, { lastChatMessageId: chat?.[0]?._id })
            return result;
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async getAllInitiatedChatUserList(user: any) {
        try {
            const { userId } = user;
            console.log(userId)

            const result = await this.ChatInitiatedModel.aggregate(
                [
                    {
                        $match: {
                            $or: [
                                {
                                    from: userId
                                },
                                {
                                    to: userId
                                },
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "chats",
                            localField: "lastChatMessageId",
                            foreignField: "_id",
                            as: "result",
                        },
                    },
                    {
                        $unwind: "$result",
                    },
                    {
                        $addFields: {
                            oponent: {
                                $cond: {
                                    if: {
                                        $eq: [
                                            "$from",
                                            userId,
                                        ],
                                    },
                                    then: "$to",
                                    else: "$from",
                                },
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "oponent",
                            foreignField: "_id",
                            as: "user",
                        },
                    },
                    {
                        $unwind: "$user",
                    },
                    {
                        $project: {
                            oponentId: "$oponent",
                            messageSentBy: "$result.from",
                            messageSentTo: "$result.to",
                            oponentName: {
                                $concat: [
                                    "$user.firstName",
                                    " ",
                                    "$user.lastName",
                                ],
                            },
                            oponentPic: "$user.profilePic",
                            messageUpdatedAt: "$result.updatedAt",
                            message: "$result.message",
                            belongsTo: "$result.belongsTo",
                            _id: 0
                        },
                    },
                    {
                        $sort: {
                            messageUpdatedAt: -1
                        }
                    }
                ],
                { maxTimeMS: 60000, allowDiskUse: true }
            );

            return result;
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async getAllChat(user, queryParams: getAllChatDto) {
        try {
            const { skip, limit, belongsTo } = queryParams

            const totalChats = await this.chatsModel.aggregate(
                [
                    {
                        $match: {
                            belongsTo: new mongoose.Types.ObjectId(belongsTo)
                        },
                    },
                    {
                        $count: "count",
                    },
                ]
            )

            console.log(totalChats)
            const chats = await this.chatsModel.aggregate(
                [
                    {
                        $match: {
                            belongsTo: new mongoose.Types.ObjectId(belongsTo)
                        },
                    },
                    {
                        $sort:
                        {
                            createdAt: -1,
                        },
                    },
                    {
                        $skip: Number(skip),
                    },
                    {
                        $limit: Number(limit),
                    },
                    {
                        $addFields: {
                            date: {
                                $dayOfMonth: "$createdAt",
                            },
                            month: {
                                $month: "$createdAt",
                            },
                            year: {
                                $year: "$createdAt",
                            },
                            hours: {
                                $hour: "$createdAt",
                            },
                            minute: {
                                $minute: "$createdAt",
                            },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                date: "$date",
                                month: "$month",
                                year: "$year",
                            },
                            chats: {
                                $push: {
                                    _id: "$_id",
                                    from: "$from",
                                    to: "$to",
                                    isInitiated: "$isInitiated",
                                    belongsTo: "$belongsTo",
                                    createdAt: "$createdAt",
                                    updatedAt: "$updatedAt",
                                    message: "$message",
                                    minute: "$minute",
                                    hours: "$hours",
                                },
                            },
                        },
                    },
                    {
                        $sort: {
                            _id: -1
                        }
                    }
                ]
            )

            return {
                chats,
                total: totalChats?.[0]?.["count"]
            }
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async createMessage(payload: addChatDto) {
        const { message, to, userId, belongsTo } = payload;

        if (!(message && to && userId && belongsTo)) {
            throw new BadRequestException()
        }

        const result = await this.chatsModel.insertMany([
            {
                from: new mongoose.Types.ObjectId(userId),
                to: new mongoose.Types.ObjectId(to),
                message,
                belongsTo: new mongoose.Types.ObjectId(belongsTo)
            }
        ])
        const lastChatId = result?.[0]?._id

        await this.ChatInitiatedModel.updateOne(
            { _id: new mongoose.Types.ObjectId(belongsTo) },
            {
                $set: {
                    lastChatMessageId: lastChatId
                }
            }
        )
        return result
    }

    async setReadmessages(user, belongsTo) {
        try {
            await this.chatsModel.updateOne({
                belongsTo: new mongoose.Types.ObjectId(belongsTo),
                isMessageRead: false,
                to : user?.userId
            }, { $set: { isMessageRead: true } })
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }
}
