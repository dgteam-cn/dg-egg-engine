'use strict';

module.exports = () => {
    return {
        cors: {
            enable: true, // 是否启用跨域
            origin: '*',
            credentials: true,
            expired: 900, // 授权时间
            headers: 'Accept,Authorization,Cache-Control,Content-Type,Identity,Verify,Access,Timestamp,Sign', // 默认允许跨域头
            methods: 'GET, POST, PUT, PATCH, DELETE' // 默认允许跨方法
        },
        router: {
            defaultModule: 'home', // 默认模块
            defaultController: 'index', // 默认控制器
            defaultAction: 'index', // 默认方法
            primaryKey: 'id', // 默认路由主键字段
            middleware: {}
        }
    }
}