var cookieParser = require('socket.io-cookie');
import { Logger, UseGuards, InternalServerErrorException, BadRequestException, UnauthorizedException, UsePipes, ValidationPipe } from "@nestjs/common";
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    OnGatewayInit,
    WebSocketServer,
    SubscribeMessage,
} from "@nestjs/websockets";
import { Namespace, Server, Socket } from "socket.io";
import { ChatsService } from "./chats.service"
import { AuthGuard } from "@nestjs/passport";
import { CurrentUser } from "src/log-in-devices/currentUser.decorator";
import { LogInDetailsService } from "src/log-in-devices/log-in-details.service";
import { JwtService } from "@nestjs/jwt";
import { JoinMeet } from "./types";
import { MeetService } from "src/meet/meet.service";
import { UsersService } from "src/users/users.service";

@WebSocketGateway({
    namespace: 'polls',
    cors: {
        origin: [
            'http://localhost:3001',
            process.env.FRONT_END
        ]
    },
})

// @UsePipes(ValidationPipe)
export class PollsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    private readonly logger = new Logger(PollsGateway.name);
    @WebSocketServer()
    server: Server;

    private users: { [id: string]: string } = {};

    constructor(
        private jwtService: JwtService,
        private readonly ChatsService: ChatsService,
        private readonly usersService: UsersService,
        private readonly MeetService: MeetService,
    ) { }
    @WebSocketServer() io: Namespace;

    afterInit(server: any): void {
        this.logger.log("Websocket getway initialized.");
        this.io.use(cookieParser)
    }

    async verifyToken(client: Socket) {
        // this.LogInDetailsService?.generateToken()
        try {
            let token = client?.request?.headers?.cookie?.["authorization"]

            if (!token) {
                throw new UnauthorizedException()
            }

            token = token.replace('Bearer ', '')
            const jwtDecodedData = await this.jwtService.verifyAsync(token, { secret: 'DailyDash51' });
            return jwtDecodedData
        } catch (err) {
            // throw new InternalServerErrorException(err?.message)
        }
    }

    // this.io.use(function (socket, next) {
    //     console.log("socket?.request?.headers?.cookie");
    //     console.log(socket?.request?.headers?.cookie);
    // });
    async handleConnection(client: Socket) {
        const sockets = this.io.sockets

        const user = await this.verifyToken(client)
        this.logger.log(`ws client with id: ${client.id} connected`);
        this.logger.debug(`Number of connected sockets: ${sockets.size} connected`);
        this.logger.debug(client?.handshake?.auth?.userId);
        await this.usersService.changeUserIsOnline(user?.userId?.toString(), true)
    }

    async handleDisconnect(client: Socket) {
        try {
            const sockets = this.io.sockets;
            console.log(`Client disconnected: ${client.id}`);
            const user = await this.verifyToken(client)
            console.log(user)
            if (!user?.userId) {
                return;
            }

            await this.usersService.changeUserIsOnline(user?.userId?.toString(), false)

            const UserInMeetingList = await this.MeetService.getAListOfAllUserInMetting(user?.userId)

            Promise.all(UserInMeetingList?.map(async (meeting, i) => {
                if (meeting?.belongsTo) {
                    await this.handleLeaveMeetEvent(client, { meetingId: meeting?.belongsTo?.toString() })
                }
            }))
            this.logger.log(`ws client with id: ${client.id} dis-connected`);
        } catch (err) {

        }
    }

    @SubscribeMessage('joinMeet')
    async handleJoinMeetEvent(client: Socket, payload: JoinMeet) {
        const user = await this.verifyToken(client)
        try {
            const { meetingId } = payload
            console.log("join meeting request")
            console.log(payload)
            const result = await this.MeetService.AddParticipantsToRoom(user, meetingId);
            let participantsId = await this.MeetService.getAllParticipantsId(user?.userId, meetingId)
            let { _id, firstName, lastName } = await this.usersService.getUserById(user?.userId)
            firstName = firstName ?? " "
            lastName = lastName ?? ""
            let name = firstName + " " + lastName
            console.log(firstName, lastName, name, _id)
            if (result) {
                this.io.socketsJoin(meetingId);
                this.server.emit(`${String(user?.userId)}-meet-join-notification`, { type: "establish-connect", participants: participantsId });
                client.broadcast.emit(`${meetingId}-notify`, { type: "new-participants-joined-meeting", name, _id })
            } else {
                this.server.emit(`${String(user?.userId)}-meet-join-notification`, { error: "Try again" });
            }
        } catch (err) {
            this.server.emit(`${String(user?.userId)}-meet-join-notification`, { error: err?.message });
        }
    }

    @SubscribeMessage('leaveMeet')
    async handleLeaveMeetEvent(client: Socket, payload: JoinMeet) {
        const user = await this.verifyToken(client)
        const { meetingId } = payload
        console.log("user =============> ")
        console.log(user)
        console.log(meetingId)
        console.log("user =============> ")
        try {
            const result = await this.MeetService.leaveMeetingRoom(user?.userId, meetingId);
            let { _id, firstName, lastName } = await this.usersService.getUserById(user?.userId)
            firstName = firstName ?? " "
            lastName = lastName ?? ""
            let name = firstName + " " + lastName
            console.log(result)
            this.io.socketsLeave(meetingId);
            client.broadcast.emit(`${meetingId}-notify`, { type: "participants-left-meeting", leftUserId: user?.userId, name })
        } catch (err) {
            this.server.emit(`${meetingId}-notify`, { error: err?.message });
        }
    }

    @SubscribeMessage('meeting-emoji-reactions')
    async handleMeetingEmojiReactionsEvent(client: Socket, payload: any) {
        try {
            const user = await this.verifyToken(client)
            const { meetingId, emoji } = payload
            console.log(emoji)
            const isExist = await this.MeetService.isUserInMeeting(user?.userId, meetingId)
            if (isExist) {
                client.broadcast.emit(`${meetingId}-notify`, { type: "emoji-reactions", meetingId, emoji, userId: user?.userId })
            }
        } catch (err) {

        }
    }

    @SubscribeMessage('screen-share-stop')
    async handleScreenShareStopEvent(client: Socket, payload: any) {
        try {
            const user = await this.verifyToken(client)
            const { meetingId, } = payload
            const isExist = await this.MeetService.isUserInMeeting(user?.userId, meetingId)
            if (isExist) {
                client.broadcast.emit(`${meetingId}-notify`, { type: "screen-share-stop", meetingId, userId: user?.userId })
            }
        } catch (err) {

        }
    }

    @SubscribeMessage('is-raise-my-hand')
    async handleMeetingRaiseMyHandEvent(client: Socket, payload: any) {
        try {
            const user = await this.verifyToken(client)
            const { meetingId, isRaiseMyHand } = payload
            const isExist = await this.MeetService.isUserInMeeting(user?.userId, meetingId)
            if (isExist) {
                this.server.emit(`${meetingId}-notify`, { type: "is-raise-my-hand", meetingId, userId: user?.userId, isRaiseMyHand })
            }
        } catch (err) {

        }
    }

    @SubscribeMessage('meeting-message')
    async handleMeetungMassagesEvent(client: Socket, payload: any) {
        try {
            const user = await this.verifyToken(client)
            const { meetingId, message, createdAt, createdBy, userId } = payload
            console.log(payload)
            if (!(userId === (user?.userId).toString())) {
                return;
            }
            const isExist = await this.MeetService.isUserInMeeting(userId, meetingId)
            console.log(isExist)
            if (isExist) {
                console.log("sending...")
                client.broadcast.emit(`${meetingId}-notify`, { type: "message", meetingId, userId, createdBy, message, createdAt })
            }
        } catch (err) {
            console.log(err)
        }
    }

    @SubscribeMessage('sending-stream')
    async handleSendingMediaStreamEvent(client: Socket, payload: any) {
        const user = await this.verifyToken(client)
        const { type, meetingId, sendingTo, opponentId } = payload
        this.server.emit(`${sendingTo}-notify`, { meetingId, sendingTo, opponentId, type })
    }

    @SubscribeMessage('stream')
    handleMeetEvent(client: Socket, payload: any) {
        // this.server.emit("1-notification" , payload);
        console.log("message 1", payload)
        this.server.emit("stream", payload);
        // this.io.to(payload?.meetingId).emit(payload)
    }

    @SubscribeMessage('joined-meeting')
    handleJoinedMeetingEvent(client: Socket, payload: any) {
        console.log("joined meeting")
        console.log(payload)
        this.server.emit(`${payload?.meetingId}-notify`, { type: "joined", userId: payload?.userId });
    }

    // inividuals chats handler
    @SubscribeMessage('INDIVIDUAL')
    async handleIndividualSendMessage(client: Socket, payload: any): Promise<void> {
        try {
            const { userId } = await this.verifyToken(client)
            // console.log(client?.handshake?.auth);
            console.log("=================================")
            console.log("Requested for handel individual send message")
            console.log(payload)
            const newMessage = await this.ChatsService.createMessage(payload);
            this.server.emit(payload?.belongsTo, newMessage?.[0])
            this.server.emit(`${payload?.to}ChatNotification`, { type: "CHAT" });
        } catch (err) {
            console.log(err)
        }
    }
    
    @SubscribeMessage("STARTED-TYPING")
    async handelTyping(client : Socket , payload : { belongsTo : string , type : string}){
        try{
            const { userId } = await this.verifyToken(client)
            console.log(payload)
            this.server.emit(`${payload?.belongsTo?.toString()}typing`, { type: payload?.type , status : "STARTED"})
        }catch(err){
            throw new InternalServerErrorException(err?.message)
        }
    }
    
    @SubscribeMessage("STOPED-TYPING")
    async handelStopTyping(client : Socket , payload : { belongsTo : string , type : string}){
        try{
            const { userId } = await this.verifyToken(client)
            this.server.emit(`${payload?.belongsTo?.toString()}typing`, { type: payload?.type , status : "STOPPED"})
        }catch(err){
            throw new InternalServerErrorException(err?.message)
        }
    }

    @SubscribeMessage('GROUP')
    async handleGroupSendMessage(client: Socket, payload: any): Promise<void> {
        try {
            const { userId } = await this.verifyToken(client)
            // console.log(client?.handshake?.auth);
            const newMessage = await this.ChatsService.createGroupMessage(payload, userId);
            console.log(newMessage)

            this.server.emit(payload?.belongsTo, newMessage?.[0])
            this.server.emit(`${payload?.belongsTo}ChatNotification`, { type: "GROUPCHAT" })
        } catch (err) {
            console.log(err)
        }
    }
}