import { BadRequestException, Injectable, InternalServerErrorException, UsePipes, ValidationPipe } from '@nestjs/common';
import { chats, chatsDocument } from './schema/chat.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Users, UsersDocument } from 'src/users/schema/users.schema';
import { UsersService } from 'src/users/users.service';
import { addChatDto, createGroupDto, findUserToInitialChatDto, getAllChatDto } from './types';
import { ChatInitiated, ChatInitiatedDocument } from './schema/ChatInitiated.schema';
import { GroupMember, GroupMemberDocument } from './schema/GroupMember.scheme';

@UsePipes(ValidationPipe)
@Injectable()
export class ChatsService {
    constructor(
        private readonly UsersService: UsersService,
        @InjectModel(chats.name) private chatsModel: Model<chatsDocument>,
        @InjectModel(ChatInitiated.name) private ChatInitiatedModel: Model<ChatInitiatedDocument>,
        @InjectModel(GroupMember.name) private GroupMemberModel: Model<GroupMemberDocument>,
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
                            opponent: {
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
                            localField: "opponent",
                            foreignField: "_id",
                            as: "user",
                        },
                    },
                    {
                        $unwind: "$user",
                    },
                    {
                        $project: {
                            opponentId: "$opponent",
                            messageSentBy: "$result.from",
                            messageSentTo: "$result.to",
                            opponentName: {
                                $concat: [
                                    "$user.firstName",
                                    " ",
                                    "$user.lastName",
                                ],
                            },
                            opponentPic: "$user.profilePic",
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
            let chats = await this.chatsModel.aggregate(
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
            const currentDate = new Date()
            const data = { date: currentDate?.getDate(), month: currentDate?.getMonth(), year: currentDate?.getFullYear() }
            const last = chats?.[0]?._id
            if (skip == '0' && last?.date != data?.date && last?.month != data?.month && last?.year != data?.year) {
                chats = [{ _id: data, chats: [] }, ...chats]
            }
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

    async setReadmessages(user, belongsTo, type : string) {
        try {
            if (type == "INDIVIDUAL") {
                await this.chatsModel.updateMany({
                    belongsTo: new mongoose.Types.ObjectId(belongsTo),
                    isMessageRead: false,
                    to: user?.userId
                }, { $set: { isMessageRead: true } })
            }
            else if (type == "GROUP") {
                await this.chatsModel.updateMany({
                    belongsTo: new mongoose.Types.ObjectId(belongsTo),
                    "messsageReadList.user" : {$ne : user?.userId}
                }, { $push: { messsageReadList: { user: user?.userId } } })
            }
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getUnReadMessagesCount(user) {
        try {
            const { userId } = user;

            const result = await this.chatsModel.aggregate([
                {
                    $match: {
                        $or: [
                            // {
                            //     from: userId
                            // },
                            {
                                to: userId
                            },
                        ],
                        isMessageRead: false,
                    },
                },
                {
                    $group: {
                        _id: "$chatType",
                        count: {
                            $sum: 1,
                        },
                    },
                },
            ])

            return result
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getUserOfMyContact(user: any, limit: number, skip: number, search?: string) {
        try {
            if (limit == undefined || skip == undefined) {
                throw new BadRequestException("Requriments not satisfied")
            }
            const query = [
                {
                    $match: {
                        $or: [
                            {
                                from: new mongoose.Types.ObjectId(user?.userId)
                            },
                            {
                                to: new mongoose.Types.ObjectId(user?.userId)
                            },
                        ],
                    },
                },
                {
                    $addFields: {
                        opponent: {
                            $cond: {
                                if: {
                                    $eq: [
                                        "$from",
                                        new mongoose.Types.ObjectId(user?.userId)
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
                        localField: "opponent",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $unwind: "$user",
                },
                {
                    $project: {
                        _id: 0,
                        userId: "$user._id",
                        name: {
                            $concat: [
                                "$user.firstName",
                                " ",
                                "$user.lastName",
                            ],
                        },
                        profilePic: "$user.profilePic",
                    },
                },
            ]
            let searchQuery = []

            if (search) {
                searchQuery = [
                    {
                        $match: {
                            name: { $regex: `^${search}`, $options: 'i' }
                        }
                    },
                ]
            }
            const total = await this.ChatInitiatedModel.aggregate([
                ...query,
                ...searchQuery,
                {
                    $count: "count"
                }
            ])
            const result = await this.ChatInitiatedModel.aggregate(
                [
                    ...query,
                    ...searchQuery,
                    {
                        $sort: {
                            name: 1,
                        },
                    },
                    {
                        $skip: Number(skip)
                    },
                    {
                        $limit: Number(limit)
                    }
                ]
            )

            return {
                user: result,
                total: total?.[0]?.count
            }

        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async createGroup(user: any, groupInfo: createGroupDto) {
        try {
            let { groupName, users } = groupInfo
            const group = await this.ChatInitiatedModel.insertMany([
                {
                    from: user?.userId,
                    type: "GROUP",
                    groupName,
                }
            ])
            const groupId = group?.[0]?._id

            if (Array.isArray(users)) {
                users = [...users, user?.userId]
            } else {
                users = [user?.userId]
            }
            await this.GroupMemberModel.insertMany(
                users?.map(ele => {
                    return {
                        groupId,
                        memeberId: new mongoose.Types.ObjectId(ele),
                        role: (ele == user?.userId?.toString()) ? "ADMIN" : "MEMBER"
                    }
                })
            )

            const firstChat = await this.chatsModel.insertMany([
                {
                    from: user?.userId,
                    message: "initiated",
                    isInitiated: true,
                    belongsTo: groupId,
                    chatType: "GROUP"
                }
            ])

            await this.ChatInitiatedModel.updateOne(
                {
                    _id: groupId
                }, {
                $set: {
                    lastChatMessageId: firstChat?.[0]?._id
                }
            })
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }


    async getAllInitiatedChatGroupList(user: any) {
        try {
            const { userId } = user;
            console.log(userId)

            const result = await this.GroupMemberModel.aggregate(
                [
                    {
                        $match: {
                            memeberId: user?.userId
                        },
                    },
                    {
                        $lookup: {
                            from: "chatinitiateds",
                            localField: "groupId",
                            foreignField: "_id",
                            as: "group",
                        },
                    },
                    {
                        $unwind: "$group",
                    },
                    {
                        $lookup: {
                            from: "chats",
                            localField: "group.lastChatMessageId",
                            foreignField: "_id",
                            as: "chat",
                        },
                    },
                    {
                        $unwind: "$chat",
                    },
                    {
                        $replaceRoot:
                        {
                            newRoot: {
                                $mergeObjects: [
                                    "$$ROOT",
                                    "$group",
                                    "$chat",
                                ],
                            },
                        },
                    },
                    {
                        $project: {
                            from: 1,
                            _id: 0,
                            message: -1,
                            isInitiated: 1,
                            chatType: 1,
                            createdAt: "$chat.createdAt",
                            groupId: 1,
                            memeberId: 1,
                            groupName: 1,
                            isMessageRead: 1,
                            belongsTo: 1,
                            groupProfilePic: 1,
                        },
                    },
                ],
                { maxTimeMS: 60000, allowDiskUse: true }
            );

            return result;
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async createGroupMessage(payload: addChatDto) {
        const { message, userId, belongsTo } = payload;

        if (!(message && userId && belongsTo)) {
            throw new BadRequestException()
        }

        const result = await this.chatsModel.insertMany([
            {
                from: new mongoose.Types.ObjectId(userId),
                message,
                chatType: "GROUP",
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
}
