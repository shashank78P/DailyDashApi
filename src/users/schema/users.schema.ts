import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose"

export type UsersDocument = Users & Document

@Schema({ timestamps: true })
export class Users {
    @Prop({ required: true })
    firstName: String

    @Prop()
    middleName: String

    @Prop()
    lastName: String

    @Prop()
    dob: Date

    @Prop()
    phone: String

    @Prop()
    profilePic: String

    @Prop({ required: true })
    userAgent: String

    @Prop({ required: true, unique: true })
    email: String

    @Prop()
    password: String

    @Prop({ required: true, default: false })
    isEmailVerified: Boolean

    @Prop({ required: true, default: false })
    isMediaSignUp: Boolean
    
    @Prop({ required: false })
    passwordResetId : string
    
    @Prop({ required: false ,  default : new Date()})
    passwordResetUpdatedAt :Date

    @Prop({ default: new Date() })
    createdAt: Date

    @Prop({ default: new Date() })
    updatedAt: Date
};

export const UsersSchema = SchemaFactory.createForClass(Users);