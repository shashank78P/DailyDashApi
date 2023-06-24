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

    @Prop({ required: true, unique: true })
    email: String

    @Prop({ required: true })
    password: String

    @Prop({ required: true, default: false })
    isEmailVarified: Boolean

    @Prop({ default: new Date() })
    createdAt: Date

    @Prop({ default: new Date() })
    updatedAt: Date
};

export const UsersSchema = SchemaFactory.createForClass(Users);