import { Module } from '@nestjs/common';
import { BookMarksController } from './book-marks.controller';
import { BookMarksService } from './book-marks.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { BookMarkSchema, BookMarks } from './schema/book-marks.schema';
import { FileSystemModule } from 'src/file-system/file-system.module';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: "jwt"
    }),
    FileSystemModule,
    MongooseModule.forFeature([{name : BookMarks.name , schema : BookMarkSchema}]),
        JwtModule.register(
            {
                secret: "DailyDash51",
                signOptions: {
                    expiresIn: "1d",
                }
            }
        ),
  ],
  controllers: [BookMarksController],
  providers: [BookMarksService]
})
export class BookMarksModule { }
