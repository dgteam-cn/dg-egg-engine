'use strict';

// const helper = require('@dgteam/helper')
const {base64Decode} = require('@dgteam/helper/dist/hash.js')
// const validator = require('../validator.js')

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
    const paramProxy = (key, value) => method === 'GET' ? ctx.param(key, value) : ctx.post(key, value)

    const validator = ctx.service.validator
    const {action, params} = ctx.api
    const result = {
        id: params && params.id ? params.id : undefined
    }
    let param = {}

    if (action === 'index') {

        if (logic.RESTfull) console.warn('[logic] Did you try "RESTful" and spell it "RESTfull"')
        const RESTful = logic.RESTfull || logic.RESTful // TODO 兼容旧版本 RESTful 字段命名错误 BUG

        if (!RESTful) return {err: 404, msg: 'resource not found'}
        if (!RESTful[identity]) return {err: 402, msg: null}
        if (!RESTful[identity][METHOD]) return {err: 405, msg: null}
        const checkupParams = extend(RESTful[identity][METHOD])

        // RESTful 的 PUT 与 DELETE 方法必传主键
        if (METHOD === 'PUT' || METHOD === 'DELETE') {
            if (!result.id) return {err: 422, msg: 'primary key can not be blank.'}
        }

        const res = validator.checkup(paramProxy(), checkupParams)
        if (res.err) {
            return {err: 422, msg: null, result: res.errors}
        } else {
            param = res.result
            Object.keys(res.result).forEach(key => paramProxy(key, res.result[key]))
        }

        // 剔除多余参数后，RESTful 的 PUT 至少要提交一个参数
        if (METHOD === 'PUT' && isEmpty(param)) {
            return {err: 422, msg: 'restfull param is empty.'}
        }

    } else if (logic.actions && logic.actions[action]) {

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
                identitys = identitys.split(/\s*,\s*/) // 2021-07-18 兼容 ‘center, admin, default’ 的写法
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

            const res = validator.checkup(paramProxy(), examiner.checkup)
            if (res.err) {
                return {err: 422, msg: null, result: res.errors}
            } else {
                param = res.result
                Object.keys(res.result).forEach(key => paramProxy(key, res.result[key]))
            }
        }
    } else {
        // console.log('\n\n not logic', logic.actions, action)
    }

    return {err: 0, result, param}
}

module.exports = options => {

    return async function(ctx, next) {

        const {controllerPath, action} = ctx.api
        const {logic} = ctx.app
        let {identity, authorization: token} = ctx.request.header
        const {method, isDev} = ctx
        const METHOD = method.toUpperCase()

        // 若为配置逻辑文件，默认返回 404
        const ctrlLogic = logic[controllerPath]
        if (!ctrlLogic) {
            return isDev ? ctx.err(510, 'api logic is undefined.') : ctx.err(404)
        }

        ctx.RESTful = {
            row: null, // 操作的单行对象
            method: METHOD, action,
            limit: {}, // ctx 键入
            query: {}, // logic -> validator.js 键入
            param: {}, // 表单参数
            marker: null,
            order: [], // logic -> validator.js 键入
            options: {} // 2022-03-31 新增，可以临时覆盖控制器默认 options
        }

        // 处理 marker 数据
        const _marker = ctx.param('marker')
        if (method === 'GET' && (_marker || _marker === '' && ctx.param('page') == 1)) {
            const formatMarker = () => {
                // TODO marker 查询方法一定需要指定排序方式，id 正序或倒叙, 创建时间正序或者倒序 | 优先以创建时间为准
                const defaultData = {id: 0, page: 1}
                if (typeof _marker !== 'string') return defaultData // 如果 marker 值属于非法值，均不报错，而是使用默认值覆盖
                try {
                    let {id, page = 1, order, size} = JSON.parse(base64Decode(_marker))
                    // console.log(id, page, order, size, typeof id, typeof page, typeof order, typeof size)
                    if (!Number.isInteger(id) || id < 0 || id > 1000000000000 || !Number.isInteger(page) || page < 0 || page > 1000000000000) {
                        id = 0 // 主键兼容性判断
                        page = 1
                    }
                    if (!Number.isInteger(size)) size = undefined // size 字段会在 controller 中填充
                    if (ctx.param('size')) size = ctx.param('size') // 优先覆盖外层的 size
                    if (typeof order === 'object') {
                        for (const key in order) {
                            if (!~['id', 'page', 'size'].indexOf(key) && typeof order[key] === 'string') {
                                ctx.param(key, order[key]) // 覆盖排序规则，下一步会进行验证字段
                            }
                        }
                    }
                    return {id, page, size, order}
                } catch (err) {
                    // console.error(err)
                    return defaultData
                }
            }
            ctx.RESTful.marker = formatMarker()
            if (ctx.RESTful.marker.page) ctx.param('page', ctx.RESTful.marker.page)
            if (ctx.RESTful.marker.size) ctx.param('size', ctx.RESTful.marker.size)
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

        const auth_account = await ctx._logicInspectIdentity(ctx)
        if (auth_account && auth_account.err) return ctx.err(auth_account.err, auth_account.msg)

        return next()
    }
}