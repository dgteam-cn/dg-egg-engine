'use strict';

exports.docs = {
    enable: true,
    version: true,
    directory: {}, // 自定义目录
    variable: [], // 自定义全局变量
    bodyFormat: 'urlencoded', // 默认 body 传惨格式 [urlencoded, json]
    plugins: {
        json5: false // 默认插件
    }
}