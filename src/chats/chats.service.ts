import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UsePipes, ValidationPipe } from '@nestjs/common';
import { chats, chatsDocument } from './schema/chat.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Users, UsersDocument } from 'src/users/schema/users.schema';
import { UsersService } from 'src/users/users.service';
import { AddUserToGroupDto, FileBodyBto, addChatDto, createGroupDto, editGroupNameDescDto, findUserToInitialChatDto, getAllChatDto } from './types';
import { ChatInitiated, ChatInitiatedDocument } from './schema/ChatInitiated.schema';
import { GroupMember, GroupMemberDocument } from './schema/GroupMember.scheme';
import { promises } from 'dns';
import { CurrentUser } from 'src/log-in-devices/currentUser.decorator';
import { JwtService } from '@nestjs/jwt';

@UsePipes(ValidationPipe)
@Injectable()
export class ChatsService {
    constructor(
        private readonly UsersService: UsersService,
        private jwtService: JwtService,
        @InjectModel(chats.name) private chatsModel: Model<chatsDocument>,
        @InjectModel(ChatInitiated.name) private ChatInitiatedModel: Model<ChatInitiatedDocument>,
        @InjectModel(GroupMember.name) private GroupMemberModel: Model<GroupMemberDocument>,
    ) { }

    async findUserToInitialChat(data: findUserToInitialChatDto, user: any) {
        try {
            const { email } = data;
            let result = await this.UsersService.getUserByEmail(email);
            if (result && result?._id.toString() == user?._id.toString()) {
                throw new BadRequestException("You con't intiated a chat");
            }

            let isAlreadyInitialted = await this.ChatInitiatedModel.findOne({
                $or: [
                    {
                        between: user?._id.toString() + result?._id.toString()
                    },
                    {
                        between: result?._id.toString() + user?._id.toString()
                    },
                ]
            })

            if (isAlreadyInitialted) {
                throw new BadRequestException("You have already intiated a chat");
            }

            const initiated = await this.ChatInitiatedModel.insertMany([{
                from: user?._id,
                to: result?._id,
                between: user?._id.toString() + result?._id.toString(),
                event: {
                    message: "initiated chat",
                    type: "CHAT_INITIATED"
                },
            }])
            const chat = await this.chatsModel.insertMany([{
                from: user?._id,
                to: result?._id,
                event: {
                    message: "initiated chat",
                    type: "CHAT_INITIATED"
                },
                belongsTo: initiated?.[0]?._id
            }])

            await this.ChatInitiatedModel.updateOne({ _id: initiated?.[0]?._id }, { lastChatMessageId: chat?.[0]?._id })
            return "Initiatyed sucessfull";
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async getAllInitiatedChatUserList(user: any) {
        try {
            const { _id: userId } = user;

            let result: any = await this.ChatInitiatedModel.aggregate(
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
                            messageCreatedAt: "$result.createdAt",
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

            result = await Promise.all(result.map(async (ele, i) => {
                let count = await this.chatsModel.aggregate(
                    [
                        {
                            $match: {
                                belongsTo: ele?.belongsTo,
                                to: user?._id,
                                chatType: "INDIVIDUAL",
                                isMessageRead: false,
                            },
                        },
                        {
                            $group: {
                                _id: {
                                    $ne: ["$_id", null],
                                },
                                count: {
                                    $sum: 1,
                                },
                            },
                        },
                    ]
                )
                ele["unReadMessageCount"] = (count?.[0]?.count == undefined) ? 0 : count?.[0]?.count
                return ele
            }))
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
                        $lookup: {
                            from: "users",
                            localField: "from",
                            foreignField: "_id",
                            as: "sender",
                        },
                    },
                    {
                        $unwind: "$sender",
                    },
                    {
                        $lookup: {
                            from: "filesystems",
                            localField: "fileId",
                            foreignField: "_id",
                            as: "file"
                        }
                    },
                    {
                        $set: {
                            sender: {
                                $concat: [{ "$ifNull": ["$sender.firstName", ""] }, { "$ifNull": ["$sender.lastName", ""] }]
                            },
                        },
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
                                    messageType: "$messageType",
                                    fileId: "$fileId",
                                    file: "$file",
                                    event: "$event",
                                    minute: "$minute",
                                    hours: "$hours",
                                    sender: "$sender",
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
            const currentDate = new Date();
            const data = { date: currentDate?.getDate(), month: currentDate?.getMonth() + 1, year: currentDate?.getFullYear() }
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
        const { message, to, userId, belongsTo, fileId, messageType, event } = payload;

        if (!(to && userId && belongsTo && messageType)) {
            throw new BadRequestException()
        }

        const result = await this.chatsModel.insertMany([
            {
                from: new mongoose.Types.ObjectId(userId),
                to: new mongoose.Types.ObjectId(to),
                message,
                messageType,
                fileId: new mongoose.Types.ObjectId(fileId),
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

    async setReadmessages(user, belongsTo, type: string) {
        try {
            if (type == "INDIVIDUAL") {
                await this.chatsModel.updateMany({
                    belongsTo: new mongoose.Types.ObjectId(belongsTo),
                    isMessageRead: false,
                    to: user?._id
                }, { $set: { isMessageRead: true } })
            }
            else if (type == "GROUP") {
                await this.chatsModel.updateMany({
                    belongsTo: new mongoose.Types.ObjectId(belongsTo),
                    "messsageReadList.user": { $ne: user?._id }
                }, { $push: { messsageReadList: { user: user?._id } } })
            }
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getUnReadMessagesCount(user) {
        try {
            const { userId } = user;

            const chatResult = await this.chatsModel.aggregate([
                {
                    $match: {
                        to: userId,
                        chatType: "INDIVIDUAL",
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

            const getAllGroupOfAUSer = await this.GroupMemberModel.aggregate(
                [
                    {
                        $match: {
                            memeberId: user?._id
                        },
                    },
                    {
                        $project: {
                            groupId: 1,
                        },
                    },
                    {
                        $group: {
                            _id: { $ne: ["$_id", null] },
                            groupId: { $push: "$groupId" }
                        }
                    }
                ]
            )
            let groupsUnreadMsgCount = []
            if (Array.isArray(getAllGroupOfAUSer?.[0]?.groupId)) {

                groupsUnreadMsgCount = await this.chatsModel.aggregate(
                    [
                        {
                            $match: {
                                belongsTo: {
                                    $in: getAllGroupOfAUSer?.[0]?.groupId
                                },
                                "messsageReadList.user": {
                                    $ne: user?._id,
                                },
                            },
                        },
                        {
                            $group: {
                                _id: { $ne: ["$_id", null] },
                                count: {
                                    $sum: 1,
                                },
                            },
                        },
                    ]
                )
            }


            return {
                chat: chatResult?.[0]?.count,
                group: groupsUnreadMsgCount?.[0]?.count,
            }
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
                                from: new mongoose.Types.ObjectId(user?._id)
                            },
                            {
                                to: new mongoose.Types.ObjectId(user?._id)
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
                                        new mongoose.Types.ObjectId(user?._id)
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

    async isUserIsMyContact(userId : string , opponentId : string) {
        try {
            if(!(userId && opponentId)){
                throw new BadRequestException("Requirements are not satisfied")
            }

            const isInContact = await this?.ChatInitiatedModel.findOne({
                $or : [ 
                    {
                        from : new mongoose.Types.ObjectId(userId),
                        to : new mongoose.Types.ObjectId(opponentId),
                    },
                    {
                        from : new mongoose.Types.ObjectId(opponentId),
                        to : new mongoose.Types.ObjectId(userId),
                    },
                 ]
            })

            return isInContact ? true : false;
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getUserOfMyContactExceptParticularGroup(user: any, limit: number, skip: number, belongsTo: string, search?: string) {
        try {
            if ((limit == undefined || skip == undefined) && belongsTo) {
                throw new BadRequestException("Requriments not satisfied")
            }
            const membersPresentInGroup = await this.GroupMemberModel.aggregate(
                [
                    {
                        $match: {
                            groupId: new mongoose.Types.ObjectId(belongsTo),
                        },
                    },
                    {
                        $group: {
                            _id: {
                                $ne: ["$_id", null],
                            },
                            members: {
                                $push: "$memeberId",
                            },
                        },
                    },
                    {
                        $project: {
                            members: 1,
                            _id: 0,
                        },
                    },
                ]
            )
            console.log(membersPresentInGroup)
            console.log(membersPresentInGroup?.[0]?.members)
            const query = [
                {
                    $match: {
                        $or: [
                            {
                                from: new mongoose.Types.ObjectId(user?._id)
                            },
                            {
                                to: new mongoose.Types.ObjectId(user?._id)
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
                                        new mongoose.Types.ObjectId(user?._id)
                                    ],
                                },
                                then: "$to",
                                else: "$from",
                            },
                        },
                    },
                },
                {
                    $match: {
                        opponent: {
                            $not: {
                                $in: (Array.isArray(membersPresentInGroup?.[0]?.members)) ? membersPresentInGroup?.[0]?.members : []
                            }
                        }
                    }
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

    async AddUserToGroup(user: any, body: AddUserToGroupDto) {
        try {
            const { belongsTo, users } = body;
            const hasPermission = await this.GroupMemberModel.findOne({ groupId: new mongoose.Types.ObjectId(belongsTo), memeberId: user?._id, role: { $ne: "MEMEBER" } })

            if (!hasPermission) {
                throw new BadRequestException("Don't have valid permission")
            }
            Promise.all(
                users.map(async (usertToAdd, i) => {
                    await this.GroupMemberModel.insertMany([
                        {
                            groupId: new mongoose.Types.ObjectId(belongsTo),
                            memeberId: new mongoose.Types.ObjectId(usertToAdd),
                            role: "MEMBER",
                            joined: "ADDED",
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            joinedBy: user?._id
                        }
                    ])
                })
            )
            return { name: (user?.firstName || " ") + " " + (user?.lastName || ""), }
        } catch (err) {
            throw new InternalServerErrorException(err?.meessage)
        }
    }

    async GenerateInviteLink(user, belongsTO, lifeSpan) {
        try {
            if (!(belongsTO && lifeSpan)) {
                throw new BadRequestException("Requirements not matched")
            }
            const symbol = lifeSpan[lifeSpan.length - 1];

            if (!["s", "m", "h", "d", "w", "M"].includes(symbol)) {
                throw new BadRequestException("Invalid lifspan")
            }
            const isAdmin = await this.GroupMemberModel.find({ memeberId: user?._id, groupId: new mongoose.Types.ObjectId(belongsTO), role: "ADMIN" })

            if (!isAdmin) {
                throw new BadRequestException("You Don't have a permission to generate")
            }
            const token = await this.jwtService.signAsync(
                { createdBy: user?._id, belongsTo: belongsTO },
                {
                    expiresIn: lifeSpan,
                }
            )
            return { link: `${process.env.FRONT_END}chat/joinGroup?token=${token}` }

        } catch (err) {

        }
    }

    async createGroup(user: any, groupInfo: createGroupDto) {
        try {
            let { groupName, users } = groupInfo
            const group = await this.ChatInitiatedModel.insertMany([
                {
                    from: user?._id,
                    type: "GROUP",
                    groupName,
                }
            ])
            const groupId = group?.[0]?._id

            if (Array.isArray(users)) {
                users = [...users, user?._id]
            } else {
                users = [user?._id]
            }
            await this.GroupMemberModel.insertMany(
                users?.map(ele => {
                    return {
                        groupId,
                        memeberId: new mongoose.Types.ObjectId(ele),
                        role: (ele == user?._id?.toString()) ? "ADMIN" : "MEMBER"
                    }
                })
            )

            const firstChat = await this.chatsModel.insertMany([
                {
                    from: user?._id,
                    event: {
                        message: "initiated chat",
                        type: "CHAT_INITIATED"
                    },
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

            let result = await this.GroupMemberModel.aggregate(
                [
                    {
                        $match: {
                            memeberId: new mongoose.Types.ObjectId(user?._id)
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
                        $lookup: {
                            from: "filesystems",
                            localField: "chat.fileId",
                            foreignField: "_id",
                            as: "file",
                        },
                    },
                    {
                        $replaceRoot: {
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
                        $set: {
                            file: {
                                $first: "$file",
                            },
                        },
                    },
                    {
                        $project: {
                            from: 1,
                            _id: 0,
                            message: 1,
                            eventMessage: "$event.message",
                            fileType: "$file.mimeType",
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
                    {
                        $sort: {
                            createdAt: -1,
                        },
                    },
                ],
                { maxTimeMS: 60000, allowDiskUse: true }
            );

            result = await Promise.all(result.map(async (ele, i) => {
                let count = await this.chatsModel.aggregate([
                    {
                        $match: {
                            belongsTo: ele?.belongsTo,
                            "messsageReadList.user": {
                                $ne: user?._id,
                            },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                $ne: ["$_id", null],
                            },
                            count: {
                                $sum: 1,
                            },
                        },
                    },
                ])
                ele["unReadMessageCount"] = (count?.[0]?.count) ? count?.[0]?.count : 0
                return ele;
            }))
            return result;
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async createGroupMessage(payload: addChatDto, userId) {
        const { message, belongsTo, event, fileId, messageType } = payload;

        if (!(belongsTo)) {
            throw new BadRequestException()
        }

        console.log("user")


        if (event?.type == "JOIN" && (!event?.message)) {
            const user = await this.UsersService.getUserById(userId);
            event.message += ` ${user?.firstName}  ${user?.lastName}`
        }

        const result = await this.chatsModel.insertMany([
            {
                from: new mongoose.Types.ObjectId(userId),
                message,
                messageType,
                event,
                fileId: new mongoose.Types.ObjectId(fileId),
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

    async editGroupNameDesc(user: any, data: editGroupNameDescDto) {
        try {
            const { belongsTo } = data;
            delete data["belongsTo"]
            const isAdmin = await this.GroupMemberModel.findOne({
                groupId: new mongoose.Types.ObjectId(belongsTo),
                memeberId: user?._id,
                role: "ADMIN"
            })

            if (isAdmin) {
                await this.ChatInitiatedModel.updateOne({ _id: new mongoose.Types.ObjectId(belongsTo) }, { $set: { ...data } })
            } else {
                throw new BadRequestException("You dont have an accesss to change")
            }
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getProfileDetails(user, belongsTo, type) {
        try {
            if (!(belongsTo && type)) {
                throw new BadRequestException("Requirements are not satisfied");
            }
            if (type == "GROUP") {
                const profileData = await this.GroupMemberModel.aggregate([
                    {
                        $match: {
                            groupId: new mongoose.Types.ObjectId(
                                belongsTo
                            ),
                            memeberId: user?._id
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
                            from: "users",
                            localField: "group.from",
                            foreignField: "_id",
                            as: "admin",
                        },
                    },
                    {
                        $unwind: "$admin",
                    },
                    {
                        $project: {
                            groupId: 1,
                            role: 1,
                            groupName: "$group.groupName",
                            description: "$group.description",
                            profilePic: "$group.groupProfilePic",
                            type: "$group.type",
                            createdBy: {
                                $concat: [
                                    "$admin.firstName",
                                    " ",
                                    "$admin.lastName",
                                ],
                            },
                            createdAt: "$group.createdAt",
                            adminId: "$group.from",
                        },
                    },
                ])
                return profileData
            } else {
                return await this.ChatInitiatedModel.aggregate(
                    [
                        {
                            $match: {
                                _id: new mongoose.Types.ObjectId(belongsTo),
                            },
                        },
                        {
                            $addFields: {
                                opponent: {
                                    $cond: {
                                        if: {
                                            $eq: [
                                                "$from",
                                                user?._id,
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
                                profilePic: "$user.profilePic",
                                name: {
                                    $concat: [
                                        "$user.firstName",
                                        " ",
                                        "$user.lastName",
                                    ],
                                },
                                email: "$user.email",
                            },
                        },
                    ]
                )
            }
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async changeGroupProfilePic(user, belongsTo, body: FileBodyBto) {
        try {
            if (!belongsTo) {
                throw new BadRequestException("Requiredments are not satisfied")
            }
            const { FileId, url } = body
            return await this.ChatInitiatedModel.updateOne({
                _id: new mongoose.Types.ObjectId(belongsTo)
            }, {
                $set: {
                    groupProfilePic: url,
                    FileId
                }
            })
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async GroupDetailsFromInviteLink(user, token) {
        try {
            let { createdBy, belongsTo }: any = await this.jwtService.verifyAsync(token);
            const groupDetails = await this.ChatInitiatedModel.findOne({
                _id: new mongoose.Types.ObjectId(belongsTo)
            },
                {
                    groupProfilePic: 1,
                    groupName: 1,
                    description: 1
                })
            if (!groupDetails) {
                throw new NotFoundException();
            }
            return groupDetails
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async JoinGroupFromInviteLink(user, token) {
        try {
            let { createdBy, belongsTo }: any = await this.jwtService.verifyAsync(token);
            const isUserAlreadyExist = await this.GroupMemberModel.findOne({
                groupId: new mongoose.Types.ObjectId(belongsTo),
                memeberId: user?._id,
            })

            if (isUserAlreadyExist) {
                throw new BadRequestException("You are already a memeber of this group")
            }

            console.log("user?._id")
            console.log(user?._id)

            let result: any = await this.GroupMemberModel.insertMany([
                {
                    groupId: new mongoose.Types.ObjectId(belongsTo),
                    memeberId: user?._id,
                    role: "MEMBER",
                    joined: "LINK",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    joinedBy: new mongoose.Types.ObjectId(createdBy)
                }
            ])
            result = result?.[0]
            return { ...result, userName: `${user?.firstName} ${user?.lastName ? user?.lastName : ""}` }
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getAllMemebersOfGroup(user, skip: number, limit: number, belongsTo: string) {
        try {
            const isUserPresent = await this.GroupMemberModel.findOne({
                memeberId: user?._id,
                groupId: new mongoose.Types.ObjectId(belongsTo)
            })
            if (!isUserPresent) {
                throw new BadRequestException("You Don't have access to perform action")
            }
            const query = [
                {
                    $match:
                    {
                        groupId: new mongoose.Types.ObjectId(belongsTo)
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "memeberId",
                        foreignField: "_id",
                        as: "users",
                    },
                },
                {
                    $unwind: "$users",
                },
                {
                    $project: {
                        groupId: 1,
                        memeberId: 1,
                        role: 1,
                        createdAt: 1,
                        name: {
                            $concat: [
                                {
                                    $ifNull: ["$users.firstName", ""],
                                },
                                " ",
                                {
                                    $ifNull: ["$users.lastName", ""],
                                },
                            ],
                        },
                        profilePic: "$users.profilePic",
                        email: "$users.email",
                    },
                },
            ]
            const totalCount = await this.GroupMemberModel.aggregate([
                ...query,
                {
                    $count: "count"
                }
            ])
            const data = await this.GroupMemberModel.aggregate([
                ...query,
                {
                    $sort: { name: 1 }
                },
                {
                    $skip: Number(skip)
                },
                {
                    $limit: Number(limit)
                },
            ])
            return { total: totalCount?.[0]?.count, data }
        } catch (err) {
            console.log(err)
            throw new InternalServerErrorException(err?.messsage)
        }
    }

    async RemoveUsersFromFroup(user: any, removableUSerID: string, belongsTo: string, opponentName: string) {
        try {
            if (!(removableUSerID && belongsTo)) {
                throw new BadRequestException("Requirements not satisfied")
            }
            const isUserAsAPermission = await this.GroupMemberModel.findOne({
                groupId: new mongoose.Types.ObjectId(belongsTo),
                memeberId: user?._id,
                role: "ADMIN"
            })

            if (!isUserAsAPermission) {
                throw new BadRequestException("You don't have a access to perform this action")
            }

            await this.GroupMemberModel.deleteOne({
                memeberId: new mongoose.Types.ObjectId(removableUSerID),
                groupId: new mongoose.Types.ObjectId(belongsTo)
            })
            return {
                name: (user?.firstName || " ") + " " + (user?.lastName || ""),
                opponentName
            }
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async leaveGroup(user: any, belongsTo: string) {
        try {
            if(!belongsTo){
                throw new BadRequestException("Requiredments not satisfied")
            }

            const numberOfAdmin = await this.GroupMemberModel.find({
                memeberId: {$ne : user?._id},
                role : "ADMIN",
                groupId: new mongoose.Types.ObjectId(belongsTo)
            })

            if(numberOfAdmin.length < 1){
                throw new BadRequestException("Please make another member as ADMIN before leaving")
            }
            await this.GroupMemberModel.deleteOne({
                memeberId: user?._id,
                groupId: new mongoose.Types.ObjectId(belongsTo)
            })
            return { name: (user?.firstName || " ") + " " + (user?.lastName || "") }
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async ChangeRoleOfUser(user: any, updatingUserID: string, belongsTo: string, role: string, opponentName: string) {
        try {
            console.log(user)
            if (!(updatingUserID && belongsTo && role)) {
                throw new BadRequestException("Requirements not satisfied")
            }

            if (updatingUserID.toString() === user?._id?.toString()) {
                throw new BadRequestException("You con't change your role")
            }
            const isUserAsAPermission = await this.GroupMemberModel.findOne({
                groupId: new mongoose.Types.ObjectId(belongsTo),
                memeberId: user?._id,
                role: "ADMIN"
            })


            if (!isUserAsAPermission) {
                throw new BadRequestException("You don't have a access to perform this action")
            }

            await this.GroupMemberModel.updateOne({
                memeberId: new mongoose.Types.ObjectId(updatingUserID),
                groupId: new mongoose.Types.ObjectId(belongsTo)
            },
                {
                    $set: {
                        role: role
                    }
                })
            return {
                role,
                name: (user?.firstName || " ") + " " + (user?.lastName || ""),
                opponentName
            }
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }
}

