
const {Validator, Rules, Messages} = require('@dgteam/validator')

Messages.en = {
    "required": "{name} can not be blank",
    "contains": "{name} need contains string {args}",
    "equals": "{name} need equal {args}",
    "different": "{name} need not equal {args}",
    "alpha": "{name} need contains only letters (a-zA-Z)",
    "alphaDash": "{name} need contains only letters and dashes(a-zA-Z_)",
    "alphaNumeric": "{name} need contains only letters and numeric(a-zA-Z0-9)",
    "alphaNumericDash": "{name} need contains only letters, numeric and dash(a-zA-Z0-9_)",
    "ascii": "{name} need contains ASCII chars only",
    "base64": "{name} need a valid base64 encoded",
    "creditCard": "{name} need a valid credit card",
    "date": "{name} need a date",
    "iso8601": "{name} need a valid ISO 8601 date",
    "mobile": "{name} need is a mobile phone number",
    "email": "{name} need an email under your options",
    "int": "{name} need an integer under your options",
    "int:range": "{name} is not within the specified range",
    "float": "{name} need a float under your options",
    "float:range": "{title} is not within the specified range",
    "float:decimal": "{name} number format error",
    "multiple": "{name} number must be a multiple of {args}",
    "hexColor": "{name} need a hexadecimal color",
    "rgbColor": "{name} need a RGB color",
    "hex": "{name} need a hexadecimal number",
    "ip": "{name} need an IP (version 4 or 6)",
    "ip4": "{name} need an IP (version 4)",
    "ip6": "{name} need an IP (version 6)",
    "uuid": "{name} need an uuid",
    "md5": "{name} need a md5",
    "sha256": "{name} need a sha256",
    "hash": "{name} need a hash",
    "mimeType": "{name} need a mimeType",
    "in": "{name} need in an array of {args}",
    "notIn": "{name} need not in an array of {args}",
    "checkbox": "{name} invalid value exists",
    "checkbox:repeat": "{name} duplicate values are not allowed",
    "length": "{name} should be length under your options",
    "lowercase": "{name} should be lowercase",
    "uppercase": "{name} should uppercase",
    "mongoId": "{name} need is a valid hex-encoded representation of a MongoDB ObjectId",
    "sqlOrder": "{name} need a valid sql order string",
    "sqlField": "{name} need a valid sql field string",
    "startWith": "{name} need start with {args}",
    "endWith": "{name} need end with {args}",
    "string": "{name} need a string",
    "string:length": "{name} should be length under your options",
    "boolean": "{name} need a boolean",
    "regexp": "{name} need match your custom regexp",
    "array": "{name} need an array",
    "array:range": "{name} is not within the specified range",
    "object": "{name} need an object"
}
Messages.zh = {
    "required": "{name} 不能为空",
    "contains": "{name} 必须包含{args}",
    "equals": "{name} 必须等于 {args}",
    "different": "{name} 必须不等于 {args}",
    "alpha": "{name} 只能用 (a-zA-Z) 字符组成",
    "alphaDash": "{name} }只能用 (a-zA-Z_) 字符组成",
    "alphaNumeric": "{name} 只能用 (a-zA-Z0-9) 字符组成",
    "alphaNumericDash": "{name} 只能用 (a-zA-Z0-9_) 字符组成",
    "ascii": "{name} 不是有效的 ASCII 编码",
    "base64": "{name} 必须通过 base64 编码",
    "creditCard": "{name} 必须是信用卡号码",
    "date": "{name} 必须是日期",
    "iso8601": "{name} 需要为 iso8601 日期格式",
    "mobile": "手机号码格式错误",
    "email": "邮箱号格式错误",
    "int": "{name} 必须是个整数",
    "int:range": "{name} 数值不在指定的范围内",
    "float": "{name} 必须是个小数",
    "float:range": "{name} 数值不在指定的范围内",
    "float:decimal": "{name} 小数格式有误",
    "multiple": "{name} 必须是{args}的倍数",
    "hexColor": "{name} 需要为十六进制颜色值",
    "rgbColor": "{name} 需要为标准 RGB 颜色值",
    "hex": "{name} 需要为十六进制",
    "ip": "{name} 不是正确的 IP 地址",
    "ip4": "{name} 不是正确的 IP (version 4) 地址",
    "ip6": "{name} 不是正确的 IP (version 6) 地址",
    "uuid": "{name} 必须是 UUID",
    "md5": "{name} 不是有效的 MD5 字符串",
    "sha256": "{name} 不是有效的 SHA256 字符串",
    "hash": "{name} 不是有效的 hash 字符串",
    "mimeType": "{name} 不是有效的 mimeType 类型",
    "in": "{name} 的值必须在 {args} 之中",
    "notIn": "{name} 的值不能再 {args} 之中",
    "checkbox": "{name} 存在无效的值",
    "checkbox:repeat": "{name} 值不能重复",
    "length": "{name} 长度有误",
    "lowercase": "{name} 必须全为小写字母",
    "uppercase": "{name} 必须全为大写字母",
    "mongoId": "{name} 不是有效的 MongoDB ObjectId",
    "sqlOrder": "{name} 不是有效的 SQL order 字符串",
    "sqlField": "{name} 不是有效的 SQL field 字符串",
    "startWith": "{name} 需要以 {args} 字符开头",
    "endWith": "{name} 需要以 {args} 字符结尾",
    "string": "{name} 必须是字符串",
    "string:length": "{name} 长度有误",
    "boolean": "{name} 必须是布尔值",
    "regexp": "{name} 格式无法通过验证",
    "array": "{name} 必须是一个数组",
    "array:range": "{name} 长度不在指定范围内",
    "object": "{name} 必须是一个对象"
}

const {big} = require('@dgteam/helper')
const examiner = new Validator({
    ignoreRuleKeys: ['title', 'placeholder', 'defaultDoc', 'description', 'mode', 'auto']
})

// RESTful 指定过滤条件
Rules.RESTful_filter = (value, {argName, validValue, ctx}) => {
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
Rules.RESTful_order = (value, {ctx}) => {
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
Rules.RESTful_range = (value, {argName, validValue, ctx}) => {
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
Rules.multiple = (value, {argName, validValue}) => {
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
// Rules.checkbox = (value, {argName, validValue}) => {
//     if (!Array.isArray(value)) {
//         return {[argName]: 'Must be array'}
//     }
//     const opt = Object.assign({in: []}, Array.isArray(validValue) ? {in: validValue} : validValue)
//     const allowKeys = new Set(opt.in)
//     for (const item of value) {
//         if (!allowKeys.has(item)) {
//             return {[argName]: 'invalid value'}
//         }
//     }
//     if (new Set(value).size != value.length) {
//         return {[argName]: 'value is repeat'}
//     }
//     return true
// }

module.exports = examiner