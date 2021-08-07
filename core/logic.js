const helper = require('@dgteam/helper')
// const user = require('../logic/account/user')
// const { app } = require('egg-mock')

const MySQLVariableRange = {
    integer: {
        'TINYINT': {min: -128, max: 127, unsigned: 255},
        'SMALLINT': {min: -32768, max: 32767, unsigned: 65535},
        'MEDIUMINT': {min: -8388608, max: 8388607, unsigned: 16777215},
        'INTEGER': {min: -2147483648, max: 2147483647, unsigned: 4294967295},
        // BIGINT 由于 JS 数值限制，小 Number.MIN_SAFE_INTEGER = -9007199254740991   Number.MAX_SAFE_INTEGER = 9007199254740991
        'BIGINT': {min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER, unsigned: Number.MAX_SAFE_INTEGER}
    }
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
                int: {min: 1, max: MySQLVariableRange.integer['INTEGER'].unsigned},
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
        let obj = {}
        if (Array.isArray(base)) {
            obj = Object.assign({}, ...base)
        } else {
            obj = typeof base === 'object' ? JSON.parse(JSON.stringify(base)) : base
        }
        if (Array.isArray(obj)) {
            const _obj = {}
            for (const attr of obj) {
                if (typeof attr === 'string') {
                    _obj[attr] = {__mode: 'force'}
                }
            }
            obj = _obj
        } else if (typeof obj === 'object') {
            for (const name in obj) {
                if (typeof obj[name] === 'string' && ~['auto', 'force'].indexOf(obj[name])) {
                    obj[name] = {__mode: obj[name]}
                } else if (obj[name] === true) {
                    obj[name] = {__mode: 'force'}
                } else if (typeof obj[name] !== 'object') {
                    obj[name] = {}
                }
            }
        } else {
            obj = {}
        }


        // 获取处理方式
        for (const key of ['field', 'exclude', 'required']) {
            if (options[key] && typeof options[key] === 'string') {
                options[key] = options[key].split(/\s*,\s*/)
            }
        }

        const {field, exclude, extend, required, mode} = options

        // 应用参数与反应用参数
        if (Array.isArray(field)) {
            for (const name in obj) {
                if (~field.indexOf(name)) {
                    delete obj[name]
                }
            }
        } else if (Array.isArray(exclude)) {
            for (const key of exclude) {
                delete obj[key]
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

        // 继承参数
        if (extend && typeof extend === 'object') {
            for (const name in extend) {
                obj[name] = Object.assign(typeof obj[name] === 'object' ? obj[name] : {}, extend[name])
            }
        }

        // 模型参数合并
        if (this.table && this.table.rawAttributes) {
            const attrs = this.table.rawAttributes
            for (const name in obj) {
                const isForce = obj[name].mode === 'force' || obj[name].__mode === 'force' || mode === 'force'
                const isAuto = obj[name].mode === 'auto' || obj[name].__mode === 'auto' || mode === 'auto' || isForce
                delete obj[name].__mode
                if (attrs[name]) {
                    // 补充标题
                    if (attrs[name].comment && (!obj[name].title || isAuto)) {
                        obj[name].title = attrs[name].comment
                    }
                    // 补充默认值
                    if (attrs[name].defaultValue && (obj[name].default === undefined && (isAuto || isForce))) {
                        obj[name].default = attrs[name].defaultValue
                    }
                    // 补充必要参数
                    if (attrs[name].allowNull === false && obj[name].required === undefined ) {
                        if (isForce || isAuto) {
                            obj[name].required = true
                        }
                    }
                    if (isForce || isAuto && attrs[name].type) {
                        let typeName = attrs[name].type.constructor.name
                        const typeOptions = attrs[name].type.options
                        if (typeName) {

                            // TINYINT, SMALLINT, MEDIUMINT, INTEGER, BIGINT, FLOAT, DECIMAL, // [可用属性] 无符号：UNSIGNED  填充零：ZEROFILL
                            // CHAR-定长字符串, STRING-变长字符串, TEXT-文本列[tiny, medium, long], UUID,
                            // DATE-时间日期, TIME-时间, DATEONLY-日期, BOOLEAN-真假, ENUM-枚举, VIRTUAL-虚拟值,
                            // // defaultValue - 默认字段填充类型
                            // NOW, UUIDV1, UUIDV4

                            if (~['TINYINT', 'SMALLINT', 'MEDIUMINT', 'INTEGER', 'BIGINT'].indexOf(typeName)) {
                                // 整数
                                if (obj[name].int === undefined) {
                                    obj[name].int = {}
                                } else if (typeof obj[name].int === 'number') {
                                    obj[name].int = {max: obj[name].int}
                                }
                                if (isForce || obj[name].int.max === undefined) {
                                    obj[name].int.max = Math.pow(10, typeOptions.length) - 1
                                }
                                if (typeOptions.unsigned) {
                                    obj[name].int.min = 0
                                } else if (isForce || obj[name].int.min === undefined) {
                                    obj[name].int.min = -obj[name].int.max
                                }
                                // 最小值不能超过限制
                                if (obj[name].int && obj[name].int.min) {
                                    const compare = typeOptions.unsigned ? 0 : MySQLVariableRange.integer[typeName].min
                                    if (obj[name].int.min <= compare) {
                                        obj[name].int.min = compare
                                    }
                                }
                                // 最大值不能超过限制
                                if (obj[name].int && obj[name].int.max) {
                                    const compare = typeOptions.unsigned ? MySQLVariableRange.integer[typeName].unsigned : MySQLVariableRange.integer[typeName].max
                                    if (obj[name].int.max >= compare) {
                                        obj[name].int.max = compare
                                    }
                                }
                            } else if (~['REAL', 'FLOAT', 'DECIMAL'].indexOf(typeName)) {
                                // 浮点数
                                if (obj[name].float === undefined) {
                                    obj[name].float = {}
                                } else if (typeof obj[name].float === 'number') {
                                    obj[name].float = {max: obj[name].float}
                                }
                                if (isForce || obj[name].float.max === undefined) {
                                    obj[name].float.max = typeOptions.precision
                                }
                                if (typeOptions.unsigned) {
                                    if (isForce || obj[name].float.min === undefined) {
                                        obj[name].float.min = -typeOptions.precision
                                    }
                                }
                                if (typeOptions.scale) {
                                    if (isForce || obj[name].float.decimal === undefined) {
                                        obj[name].float.decimal = typeOptions.scale
                                    }
                                }
                            } else if (~['CHAR', 'STRING', 'TEXT'].indexOf(typeName)) {
                                // 字符串
                                if (obj[name].length === undefined) {
                                    obj[name].length = {}
                                } else if (typeof obj[name].length === 'number') {
                                    obj[name].length = {max: obj[name].length}
                                }
                                if (isForce || obj[name].length.max === undefined) {
                                    obj[name].length.max = typeOptions.length
                                }
                            } else if ('BOOLEAN' === typeName) {
                                // 布尔值
                                if (isForce || obj[name].boolean === undefined) {
                                    obj[name].boolean = true
                                }
                            } else if ('ENUM' === typeName) {
                                // 枚举
                                if (isForce || obj[name].in === undefined) {
                                    obj[name].in = typeOptions.values
                                }
                            } else if ('JSON' === typeName) {
                                // if (obj[name].default && typeOptions.default) {
                                //     if (Array.isArray(typeOptions.default)) obj[name].default = []
                                // }
                            } else if ('JSONTYPE' === typeName) {

                            } else if ('DATEONLY' === typeName) {
                                // 日期
                                if (isForce || obj[name].date === undefined) {
                                    obj[name].date = true
                                }
                            } else if ('TIME' === typeName) {
                                // 时间
                                if (isForce || obj[name].time === undefined) {
                                    obj[name].time = true
                                }
                            } else if ('DATE' === typeName) {
                                // 时间日期
                                if (isForce || obj[name].datetime === undefined) {
                                    obj[name].datetime = true
                                }
                            } else {
                                // 其他字段无法使用自动
                                throw new Error(`app/core/logic.js => ${typeName} is not supported 'auto' or 'force'`)
                            }
                            // console.log(name, typeName, typeOptions)
                        }
                    }
                }
            }
        }
        return obj
    }

    static ApplyCheck(base={}, options= {}) {

        // 预处理
        let obj = Object.assign({}, base)
        for (let key of ['field', 'exclude', 'required']) {
            if (options[key] && typeof options[key] === 'string') {
                options[key] = required.split(/\s*,\s*/)
            }
        }

        const {field, exclude, extend, required, attrs} = options

        // 应用参数与反应用参数
        if (helper.isArray(field)) {
            for (let name in obj) {
                if (~field.indexOf(name)) {
                    delete obj[name]
                }
            }
        } else if (helper.isArray(exclude)) {
            for (let key of exclude) {
                delete obj[key]
            }
        }

        // 合并参数
        // if (attrs) {}

        // 必要参数
        if (required && helper.isArray(required)) {
            for (let name of required) {
                if (obj[name]) {
                    obj[name].required = true
                }
            }
        }

        // 继承参数
        if (extend && typeof extend === 'object') {
            for (let name in obj) {
                obj[name] = helper.extend(obj[name], extend[name])
            }
        }
        return obj
    }
}