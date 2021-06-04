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

    // 提供 CORS 跨域支持
    // 自动将文件夹封装成 RESETFULL 风格接口
    router: {
        enable: true,
        path: path.resolve(__dirname, '../plugin/router')
    },
    model: {
        enable: true,
        path: path.resolve(__dirname, '../plugin/model')
    },
    logic: {
        enable: true,
        path: path.resolve(__dirname, '../plugin/logic')
    },
    docs: {
        enable: false,
        path: path.resolve(__dirname, '../plugin/docs')
    }
}