import { Module } from '@nestjs/common';
import { QuickAccessController } from './quick-access.controller';
import { QuickAccessService } from './quick-access.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { quickAccess, quickAccesssSchema } from './schema/quick-access.schema';

@Module({
  controllers: [QuickAccessController],
  providers: [QuickAccessService],
  imports: [
    PassportModule.register({
      defaultStrategy: "jwt"
    }),
    MongooseModule.forFeature([{ name: quickAccess.name, schema: quickAccesssSchema }]),
    JwtModule.register(
      {
        secret: "DailyDash51",
        signOptions: {
          expiresIn: "1d",
        }
      }
    ),
  ]
})
export class QuickAccessModule { }
