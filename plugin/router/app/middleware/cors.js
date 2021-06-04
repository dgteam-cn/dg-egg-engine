'use strict';

module.exports = options => {
    return async function(ctx, next) {
        const {enable, origin, headers, expired, methods, credentials} = options
        if (enable) {
            if (origin) ctx.set('Access-Control-Allow-Origin', origin) // 允许跨域的 host 地址
            if (headers) ctx.set('Access-Control-Allow-Headers', headers) // 跨域请求允许的自定义请求头字段
            if (expired) ctx.set('Access-Control-Max-Age', expired + '') // 在某一期限下无需重新发起 OPTIONS 预请求
            if (methods) ctx.set('Access-Control-Allow-Methods', methods) // 允许跨域的方法
            if (credentials) ctx.set('Access-Control-Allow-Credentials', 'true')
            if (ctx.method === 'OPTIONS') {
                ctx.status = 204
                return ctx.json(1)
            }
        }
        return next()
    }
}