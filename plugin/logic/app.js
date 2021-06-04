'use strict';

const fs = require('fs')
const path = require('path')
// const Logic = require(`${process.env.INIT_CWD}/app/core/logic.js`)

module.exports = app => {

    // const index = app.config.coreMiddleware.indexOf('router')
    // app.config.coreMiddleware.splice(index + 1, 0, 'logic') // 在执行 logic 之前，必须先通过用户鉴权
    app.config.coreMiddleware.push('logic')

    app.beforeStart(async () => {

        // 在 APP 运行之前必须加载路由校验逻辑
        const readFileList = function(dir, location="", map={}) {
            const files = fs.readdirSync(dir)
            files.forEach(item => {
                const fullPath = path.join(dir, item)
                const stat = fs.statSync(fullPath)
                if (stat.isDirectory()) {
                    readFileList(path.join(dir, item), `${location}/${item}`, map) // 如果是目录则递归读取文件
                } else if (item && item.lastIndexOf('.js') === item.length - 3) {
                    const controller = `${location}/${item.replace(/.js/g, '')}`.replace(/\/index/g, '')
                    const logic = require(fullPath)
                    map[controller] = typeof logic === 'function' ? new logic(app, {paths: controller}) : logic
                }
            })
            return map
        }
        app.logic = readFileList(path.join(app.baseDir, './app/logic'))

        // const directory = path.join(app.config.baseDir, 'app/logic')
        // app.loader.loadToApp(directory, 'logic2')

        // console.log('\n', 'app.logic', app.logic, '\n')
    })
}