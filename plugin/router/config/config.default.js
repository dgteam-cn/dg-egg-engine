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
            camelCase: true, // path 自动转为驼峰命名
            middleware: {},
            // 部分需求需要解析  /user/5/address/6 为 /user/address?user=5&address=6 的情况
            // 因此 primaryKeyAdaptor 需要判断是否为 controller.action name 的一部分（即上诉例子中的 user 和 address） !!! 等待后续解决方案
            primaryKey: 'id', // 默认路由主键字段
            primaryKeyAdaptor: null, // {Function} 主键适配器 return: primaryKey
            primaryKeySeparator: ',', // [未实装] 主键分隔符
            rules: {} // [未实装] 自定义匹配路由规则
        }
    }
}