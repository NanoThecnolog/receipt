import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {

    private client: Redis;
    private logger = new Logger('REDIS')

    onModuleInit() {
        this.client = new Redis({
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD || undefined,
            retryStrategy: (times) => Math.min(times * 50, 2000)
        })

        this.client.on('connect', () => {
            this.logger.log("Redis connected")
        })

        this.client.on('error', (err) => {
            this.logger.error('Redis Error', err)
        })
    }

    onModuleDestroy() {
        this.client.disconnect()
    }

    getClient(): Redis {
        return this.client
    }
}