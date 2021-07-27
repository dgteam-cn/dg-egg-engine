const Model = require('../../core/model.js')
const {
    extend, origin, big, price, priceUppercase, prefixZero, uuid, time, timestamp,
    isEmpty, isArray, isObject
} = require('@dgteam/helper')
const {md5, base64, base64Decode, base64Encode, base64EncodeURI} = require('@dgteam/helper/dist/hash.js')

module.exports = {

    $err: 0,
    $result: null,

    extend, //origin, // origin 与 koa ctx 有冲突
    big, price, priceUppercase, prefixZero, uuid, time, timestamp,
    isEmpty, isArray, isObject,
    isFunction(obj) {
        return typeof obj === 'function'
    },
    md5, base64, base64Decode, base64Encode, base64EncodeURI,

    table(name) {
        return new Model(name, this.app, this) // 获取数据模型
    },
    transaction(opt) {
        return this.app.Sequelize.transaction(opt)
    },

    get service() {
        return this.app.service
    },
    get isDev() {
        return this.app.config.env != 'prod'
    },
    get isPostman() {
        let userAgent = this.get('user-agent')
        return Boolean(typeof userAgent === 'string' && (~userAgent.indexOf('Postman') || ~userAgent.indexOf('Postuncle')))
    },

    json(obj) {
        this.set('content-type', 'application/json; charset=utf-8')
        this.body = obj
        return obj
    },

    err(err=404, msg, data=null) {
        // class Err extends Object {
        //     constructor(err, msg, data){
        //         super()
        //         this.err = err
        //         this.msg = msg
        //         this.data = data
        //     }
        // }
        const map = {
            400: 'parameter error.',             // 400  用户请求错误（原因不明）
            401: 'need login.',                  // 401  未登录，或授权令牌过期
            402: 'need permission.',             // 402  已登录，但无相应权限
            403: 'need permission.',             // 403  权限不足
            404: 'not found.',                   // 404  请求或资源不存在
            405: 'method not allowed.',          // 405  请求类型错误
            406: 'need security verification.',  // 406  账户安全风险，需要安全验证
            408: 'request timeout.',             // 408  请求超时
            409: 'need security verification.',  // 409  账户安全风险，需要安全验证
            422: 'unprocessable entity.',        // 422  语义错误
            429: 'too many requests.',           // 429  请求频率过快

            500: 'server error.',                // 500  服务器未执行（原因不明）
            501: 'server reject request.',       // 501  服务器拒绝执行
            502: 'server is not responding.',    // 502  第三方服务未响应
            503: 'server is busy.',              // 503  当前服务器繁忙（也有可能是资源锁）
            504: 'server maintenance.',          // 504  服务器维护
            505: 'protocol not supported.',      // 505  请求协议不支持
            510: 'server resources deficient.'   // 510  服务器内部错误（一般用于测试环境的错误栈追踪）
        }
        if (err && typeof msg != 'string' && map[err]) {
            msg = map[err]
        }
        this.$err = {err, msg, result: data}
        this.status = err
        const result = {
            ...this.$err,
            date: new Date(),
            worker: process.pid
        }
        if (err === 422) {
            result.validator = data
            result.result = null
        }
        return this.json(result)
    },

    suc(data = null, msg = "successful.", status = 200) {
        this.status = status
        if (this.type && !~['application/json', 'json'].indexOf(this.type)) {
            this.body = data
        } else if (data !== null && typeof data === 'object' && data.constructor.name === 'Items') {
            const itemsInfo = data.getItemsInfo()
            const res = {
                err: 0,
                msg,
                result: data,
                ...itemsInfo,
                date: time(new Date()),
                worker: process.pid
            }
            // 组装 marker 字段
            if (this.RESTful.method === 'GET' && this.RESTful.marker) {
                const {page, size, sort} = this.RESTful.marker
                if (data.length === 0 || data.length < size) {
                    res.marker = false
                } else {
                    res.marker = base64Encode(JSON.stringify({id: data[data.length - 1].id, page: page + 1, size}))
                }
                res.page = page
                res.size = size
                if (sort) res.sort = sort
            }
            return this.json(res)
        } else {
            return this.json({err: 0, msg, result: data, date: new Date(), worker: process.pid})
        }
    },

    mock(data=null, msg="mock data.") {
        this.suc(data, msg, 202)
    },

    randomInt(num=6) {
        let r = Math.random() + ''
        let n = r.substring(2, 2+num)
        return n
    },

    // exportToExcel(cols, list) {
    //     const table = {cols, rows: []}
    //     const fields = []
    //     for (const col of table.cols) {
    //         fields.push(col.key)
    //     }
    //     for (const item of list) {
    //         const row = []
    //         for (const col of table.cols) {
    //             row.push(item[col.key] ? item[col.key] : '')
    //         }
    //         table.rows.push(row)
    //     }
    //     // 返回结果
    //     const nodeExcel = require('excel-export')
    //     const result = nodeExcel.execute(table)
    //     this.type = 'application/vnd.openxmlformats'
    //     this.set('Content-Type', 'application/vnd.openxmlformats')
    //     this.set('Content-Disposition', "attachment; filename=Report.xlsx")
    //     this.body = new Buffer(result, 'binary')
    // },


    enum(list = [], fun=new Function(), options) {
        if (typeof options === 'string') {
            options = {defLabel: options}
        }
        const config = Object.assign({name: 'name', label: ['label', 'title'], strict: false, defLabel: ''}, options)
        let {name, label, defLabel} = config
        // 枚举匹配判定函数
        const handel = typeof fun !== 'function' ? item => {
            return item[name] == fun
        } : fun
        for (const item of list) {
            if (handel(item)) {
                if (typeof label === 'string') {
                    label = [label]
                }
                if (Array.isArray(label)) {
                    for (let key of label) {
                        if (item[key] !== undefined) {
                            return item[key]
                        }
                    }
                }
                return item
            }
        }
        return defLabel
    }
}