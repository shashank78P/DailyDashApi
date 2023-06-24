import { Prop, Schema } from "@nestjs/mongoose";
import mongoose from "mongoose";

@Schema()
export class TaskManagement {
    @Prop({
        required: true,
        type: String,
        validate: [
            {
                validator: (value) => value.length >= 3,
                message: 'Project name must be at least 3 characters long',
            },]
    })
    title: String

    @Prop()
    description: String

    @Prop({ default: new Date() })
    createdAt: Date

    @Prop({ default: new Date() })
    updatedAt: Date

    @Prop()
    belongsTo: mongoose.Schema.Types.ObjectId

    @Prop()
    createdBy: mongoose.Schema.Types.ObjectId


}