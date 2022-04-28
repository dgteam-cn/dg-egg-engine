// const helper = require('@dgteam/helper')
// const user = require('../logic/account/user')
// const { app } = require('egg-mock')

const MySQLVariableRange = {
    integer: {
        'TINYINT': {min: -128, max: 127, unsigned: 255},
        'SMALLINT': {min: -32768, max: 32767, unsigned: 65535},
        'MEDIUMINT': {min: -8388608, max: 8388607, unsigned: 16777215},
        'INTEGER': {min: -2147483648, max: 2147483647, unsigned: 4294967295},
        // BIGINT 由于 JS 数值限制，小 Number.MIN_SAFE_INTEGER = -9223372036854775807   Number.MAX_SAFE_INTEGER = 9007199254740991
        'BIGINT': {min: Number.MAX_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER, unsigned: Number.MAX_SAFE_INTEGER}
    },
    float: {
        'FLOAT': {},
        'DOUBLE': {}
    }
}
if (typeof BigInt !== 'undefined') {
    // node10+以上有原生的 BigInt 可以支持大型整数，支持判断对比，支持 Big.js
    // 需要 dg-validator 支持
    // MySQLVariableRange.integer.BIGINT.min = -9223372036854775808n
    // MySQLVariableRange.integer.BIGINT.max = 9223372036854775807n
    // MySQLVariableRange.integer.BIGINT.unsigned = 18446744073709551615n
}

