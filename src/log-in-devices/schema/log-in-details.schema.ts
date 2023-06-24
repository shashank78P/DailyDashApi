import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { deviceType } from "../types";
import mongoose from "mongoose";

export type LogInDevicesDocument = LogInDevices & Document

@Schema({ timestamps: true })
export class LogInDevices {
    @Prop({ type: mongoose.Types.ObjectId })
    userId: mongoose.Schema.Types.ObjectId

    @Prop()
    ip: string

    @Prop()
    isOwner: boolean

    @Prop()
    Browser: string

    @Prop()
    deviceType: string

    @Prop()
    os: string

    @Prop()
    engine: string

    @Prop()
    type: string

    @Prop()
    logInId: string

    @Prop()
    latitude: number

    @Prop()
    longitude: number

    @Prop()
    createdAt: Date

    @Prop()
    updatedAt: Date

    @Prop()
    belongsTo: Date
}

export const LogInDevicesSchema = SchemaFactory.createForClass(LogInDevices);