import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { WhoCanJoindDTO } from "../type";

export type MeetDocument = Meets & Document

@Schema({ timestamps: true })
export class Meets {
    @Prop({ type: String, required: true })
    title: String

    @Prop({ type: String })
    description: String

    @Prop({ type: Date, required: true })
    meetingDate: Date

    @Prop({ type: String, required: true })
    meetingLength: String

    @Prop({ type: String, required: true })
    whoCanJoin: WhoCanJoindDTO 

    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
    createdBy: mongoose.Schema.Types.ObjectId

    @Prop({ type: Date })
    createdAt: Date

    @Prop({ type: Date })
    updatedAt: Date
    
}

export const MeetsSchema = SchemaFactory.createForClass(Meets)