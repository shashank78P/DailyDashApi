// cors.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class corsMiddleware implements NestMiddleware {
    use(req: any, res: any, next: () => void) {
        res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // Replace with your frontend URL
        res.header('Access-Control-Allow-Origin', 'https://dasily-dash-git-final-shashank78p.vercel.app'); // Replace with your frontend URL
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        next();
    }
}
