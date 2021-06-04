
const isDev = process.env.NODE_ENV !== 'production'

/**
 * @name 错误捕获
 * @param {*} options 配置项
* 1、服务中间件没有标记错误，也没有返回结果，默认返回 404 错误
* 2、服务中间件标记了错误，则默认补齐错误信息
* 3、服务中间件直接返回了错误
* 4、应用级的错误捕获
 */
module.exports = options => {
    return async function(ctx, next) {

        try {
            await next()
            if (typeof ctx.$err === 'number' && ctx.$err > 0) {
                ctx.err(ctx.$err)
            } else if (ctx.status && ctx.statu >= 400) {
                ctx.err(ctx.status)
            } if (!ctx.$err && !ctx.body) {
                ctx.err(404)
            }
        } catch (err) {
            // 框架级错误
            ctx.status = 500
            if (!isDev) {
                ctx.app.emit('error', err, ctx)
                ctx.err(500)
            } else {
                ctx.err(510, undefined, {error: err.toString()})
                ctx.logger.error(err)
            }
        }

        // 如果有锁则释放锁
        // console.log('\n\n', 'ctx.RedisLock.unlock', '\n')
        if (ctx.RedisLock) {
            try {
                ctx.RedisLock.unlock()
            } catch (err) {
                console.error(err)
            }
        }
    }
}