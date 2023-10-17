import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { joined, role } from "../types";

export type GroupMemberDocument = GroupMember & Document

@Schema({timestamps : true})
export class GroupMember{
    @Prop({ type: mongoose.Types.ObjectId , required : true })
    groupId: mongoose.Schema.Types.ObjectId
    
    @Prop({ type: mongoose.Types.ObjectId , required : true })
    memeberId: mongoose.Schema.Types.ObjectId
    
    @Prop({ type: mongoose.Types.ObjectId , required : true })
    joinedBy: mongoose.Schema.Types.ObjectId
    
    @Prop({ type: String , default : "MEMBER" })
    role: role
    
    @Prop({ type: String , default : "ADDED" })
    joined: joined

    @Prop({type : Date })
    createdAt : Date
    
    @Prop({type : Date })
    updatedAt : Date
}

export const GroupMemeberSchema = SchemaFactory.createForClass(GroupMember);