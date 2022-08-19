'use strict';

const assert = require('assert')
// const fs = require('fs')
// const path = require('path')

module.exports = app => {

    const index = app.config.coreMiddleware.indexOf('meta')
    app.config.coreMiddleware.splice(index + 1, 0, 'cors', 'router') // 增加跨域中间件、路由拦截中间件
    // app.config.coreMiddleware.push('cors', 'router')
    // console.log(app.config.coreMiddleware)

    app.beforeStart(async () => {

        // console.log('\n', 'egg-router', '\n')
        // console.log(app.config.coreMiddleware)
        // console.log(app.config.middleware)

        const {router, controller} = app
        const format = {
            map: {}, controller: {}, repeats: [],
            stats: {
                module: 0, controller: 0,  api: 0, router: 0, repeat: 0
            }
        }

        const {prefix=''} = app.config.router || {}

        // 匹配路由中间件
        const checkMiddleware = location => {

            // 递归查询
            const deepMiddleware = (tunnel, sites) => {
                if (typeof sites === 'string') sites = sites.split('/')
                const key = sites.shift()
                if (tunnel[key]) {
                    if (sites.length > 0) {
                        return deepMiddleware(tunnel[key], sites)
                    } else {
                        return tunnel[key]
                    }
                }
                return undefined
            }

            // 根据目录匹配
            const directory = app.config.router.middleware || {}
            for (let path in directory) {
                let wildcard = false
                let sites = directory[path]
                if (typeof sites === 'object') {
                    sites = directory[path].sites
                    assert(!!sites, `plugin-router: middleware sites can not be blank.`)
                }
                if (path.charAt(path.length - 1) === '*') {
                    wildcard = true
                    path = path.substr(0, path.length - 1)
                }
                if (path[0] !== '/') path = '/' + path
                if (wildcard && location.indexOf(path) === 0 || location === path) {
                    const middleware = deepMiddleware(app.middleware, sites)
                    assert(!!middleware, `plugin-router: middleware [${sites}] is undefined.`)
                    return middleware
                }
            }

            return undefined
        }

        // 批量装载 RESTful 与 action 接口
        const RESTfulFactory = function(url, ctrl, location) {
            const middleware = checkMiddleware(location)
            if (middleware) {
                router.get(`${url}`, middleware(), ctrl)
                router.post(`${url}`, middleware(), ctrl)
                router.put(`${url}`, middleware(), ctrl)
                router.del(`${url}`, middleware(), ctrl)
            } else {
                router.get(`${url}`, ctrl)
                router.post(`${url}`, ctrl)
                router.put(`${url}`, ctrl)
                router.del(`${url}`, ctrl)
            }
        }


        // 把控制器的 symbols 对象导出
        const getSymbols = function(ctrl) {
            const symbols = {}
            for (const symbol of Object.getOwnPropertySymbols(ctrl)) {
                symbols[symbol.description] = ctrl[symbol]
            }
            return symbols
        }

        // 若末尾为 index 的路由则自动设置重定向
        const indexRedirect = location => {
            return location.replace(/\/index/g, '')
        }

        const deepRouter = (ctrl, location='') => {
            if (typeof ctrl === 'function') {
                const url = indexRedirect(location)
                if (format.map[url]) {
                    // 路由重复
                    format.repeats.push(`${url} => ${location}`)
                    format.stats.repeat ++
                } else {
                    RESTfulFactory(url, ctrl, location) // 自动装载 RESTful 接口
                    format.map[url] = location
                    format.stats.router ++
                }
                format.stats.api ++
            } else if (typeof ctrl === 'object') {
                for (let name in ctrl) {
                    if (!location || location === prefix) {
                        // 当前层级为模块
                        format.stats.module ++
                    } else if (!getSymbols(ctrl).EGG_LOADER_ITEM_EXPORTS) {
                        // EGG_LOADER_ITEM_EXPORTS 表示当前对象属于控制器
                        format.controller[`${location}${name === 'index' ? '' : '/' + name}`] = {}
                        format.stats.controller ++
                    } else if (name != 'index') {
                        // 当前属于动作
                        format.controller[indexRedirect(location)][name] = {}
                    }
                    deepRouter(ctrl[name], `${location}/${name}`)
                }
            }
        }
        deepRouter(controller, prefix)

        router.format = format

        if (router.format.repeats && router.format.repeats.length > 0) {
            app.logger.error('\n', '[egg-dg-router] \n 部分控制器与方法有重名的风险，请检查:', ...router.format.repeats, '\n')
        }

        // console.log('\n', router.format, '\n')
    })
}