import { Logger } from "@nestjs/common";
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    OnGatewayInit,
    WebSocketServer,
    SubscribeMessage,

} from "@nestjs/websockets";
import { SocketService } from "./socket.service"
import { Namespace, Server, Socket } from "socket.io";


@WebSocketGateway({
    namespace: 'polls',
    cors: {
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
        ]
    },
})

export class PollsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

    private readonly logger = new Logger(PollsGateway.name);
    @WebSocketServer()
    server: Server;
    private users: { [id: string]: string } = {};

    constructor(private readonly socketSerevice: SocketService) {

    }

    @WebSocketServer() io: Namespace;

    afterInit(server: any): void {
        this.logger.log("Websocket getway initialized.");
    }

    handleConnection(client: Socket) {
        const sockets = this.io.sockets

        this.logger.log(`ws client with id: ${client.id} connected`);
        this.logger.debug(`Number of connected sockets: ${sockets.size} connected`);

        const obj = JSON.stringify(
            {
                "id": client.id,
                "users": this.users,
                "connected": true
            }
        )
        this.io.emit("hello", obj);
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
        this.io.emit("hello", obj)
    }

    @SubscribeMessage('joinChat')
    handleJoinChatEvent(client: Socket, username: string) {
        this.users[client.id] = username;
        this.server.emit('userJoined', `${username} joined to chat`);
        const obj = JSON.stringify(
            {
                "username": username,
            }
        )
        this.io.emit("hello", obj);
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(client: Socket, payload: string): Promise<void> {
        // const newMessage = await this.messagesService.createMessage(payload);
        console.log(client.id)
        console.log(payload);
        this.server.emit('receiveMessage', payload);
    }
}