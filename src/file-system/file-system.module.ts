import { Module } from '@nestjs/common';
import { FileSystemController } from './file-system.controller';
import { FileSystemService } from './file-system.service';
import { MongooseModule } from '@nestjs/mongoose';
import { FileSystem, FileSystemSchema } from './schema/file-system.schema';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: "jwt"
    }),
    MongooseModule.forFeature([{ name: FileSystem.name, schema: FileSystemSchema }]),
  ],
  controllers: [FileSystemController],
  providers: [FileSystemService],
  exports: [FileSystemService]
})
export class FileSystemModule { }
