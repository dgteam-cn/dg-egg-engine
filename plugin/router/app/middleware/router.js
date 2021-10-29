'use strict';

const querystring = require('querystring')
/**
 * @name 路由解析与重定向
 */
module.exports = options => {

    /**
     * @name 判断是否是主键
     * @param {string} sample 需要判断的样本字符
     * @return {number|boolean} 若判定成功返回正确的主键值
     */
    const getPrimary = sample => {
        if (sample) {
            const primary = Number(sample)
            if (primary == sample) {
                return primary
            }
        }
        return false
    }

    /**
     * @name 路由解析与重定向
     */
    return async function(ctx, next) {

        const isDev = ctx.app.config.env !== 'prod'
        const {controller: CTRLS} = ctx.app.router.format
        const {camelCase} = ctx.app.config.router

        let module, controller, action;
        const origin = ctx.originalUrl.split('?')
        const originPath = camelCase ? Array.from(origin[0].split('/'), str => ctx._.camelCase(str)).join('/') : origin[0]
        const originaPath = originPath.replace(/(^\/*)|(\/*$)/g, "").split('/') // 注意需要去除头尾的斜杠

        // 强制模块名，若未定义则取默认值
        if (!originaPath[0] || originaPath[0] === '') {
            originaPath[0] = options['defaultModule']
        }

        // 从原始路径中拷贝一个路径进行计算
        const formatPath = Array(...originaPath)
        module = formatPath.shift() // 固定第一个为模块名


        // 取出并将 params 与 query 进行合并
        const params = {}
        const query = querystring.decode(origin[1])
        for (const key in query) {
            if (key !== '' && query[key] !== ''  && query[key] !== 'undefined') {
                params[key] = query[key]
            }
        }

        // 提取 formatPath 的 params 传参，注意不能提取第一个与最后一个
        formatPath.forEach((item, index) => {
            const primary = getPrimary(item)
            if (primary && index) {
                if (formatPath[index - 1] && formatPath.length - 1 !== index) {
                    params[formatPath[index - 1]] = primary
                    formatPath.splice(index - 1, 2)
                }
            }
        })
        // console.log({ module, controller, action, origin, originaPath, formatPath, params })

        // 根据 formatPath 尾部判断，如果为 主键 或 index, 那么可以推断 action 为 index, 否则需要下一步去推导
        const tail = formatPath[formatPath.length - 1]
        const possiblePrimary = getPrimary(tail)
        if (possiblePrimary || tail === 'index') {
            action = 'index'
            if (possiblePrimary) {
                params[options['primaryKey']] = possiblePrimary // 把组件提取出来
            }
            formatPath.pop()
        }


        // 当前 formatPath 被剔除掉了模块名与参数，如果为空则填入一个默认值
        if (!formatPath[0] || formatPath[0] === '') {
            formatPath[0] = options['defaultController']
        }


        controller = formatPath.join('/') // 如果之前获取到了 action 那么剩下的路径即是资源名

        if (CTRLS[`/${module}/${controller}`]) {
            action = options['defaultAction'] // 如果存在控制器，则取控制器，并映射默认方法
        } else {
            // 如果不存在控制器，则有可能最后一路径为动作名
            action = formatPath.pop()
            controller = formatPath.join('/') || options['defaultController']
        }

        // 若路由不存在可以直接报错
        const controllerPath = `/${module}${controller === 'index' ? '' : '/' + controller}`
        const fullPath = `${controllerPath}${action === 'index' ? '' : '/' + action}`
        if (!CTRLS[controllerPath] || action != 'index' && !CTRLS[controllerPath][action]) {
            // console.log({ module, controller, action, controllerPath, fullPath })
            return ctx.err(404, isDev ? 'resource is undefined.' : null )
        }

        // 返回结果
        ctx.api = {
            module, controller, action,
            originaPath, controllerPath, fullPath,
            params
        }
        ctx.request.url = `${fullPath}?${querystring.encode(params)}`

        return next()
    }
}