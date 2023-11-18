import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException, ValidationError } from '@nestjs/common';
import { Users, UsersDocument } from './schema/users.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateUserDto, UserDataDto, SignUp, _idDto, invitationDetailsDto, changeProfilePicDto } from "./types.dto"
import * as bcrypt from "bcryptjs"
import { InviteUsers, InviteUsersDocument } from './schema/inviteUser.schema';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(Users.name) private UsersModel: Model<UsersDocument>,
        @InjectModel(InviteUsers.name) private InviteUsersModel: Model<InviteUsersDocument>,
    ) { }
    async getUserByEmail(email: string) {
        try {
            if (!email) {
                throw new BadRequestException("email required");
            }
            let result = await this.UsersModel.findOne({ email })
            return result;
        }
        catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async getUserProfilePic(user: any, _id: string) {
        try {
            if (!_id) {
                throw new BadRequestException("_id required");
            }
            let result = await this.UsersModel.findOne({ _id: new mongoose.Types.ObjectId(_id) }, { _id: 0, profilePic: 1 })
            return result;
        }
        catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async getMyDetails(user) {
        try {
            let result = await this.UsersModel.findOne({ _id: new mongoose.Types.ObjectId(user?._id) }, {
                password: -1,
                passwordResetId: -1,
                firstName: 1,
                lastName: 1,
                email: 1,
                dob: 1
            })
            // if (!result) {
            //     throw new NotFoundException("No user found");
            // }
            return result;
        }
        catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getUserById(_id: string) {
        try {
            if (!_id) {
                throw new BadRequestException("_id required");
            }
            let result = await this.UsersModel.findOne({ _id: new mongoose.Types.ObjectId(_id) }, { password: -1, passwordResetId: -1, firstName: 1, lastName: 1, email: 1 ,address : 1 , dob : 1})
            // if (!result) {
            //     throw new NotFoundException("No user found");
            // }
            return result;
        }
        catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async createUser(userData: SignUp, req: Request) {
        try {
            const { email, password, confirmPassword } = userData;
            const userHasAccountWithThisEmail = await this.UsersModel.findOne({ email });
            if (userHasAccountWithThisEmail) {
                throw new NotFoundException("User is already exist with this email");
            }
            if (password != confirmPassword) {
                throw new BadRequestException("Password mismatch");
            }
            console.log(userData);
            userData.password = await bcrypt.hash(userData.password.toString(), 12)
            userData["userAgent"] = req.headers['user-agent'];

            const user = await this.UsersModel.insertMany([userData]);
            return user
        } catch (err) {

            throw new InternalServerErrorException(err?.message);
        }
    }

    async updateUser(userData: UpdateUserDto, _id: string) {
        try {
            if (!_id) {
                throw new BadRequestException("_id required");
            }

            const userExist = await this.UsersModel.findOne({ _id: new mongoose.Types.ObjectId(_id) });
            if (!userExist) {
                throw new BadRequestException("No user exist!!");
            }
            console.log(userData["email"])
            console.log(_id)
            if (userData["email"]) {
                const emailExist = await this.UsersModel.findOne({ email: userData["email"], _id: { $ne: new mongoose.Types.ObjectId(_id) } });
                console.log("enail exist", emailExist)
                if (emailExist) {
                    throw new BadRequestException("Email already exist")
                }
            }
            delete userData["password"];
            console.log("after password details", userData);
            const result = await this.UsersModel.findByIdAndUpdate(_id, userData);
            // { _id: new mongoose.Types.ObjectId(Id) }, { $set: userData }
            delete result["password"];
            delete result["passwordResetId"];
            console.log("After update result =>", userData);
            return result
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async inviteUser(user: any, invitationDetails: invitationDetailsDto) {
        try {
            const { email, invitedBy, belongsTo } = invitationDetails
            if (!(email && invitedBy)) {
                throw new BadRequestException("Requirements are not matched")
            }
            return await this.InviteUsersModel.insertMany([
                {
                    email,
                    invitedBy: new mongoose.Types.ObjectId(invitedBy),
                    belongsTo: new mongoose.Types.ObjectId(belongsTo)
                }
            ])
        } catch (err: any) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getInvitedUserBasedOnBelongsTo(user: any, belongsTo: string) {
        try {
            if (!belongsTo) {
                throw new BadRequestException("Requirements are not matched")
            }
            return await this.InviteUsersModel.find(
                {
                    belongsTo: new mongoose.Types.ObjectId(belongsTo),
                    invitationAccepted: false
                }
            )
        } catch (err: any) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async changeProfilePic(profilePicture: changeProfilePicDto, user: any) {
        try {
            const { url } = profilePicture;

            if (!(url)) {
                throw new BadRequestException()
            }
            const isUserExist = await this.UsersModel.findOne({ _id: new mongoose.Types.ObjectId(user?._id) });

            if (!isUserExist) {
                throw new NotFoundException()
            }

            await this.UsersModel.updateOne(
                {
                    _id: new mongoose.Types.ObjectId(user?._id)
                },
                {
                    $set: {
                        profilePic: url
                    }
                }
            )
            return "Updated successfully";
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

}
