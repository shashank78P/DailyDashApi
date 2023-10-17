import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

export type FileSystemDocument = FileSystem & Document

@Schema()
export class FileSystem {
    @Prop({
        required: true,
        type: String,
    })
    FileId: String
    @Prop({
        required: true,
        type: String,
    })
    
    mimeType: String
    @Prop({
        required: true,
        type: String,
    })
    FileName: String

    @Prop({
        required: true,
        type: String,
    })
    link: String

    @Prop({ default: new Date() })
    createdAt: Date

    @Prop({ default: new Date() })
    updatedAt: Date

    @Prop()
    belongsTo: mongoose.Schema.Types.ObjectId

    @Prop()
    parentId: mongoose.Schema.Types.ObjectId

    @Prop()
    createdBy: mongoose.Schema.Types.ObjectId
}
export const FileSystemSchema = SchemaFactory.createForClass(FileSystem);