module.exports = class Logic {

    title = 'Logic'
    RESTfull = {}
    actions = {}
    variableRange = {
        MySQL: MySQLVariableRange
    }

    constructor(app, options={}) {
        this.app = app
        this.options = options
        try {
            this.table = this.app.table(this.options.paths.slice(1)).client
            this.tableAttrs = this.table.rawAttributes
        } catch (err) {
            this.table = null
            this.tableAttrs = null
        }
    }

    static get defaultQuery() {
        return {
            page: {
                title: '分页页码',
                int: {min: 1, max: 1000000000},
                default: 1
            },
            size: {
                title: '分页大小',
                int: {min: 1, max: 64},
                default: 16
            },
            marker: {
                title: '分页标记',
                string: true,
                length: {min: 1, max: 2000}
            }
        }
    }

    // 混合数据
    mixin(base = {}, options = {}) {

        // 预处理
        const obj = Object.assign({}, ...Array.isArray(base) ? base : [base])
        for (const name in obj) {
            if (obj[name] === true) {
                obj[name] = {auto: true}
            } else if (typeof obj[name] !== 'object') {
                obj[name] = {}
            }
        }


        // 获取处理方式
        for (const key of ['field', 'exclude', 'required']) {
            if (options[key] && typeof options[key] === 'string') {
                options[key] = options[key].split(/\s*,\s*/) // 去除多余空格并转为数组
            }
        }

        const {field, exclude, extend, required} = options

        // 应用参数与反应用参数
        if (Array.isArray(field)) {
            for (const name in obj) {
                if (!~field.indexOf(name)) {
                    delete obj[name]
                }
            }
        } else if (Array.isArray(exclude)) {
            for (const key of exclude) {
                delete obj[key]
            }
        }

        // 继承参数
        if (extend && typeof extend === 'object') {
            for (const name in extend) {
                obj[name] = Object.assign(typeof obj[name] === 'object' ? obj[name] : {}, extend[name])
            }
        }

        // 必要参数
        if (required && Array.isArray(required)) {
            for (let name of required) {
                if (obj[name]) {
                    obj[name].required = true
                }
            }
        }

        // 模型参数合并
        if (this.table && this.table.rawAttributes) {

            const attrs = this.table.rawAttributes

            for (const name in obj) {

                const isAuto = obj[name].auto !== undefined ? !!obj[name].auto : !!obj[name].mode || options.auto === true

                if (isAuto && attrs[name]) {

                    Object.defineProperty(obj[name], 'auto', {value: true, enumerable: false, configurable: false, writable: false})

                    // 补充标题
                    if (attrs[name].comment && obj[name].title === undefined) {
                        obj[name].title = attrs[name].comment
                    }

                    // 补充默认值
                    if (attrs[name].defaultValue && obj[name].default === undefined) {
                        obj[name].default = attrs[name].defaultValue
                    }

                    // 补充必要参数
                    if (attrs[name].allowNull === false) {
                        if (obj[name].required === undefined) {
                            obj[name].required = true
                        }
                    } else if (obj[name].allowNull === undefined) {
                        // obj[name].allowNull = true
                    }
                    // 判断是否允许默认值

                    if (attrs[name].type) {
                        let typeName = attrs[name].type.constructor.name
                        const typeOptions = attrs[name].type.options
                        if (typeName) {

                            // TINYINT, SMALLINT, MEDIUMINT, INTEGER, BIGINT, FLOAT, DECIMAL, // [可用属性] 无符号：UNSIGNED  填充零：ZEROFILL
                            // CHAR-定长字符串, STRING-变长字符串, TEXT-文本列[tiny, medium, long], UUID,
                            // DATE-时间日期, TIME-时间, DATEONLY-日期, BOOLEAN-真假, ENUM-枚举, VIRTUAL-虚拟值,
                            // // defaultValue - 默认字段填充类型
                            // NOW, UUIDV1, UUIDV4

                            switch (typeName) {
                                // 整数
                                case 'TINYINT': case 'SMALLINT': case 'MEDIUMINT': case 'INTEGER': case 'BIGINT': {
                                    const {unsigned} = typeOptions

                                    if (obj[name].int === undefined) {
                                        obj[name].int = {}
                                    } else if (typeof obj[name].int === 'number') {
                                        obj[name].int = {max: obj[name].int}
                                    }
                                    if (obj[name].int.max === undefined) {
                                        obj[name].int.max = Math.pow(10, typeOptions.length) - 1
                                        // 最大值不能超过限制
                                        const compare = unsigned ? MySQLVariableRange.integer[typeName].unsigned : MySQLVariableRange.integer[typeName].max
                                        if (obj[name].int.max > compare) obj[name].int.max = compare
                                    }
                                    if (obj[name].int.min === undefined) {
                                        if (unsigned) {
                                            obj[name].int.min = 0
                                        } else {
                                            obj[name].int.min = -(Math.pow(10, typeOptions.length) - 1)
                                        }
                                        // 最小值不能超过限制
                                        const compare = unsigned ? 0 : MySQLVariableRange.integer[typeName].min
                                        if (obj[name].int.min < compare) obj[name].int.min = compare
                                    }
                                    break
                                }
                                // 浮点数
                                case 'REAL': case 'FLOAT': case 'DECIMAL': {
                                    const {precision, scale, unsigned} = typeOptions

                                    if (obj[name].float === undefined) {
                                        obj[name].float = {}
                                    } else if (typeof obj[name].float === 'number') {
                                        obj[name].float = {max: obj[name].float}
                                    }
                                    if (obj[name].float.max === undefined && precision) {
                                        obj[name].float.max = Math.pow(10, precision) - 1
                                        // 最大值不能超过限制
                                        // const compare = unsigned ? MySQLVariableRange.float[typeName].unsigned : MySQLVariableRange.float[typeName].max
                                        // if (obj[name].float.max > compare) obj[name].float.max = compare
                                    }
                                    if (obj[name].float.min === undefined) {
                                        if (unsigned) {
                                            obj[name].float.min = 0
                                        } else if (precision) {
                                            // obj[name].float.min = -(Math.pow(10, precision) - 1)
                                        }
                                        // // 最小值不能超过限制
                                        // const compare = unsigned ? 0 : MySQLVariableRange.float[typeName].min
                                        // if (obj[name].float.min < compare) obj[name].float.min = compare
                                    }
                                    if (obj[name].float.decimal === undefined && scale) {
                                        obj[name].float.decimal = scale
                                    }
                                    break
                                }
                                // 字符串
                                case 'CHAR': case 'STRING': case 'TEXT': {
                                    if (obj[name].length === undefined) {
                                        obj[name].length = {}
                                    } else if (typeof obj[name].length === 'number') {
                                        obj[name].length = {min: obj[name].length, max: obj[name].length}
                                    }
                                    if (obj[name].length.max === undefined) {
                                        obj[name].length.max = typeOptions.length
                                    }
                                    break
                                }
                                // 布尔值
                                case 'BOOLEAN': {
                                    if (obj[name].boolean === undefined) {
                                        obj[name].boolean = true
                                    }
                                    break
                                }
                                // 枚举
                                case 'ENUM': {
                                    if (obj[name].in === undefined) {
                                        obj[name].in = typeOptions.values
                                    }
                                    break
                                }
                                // JSON
                                case 'JSON': {
                                    // if (obj[name].default && typeOptions.default) {
                                    //     if (Array.isArray(typeOptions.default)) obj[name].default = []
                                    // }
                                    break
                                }
                                case 'JSONTYPE': {
                                    break
                                }
                                // 日期
                                case 'DATEONLY': {
                                    if (obj[name].date === undefined) {
                                        obj[name].date = true
                                    }
                                    break
                                }
                                // 时间
                                case 'TIME': {
                                    if (obj[name].time === undefined) {
                                        obj[name].time = true
                                    }
                                    break
                                }
                                // 时间日期
                                case 'DATE': {
                                    if (obj[name].datetime === undefined) {
                                        obj[name].datetime = true
                                    }
                                    break
                                }
                                default: {
                                    // 其他类型无法自动匹配规则
                                    // throw new Error(`app/core/logic.js => ${typeName} is not supported 'auto' or 'force'`)
                                }
                            }
                        }
                    }
                }
            }
        }
        return obj
    }

    // static ApplyCheck(base={}, options= {}) {

    //     // 预处理
    //     let obj = Object.assign({}, base)
    //     for (let key of ['field', 'exclude', 'required']) {
    //         if (options[key] && typeof options[key] === 'string') {
    //             options[key] = required.split(/\s*,\s*/)
    //         }
    //     }

    //     const {field, exclude, extend, required} = options

    //     // 应用参数与反应用参数
    //     if (helper.isArray(field)) {
    //         for (let name in obj) {
    //             if (~field.indexOf(name)) {
    //                 delete obj[name]
    //             }
    //         }
    //     } else if (helper.isArray(exclude)) {
    //         for (let key of exclude) {
    //             delete obj[key]
    //         }
    //     }

    //     // 合并参数
    //     // if (attrs) {}

    //     // 必要参数
    //     if (required && helper.isArray(required)) {
    //         for (let name of required) {
    //             if (obj[name]) {
    //                 obj[name].required = true
    //             }
    //         }
    //     }

    //     // 继承参数
    //     if (extend && typeof extend === 'object') {
    //         for (let name in obj) {
    //             obj[name] = helper.extend(obj[name], extend[name])
    //         }
    //     }
    //     return obj
    // }
}