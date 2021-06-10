const Egg = require('egg')
const {Controller} = Egg
const Model = require('./model.js')

// const PARAM = Symbol('context-param')

// 默认配置
const opt_default = {
    model: null,
    RESTfull: {
        GET: null, POST: null, PUT: null, DELETE: null, count: null, // 增删改查的默认配置
        // own: false, // 查询我自己的行，返回为查询所用的筛选条件
        // inspect: false, // 是否允许导出逻辑文件
        limit: async () => null, // 操作限制，返回为查询或修改将要被锁定的参数
        lock: async () => null //  行锁，默认使用 redis 分布式锁，返回为资源名称
    },
    export: false // 可否导出
}

class RESTfullController extends Controller {

    constructor(ctx) {
        super(ctx);
    }

    get = (opt) => this.ctx.param(opt)
    param = (opt) => this.ctx.param(opt)
    post = (opt) => this.ctx.post(opt)

    // 获取数据模型
    table = (name) => this.model(name || this.options.model)
    model = (name) => {
        if (!name) {
            name = this.storePath.name
        }
        return new Model(name, this.app, this.ctx)
    }
    get redis() {
        return this.app.redis
    }

    get opt() {
        // const identitys = this.app.config.project.identitys
        // const topLevel = [...identitys, 'default', 'none']
        const identity = this.ctx.identity
        const {RESTfull} = this.options
        if (RESTfull && RESTfull[identity]) {
            return RESTfull[identity]
        }
        return opt_default.RESTfull
    }

    // 获取控制器标识符
    get storePath() {
        let path = this.fullPath
        let start = path.indexOf('controller') + 'controller/'.length
        let end =  path.indexOf('.js')
        let paths = path.substring(start, end).replace(/\\/g, "/").split('/')
        if (paths.length && paths[paths.length-1] === 'index') {
            paths.splice(paths.length - 1, 1)
        }
        return {name: paths.join('/')}
    }

    async index() {

        const {ctx, app} = this
        const {helper, RESTful, identity, method, api} = ctx
        const {action} = api
        // const isDev = app.config.env !== 'prod'

        // 身份判断
        if (!this.opt[method]) {
            if (!identity || identity === 'none') {
                return ctx.err(401)
            }
            return ctx.err(405)
        }

        // 按需启用行锁
        // GET 默认不带锁，必须在 GET.options 中配置
        if (method !== 'GET' && this.opt.lock || this.opt[method].lock) {
            const LockFun = this.opt[method].lock ? this.opt[method].lock : this.opt.lock
            let LockName = typeof LockFun === 'function' ? await LockFun(this.ctx.RESTful, this.ctx) : LockFun
            if (!LockName || typeof LockName !== 'string') {
                LockName = this.options.model ? this.options.model : this.storePath
            }
            ctx.RedisLock = await ctx.redis.lock(LockName, 15000)
            if (!ctx.RedisLock) {
                return ctx.err(503, ctx.isDev ? '[RedisLock] 服务器繁忙,请稍候重试' : '服务器繁忙,请稍候重试')
            }
        }

        // 前置中间件
        for (const beforeAction of [`Before${method}_${identity}`, `Before${method}`]) {
            if (this[beforeAction]) {
                let flag = await this[beforeAction](this.ctx)
                if (flag !== undefined && flag !== true) {
                    return // 当返回了结果时候，则表示跳过默认行为
                }
            }
        }

        if (this[method]) {
            await this[method]()
        } else {
            return this.Err(405)
        }

        // 后置中间件
        for (const afterAction of [`After${method}_${identity}`, `After${method}`]) {
            if (this[afterAction]) {
                const flag = await this[afterAction](this.ctx)
                if (flag !== undefined && flag !== true) {
                    return
                }
            }
        }

        // if (this.ctx.RedisLock) this.ctx.RedisLock.unlock()  // 如果有锁则释放锁
    }


    GET = async (param=this.ctx.RESTful.param) => {

        const {ctx} = this

        const index = this.RESTfulIndex('GET')
        let limit = await this.RESTfulLimit('GET')

        if (ctx.RESTful.limit) {
            limit = {...limit, ...this.ctx.RESTful.limit}
        }

        const getGEToptions = key => {
            const type = index ? 'item' : 'list'
            const options = this.opt.GET
            return options[type] && options[type][key] ? options[type][key] : options[key]
        }
        const field = getGEToptions('field')
        const fieldReverse = getGEToptions('fieldReverse') || ['deleted_at']
        const include = getGEToptions('include') || []

        const model = this.table(this.options.model)
        if (index) {
            const item = await model.where(Object.assign({}, limit, index)).field(field).fieldReverse(fieldReverse).include(include).find()
            if (ctx.isEmpty(item)) {
                ctx.err(404)
            } else {
                ctx.suc(item)
            }
        } else {

            const {query, marker} = ctx.RESTful
            let {order} = ctx.RESTful
            const {page, size} = param
            if (ctx.RESTful.include) {
                Array.isArray(ctx.RESTful.include) ?
                    include.push(...ctx.RESTful.include) :
                    include.push(ctx.RESTful.include)
            }
            if (marker) {
                // marker 中至少包含两个参数：上一列表最后 id 值，排序方式；次要参数：其他排序方式；
                // 除了 id 以外的其他参数，都要通过 base64 解析后装载在 params 中（覆盖式）
                if (!marker.size) marker.size = size
                if (!order || order.length === 0) order = ['id ASC']
                if (!marker.order) marker.order = order.join(',')
                if (order && ~order.indexOf('id DESC')) {
                    if (marker.id) {
                        query['id'] = ['<', marker.id]
                    }
                } else {
                    query['id'] = ['>', marker.id]
                }
            }
            const list = await model.where(Object.assign({}, query, limit)).order(order).field(field).fieldReverse(fieldReverse).include(include).selectPage(page, size)
            ctx.suc(list)
        }
    }

