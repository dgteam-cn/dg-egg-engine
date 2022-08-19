'use strict';

const path = require('path')
module.exports = {

    // 数据模型管理类
    sequelize: {
        enable: true,
        package: 'egg-sequelize'
    },
    redis: {
        enable: true,
        path: path.resolve(__dirname, '../plugin/redis')
    },
    bull: {
        enable: false,
        path: path.resolve(__dirname, '../plugin/bull')
    },

    // 提供 CORS 跨域支持
    // 自动将文件夹封装成 RESETFULL 风格接口
    router: {
        enable: true, // 路由解析
        path: path.resolve(__dirname, '../plugin/router')
    },
    model: {
        enable: true, // 模型
        path: path.resolve(__dirname, '../plugin/model')
    },
    logic: {
        enable: true, // 逻辑
        path: path.resolve(__dirname, '../plugin/logic')
    },
    docs: {
        enable: false, // 自动生成 postman 文档插件
        path: path.resolve(__dirname, '../plugin/docs')
    },
    genid: {
        enable: false, // 雪花 ID 优化算法，https://gitee.com/yitter/idgenerator/tree/master
        path: path.resolve(__dirname, '../plugin/genid')
    }
}