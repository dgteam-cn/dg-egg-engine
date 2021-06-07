'use strict';

const crypto = require('crypto')

const Redis = require('ioredis')
const Redlock = require('redlock')
const REDLOCK = Symbol('redlock')

const Pool = {} // ioredis 连接池

const md5 = function(str) {
    return crypto.createHash('md5').update(str).digest('hex')
}

module.exports = app => {

    const Config = Object.assign({}, app.config.redis)

    function redis(key, value, timeout, opt={}) {
        if (!key) {
            throw new Error('[redis]: key can not be blank')
        }
        if (typeof timeout === 'object') {
            opt = timeout
        } else if (opt && timeout && typeof opt === 'object' && !opt.timeout) {
            opt.timeout = timeout
        }
        if (value === undefined) return redis.get(key, opt)
        if (value === null) return redis.del(key, opt)
        return redis.set(key, value, opt)
    }

    /**
     * 资源锁（基于 redlock 实现）
     * @param {string} resource - 需要被锁的资源名称
     * @param {number} ttl - 超时时间，若超过时间没有解锁则自动解锁
     */
    redis.lock = function(resource = 'redlock', ttl = 10000) {
        if (!Pool[REDLOCK]) {
            Pool[REDLOCK] = new Redlock(
                [
                    Redis.createClient(
                        Object.assign({}, app.config.redis, {db: 4})
                    )
                ],
                Object.assign({
                    driftFactor: 0.01, // 预期的时钟漂移，会与 ttl 相乘
                    retryCount: 8, // 重试次数
                    retryDelay: 200,  // 抖动时间
                    retryJitter: 200  // 重试时间
                }, app.config.redlock)
            )
            Pool[REDLOCK].on('clientError', err => {
                console.error('A redis error has occurred:', err) // 链接终端
            })
        }
        return Pool[REDLOCK].lock(resource, ttl).then(lock => lock).catch(err => {
            console.error('[redis/redlock.js] err：超出队列最大长度', err)
            return Promise.reject(false)
        })
    }

    /**
     * 引擎实例，根据配置进行返回，若实例不存在则创建一个新实例
     * @param {number} db - 数据库索引
     */
    redis.engine = function(db = 0) {
        let config = Object.assign(Config, {db})
        let tunnel = md5(JSON.stringify(config))
        if (!Pool[tunnel] || !Pool[tunnel].connector.connecting) {
            Pool[tunnel] = new Redis(config)
        }
        return Pool[tunnel]
    }
    redis.get = function(key, opt={}) {
        return new Promise(resolve => {
            this.engine(opt.db).get(key, (err, value) => {
                if (value === null) resolve(void 0)
                try {
                    resolve(JSON.parse(value))
                } catch (e) {
                    resolve(value)
                }
            })
        })
    }
    redis.set = function(key, content, opt={}) {
        content = JSON.stringify(content)
        return new Promise(resolve => {
            if (opt && opt.timeout) {
                this.engine(opt.db).setex(key, opt.timeout, content, (err, value) => {
                    value ? resolve(true) : resolve(false)
                })
            } else {
                this.engine(opt.db).set(key, content, (err, value) => {
                    value ? resolve(true) : resolve(false)
                })
            }
        })
    }
    redis.del = function(key, opt={}) {
        return new Promise(resolve => {
            this.engine(opt.db).del(key, (err, value) => {
                resolve(true)
            })
        })
    }
    // key 是否存在
    redis.exists = function(key, opt={}) {
        return new Promise(resolve => {
            this.engine(opt.db).exists(key, (err, value) => {
                resolve(value)
            })
        })
    }
    redis.keys = function(keys, opt={}) {
        return new Promise(resolve => {
            this.engine(opt.db).keys(keys, (err, value) => {
                resolve(value)
            })
        })
    }
    // 获取缓存时间，单位秒
    redis.ttl = function(key, opt={}) {
        return new Promise(resolve => {
            this.engine(opt.db).ttl(key, (err, value) => {
                resolve(value)
            })
        })
    }
    // 设置缓存时间，单位秒
    redis.expire = function(key, timeout=0, opt={}) {
        return new Promise(resolve => {
            this.engine(opt.db).expire(key, timeout, (err, value) => {
                resolve(true)
            })
        })
    }
    // string 计数器
    redis.incr = function(key, num=1, opt={}) {
        if (typeof num === 'object') opt = num
        num = Number.isInteger(num) ? num : 1
        return new Promise(resolve => {
            this.engine(opt.db).incrby(key, num, (err, value) => {
                resolve(value)
            })
        })
    }
    redis.decr = function(key, num=1, opt={}) {
        if (typeof num === 'object') opt = num
        num = Number.isInteger(num) ? num : 1
        return new Promise(resolve => {
            this.engine(opt.db).decrby(key, num, (err, value) => {
                resolve(value)
            })
        })
    }
    redis.hash = function(hash, key, opt={}) {
        return new Promise(resolve => {
            this.engine(opt.db).hset(hash, key, (err, value) => {
                resolve(value)
            })
        })
    }


    // ------------ //
    // hash 键值对  //
    // ------------ //

    redis.hget = function(hash, key, opt={}) {
        if (key == undefined || typeof key === 'object') {
            if (typeof key === 'object' || key === undefined || key === null) {
                if (typeof key === 'object') {
                    opt = key
                }
            }
            return new Promise((resolve) => {
                this.engine(opt.db).hgetall(hash, (err, value) => {
                    if (value) {
                        for (let k in value) {
                            try {
                                value[k] = JSON.parse(value[k])
                            } catch (e) {}
                        }
                    }
                    if (value === null) resolve(void 0)
                    resolve(value)
                })
            })
        }
        return new Promise((resolve) => {
            this.engine(opt.db).hget(hash, key, (err, value) => {
                if (value === null) resolve(void 0);
                try {
                    resolve(JSON.parse(value))
                } catch (e) {
                    resolve(value)
                }
            })
        })
    }

    redis.hset = function(hash, key, content, opt={}) {
        content = JSON.stringify(content);
        return new Promise((resolve) => {
            this.engine(opt.db).hset(hash, key, content, (err, value) => {
                value ? resolve(true) : resolve(false)
            })
        })
    }
    redis.hlen = function(hash, opt={}) {
        return new Promise((resolve) => {
            this.engine(opt.db).hlen(hash, (err, value) => {
                if (value === null) resolve(void 0)
                resolve(value)
            })
        })
    }
    redis.hincrby = function(hash, key, num, opt={}) {
        return new Promise((resolve) => {
            this.engine(opt.db).hincrby(hash, key, num, (err, value) => {
                resolve(value)
            })
        })
    }
    redis.hincrbyfloat = function(hash, key, num, opt={}) {
        return new Promise((resolve) => {
            this.engine(opt.db).hincrbyfloat(hash, key, num, (err, value) => {
                resolve(value)
            })
        })
    }
    redis.hdel = function(hash, key, opt={}) {
        return new Promise((resolve) => {
            this.engine(opt.db).hdel(hash, key, (err, value) => {
                value ? resolve(true) : resolve(false)
            })
        })
    }

    // --------- //
    // list 列表 //
    // --------- //

    redis.push = function(list, content, opt={}) {
        content = JSON.stringify(content);
        return new Promise((resolve) => {
            this.engine(opt.db).rpush(list, content, (err, value) => {
                resolve(value)
            })
        })
    }
    redis.lpop = function(list, content, opt={}) {
        return new Promise((resolve) => {
            this.engine(opt.db).lpop(key, (err, value) => {
                if (value === null) resolve(void 0)
                try {
                    resolve(JSON.parse(value))
                } catch (e) {
                    resolve(value)
                }
            })
        })
    }

    /**
     * redis.pipeline
     * pipeline = [
     *  ["set", "foo", "bar"],
     *   ["get", "foo"],
     * ]
     */
    redis.pipeline = function(pipeline = [], opt = {}) {
        return new Promise(resolve => {
            return this.engine(opt.db).pipeline(pipeline).exec((err, results) => {
                resolve(err ? false : results)
            })
        })
    }


    // --------- //
    // get 位置  //
    // --------- //

    // 增加一个地点到指定键值
    redis.geoadd = function(key, longitude, latitude, name, opt={}) {
        return new Promise(resolve => {
            this.engine(opt.db).geoadd(key, longitude, latitude, name, (err, value) => {
                resolve(value)
            })
        })
    }
    // 计算键值内两个地点的距离
    redis.geodist = function(key, member1, member2, unit='km', opt={}) {
        // unit:  m米   km千米   mi英里   ft英尺。
        return new Promise(resolve => {
            this.engine(opt.db).geodist(key, member1, member2, unit, (err, value) => {
                resolve(value)
            })
        })
    }
    // 列出一个范围内的所有位置
    redis.georadius = function(key, longitude, latitude, radius, unit='km', opt={}) {
        // unit:  m米   km千米   mi英里   ft英尺。
        return new Promise(resolve => {
            this.engine(opt.db).georadius(key, longitude, latitude, radius, unit, (err, value) => {
                resolve(value)
            })
        })
    }


    // 订阅 / 广播
    redis.subscribe = function(event, callback, opt={}) {
        if (typeof callback != "function") {
            callback = undefined
        }
        return this.engine(opt.db).subscribe(event, callback)
    }
    redis.psubscribe = function(event, callback, opt={}) {
        if (typeof callback != "function") {
            callback = undefined
        }
        return this.engine(opt.db).psubscribe(event, callback)
    }
    redis.on = function(event, callback, opt={}) {
        if (typeof callback != "function") {
            callback = undefined
        }
        return this.engine(opt.db).on(event, callback)
    }
    redis.publish = function(event, message, opt={}) {
        if (typeof message != 'string') {
            message = JSON.stringify(message)
        }
        return this.engine(opt.db).publish(event, message)
    }

    app.redis = redis
}