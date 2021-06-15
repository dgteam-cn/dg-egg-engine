const {isEmpty, isArray, isObject} = require('@dgteam/helper')
const {base64Decode} = require('@dgteam/helper/dist/hash')

function trimStr(str) {
    return str.replace(/(^\s*)|(\s*$)/g, "");
}

class Items extends Array {

    constructor(items, opt) {
        super(...items)
        this.select = 'default'
        if (opt) {
            let {count, total, size, page, marker} = opt
            if (marker) {
                this.select = 'marker'
                this.marker = marker
            } else {
                this.select = 'page'
                this.page = parseInt(page)
                this.size = parseInt(size)
                if (count || count === 0) {
                    this.count = parseInt(count)
                }
                if (total != undefined) {
                    this.total = parseInt(total)
                } else if (this.count !== undefined) {
                    if (size > 1) {
                        this.total = this.count > 0 ? Math.ceil(this.count / size) : 1
                    }
                }
            }
        }
    }

    // 获取列表信息
    getItemsInfo() {
        const {select, count, total, size, page, marker} = this
        if (this.select == 'page') {
            return {select, count, total, size, page}
        } else if (this.mode == 'marker') {
            return {select, marker}
        }
        return {select}
    }

    // 转化成普通数组
    toJSON() {
        const list = []
        for (const item of this) {
            list.push(item.toJSON())
        }
        return list
    }
}

