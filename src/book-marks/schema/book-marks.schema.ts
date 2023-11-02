import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { priorityDto } from "../type";

export type BookMarkDocument = BookMarks & Document

@Schema({ timestamps: true })
export class BookMarks {
    @Prop({ type: String, required: true })
    title: string
    
    @Prop({ type: String, required: true })
    priority: priorityDto

    @Prop({ type: Array<String>, required: true })
    hashTags: string[]

    @Prop({ type: String , required : true})
    link: string
    
    @Prop({ type: mongoose.Types.ObjectId , required : true})
    fileId: mongoose.Types.ObjectId
    
    @Prop({ type: mongoose.Types.ObjectId , required : true})
    belongsTo : mongoose.Types.ObjectId

    @Prop({ type: String })
    description: string
    
    @Prop({ type: Date })
    createdAt: Date
    
    @Prop({ type: Date })
    updatedAt: Date

}

export const BookMarkSchema = SchemaFactory.createForClass(BookMarks)