    POST = async (param=this.ctx.RESTful.param) => {
        const {ctx} = this
        const limit = await this.RESTfulLimit('POST')
        const data = Object.assign({}, param, limit)
        const row = await this.table(this.options.model).add(data)
        row && row.id ? ctx.suc(row) : ctx.err(500)
        // if (row && row.id) {
        //     ctx.suc(row)
        // } else {
        //     ctx.err(500)
        // }
    }

    PUT = async (param=this.ctx.RESTful.param, index=this.RESTfulIndex('PUT', true)) => {
        const {ctx} = this
        const limit = await this.RESTfulLimit('PUT')
        if (index) {
            const result = await this.table(this.options.model).where(Object.assign({}, limit, index)).update(param)
            Array.isArray(result) && result[0] ? ctx.suc(Object.assign(param, index)) : ctx.err(404)
            // if (Array.isArray(result) && result[0]) {
            //     ctx.suc(Object.assign(param, index))
            // } else {
            //     ctx.err(404)
            // }
        } else {
            ctx.err(500)
        }
    }

    DELETE = async () => {
        const {ctx} = this
        const index = this.RESTfulIndex('DELETE', true)
        const limit = await this.RESTfulLimit('DELETE')
        const force = Boolean(this.opt.DELETE && this.opt.DELETE.force)
        if (index) {
            const result = await this.table(this.options.model).where(Object.assign({}, limit, index)).delete({force})
            result ? ctx.suc(index) : ctx.err(404)
            // if (result) {
            //     ctx.suc(index)
            // } else {
            //     ctx.err(404)
            // }
        }
    }

    // 查询索引
    RESTfulIndex = () => this.ctx.RESTful.id ? {id: this.ctx.RESTful.id} : null

    // 查询限制
    RESTfulLimit = async method => {
        if (method && this.opt[method] && this.opt[method].limit) {
            return this.ctx.isFunction(this.opt[method].limit) ?
                await this.opt[method].limit(this.ctx.RESTful, this.ctx) : this.opt[method].limit
        } else if (this.opt.limit) {
            return this.ctx.isFunction(this.opt.limit) ?
                await this.opt.limit(this.ctx.RESTful, this.ctx) : this.opt.limit
        } else if (this.ctx.RESTful.limit) {
            return this.ctx.isFunction(this.ctx.RESTful.limit) ?
                await this.ctx.RESTful.limit(this.ctx.RESTful, this.ctx) : this.ctx.RESTful.limit
        }
        return null
    }

    // /**
    //  * 查询自己的数据，仅限单条数据，在 options 中配置过滤方式
    //  */
    // async own() {
    //     const {ctx, opt} = this
    //     if (opt.own) {
    //         const filter = ctx.isFunction(opt.own) ? await opt.own(this.ctx.RESTful, this.ctx) : opt.own
    //         if (ctx.isObject(filter)) {
    //             const row = await this.table().where(filter).find()
    //             ctx.isEmpty(row) ? ctx.err(404) : ctx.suc(row)
    //         } else {
    //             console.error(`'opt.own' must be function or object.`)
    //         }
    //     }
    // }

    // /**
    //  * 表单验证参数
    //  */
    // async inspect() {
    //     const {app, ctx, opt} = this
    //     const {api, identity} = ctx
    //     const {controllerPath} = api
    //     if (opt.inspect && app.logic[controllerPath]) {
    //         const logic = app.logic[controllerPath]
    //         const result = {restfull: {}, actions: {}}
    //         if (logic.RESTfull && logic.RESTfull[identity]) {
    //             result.restfull = logic.RESTfull[identity]
    //         }
    //         if (typeof logic.actions === 'object') {
    //             for (const name in logic.actions) {
    //                 if (logic.actions[name].identitys) {
    //                     const identitys = Array.isArray(logic.actions[name].identitys) ? logic.actions[name].identitys : logic.actions[name].identitys.replace(/\s+/g, "").toLowerCase().split(',')
    //                     if (!~identitys.indexOf('null') || !~identitys.indexOf('any') || !~identitys.indexOf(identity)) {
    //                         continue
    //                     }
    //                 }
    //                 result.actions[name] = logic.actions[name].identitys.checkup ? logic.actions[name].identitys.checkup : {}
    //             }
    //             if (this.opt.own) {
    //                 result.actions['own'] = {}
    //             }
    //         }
    //         ctx.suc(result)
    //     }
    //     ctx.err(404)
    // }
}

Egg.RESTfullController = RESTfullController

module.exports = RESTfullController