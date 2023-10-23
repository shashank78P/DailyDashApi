import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

export type MeetingParticipantsDocument = MeetingParticipants & Document

@Schema({ timestamps: true })
export class MeetingParticipants {
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
    participantId: mongoose.Schema.Types.ObjectId
    
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
    belongsTo: mongoose.Schema.Types.ObjectId

    @Prop({ type : Boolean , default : false })
    isAttended : Boolean
    
    @Prop({ type : Boolean , default : false })
    isInMeeting : Boolean

    @Prop({ type: Date })
    createdAt: Date

    @Prop({ type: Date })
    updatedAt: Date
}

export const MeetingParticipantsSchema = SchemaFactory.createForClass(MeetingParticipants)