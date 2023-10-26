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
            'http://localhost:3000',
            'http://localhost:3001',
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
            throw new InternalServerErrorException(err?.message)
        }
    }

    // this.io.use(function (socket, next) {
    //     console.log("socket?.request?.headers?.cookie");
    //     console.log(socket?.request?.headers?.cookie);
    // });
    handleConnection(client: Socket) {
        const sockets = this.io.sockets

        this.logger.log(`ws client with id: ${client.id} connected`);
        this.logger.debug(`Number of connected sockets: ${sockets.size} connected`);
        this.logger.debug(client?.handshake?.auth?.userId);
    }

    handleDisconnect(client: Socket) {
        const sockets = this.io.sockets;
        console.log(`Client disconnected: ${client.id}`);
        const userId = this.users[client.id];
        this.logger.log(`ws client with id: ${client.id} dis-connected`);
        if (userId) {
            delete this.users[client.id];
            this.server.emit('userLeft', userId);
        }
        const obj = JSON.stringify(
            {
                "id": client.id,
                "users": this.users,
                "connected": false
            }
        )
        // this?.io?.
        // .request.headers.cookie.someCookie
        this.io.emit("hello", obj)
    }

    @SubscribeMessage('joinMeet')
    async handleJoinMeetEvent(client: Socket, payload: JoinMeet) {
        const user = await this.verifyToken(client)
        try {
            const { meetingId } = payload
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
        console.log(user)
        console.log(meetingId)
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

    @SubscribeMessage('sending-stream')
    async handleSendingMediaStreamEvent(client: Socket, payload: any) {
        const user = await this.verifyToken(client)
        const { type, meetingId, sendingTo, opponentId } = payload
        this.server.emit(`${sendingTo}-notify`, { meetingId, sendingTo, opponentId, type });
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
            console.log(payload)
            const newMessage = await this.ChatsService.createMessage(payload);

            this.server.emit(payload?.belongsTo, newMessage?.[0])
            this.server.emit(`${payload?.to}ChatNotification`, { type: "CHAT" });
        } catch (err) {
            console.log(err)
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