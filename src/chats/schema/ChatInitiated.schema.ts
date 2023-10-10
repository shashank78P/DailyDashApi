import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

export type ChatInitiatedDocument = ChatInitiated & Document

@Schema({ timestamps : true})
export class ChatInitiated{
    @Prop({type : mongoose.Types.ObjectId})
    from : mongoose.Schema.Types.ObjectId

    @Prop({type : mongoose.Types.ObjectId})
    to : mongoose.Schema.Types.ObjectId
    
    @Prop({type : String})
    between : String

    @Prop({type : mongoose.Types.ObjectId})
    lastChatMessageId : mongoose.Schema.Types.ObjectId
    
    @Prop({type : Date , default : Date.now()})
    createdAt : Date
    
    @Prop({type : Date , default : Date.now()})
    updatedAt : Date
}

export const ChatInitiatedSchema = SchemaFactory.createForClass(ChatInitiated);