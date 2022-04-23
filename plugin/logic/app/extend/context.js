const helper = require('@dgteam/helper')
const validator = require('../validator.js')

const PARAM = Symbol('context-param')
const POST = Symbol('context-post')

module.exports = {

    /**
     * 获取查询参数
     * @param {string} name - 参数名，若不传则获取所有查询参数
     * @param {any} value - 参数值，若传本值则会对该参数进行设置
     */
    param(name, value) {
        if (!this[PARAM]) {
            // 合并 params 与 query 参数，params 参数有更高合并优先级
            this[PARAM] = Object.assign({}, this.request._query || this.request.query, this.params)
        }
        if (!name) return this[PARAM]
        if (helper.isObject(name)) {
            this[PARAM] = Object.assign(this[PARAM], name)
            return this
        }
        if (value === undefined) {
            if (typeof name === 'string' && name.indexOf(',') > -1) {
                name = name.split(/\s*,\s*/)
            }
            if (Array.isArray(name)) {
                const value = {}
                name.forEach(item => {
                    const val = this[PARAM][item]
                    if (val !== undefined) {
                        value[item] = val
                    }
                })
                return value
            }
            return this[PARAM][name]
        }
        this[PARAM][name] = value
        return this
    },

    /**
     * 获取请求体参数
     * @param {string} name - 参数名，若不传则获取所有查询参数
     * @param {any} value - 参数值，若传本值则会对该参数进行设置
     */
    post(name, value) {
        if (!this[POST]) {
            const json = this.request.body // && this.request.body.post;
            this[POST] = Array.isArray(json) ? Array.from(json) : Object.assign({}, json)
        }
        if (!name) return this[POST]
        if (helper.isObject(name)) {
            this[POST] = Object.assign(this[POST], name)
            return this
        }
        if (value === undefined) {
            if (typeof name === 'string' && name.indexOf(',') > -1) {
                name = name.split(/\s*,\s*/)
            }
            if (Array.isArray(name)) {
                const value = {}
                name.forEach(item => {
                    const val = this[POST][item]
                    if (val !== undefined) {
                        value[item] = val
                    }
                })
                return value
            }
            return this[POST][name]
        }
        this[POST][name] = value
        return this
    },

    validator,

    /**
     * 用户鉴权判定逻辑
     */
    async _logicInspectIdentity(ctx) {

        // const ctx = this
        const {isEmpty, redis, identity} = ctx

        const {authorization: token} = ctx.request.header

        // 没有 token 但是又指定了身份
        if (!token && identity !== 'none') return {err: 401, msg: 'permission need token.'}

        if (identity !== 'none') {

            const token_dncrypt = ctx.service.authorization.dncrypt(token) // 直接对用户提交的 token 进行解析
            if (token_dncrypt.err) return {err: 401, msg: 'this token is invalid.'} // 令牌不合法

            // 用户基础身份验证
            const row_user = await redis.hget(`UID_${token_dncrypt.result.uid}`, undefined, {db: 1}) // 从缓存库中获取用户信息进行交叉对比
            if (isEmpty(row_user) || !row_user.base || !row_user.base.id) return {err: 401, msg: 'this account is expired.'} // 令牌失效返回错误

            // 授权令牌双向验证
            if (!row_user.base.auth) return {err: 500, msg: 'this account is expired.'} // 如果没有签发 token 记录，那么这个 token 是非法的
            const tokens = {}
            for (let type in row_user.base.auth) {
                tokens[row_user.base.auth[type]] = type
            }
            if (!tokens[token_dncrypt.token]) return {err: 401, msg: 'this token is expired.'} // 如果令牌过期也会触发
            ctx.authorization = {data: token_dncrypt.result, identity: identity, token: token_dncrypt.token, tokens}

            // 用户特殊身份验证
            if (identity !== 'default' && !row_user[identity]) return {err: 402, msg: `this account does not has '${identity}' permission.`}

            ctx.user = row_user
            ctx.RESTful.user = row_user
        } else {
            ctx.user = {base: {id: null}}
            ctx.RESTful.user = {base: {id: null}}
        }
    }
}