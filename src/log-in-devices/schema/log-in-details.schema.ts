import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { deviceType } from "../types";
import mongoose from "mongoose";

export type LogInDocument = LogInDetails & Document

@Schema({ timestamps: true })
export class LogInDetails {
    @Prop({ type: mongoose.Types.ObjectId })
    userId: mongoose.Schema.Types.ObjectId

    @Prop({ required: true })
    logInId: string

    @Prop({ required: true })
    userAgent: string
    
    @Prop({ required: true })
    os: string
    
    @Prop({ required: true })
    browser: string

    @Prop()
    createdAt: Date

    @Prop()
    updatedAt: Date

    @Prop()
    belongsTo: Date
}

export const LogInDetailsSchema = SchemaFactory.createForClass(LogInDetails);