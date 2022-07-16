'use strict';

const fs = require('fs')
const helper = require('@dgteam/helper')
const assert = require('assert')
const {JSON5_PARSE} = require('../lib/exec')

module.exports = class Document {

    constructor(app) {

        // 继承属性
        this.app = app
        this.options = app.config.docs || {}
        this.directory = this.options.directory || {}
        this.bodyFormat = ~['urlencoded', 'json'].indexOf(this.options.bodyFormat) ? this.options.bodyFormat : 'urlencoded'

        // 文档版本号
        this.name = app.name
        this.version = app.config.pkg.version
        for (const key of ['name', 'version']) {
            const value = this.options[key]
            const legalTypes = ['boolean', 'number', 'string']
            assert(~legalTypes.indexOf(typeof value) || value === undefined || value === null, `plugin-docs: options [${key}] need "${legalTypes.join(' | ')}"`)
            if (typeof value !== 'boolean' && value) {
                this[key] = value + ''
            }
        }

        // 基础属性
        this.json = {
            info: {
                name: `${this.name}_${this.version}`,
                schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            item: [],
            event: [
                {listen: "prerequest", script: {type: "text/javascript", exec: []}},
                {listen: "test", script: {type: "text/javascript", exec: []}}
            ],
            variable: []  // {key: '', value: '', type: 'string'}
        }
        this.install()
        this.mergeDirectory()


        // 插件部分
        if (this.options.plugins) {
            const {plugins} = this.options
            // json5 解析插件
            if (plugins.json5) {
                const preRequestOpt = this.json.event.find(row => row.listen === 'prerequest')
                if (preRequestOpt && preRequestOpt.script && Array.isArray(preRequestOpt.script.exec)) {
                    preRequestOpt.script.exec.push(...JSON5_PARSE)
                }
            }
        }
        // 自定义全局变量
        if (Array.isArray(this.options.variable)) {
            this.options.variable.forEach(row => {
                const {key, value, type} = row
                if (typeof key === 'string' && key) {
                    this.json.variable.push({key, value: typeof value === 'string' ? value : '', type: ~['string'].indexOf(type) ? type : 'string'})
                }
            })
        }
    }

    // 初始化安装
    install() {
        const {router} = this.app
        const deepFolder = (tunnel, fullPath, location, parent) => {
            if (location.length) {
                // 当前还是文件夹层
                const name = location.shift()
                for (const folder of tunnel.item) {
                    if (folder.name === name) {
                        return deepFolder(folder, fullPath, location, tunnel) // 继续往下级遍历
                    }
                }
                tunnel.item.push({name, path: name, item: []})
                return deepFolder(tunnel.item[tunnel.item.length - 1], fullPath, location, tunnel)
            } else {

                // 当前需要遍历 action
                const logic = this.app.logic[fullPath]
                if (typeof logic === 'object' && logic.document !== false) {

                    const RESTful = logic.RESTfull || logic.RESTful // TODO 兼容旧版本 RESTful 字段命名错误 BUG

                    if (RESTful) {
                        tunnel.item.push(...this.addApis('index', fullPath, RESTful))
                    }
                    for (const action in router.format.controller[fullPath]) {
                        if (logic.actions) {
                            tunnel.item.push(...this.addApis(action, fullPath, logic.actions[action]))
                        }
                    }
                    if (logic.title && parent) {
                        tunnel.title = logic.title
                    }
                }
            }
        }
        for (const controllerPath in router.format.controller) {
            deepFolder(this.json, controllerPath, controllerPath.substr(1).split('/') )
        }
    }

    // 合并目录
    mergeDirectory() {
        const {directory} = this
        const deepFolder = (tunnel, location='') => {
            if (tunnel.name) {
                location = location ? location + '/' + tunnel.name : tunnel.name
                if (directory[location]) {
                    tunnel.name = directory[location] + ' ' + tunnel.name
                } else {
                    const logic = this.app.logic[`/${location}`]
                    if (logic && logic.title) {
                        tunnel.name = logic.title + ' ' + tunnel.name
                    }
                }
            }
            if (tunnel.item && tunnel.item.length > 0) {
                for (const item of tunnel.item) {
                    deepFolder(item, location)
                }
            }
        }
        deepFolder(this.json)
    }

    // 添加 api
    addApis(action, fullPath, logic={}) {

        const apis = []
        const host = ["{{BASE}}"]
        const rowsMap = new Map()
        const formatParam = (api, checkup) => {
            // 填充注释
            for (const key in checkup) {

                let description = ''
                let required = false
                let type = null

                // 必选
                if (checkup[key].required) {
                    description += '* '
                    required = true
                } else if (checkup[key].requiredIf) {
                    description += '! '
                }
                // 标题
                if (checkup[key].title) {
                    description += `${checkup[key].title} `
                }
                // 类型与范围
                if (checkup[key].int) {
                    description += `INT ` // 整型
                    type = 'integer'
                    if (typeof checkup[key].int === 'object') {
                        description += `${checkup[key].int.min ? checkup[key].int.min : ''}-${checkup[key].int.max ? checkup[key].int.max : ''}`
                    }
                } else if (checkup[key].float) {
                    description += `FLOAT ` // 浮点数
                    type = 'flaot'
                    if (typeof checkup[key].float === 'object') {
                        description += `${checkup[key].float.min ? checkup[key].float.min : ''}-${checkup[key].float.max ? checkup[key].float.max : ''}`
                    }
                } else if (checkup[key].string) {
                    description += `STRING ` // 字符串
                    type = 'string'
                    if (typeof checkup[key].length === 'object') {
                        description += `${checkup[key].length.min ? checkup[key].length.min : ''}-${checkup[key].length.max ? checkup[key].length.max : ''}`
                    } else if (typeof checkup[key].length === 'number') {
                        description += `(${checkup[key].length})`
                    }
                } else if (checkup[key].date) {
                    description += `DATE yyyy-MM-dd` // 日期
                    type = 'date'
                } else if (checkup[key].datetime) {
                    description += `DATETIME yyyy-MM-dd hh:mm:ss` // 日期时间
                    type = 'datetime'
                } else if (checkup[key].time) {
                    description += `TIME hh:mm:ss` // 时间
                    type = 'time'
                } else if (checkup[key].in) {
                    description += `EMUN [ ${checkup[key].in.join(' | ')} ]` // 枚举
                    type = 'emun'
                } else if (checkup[key].boolean) {
                    description += `BOOLEAN` // 布尔值
                    type = 'boolean'
                }
                if (checkup[key].description) {
                    description += `; ${checkup[key].description}`
                }
                const rowData = {key, value: checkup[key].default ? checkup[key].default: '', description, required, type}
                if (typeof rowData.value === 'object') {
                    rowData.value = JSON.stringify(rowData.value)
                }
                if (api.request.method === 'GET') {
                    if (typeof rowData.value === 'number') {
                        rowData.value = rowData.value.toString()
                    }
                    api.request.url.query.push(rowData)
                } else {
                    switch (this.bodyFormat) {
                        case 'json': {
                            rowsMap.set(rowData.key, rowData)
                            break
                        }
                        case 'formdata': {
                            api.request.body.formdata.push({...rowData, type: 'text'})
                            break
                        }
                        case 'urlencoded':
                        default: {
                            api.request.body.urlencoded.push({...rowData, type: 'text'})
                        }
                    }
                }
            }
            if (this.bodyFormat === 'json') {
                api.request.body.mode = 'raw'
                api.request.body.options = {raw: {language: "json"}}
                if (rowsMap.size > 0) {
                    const jsonRows = Array.from(rowsMap, ([key, row], index) => {
                        let str = `"${row.key}": ${JSON.stringify(row.value)}`
                        if (rowsMap.size > index + 1) {
                            str += ','
                        }
                        if (this.options.plugins && this.options.plugins.json5) {
                            if (row.value === '' || row.value === undefined) {
                                str = '// ' + str
                            }
                            if (row.description) {
                                str += ` // ${row.description}`
                            }
                        }
                        return str
                    })
                    api.request.body.raw = `{\n    ${jsonRows.join('\n    ')}\n}`
                    // if (api.request.method === 'POST' && api.request.url.raw === '{{BASE}}/business/cashbook') {
                    //     console.log(api.request.body.raw)
                    // }
                    // "{\n    \"a\": 15\n}"
                    // "{\n    \"a\": 15,\n    \"b\": false\n}",
                    // "{\n    \"a\": 15, // no\n    \"b\": false,\n    \"c\": \"11\"\n}"
                } else {
                    api.request.body.raw = '{}'
                }

            }
            return api
        }

        // 身份鉴权判定
        if (action === 'index') {
            for (const identity in logic) {
                for (let method in logic[identity]) {
                    method = method.toUpperCase()
                    const header = [
                        {key: "Authorization", value: "{{TOKEN}}", description: '授权令牌', type: "text"},
                        {key: "Identity", value: identity, description: `请求身份 ${identity}`,  type: "text"},
                        {key: "Accept-Language", value: "{{LOCALE}}", description: `语言`,  type: "text"}
                    ]
                    const createApi = pathId => {
                        return helper.origin({
                            name: `${identity} /${pathId ? ':id' : ''}`,
                            request: {
                                method, header, description: '',
                                body: {
                                    mode: "urlencoded", formdata: [], urlencoded: []
                                },
                                url: {
                                    path: `${fullPath.substr(1)}${pathId ? '/:id' : ''}`.split('/'),
                                    raw: `{{BASE}}${fullPath}${pathId ? '/:id' : ''}`,
                                    host, variable: pathId ? [{key: 'id', value: ''}] : [],
                                    query: []
                                }
                            }
                        })
                    }
                    const needId = Boolean(~['GET', 'PUT', 'DELETE'].indexOf(method))
                    apis.push(formatParam( createApi(needId), logic[identity][method] || {} )) // PUT DELETE 方法要求指定 id
                }
            }
        } else {

            const {title, description='', document= {}} = logic
            let {methods, identitys} = logic

            if (document !== false) {
                let method = null
                if (!methods || !methods.length) {
                    methods = ["GET"]
                } else if (typeof methods === 'string') {
                    methods = methods.replace(/\s+/g, "").split(',')
                }
                method = methods[0].toUpperCase()

                let identity = null
                if (!identitys || !identitys.length) {
                    identitys = ["default"]
                } else if (typeof identitys === 'string') {
                    identitys = identitys.replace(/\s+/g, "").split(',')
                }
                identity = identitys[0]

                const header = [
                    {key: "Authorization", value: "{{TOKEN}}", description: '授权令牌', type: "text"},
                    {key: "Identity", value: identity, description: `请求身份 ${identitys.join(' | ')}`,  type: "text"}
                ]
                apis.push(
                    formatParam({
                        name: title ? `${identity} /${action} - ${title}` : action,
                        request: {
                            method, header, description,
                            body: {
                                mode: "urlencoded", formdata: [], urlencoded: []
                            },
                            url: {
                                path: `${fullPath.substr(1)}/${action}`.split('/'),
                                raw: `{{BASE}}${fullPath}/${action}`,
                                host,
                                query: []
                            }
                        },
                        // 自定义字段
                        // disuse: true // 接口废弃
                        // version: '0.1' // 版本号新增
                        // event : [] // 事件
                        ...document
                    }, logic.checkup || {})
                )
            }
        }

        return apis
    }

    // 导出到本地
    exportJSON(exportPath=this.app.baseDir) {

        // 多版本模式
        // const path = `${exportPath}/app/public/documentation/${this.app.config.pkg.version}`
        // const name = `${this.name}.${helper.time(new Date(), 'yyyyMMddhhmmss')}.postman.json`

        // 单版本覆盖模式
        const path = `${exportPath}/app/public/docs/`
        const name = `${this.name}.${this.version}.postman.json`
        if (!fs.existsSync(path)) fs.mkdirSync(path, {recursive: true})
        fs.writeFileSync(`${path}/${name}`, JSON.stringify(this.json))
    }
}