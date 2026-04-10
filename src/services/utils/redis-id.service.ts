import { Injectable } from "@nestjs/common";
import { RedisService } from "src/infra/redis/redis.service";

@Injectable()
export class RedisIdService {
    private readonly KEY = 'rec:id'
    private readonly Initial = 1854

    constructor(private readonly redisService: RedisService) { }

    async onModuleInit() {
        const redis = this.redisService.getClient()

        const exists = await redis.exists(this.KEY)

        if (!exists) {
            await redis.setnx(this.KEY, this.Initial)
        }
    }

    async generate(): Promise<number> {
        const redis = this.redisService.getClient()
        return redis.incr(this.KEY)
    }
}