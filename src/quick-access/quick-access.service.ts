import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { quickAccess, quickAccessDocument } from './schema/quick-access.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { QuickAccessDto } from './type';

@Injectable()
export class QuickAccessService {
    constructor(
        private jwtService: JwtService,
        @InjectModel(quickAccess.name) private QuickAccessModel: Model<quickAccessDocument>,
    ) { }

    async getQuickAccess(user: any) {
        try {
            return await this.QuickAccessModel.aggregate([
                {
                    $match: {
                        createdBy: user?._id,
                    },
                },
                {
                    $lookup: {
                        from: "filesystems",
                        localField: "fileId",
                        foreignField: "_id",
                        as: "file"
                    },
                },
                {
                    $unwind: "$file"
                },
                {
                    $project: {
                        title: 1,
                        link: 1,
                        fileLink: "$file.link",
                        fileId : "$file._id"
                    }
                }
            ])
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async addQuickAccess(user, data: QuickAccessDto) {
        try {
            const { fileId, link, title } = data;
            return await this.QuickAccessModel.insertMany([
                {
                    fileId: new mongoose.Types.ObjectId(fileId),
                    link,
                    title,
                    createdBy: user?._id
                }
            ])
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async editQuickAccess(user: any, data: QuickAccessDto, _id: string) {
        try {
            const isExist = await this.QuickAccessModel.findOne({ _id : new mongoose.Types.ObjectId(_id) })

            if(!isExist){
                throw new NotFoundException()
            }

            await this.QuickAccessModel.updateOne(
                {
                    _id : new mongoose.Types.ObjectId(_id)
                },
                {
                    $set : {
                        ...data
                    }
                }
            )
            return "Updated Successfully"
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async deleteQuickAccess(user, id: string) {
        try {
            const isHisData = await this.QuickAccessModel.findOne({
                _id: new mongoose.Types.ObjectId(id),
                createdBy: user?._id
            })

            if (!isHisData) {
                throw new NotFoundException("Quick access not found")
            }

            await this.QuickAccessModel.deleteOne({
                _id: new mongoose.Types.ObjectId(id),
                createdBy: user?._id
            })
            return "Deleted successfully"
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }
}
