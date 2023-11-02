import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose"

export type InviteUsersDocument = InviteUsers & Document

@Schema({ timestamps: true })
export class InviteUsers {

    @Prop({ required: true })
    email: String

    @Prop({ default: false, type: Boolean })
    invitationAccepted: boolean

    @Prop({ required: true, type: mongoose.Types.ObjectId })
    invitedBy: mongoose.Types.ObjectId
    
    @Prop({ required: true, type: mongoose.Types.ObjectId })
    belongsTo: mongoose.Types.ObjectId

    @Prop({ default: new Date() })
    createdAt: Date

    @Prop({ default: new Date() })
    updatedAt: Date
};

export const InviteUsersSchema = SchemaFactory.createForClass(InviteUsers);