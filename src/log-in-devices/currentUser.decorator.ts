import { ExecutionContext, UnauthorizedException, createParamDecorator } from "@nestjs/common";

export const CurrentUser = createParamDecorator((data, ctx: ExecutionContext) => {
    try {
        const req = ctx.switchToHttp().getRequest()
        return req?.user?._doc
    } catch (error) {
        throw new UnauthorizedException();
    }
})