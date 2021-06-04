const helper = require('@dgteam/helper')

const PARAM = Symbol('context-param')
const POST = Symbol('context-post')

module.exports = {

    /**
     * 获取查询参数
     * @param {string} name - 参数名，若不传则获取所有查询参数
     * @param {any} value - 参数值，若传本值则会对该参数进行设置
     */
    param(name, value) {
        if (!this[PARAM]) {
            // 合并 params 与 query 参数，params 参数有更高合并优先级
            this[PARAM] = Object.assign({}, this.request._query || this.request.query, this.params )
        }
        if (!name) return this[PARAM]
        if (helper.isObject(name)) {
            this[PARAM] = Object.assign(this[PARAM], name)
            return this
        }
        if (value === undefined) {
            if (typeof name === 'string' && name.indexOf(',') > -1) {
                name = name.split(/\s*,\s*/)
            }
            if (Array.isArray(name)) {
                const value = {}
                name.forEach(item => {
                    const val = this[PARAM][item]
                    if (val !== undefined) {
                        value[item] = val
                    }
                })
                return value
            }
            return this[PARAM][name]
        }
        this[PARAM][name] = value
        return this
    },

    /**
     * 获取请求体参数
     * @param {string} name - 参数名，若不传则获取所有查询参数
     * @param {any} value - 参数值，若传本值则会对该参数进行设置
     */
    post(name, value) {
        if (!this[POST]) {
            const json = this.request.body // && this.request.body.post;
            this[POST] = Array.isArray(json) ? Array.from(json) : Object.assign({}, json)
        }
        if (!name) return this[POST]
        if (helper.isObject(name)) {
            this[POST] = Object.assign(this[POST], name)
            return this
        }
        if (value === undefined) {
            if (typeof name === 'string' && name.indexOf(',') > -1) {
                name = name.split(/\s*,\s*/)
            }
            if (Array.isArray(name)) {
                const value = {}
                name.forEach(item => {
                    const val = this[POST][item]
                    if (val !== undefined) {
                        value[item] = val
                    }
                })
                return value
            }
            return this[POST][name]
        }
        this[POST][name] = value
        return this
    }
}