'use strict';

exports.redis = {
    port: 6379,
    host: 'localhost',
    username: '', // needs Redis >= 6
    password: '',
    db: 0,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 1000)
        return delay
    },
    redlock: {
        driftFactor: 0.01,
        retryCount: 1000, // 队列最大长度
        retryDelay: 150,  // 抖动时间
        retryJitter: 150  // 重试时间
    }
}