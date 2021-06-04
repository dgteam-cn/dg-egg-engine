'use strict';

// const helper = require('@dgteam/helper')
const {base64Decode} = require('@dgteam/helper/dist/hash.js')

function extend(target = {}, ...args) {
    let i = 0;
    const length = args.length;
    let options;
    let name;
    let src;
    let copy;
    if (!target) {
        target = this.isArray(args[0]) ? [] : {};
    }
    for (; i < length; i++) {
        options = args[i];
        if (!options) {
            continue;
        }
        for (name in options) {
            src = target[name];
            copy = options[name];
            if (src && src === copy) {
                continue;
            }
            if (this.isArray(copy)) {
                target[name] = this.extend([], copy);
            } else if (this.isObject(copy)) {
                target[name] = this.extend(src && this.isObject(src) ? src : {}, copy);
            } else {
                target[name] = copy;
            }
        }
    }
    return target
}

const checkPermission = (identity, ctx, logic) => {

    let {method, isEmpty} = ctx
    const METHOD = method.toUpperCase()
    const {validator} = ctx.service
    const {action, params} = ctx.api
    let result = {
        id: params && params.id ? params.id : undefined
    }
    let param = {}
    if (action === 'index') {

        let {RESTfull} = logic
        if (!RESTfull) return {err: 404, msg: 'resource not found'}
        if (!RESTfull[identity]) return {err: 402, msg: null}
        if (!RESTfull[identity][METHOD]) return {err: 405, msg: null}
        const checkupParams = extend(RESTfull[identity][METHOD])

        // RESTfull 的 PUT 与 DELETE 方法必传主键
        if (METHOD === 'PUT' || METHOD === 'DELETE') {
            if (!result.id) return {err: 422, msg: 'primary key can not be blank.'}
        }

        // 使用验证器进行字段验证
        let flag = validator.checkup(checkupParams, {})
        if (!isEmpty(flag)) return {err: 422, msg: null, result: flag}

        // 剔除非有效的参数
        for (let key in checkupParams) {
            let value = method === 'GET' ? ctx.param(key) : ctx.post(key)
            if (value !== undefined) {
                param[key] = value
            } else if (METHOD !== 'PUT' && checkupParams[key].default) {
                param[key] = checkupParams[key].default
            }
        }

        // RESTfull 的 PUT 至少要提交一个参数
        if (METHOD === 'PUT' && isEmpty(param)) {
            return {err: 422, msg: 'restfull param is empty.'}
        }

    } else if (logic.actions && logic.actions[action] && logic.actions[action].methods != undefined) {

        // 自定义动作
        const examiner = logic.actions[action]

        // 1、方法是否被允许 method
        if (examiner.methods !== undefined) {
            let methods = examiner.methods
            if (typeof methods === 'string') {
                methods = methods.replace(/\s+/g, "").toUpperCase().split(',')
            } else if (typeof methods === 'function') {
                methods = methods()
            }
            if (!~methods.indexOf(METHOD) && !~methods.indexOf('ALL')) {
                return {err: 405, msg: null}
            }
        }

        // 2、身份是否被允许
        if (examiner.identitys) {
            let identitys = examiner.identitys
            if (typeof identitys === 'string') {
                identitys = identitys.split(',')
            } else if (typeof identitys === 'function') {
                identitys = identitys()
            }
            if (!~identitys.indexOf(identity) && !~identitys.indexOf('all') && !~identitys.indexOf('any') && !~identitys.indexOf('none')) {
                return {err: 402, msg: null}
            }
        } else if (examiner.identity) {
            console.error('[logic] "identity" need to "identitys"') // 字段输入错误
        }

        // 3、表单验证
        if (examiner.checkup) {
            let flag = validator.checkup(examiner.checkup, {})
            if (!isEmpty(flag)) {
                return {err: 422, msg: null, result: flag}
            }
        }
    }
    return {err: 0, result, param}
}

