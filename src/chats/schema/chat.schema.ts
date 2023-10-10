import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

export type chatsDocument = chats & Document

enum chatType {
    INDIVIDUAL="INDIVIDUAL",
    GROUP = "GROUP",
}

@Schema({timestamps : true})
class messsageReadList{
    @Prop({ type: mongoose.Types.ObjectId })
    user: mongoose.Schema.Types.ObjectId

    @Prop({type : Date })
    createdAt : Date
    
    @Prop({type : Date })
    updatedAt : Date
}

@Schema({ timestamps: true })
export class chats {
    @Prop({ type: mongoose.Types.ObjectId , required : true })
    from: mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Types.ObjectId })
    to: mongoose.Schema.Types.ObjectId

    @Prop({ type: String , required : true})
    message: String
    
    @Prop({ type: Boolean , default : false })
    isInitiated: Boolean
    
    @Prop({ type: Boolean , default : false })
    isMessageRead: Boolean
    
    @Prop({ required : true , default : "INDIVIDUAL"})
    chatType: chatType
    
    @Prop({ default : []})
    messsageReadList: messsageReadList[]

    @Prop({type : Date , default : Date.now()})
    createdAt : Date
    
    @Prop({type : Date , default : Date.now()})
    updatedAt : Date

    @Prop({ type: mongoose.Types.ObjectId, required : true })
    belongsTo: mongoose.Schema.Types.ObjectId
}

export const chatsSchema = SchemaFactory.createForClass(chats);