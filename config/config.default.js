'use strict';

// eslint-disable-next-line no-unused-vars
module.exports = appInfo => {
    return {

        project: {
            name: 'egg-engine', // 项目名称
            identitys: ['center'], // 特殊身份类型 investor
            authorization: {
                secret: '@dgteam/egg-engine' // 修改后会导致所有用户 token 失效
            }
        },
        // cluster: {
        //     listen: {
        //         port: 7001,
        //         hostname: '127.0.0.1',
        //         workers: 2
        //     }
        // },

        bodyParser: {
            enable: true,
            enableTypes: ['json', 'form', 'xml'],
            formLimit: '1mb',
            jsonLimit: '1mb',
            xmlLimit: '1mb',
            queryString: {
                arrayLimit: 100, // 数组最大长度
                depth: 5, // 对象最深级别
                parameterLimit: 1000 // 最大参数
            },
            onerror: function (err, ctx) {
                ctx.$err = 422
            }
        },
        multipart: {
            mode: 'file', // 支持普通模式或者流数据
            // autoFields: true,
            fileSize: '3mb', // 最大上传大小限制
            cleanSchedule: {
                cron: '0 30 4 * * *' // 自动清除文件时间
            }
        },

        keys: '@dgteam/egg-engine', // 这个用于 Cookie 加密算法的关键字
        cookies: {
            httpOnly: true
            // sameSite: 'none|lax|strict',
        },
        notfound: {
            // enable: false
        },

        // onClientError: async (err, socket, app) => {
        //     return {
        //         status: 500,
        //         body: {
        //             err: 500
        //         }
        //     }
        // },

        gzip: {
            enable: false, // 大部分都会有
            threshold: 5120 // 响应体若小于 5 kb 不进行 gzip 压缩
        },

        // 系统安全
        security: {
            csrf: {
                enable: false // 关闭自动跨域防护
            },
            domainWhiteList: ['*']
        },

        logger: {
            level: 'NONE' // 关闭日志打印
            // consoleLevel: 'NONE',
        }
    }
}