module.exports = options => {

    return async function(ctx, next) {

        const {controllerPath, action} = ctx.api
        const {logic} = ctx.app
        let {identity, authorization: token} = ctx.request.header
        const {method, redis, isDev, isPostman, isEmpty} = ctx
        const METHOD = method.toUpperCase()

        // 若为配置逻辑文件，默认返回 404
        const ctrlLogic = logic[controllerPath]
        if (!ctrlLogic) {
            return isDev ? ctx.err(510, 'api logic is undefined.') : ctx.err(404)
        }

        // 测试模式下允许使用 cookies 传递令牌
        if (!token && isDev && isPostman) {
            token = ctx.cookies.get('Authorization')
        }

        ctx.RESTful = {
            method: METHOD, action,
            limit: {}, // ctx 键入
            query: {}, // logic -> validator.js 键入
            param: {},
            marker: null,
            order: [] // logic -> validator.js 键入
        }
        // 处理 marker 数据
        const _marker = ctx.param('marker')
        if (method === 'GET' && _marker) {
            const formatMarker = () => {
                const defaultData = {id: 0, page: 1}
                if (typeof _marker !== 'string') return defaultData // ctx.err(422, undefined, {marker: 'is illegal.'})
                try {
                    let {id, size, order} = JSON.parse(base64Decode(_marker))
                    if (!Number.isInteger(id) || id < 0 || id > 1000000000000) id = 0
                    if (!Number.isInteger(size)) size = undefined
                    if (ctx.param('size')) size = ctx.param('size') // 优先覆盖外层的 size
                    if (typeof order !== 'string') order = undefined
                    return {id, page: 1, size, order}
                } catch (err) {
                    // console.error(err)
                    return defaultData
                }
            }
            ctx.RESTful.marker = formatMarker()
            if (ctx.RESTful.marker.page) ctx.param('page', ctx.RESTful.marker.page)
            if (ctx.RESTful.marker.size) ctx.param('size', ctx.RESTful.marker.size)
            if (ctx.RESTful.marker.order) ctx.param('order', ctx.RESTful.marker.order)
        }

        // 权限基础判断，若未指定身份，则根据实际情况去选择身份
        if (identity) {
            ctx.identity = identity
        } else if (token) {
            ctx.identity = 'default'
            let checkupDefault = checkPermission('default', ctx, ctrlLogic)
            if (~[402, 404, 405].indexOf(checkupDefault.err)) {
                ctx.identity = 'none'
            }
        } else {
            ctx.identity = 'none'
        }

        // 使用已经计算好的 ctx.identity 套用 logic 规则进行初步判断
        const checkup = checkPermission(ctx.identity, ctx, ctrlLogic)
        if (checkup.err) return ctx.err(checkup.err, checkup.msg, checkup.result)

        ctx.RESTful.id = checkup.result.id
        ctx.RESTful.identity = ctx.identity
        ctx.RESTful.param = checkup.param

        if (!token && ctx.identity !== 'none') {
            return ctx.err(401, 'permission need token.')
        }
        if (ctx.identity !== 'none') {

            const token_dncrypt = ctx.service.authorization.dncrypt(token) // 直接对用户提交的 token 进行解析
            if (token_dncrypt.err) return ctx.err(401, 'this token is invalid.') // 令牌不合法

            // 用户基础身份验证
            const row_user = await redis.hget(`UID_${token_dncrypt.result.uid}`, undefined, {db: 1}) // 从缓存库中获取用户信息进行交叉对比
            if (isEmpty(row_user) || !row_user.base || !row_user.base.id) return ctx.err(401, 'this account is expired.') // 令牌失效返回错误

            // 授权令牌双向验证
            if (!row_user.base.auth) return ctx.err(500, 'this account is expired.') // 如果没有签发 token 记录，那么这个 token 是非法的
            const tokens = {}
            for (let type in row_user.base.auth) {
                tokens[row_user.base.auth[type]] = type
            }
            if (!tokens[token_dncrypt.token]) return ctx.err(401, 'this token is expired.') // 如果令牌过期也会触发
            ctx.authorization = {data: token_dncrypt.result, identity: ctx.identity, token: token_dncrypt.token, tokens}

            // 用户特殊身份验证
            if (ctx.identity !== 'default' && !row_user[ctx.identity]) return ctx.err(402, `this account does not has '${ctx.identity}' permission.`)

            ctx.user = row_user
            ctx.RESTful.user = row_user
        } else {
            ctx.user = {base: {id: null}}
            ctx.RESTful.user = {base: {id: null}}
        }

        return next()
    }
}