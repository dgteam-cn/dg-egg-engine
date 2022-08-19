'use strict';

const createRedis = require('./app/library/redis')
module.exports = app => {

    // if (app.config.redis && !app.config.redis.client) {
    //     app.config.redis.client = Object.assign({}, app.config.redis)
    // }
    // app.addSingleton('redis', clientInstall)

    const client = createRedis(app.config.redis, app)
    app.redis = client

    // const Redis = require('ioredis')
    // const _redis = new Redis({
    //     port: 6379, // Redis port
    //     host: "localhost", // Redis host
    //     password: "hN7KmrL]G@QrcfIH8woa]DD[",
    //     db: 14 // Defaults to 0
    // })
    // const fun = async () => {
    //     await _redis.set('test set', 1).then(res => console.log('set', res))
    //     await _redis.get('test set').then(res => console.log('get', res))
    //     await _redis.pipeline().set("test pipeline 1", "pipeline 1").get("test pipeline 1").exec().then(res => console.log('pipeline 1', res))
    //     await _redis.pipeline([['set', 'test pipeline 2', 'pipeline 1'], ['get', 'test pipeline 2']]).exec().then(res => console.log('pipeline 2', res))
    // }
    // fun()
}