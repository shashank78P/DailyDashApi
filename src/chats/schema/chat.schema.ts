import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { MessageType } from "../types";

export type chatsDocument = chats & Document

enum chatType {
    INDIVIDUAL = "INDIVIDUAL",
    GROUP = "GROUP",
}


export enum EventType {
    CHAT_INITIATED = "CHAT_INITIATED",
    JOIN = "JOIN",
    LEFT = "LEFT",
    REMOVED = "REMOVED",
    MODIFIED = "MODIFIED",
    CREATED = "CREATED",
}

@Schema({ _id: false })
class Event{
    @Prop({  })
    type : EventType

    @Prop({ type: String })
    message : String
}


@Schema({ timestamps: true })
class messsageReadList {
    @Prop({ type: mongoose.Types.ObjectId })
    user: mongoose.Schema.Types.ObjectId

    @Prop({ type: Date })
    createdAt: Date

    @Prop({ type: Date })
    updatedAt: Date
}

@Schema({ timestamps: true })
export class chats {
    @Prop({ type: mongoose.Types.ObjectId, required: true })
    from: mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Types.ObjectId })
    to: mongoose.Schema.Types.ObjectId

    @Prop({ type: String , default:null})
    message: String

    @Prop({ type: Boolean, default: false })
    isMessageRead: Boolean

    @Prop({ required: true, default: "TEXT" })
    messageType: MessageType
    
    @Prop({ type : mongoose.Types.ObjectId })
    fileId : mongoose.Types.ObjectId
    
    @Prop({ type : mongoose.Types.ObjectId })
    meetId : mongoose.Types.ObjectId

    @Prop({ required: true, default: "INDIVIDUAL" })
    chatType: chatType

    @Prop({ required: true, default: {} })
    event: Event

    @Prop({ default: [] })
    messsageReadList: messsageReadList[]

    @Prop({ type: Date })
    createdAt: Date

    @Prop({ type: Date })
    updatedAt: Date

    @Prop({ type: mongoose.Types.ObjectId, required: true })
    belongsTo: mongoose.Schema.Types.ObjectId
}

export const chatsSchema = SchemaFactory.createForClass(chats);