import { CacheInterceptor, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export default class CacheByUserIDInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const req = context.switchToHttp().getRequest();
    return req.user._id;
  }
}
