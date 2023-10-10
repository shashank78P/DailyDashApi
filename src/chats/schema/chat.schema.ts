import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

export type chatsDocument = chats & Document

@Schema({ timestamps: true })
export class chats {
    @Prop({ type: mongoose.Types.ObjectId })
    from: mongoose.Schema.Types.ObjectId

    @Prop({ type: mongoose.Types.ObjectId })
    to: mongoose.Schema.Types.ObjectId

    @Prop({ type: String })
    message: String
    
    @Prop({ type: Boolean , default : false })
    isInitiated: Boolean
    
    @Prop({ type: Boolean , default : false })
    isMessageRead: Boolean

    @Prop()
    createdAt: Date

    @Prop()
    updatedAt: Date

    @Prop({ type: mongoose.Types.ObjectId })
    belongsTo: mongoose.Schema.Types.ObjectId
}

export const chatsSchema = SchemaFactory.createForClass(chats);