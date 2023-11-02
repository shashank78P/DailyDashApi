import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UsePipes, ValidationPipe } from '@nestjs/common';
import { BookMarkDocument, BookMarks } from './schema/book-marks.schema';
import { JwtService } from '@nestjs/jwt';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { createBookMarkDto } from './type';

@UsePipes(ValidationPipe)
@Injectable()
export class BookMarksService {
    constructor(
        private jwtService: JwtService,
        @InjectModel(BookMarks.name) private BookMarkModel: Model<BookMarkDocument>,
    ) { }


    async createBookMark(user, data: createBookMarkDto) {
        try {
            const result = await this.BookMarkModel.insertMany([
                data
            ])
            return result
        } catch (err: any) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async updateBookMark(user, data: createBookMarkDto, bookMarkId: string) {
        try {
            const { description, fileId, hashTags, priority, title } = data;
            const isBookMarkIsExist = await this.BookMarkModel.findOne({
                _id: new mongoose.Types.ObjectId(bookMarkId),
                belongsTo: user?._id
            })

            if (!isBookMarkIsExist) {
                throw new NotFoundException("BookMark not found")
            }
            const result = await this.BookMarkModel.updateOne(
                {
                    _id: new mongoose.Types.ObjectId(bookMarkId),
                    belongsTo: user?._id
                },
                {
                    $set: {
                        description, fileId, hashTags, priority, title
                    }
                }
            )
            return result
        } catch (err: any) {
            throw new InternalServerErrorException(err?.message)
        }
    }
    async getBookMarkPagination(user: any, limit: number, page: number, search: string, sortBy: string, sortOrder: number, status: string , from : string ,to : string) {
        try {

            const query: any = [{ meetingId: { $ne: null } }]
            
            if(from && new Date(from)){
                query.push({ createdAt : { $gte : new Date(from) } })
            }
            if(to && new Date(to)){
                query.push({ createdAt : { $lte : new Date(to) } })
            }

            if (search) {
                const regx = new RegExp(search);
                const d = {
                    $or: [
                        { title: { $regex: regx } },
                        { description: { $regex: regx } },
                        // { priority: {  $regex: regx } },
                        { link: { $regex: regx } },
                        { createdAt: { $regex: regx } },
                    ],
                }
                console.log(d)
                query.push(d)
            }
            

            const sortByQuery = []
            if (sortBy) {
                let q = {}
                q[sortBy] = sortOrder
                sortByQuery.push({ $sort: q })
            }

            if (status && status !== "All") {
                query?.push({ priority: status })
            }

            const finalQuery = [
                {
                    $match: {
                        belongsTo: user?._id
                    }
                },
                {
                    $match:
                    {
                        $and: query
                    },
                },
                {
                    $lookup: {
                        from: "filesystems",
                        localField: "fileId",
                        foreignField: "_id",
                        as: "file",
                    },
                },
                {
                    $unwind: "$file",
                },
                ...sortByQuery
            ]

            const count = await this.BookMarkModel.aggregate(
                [
                    ...finalQuery,
                    {
                        $count: "count"
                    }
                ],
                { allowDiskUse: true },
            )

            const totalCount = count?.[0]?.["count"] ?? 0
            const skipingNumber = Number(limit) * Number(page);

            const result = await this.BookMarkModel.aggregate(
                [
                    ...finalQuery,
                    {
                        $skip: Number(skipingNumber) ?? 0
                    },
                    {
                        $limit: Number(limit)
                    }
                ],
                { allowDiskUse: true },
            )

            const finalResult = { total: totalCount, }

            if (result?.[0]) {
                finalResult["data"] = result
            }
            if (page - 1 >= 0) {
                finalResult["prev"] = page - 1
            }
            if ((page + 1) * limit <= totalCount) {
                finalResult["next"] = page + 1
            }

            return finalResult

        } catch (err: any) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getBookMarkById(user , id : string){
        try{
            if(!id){
                throw new BadRequestException("Requirements are not matrched")
            }
            const isHisBookMark = await this.BookMarkModel.findOne({
                _id : new mongoose.Types.ObjectId(id),
                belongsTo : user?._id
            })

            if(!isHisBookMark){
                throw new NotFoundException("Document not found")
            }
            return isHisBookMark;
        }catch(err){
            throw new InternalServerErrorException(err?.message)
        }
    }
}
