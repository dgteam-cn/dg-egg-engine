const Service = require('egg').Service
const _Validator = require('@dgteam/validator')
const {big} = require('@dgteam/helper')
/**
 * 可对主体类的 rules 进行添加或覆盖原规则
 * @param {string} argName                  - 用户提交参数名
 * @param {any}    value                    - 用户提交参数值
 * @param {object} options                  - 验证规则参数
 * @param {string} options.validName        - 验证器验证规则名称
 * @param {any}    options.validValue       - 验证器验证规则参数（配置）
 * @param {any}    options.parsedValidValue - 用户请求最终查询参数结果
 * @param {string} options.currentQuery     - 原始的查询语句规则
 * @param {object} options.ctx              - 上下文对象，仅在后端有效
 * @param {object} options.rule             - 用户提交字段对应的本次规则
 * @param {object} options.rules            - 用户提交字段对应的所有规则
 */

// RESTful 指定过滤条件
_Validator.rules.RESTful_filter = (value, {argName, validValue, ctx}) => {
    if (value !== undefined) { // 需要考虑 ['', false, null, 0] 的情况
        const key = validValue && typeof validValue === 'string' ? validValue : argName
        if (ctx.RESTful && ctx.RESTful.query) {
            ctx.RESTful.query[key] = value
        }
    }
    return true
}

// RESTful 指定排序条件
// 2022-03-03 支持两种方式，如果传入数组则不做检测直接入列
// 1、字符串 id ASC (多字段逗号隔开，逗号后若接空格会自动去除空格)
// 2、一元数组 []
// 3、可枚举对象 {}
_Validator.rules.RESTful_order = (value, {ctx}) => {
    if (value && ctx.RESTful && ctx.RESTful.order) {
        if (typeof value === 'string') {
            const values = Array.from(value.split(/\s*,\s*/), row => row.split(' '))
            for (const [key, sort] of values) {
                if (key && ~['ASC', 'DESC'].indexOf(sort)) {
                    ctx.RESTful.order.push([key, sort])
                }
            }
        } else if (Array.isArray(value)) {
            ctx.RESTful.order.push(value)
        } else if (typeof value === 'object' && value) {
            for (const key in value) {
                const sort = value[key]
                if (~['ASC', 'DESC'].indexOf(sort)) {
                    ctx.RESTful.order.push([key, sort])
                }
            }
        }
    }
    return true
}

// RESTful 指定范围条件
_Validator.rules.RESTful_range = (value, {argName, validValue, ctx}) => {
    if (value) {
        const key = validValue && typeof validValue === 'string' ? validValue : argName
        if (ctx.RESTful && ctx.RESTful.query) {
            let range;
            if (typeof value === 'string') {
                range = value.split(',')
            } else if (Array.isArray(value)) {
                range = Array.from(value)
            }
            if (Array.isArray(range) && range[0] && range[1]) ctx.RESTful.query[key] = ['BETWEEN', range[0], range[1]]
        }
    }
    return true
}


// // TODO 需要支持
// _Validator.rules.RESTful_like = (value, {argName, validValue, ctx}) => {
//     const key = validValue && typeof validValue === 'string' ? validValue : argName
//     if (value && ctx.RESTful && ctx.RESTful.query) {
//         ctx.RESTful.query.push(value)
//     }
//     return true
// }

// 数字必须是 xx 的倍数
_Validator.rules.multiple = (value, {argName, validValue}) => {
    if (value && typeof validValue === 'number') {
        try {
            if (big(value).mod(validValue).toString() !== '0') {
                return {[argName]: `The number must be a multiple of ${validValue}`}
            }
        } catch (e) {
            return {[argName]: 'Number format error'}
        }
    }
    return true
}

// 多选检查（强制要求 value 为 array 类型）
// 检查 value 的值是否在
_Validator.rules.checkbox = (value, {argName, validValue}) => {
    if (!Array.isArray(value)) {
        return {[argName]: 'Must be array'}
    }
    const opt = Object.assign({in: []}, Array.isArray(validValue) ? {in: validValue} : validValue)
    const allowKeys = new Set(opt.in)
    for (const item of value) {
        if (!allowKeys.has(item)) {
            return {[argName]: 'invalid value'}
        }
    }
    if (new Set(value).size != value.length) {
        return {[argName]: 'value is repeat'}
    }
    return true
}

module.exports = class Validator extends Service {

    // 测试自定义数据对象
    test(params, rules, msgs, opt = {}) {
        try {
            const config = this.app.config.logic  && this.app.config.logic.validator || {}
            const {language} = config
            const examiner = new _Validator(null, Object.assign({language}, opt))
            return examiner.validate(rules, msgs, params)
        } catch (err) {
            return {'validator rules error.': err.message}
        }
    }

    // 测试 ctx 请求参数数据
    checkup(rules, msgs, opt = {}) {
        try {
            const config = this.app.config.logic  && this.app.config.logic.validator || {}
            const {language} = config
            const examiner = new _Validator(this.ctx, Object.assign({language}, opt)) // {language: 'zh'}
            return examiner.validate(rules, msgs)
        } catch (err) {
            return {'validator rules error.': err.message}
        }
    }

    addRule(validName, callback) {
        return _Validator.addRule(validName, callback)
    }
}