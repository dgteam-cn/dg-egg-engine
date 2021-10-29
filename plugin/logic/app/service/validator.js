const Service = require('egg').Service
const _Validator = require('@dgteam/validator')

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
    if (value) {
        const key = validValue && typeof validValue === 'string' ? validValue : argName
        if (ctx.RESTful && ctx.RESTful.query) {
            ctx.RESTful.query[key] = value
        }
    }
    return true
}

// RESTful 指定排序条件
_Validator.rules.RESTful_order = (value, {ctx}) => {
    if (value && ctx.RESTful && ctx.RESTful.order) {
        ctx.RESTful.order.push(value)
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
_Validator.rules.multiple = (value, {argName, validValue, ctx}) => {
    if (value && typeof validValue === 'number') {
        try {
            if (ctx.big(value).mod(validValue).toString() !== '0') {
                return {[argName]: `The number must be a multiple of ${validValue}`}
            }
        } catch (e) {
            return {[argName]: 'Number format error'}
        }
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