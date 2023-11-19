import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

export type ChatInitiatedDocument = ChatInitiated & Document

@Schema({ timestamps : true})
export class ChatInitiated{
    @Prop({type : mongoose.Types.ObjectId , required : true})
    from : mongoose.Schema.Types.ObjectId

    @Prop({type : mongoose.Types.ObjectId})
    to : mongoose.Schema.Types.ObjectId
    
    @Prop({type : String})
    between : String

    @Prop({type : mongoose.Types.ObjectId})
    lastChatMessageId : mongoose.Schema.Types.ObjectId
    
    @Prop({type : Date })
    createdAt : Date
    
    @Prop({type : Date })
    updatedAt : Date
    
    @Prop({type : String })
    groupName : String
    
    @Prop({type : String , default : "INDIVIDUAL"})
    type : String
    
    @Prop({type : String })
    description : String
    
    @Prop({type : String , default : "https://drive.google.com/uc?export=download&id=1MUlNxRj8g_BWLxt1YKl8cep2yp5Zdo_u"})
    groupProfilePic : String
    
    @Prop({type : String })
    FileId : String
}

export const ChatInitiatedSchema = SchemaFactory.createForClass(ChatInitiated);