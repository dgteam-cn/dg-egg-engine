// const os = require('os')

module.exports = class {

    constructor({app, paths, attrs, options, relation}) {
        /**
         * @name options
         * @param {string} modelName - 模型名，在sequelize.models属性中会使用这个名称；如果没有在options中指定表名，数据库中也会使用此属性做为表名
         * @param {string} attributes - 一个对象，其每个属性对应表中的一个列，每个列可以使用一个预定义的DataType、字符串或类型描述对象定义
         * @param modelName {string}
         * @param modelName {string}
         * @param modelName {string}
         * @param validate {object} 验证器，用于表单验证，详见 validator.js 第三方模块文档
        */
        this.app = app
        while (paths.length > 1 && paths[paths.length - 1] === 'index') {
            paths.pop()
        }

        this.name = paths[paths.length - 1]
        this.path = paths.join('/')
        this.paths = paths

        const modelName = paths[paths.length - 1] // 模型名称（第一级文件夹名称）
        const tableName = paths.join('_') // 表名称（用于建表）

        // 自动创建 ID 主键字段
        this.attrs = Object.assign({
            id: {
                type: app.Sequelize.INTEGER(10).UNSIGNED,
                autoIncrement: true,
                comment: '主键',
                primaryKey: true
            }
        }, attrs)
        for (const rowKey in this.attrs) {
            /**
             * @name column 对象配置
             * @param {DataType}        type - 列的数据类型
             * @param {boolean}         allowNull - 是否允许空值
             * @param {any}             defaultValue - 默认值，或一个 SQL 函数
             * @param {boolean|string}  unique - 唯一约束
             * @param {boolean}         primaryKey - 是否为主键
             * @param {string}          field - 设置在数据库中的字段名。设置后会，Sequelize会将属性名映射到数据库中的不同名称
             * @param {boolean}         autoIncrement - 是否自增
             * @param {string}          comment - 字段描述（自1.7+后，此描述不再添加到数据库中）
             * @param {string|Model}    references - 引用对象
             * @param {string|Model}    references.model - 如果列引用到另一个表，可以通过这个属性设置模型或字符串
             * @param {string}          references.key - 该列表示到表外键列的引用
             * @param {string}          onUpdate - 当被引用的键更新时的操作 [CASCADE, RESTRICT, SET DEFAULT, SET NULL, NO ACTION]
             * @param {string}          onDelete - 当被引用的键删除时的操作 [CASCADE, RESTRICT, SET DEFAULT, SET NULL, NO ACTION]
             * @param {function}        get - 代理访问器，可以对数据进行处理并返回新的值
             * @param {function}        set - 代理存储器，可以对数据进行处理并返回新的值
            */

            // 语法糖 title -> comment
            if (this.attrs[rowKey].title !== undefined) {
                if (typeof this.attrs[rowKey].title === 'string') {
                    this.attrs[rowKey].comment = this.attrs[rowKey].title
                }
                delete this.attrs[rowKey].title
            }

            // 语法糖 default -> defaultValue
            if (this.attrs[rowKey].default !== undefined) {
                if (typeof this.attrs[rowKey].default !== 'function') {
                    this.attrs[rowKey].defaultValue = typeof this.attrs[rowKey].default === 'object' ? JSON.parse(JSON.stringify(this.attrs[rowKey].default)) : this.attrs[rowKey].default
                }
                delete this.attrs[rowKey].default
            }
        }
        this.options = Object.assign({
            // 自动设置时间
            timestamps: true,
            createdAt: 'created_at', // timestamps = true 时，该字段为数据创建时间戳，设为 false 则禁用
            updatedAt: 'updated_at', // timestamps = true 时，该字段为数据更新时间戳，设为 false 则禁用
            deletedAt: 'deleted_at', // timestamps = true 时，该字段为数据删除时间戳，设为 false 则禁用
            paranoid: true, // 删除时启用非物理删除，对应 deletedAt 字段
            // freezeTableName: true, // 表名默认为模型名称
            comment: '',
            tableName, // 指定表名
            modelName // 指定模型名
        }, options)
        this.relation = relation
    }

    /**
     * @name 根据配置创建（实例化）数据模型
     */
    install() {

        // 实例化数据模型
        const Table = this.app.model.define('$' + this.path, this.attrs, this.options)

        // 创建数据模型关联关系
        Table.associate = () => {
            if (this.relation && this.relation.length) {

                // 首字母大写
                const nametoUpperCase = str => {
                    if (str && typeof str === 'string') {
                        str = str.toLocaleLowerCase()
                        str = str.charAt(0).toUpperCase() + str.slice(1)
                    }
                    return str
                }

                /**
                 * @name 递归查询
                 * @param {Object} tunnel - 模型（目录）隧道
                 * @param {Array}  paths  - 模型路径
                 * @param {String} prefix - 上级路径前缀
                 */
                const deepSearcher = (tunnel, paths, prefix) => {
                    const condition = paths.splice(0, 1)[0]
                    if (condition && typeof condition === 'string') {
                        let name = nametoUpperCase(condition) // 首字母大写
                        if (tunnel[name] && paths.length) {
                            return deepSearcher(tunnel[name], paths, condition) // 如果直接名称匹配且 paths 没有到尽头，则进行深层查询
                        } else if (tunnel[name]) {
                            if (tunnel[name].Index) {
                                return tunnel[name].Index // 子集包含了 Index 则自动配对子集的 Index
                            }
                            return tunnel[name] // 完全匹配
                        } else if (name === 'Index' && prefix) {
                            throw new Error(`模型路径意外错误`)
                        }
                        return null
                    }
                }

                // 关联查询枚举
                const relationType = {
                    'HAS_ONE': 'hasOne',
                    'BELONG_TO': 'belongsTo',
                    'HAS_MANY': 'hasMany',
                    'MANY_TO_MANY': 'belongsToMany'
                }

                // 遍历查询
                for (const row of this.relation) {

                    let {model, type, foreign: foreignKey, target: targetKey, as, constraints} = row

                    const Self = deepSearcher(this.app.model, JSON.parse(JSON.stringify(this.paths))) // 自己
                    const Target = deepSearcher(this.app.model, model.split('/')) // 关联目标
                    if (!Target) throw new Error(`模型关联无效路径: ${this.paths.join('/')}`)
                    if (constraints === undefined) constraints = false

                    // foreignKey  targetKey  onDelete: 'RESTRICT'  onUpdate: 'RESTRICT'
                    const typeAction = relationType[type] ? relationType[type] : type
                    // console.log(this.app.model)
                    if (Self) {
                        Self[typeAction](Target, {foreignKey, targetKey, as, constraints}) // as: `$${model.split('_')}`
                    } else {
                        throw new Error('can not found model')
                    }
                }
            }
        }

        return Table
    }

    static formatPath(str) {
        const {platform} = process
        if (platform === 'win32') {
            const start = str.indexOf('app\\model') + 10
            return str.slice(start).replace(/.js/, "").split('\\') // windows 平台的路径与 linux 不一样
        } else if (platform === 'linux') {
            const start = str.indexOf('app/model') + 10
            return str.slice(start).replace(/.js/, "").split('/')
        }
    }
}