module.exports = class Model {

    constructor(name, app) {
        this.name = name
        this.app = app
        this.options = {
            where: {},
            order: {},
            page: null,
            field: {},
            fieldReverse: {},
            scope: {},
            include: [],
            limit: undefined,
            offset: undefined,
            marker: undefined,
            paranoid: true // 不查询软删除的记录
        }
        this.client = this._deepSearcher(this.app.model, name.split('/'))
    }

    // 查询模型实例
    _deepSearcher(tunnel, paths) {
        // 首字母大写
        const nametoUpperCase = str => str && typeof str === 'string' ? str.charAt(0).toUpperCase() + str.slice(1) : str
        const target = paths.splice(0, 1)[0]
        if (target && typeof target === 'string') {
            const name = nametoUpperCase(target)
            if (tunnel[name] && paths.length) {
                return this._deepSearcher(tunnel[name], paths) // 深层查询
            } else if (tunnel[name]['Index']) {
                return tunnel[name]['Index']
            } else if (tunnel[name]) {
                return tunnel[name]
            }
            throw this._error('.deepSearcher() => target is undefined.')
        } else {
            throw this._error('.deepSearcher() => paths is invalid.')
        }
    }

    // 格式化筛选参数
    _formatOption(config=this.options) {
        const {where, include, order, page, limit, offset, field, fieldReverse, paranoid} = config
        const options = {limit, offset, include, order: [], paranoid}
        if (page) {
            const {current, size} = page
            options.limit = size
            options.offset = (current - 1) * size
        }
        if (!isEmpty(field) || !isEmpty(fieldReverse)) {
            options.attributes = {}
            if (!isEmpty(field)) {
                options.attributes.include = Object.keys(field)
            }
            if (!isEmpty(fieldReverse)) {
                options.attributes.exclude = Object.keys(fieldReverse)
            }
        }
        // if (!isEmpty(field)) {
        //     options.attributes = Object.keys(field)
        // }
        // if (!isEmpty(fieldReverse)) {
        //     options.attributes = { exclude: Object.keys(fieldReverse) }
        // }
        if (order && isObject(order)) {
            for (let key in order) {
                options.order.push([key, order[key]])
            }
        }
        options.where = this._whereFactory(where)
        return options
    }

    _whereFactory(opt) {
        const {Op} = this.app.Sequelize
        for (const key in opt) {
            const type = typeof opt[key]
            if (type === undefined) {
                delete opt[key]
            } else if (isArray(opt[key])) {
                let action = opt[key].shift()
                let value = opt[key].shift()
                // 20210429 -> 由于 null 属于有效字符（在 MYSQL 中有意义），而 js 中 null != undefined 会出现无法执行
                if (typeof action === 'string' && (value || (value !== undefined || !Number.isNaN(value)))) {
                    action = action.toUpperCase()
                    const OpMap = {
                        '=': Op.and, '>': Op.gt, '>=': Op.gte, '<': Op.lt, '<=': Op.lte, '!=': Op.ne,
                        'BETWEEN': Op.between, 'NOTBETWEEN': Op.between, 'IN': Op.in, 'NOTIN': Op.notIn, 'LIKE': Op.like, 'NOTLIKE': Op.notLike
                    }

                    if (~['BETWEEN', 'NOTBETWEEN', 'IN', 'NOTIN'].indexOf(action)) {
                        if (typeof value === 'string') {
                            value = value.split(/\s*,\s*/)
                        } else if (!isArray(value)) {
                            value = [value]
                        }
                        if (opt[key].length > 0) {
                            value = value.concat(opt[key])
                        }
                    }
                    opt[key] = {[OpMap[action]]: value}
                } else {
                    delete opt[key]
                }
            }
        }
        return opt
    }
    _error(message) {
        return new Error(`[SequelizeFactory] - ${message}`)
    }

    /**
     * @name 关联查询
     * @param {Array<Object>|Object} [opt] - 模型数组（可以是封装的 Model 或是 sequelize model，可以是数组或者 arguments）
     * @param {Boolean}              [opt.paranoid] - 是否剔除软删除的数据
     * @param {Array<String>}        [opt.attributes] - 子集中需要显示的字段，默认全部字段
     * @param {Boolean}              [opt.required] - 如果该行没有子记录，则父级也标识无效，连同父级也不返回
     * @param {Object}               [opt.where] - 子记录的查询条件，若使用了则默认开启 required = true，但是可以手动覆盖调为 false
     * @param {Object}               [opt.association] - 临时关联配置，用于没有事先关联或需要改变原来的模型关系(注意该关系数据全局)
     * @param {Object}               [opt.include] - 还能继续在 include 其他关系，但是深层对象需要自己提取 sequelize model 对象
     */
    include(opt) {
        
        // 2021-06-04 改为支持 Set 格式
        const options = Array.isArray(opt) || opt instanceof Set ? opt : arguments
        for (let row of options) {
            if (row instanceof Model) {
                row = row.client
            } else if (row.model && row.model instanceof Model) {
                row.model = row.model.client
            }
            if (row.where) {
                row.where = this._whereFactory(row.where)
            }
            this.options.include.push(row)
        }
        return this
    }


    where(opt) {
        if (opt && typeof opt === 'object') {
            this.options.where = Object.assign(this.options.where, opt)
        }
        return this
    }
    scope(opt) {
        if (opt && typeof opt === 'object') {
            this.options.scope = Object.assign(this.options.scope, opt)
        }
        return this
    }

    limit(limit, offset) {
        if (limit) {
            try {
                limit = parseInt(limit)
            } catch (err) {}
            if (typeof limit === 'number' && limit > 0) {
                this.options.limit = parseInt(limit)
            }
        }
        if (typeof offset === 'number' && offset > 0) {
            try {
                offset = parseInt(offset)
            } catch (err) {}
            if (typeof offset === 'number' && offset > 0) {
                this.options.limit = parseInt(offset)
            }
        }
        return this
    }
    page(current = 1, size = 16) {
        if (typeof current === 'string') current = Number(current)
        if (typeof size === 'string') size = Number(size)
        if (typeof current != 'number' || typeof size != 'number' || Number.isNaN(current) || Number.isNaN(size)) throw this._error("page() => 'page' or 'size' need integer.")
        if (current < 1 || size < 1) throw this._error("page() => 'page' or 'size' need integer.")
        this.options.page = {current, size}
        return this
    }
    field(opt) {
        if (opt) {
            if (typeof opt === 'string') {
                opt = opt.split(/\s*,\s*/)
            }
            for (const key of opt) {
                this.options.field[key] = true
            }
        }
        return this
    }
    fieldReverse(opt) {
        if (opt) {
            if (typeof opt === 'string') {
                opt = opt.split(/\s*,\s*/)
            }
            for (const key of opt) {
                this.options.fieldReverse[key] = true
            }
        }
        return this
    }
    order(opt) {
        if (opt) {
            let list = []
            if (typeof opt === 'string') {
                list = opt.split(/\s*,\s*/)
            } else if (isArray(opt)) {
                list = opt
            }
            for (let row of list) {
                if (typeof row === 'string') {
                    row = trimStr(row).split(' ')
                }
                if (!isArray(row)) {
                    throw this._error("order() => 'opt' is invalid.")
                }
                const [key, sort] = row
                if (typeof key != 'string' || !~['ASC', 'DESC'].indexOf(sort)) {
                    throw this._error("order() => 'opt' is invalid.")
                }
                this.options.order[key] = sort
            }
        }
        return this
    }


    find() {
        const {where, attributes, include, order, paranoid} = this._formatOption()
        return this.client.findOne({where, attributes, include, order, paranoid})
    }
    select() {
        const {where, attributes, include, limit, offset, order, paranoid} = this._formatOption()
        return this.client.findAll({where, attributes, include, limit, offset, order, paranoid})
    }
    selectMarker(marker) {
        if (marker && typeof marker === 'string') {
            try {
                this.options.marker = base64Decode(marker)
            } catch (err) {
                this.options.marker = ''
            }
        } else {
            this.options.marker = ''
        }
        return this.select()
    }

    // 分页查询
    selectPage(current, size) {
        if (current) this.page(current, size)
        const formatData = this._formatOption()
        const {where, attributes, include, order, paranoid} = formatData
        const {limit = 12, offset = 0} = formatData
        return this.client.findAndCountAll({where, attributes, include, limit, offset, order, paranoid}).then(res => {
            const {count, rows: items} = res
            return new Items(items, {count, size: limit, page: Math.ceil(offset / limit) + 1})
        })
    }

    /**
     *
     * @param {Object}  [options] 配置对象
     * @param {Object}  [options.include] 如果提供include选项，则将计算匹配关联的数量。
     * @param {Boolean} [options.distinct] 不同的
     */
    count(options) {
        const {where, paranoid} = this._formatOption()
        return this.client.count({...options, where, paranoid})
    }
    min(field, options) {
        const {where, paranoid} = this._formatOption()
        return this.client.min(field, {where, paranoid, ...options})
    }
    max(field, options) {
        const {where, paranoid} = this._formatOption()
        return this.client.max(field, {where, paranoid, ...options})
    }
    sum(field, options) {
        const {where, paranoid} = this._formatOption()
        return this.client.sum(field, {where, paranoid, ...options})
    }


    add(item, options) {
        return this.client.create(item, options)
    }
    thenAdd(item, check) {
        this.where(check)
        const {where, paranoid} = this._formatOption()
        return this.client.findOrCreate({where, paranoid, defaults: item})
    }
    addMany(list) {
        return this.client.bulkCreate(list) // 批量增加
    }


    update(item={}) {
        const {where, paranoid} = this._formatOption()
        return this.client.update(item, {where, paranoid}) // 更新数据
    }
    thenUpdate(item={}) {
        return this.client.upsert(item) // 若包含主键则更新数据，否则新增数据，此处无法 where 限制条件
    }

    increment(key, number=1) {
        const update = {}
        if (typeof key === 'string') {
            update[key] = this.app.Sequelize.literal(`\`${key}\` +${number}`)
        } else if (isArray(key)) {
            for (const k of key) {
                update[k] = this.app.Sequelize.literal(`\`${k}\` +${number}`)
            }
        } else if (isObject(key)) {
            for (const k in key) {
                update[k] = this.app.Sequelize.literal(`\`${k}\` +${key[k]}`)
            }
        }
        const {where, paranoid} = this._formatOption()
        // return this.client.update({[key]: this.app.Sequelize.literal(`\`${key}\` +${number}`)}, {where, paranoid})
        // 如果是 item 实例，可以直接 item.increment({ [key]: number })
        return this.client.update(update, {where, paranoid})
    }
    decrement(key, number=1) {
        const update = {}
        if (typeof key === 'string') {
            update[key] = this.app.Sequelize.literal(`\`${key}\` -${number}`)
        } else if (isArray(key)) {
            for (const k of key) {
                update[k] = this.app.Sequelize.literal(`\`${k}\` -${number}`)
            }
        } else if (isObject(key)) {
            for (const k in key) {
                update[k] = this.app.Sequelize.literal(`\`${k}\` -${key[k]}`)
            }
        }
        const {where, paranoid} = this._formatOption()
        // return this.client.update({[key]: this.app.Sequelize.literal(`\`${key}\` +${number}`)}, {where, paranoid})
        return this.client.update(update, {where, paranoid})
    }

    // 删除数据
    delete({force=false}={}) {
        const {where} = this._formatOption()
        if (isEmpty(where) ) throw this._error('delete() => item need condition.')
        return this.client.destroy({where, force})
    }
    // 恢复数据（仅限软删除）
    restore({force=false}={}) {
        const {where} = this._formatOption()
        if (isEmpty(where) ) throw this._error('restore() => item need condition.')
        return this.client.restore({where, force})
    }


    paranoid(opt=true) {
        this.options.paranoid = opt
        return this
    }
    startTrans() {}
    commit() {}
    rollback() {}

    // TODO 测试事务
    transaction(fun = new Function()) {
        return new Promise(resolve => {
            return this.app.Sequelize.transaction(async t => {
                try {
                    const result = await fun(t)
                    resolve({err: 0, msg: 'sequelize transaction success => commit.', result})
                } catch (err) {
                    resolve({err: 1, msg: 'sequelize transaction fail => rollback.', result: err})
                }
            })
        })
    }

    sync() {
        return this.client.sync({force: false, alter: true}).then(res => ({err: 0, data: res}), err => ({err: 500, data: err}))
    }

    getAttrs() {
        const obj = {}
        for (const key in this.client.tableAttributes) {
            const row = this.client.tableAttributes[key]
            const {comment, defaultValue} = row
            const typeSQL = row.type ? row.type.constructor.name : null
            obj[key] = {comment, typeSQL, default: defaultValue}
            if (row.autoIncrement) obj[key].autoIncrement = true
            if (row.primaryKey) obj[key].primaryKey = true
            if (row.type) {
                if (row.type._length) obj[key].length = row.type._length
            }
            if (typeSQL) {
                // TINYINT, SMALLINT, MEDIUMINT, INTEGER, BIGINT, FLOAT, DECIMAL, // [可用属性] 无符号：UNSIGNED  填充零：ZEROFILL
                // CHAR, STRING, TEXT, UUID,
                // DATE, TIME, DATEONLY, BOOLEAN, ENUM, VIRTUAL,
                // NOW, UUIDV1, UUIDV4
                if (~['TINYINT', 'SMALLINT', 'MEDIUMINT', 'INTEGER', 'BIGINT', 'FLOAT', 'DECIMAL'].indexOf(typeSQL)) {
                    obj[key].type = 'number'
                } else if (typeSQL === 'BOOLEAN') {
                    obj[key].type = 'boolean'
                } else {
                    obj[key].type = 'string'
                }
            }
        }
        return obj
    }
    getIndexs() {
        return this.client._indexes
    }
    // getPrimaryKeys() {
    //     return this.client.primaryKeys
    // }
    getOptions() {
        return this.client.options
    }
}