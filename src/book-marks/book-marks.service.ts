import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UsePipes, ValidationPipe } from '@nestjs/common';
import { BookMarkDocument, BookMarks } from './schema/book-marks.schema';
import { JwtService } from '@nestjs/jwt';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { bookMarkBasicQuery, createBookMarkDto, updateBookMarkDto } from './type';
import { FileSystemService } from 'src/file-system/file-system.service';

@UsePipes(ValidationPipe)
@Injectable()
export class BookMarksService {
    constructor(
        private jwtService: JwtService,
        private fileSystemService: FileSystemService,
        @InjectModel(BookMarks.name) private BookMarkModel: Model<BookMarkDocument>,
    ) { }


    async createBookMark(user: any, data: createBookMarkDto) {
        try {
            const result = await this.BookMarkModel.insertMany([
                {
                    ...data,
                    fileId: new mongoose.Types.ObjectId(data?.fileId),
                    belongsTo: user?._id
                }
            ])
            return result
        } catch (err: any) {
            throw new InternalServerErrorException(err?.message)
        }
    }



    async updateBookMark(user, data: updateBookMarkDto, bookMarkId: string) {
        try {
            const { description, fileId, hashTags, priority, title, isBookMarkImageChanged, pinned , link } = data;
            const isBookMarkIsExist = await this.BookMarkModel.findOne({
                _id: new mongoose.Types.ObjectId(bookMarkId),
                belongsTo: user?._id
            })

            if (!isBookMarkIsExist) {
                throw new NotFoundException("BookMark not found")
            }

            const dataToBeUpdated = {
                description,
                hashTags,
                priority,
                title,
                pinned,
                link
            }

            if (isBookMarkImageChanged && fileId) {
                dataToBeUpdated["fileId"] = new mongoose.Types.ObjectId(fileId)
            }

            const result = await this.BookMarkModel.updateOne(
                {
                    _id: new mongoose.Types.ObjectId(bookMarkId),
                    belongsTo: user?._id
                },
                {
                    $set: dataToBeUpdated
                })
            return result
        } catch (err: any) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getBookMarkPagination(user: any, limit: number, page: number, search: string, sortBy: string, sortOrder: number, status: string, from: string, to: string) {
        try {

            const query: any = [{ _id: { $ne: null }, belongsTo: user?._id }]
            console.log(from, to)

            if (!["undefined", "null"].includes(from) && new Date(from)) {
                query.push({ createdAt: { $gte: new Date(from) } })
            }
            if (!["undefined", "null"].includes(to) && new Date(to)) {
                query.push({ createdAt: { $lte: new Date(to) } })
            }

            if (search) {
                const regx = new RegExp(search, "i");
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
                q[sortBy] = Number(sortOrder)
                sortByQuery.push({ $sort: q })
            }
            console.log(sortByQuery)

            if (status && status !== "All") {
                query?.push({ priority: status })
            }

            console.log(query)

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
                ...bookMarkBasicQuery,
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
                        $skip: Number(skipingNumber ?? 0)
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
            console.log(err)
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getBookMarkById(user, id: string) {
        try {
            if (!id) {
                throw new BadRequestException("Requirements are not matrched")
            }
            const isHisBookMark = await this.BookMarkModel.findOne({
                _id: new mongoose.Types.ObjectId(id),
                belongsTo: user?._id
            })

            if (!isHisBookMark) {
                throw new NotFoundException("Document not found")
            }

            return this.BookMarkModel.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id),
                        belongsTo: user?._id
                    },
                },
                ...bookMarkBasicQuery
            ])
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async deleteBookMark(user, _id) {
        try {
            const deleted = await this.BookMarkModel.findOneAndDelete({ _id: new mongoose.Types.ObjectId(_id), belongsTo: user?._id })
            if (!deleted) {
                throw new NotFoundException("Bookmark not found")
            }
            return deleted
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async togglePinnedBookmark(user: any, id: string) {
        try {
            if (!id) {
                throw new BadRequestException("Requirements not matched")
            }
            const bookmark = await this.BookMarkModel.findOne({
                _id: new mongoose.Types.ObjectId(id),
                belongsTo: new mongoose.Types.ObjectId(user?._id)
            })

            if (!bookmark) {
                throw new NotFoundException("Bokmark not found")
            }

            await this.BookMarkModel.updateOne(
                {
                    _id: new mongoose.Types.ObjectId(id),
                    belongsTo: user?._id
                },
                {
                    $set: {
                        pinned: !bookmark?.pinned
                    }
                })
            return bookmark?.pinned ? "Un-Pinned sucessfully" : "Pinned sucessfully";

        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getPinnedDetails(user) {
        try {
            return await this.BookMarkModel.find({ belongsTo: user?._id, pinned: true });
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }
}
