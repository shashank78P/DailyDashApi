import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

export type quickAccessDocument = quickAccess & Document

@Schema({ timestamps: true })
export class quickAccess {
    @Prop({ type: String, required: true })
    title: String

    @Prop({ type: String, required: true })
    link: string 

    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
    createdBy: mongoose.Schema.Types.ObjectId
    
    @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
    fileId: mongoose.Schema.Types.ObjectId

    @Prop({ type: Date })
    createdAt: Date

    @Prop({ type: Date })
    updatedAt: Date
    
}

export const quickAccesssSchema = SchemaFactory.createForClass(quickAccess)