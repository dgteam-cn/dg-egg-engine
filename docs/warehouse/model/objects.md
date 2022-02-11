---
title: 内置对象
---

# 内置对象

## 配置项
### ModelConfig
+ 在 Vue 加载插件时候使用的配置
```javascript
const ModelConfig = {
  store: Store, // {Object} vuex 的实例，某些场景框架能够自动获取，但要确保已经安装了 vuex
  httpAdapter: axios, // {Object} 网络适配器，支持传入 axios 与 uni.request 对象
  uniRequestAdapter: false, // {Boolean} 开启后 uni.request 的传参和回参方式会被框架自动 axios 化
  primaryKey: 'id', // {String} 全局配置数据模型的主键键名，默认值 "id"
  GET: {
    interact: true, // {Boolean} 开启 GET 方法的数据联动效果，默认值 true
    mode: 'page' // [预留字段] 
  },
  POST: {
    interact: false // {Boolean} 开启 POST 方法的数据联动效果，默认值 false
  },
  PUT: {
    interact: true // {Boolean} 开启 PUT 方法的数据联动效果，默认值 true
  },
  PATCH: {
    interact: true // 【预留字段】
  },
  DELETE: {
    interact: true // {Boolean} 开启 DELETE 方法的数据联动效果，默认值 true
  }
}
```

### TableConfig
+ 在声明数据模型时使用的配置
```javascript
const TableConfig = {
  options: {
    url: '', // {String} 请求地址，支持 Path Variables
    GET: {
      interact: true, // {Boolean} 开启 GET 方法的数据联动效果，默认值 true
      mode: 'page' // [预留字段] 
    },
    POST: {
      interact: false // {Boolean} 开启 POST 方法的数据联动效果，默认值 false
    },
    PUT: {
      interact: true // {Boolean} 开启 PUT 方法的数据联动效果，默认值 true
    },
    PATCH: {
      interact: true // 【预留字段】
    },
    DELETE: {
      interact: true // {Boolean} 开启 DELETE 方法的数据联动效果，默认值 true
    },
    limit: {}, // {Object} 当前模型执行 GET 时，fetchConfig.params 会强制去继承该对象
    only: false, // {Boolean} 为当前模型所有 RESTful 方法开启请求唯一键设置（需要网络适配器支持）
    silent: false, // {Boolean} 本身无实际效果，会传递到网络适配器中
    loading: false, // {Boolean} 本身无实际效果，会传递到网络适配器中
    customData: undefined // {any} 本身无实际效果，会传递到网络适配器中
  }
  // 除了 options 的其他字段会作为 table 自定义属性添加在 table 实例中（注意不能和框架默认属性冲突） 
  // 可以放一些和数据模型相关的描述信息、字段枚举、表单验证规则等自定义对象，方便以后调用
}
```


### FetchConfig
+ 在执行 $store.dispatch('FETCH') 和 RESTful 方法的配置   
+ 在 [uni.request](https://uniapp.dcloud.io/api/request/request) 中需要开启 uniRequestAdapter = true 或手动封装转译   
+ 在 RESTfull 方法调用时候，某些参数会被覆盖   
```javascript
const TableConfig = {
  id: '', // {Number|String} 执行 GET PUT DELETE 单行数据时，需要传入数据主键
  url: '', // {String} 请求地址
  method: 'GET', // {String} 请求方式 [GET POST PUT PATCH DELETE]
  table: 'common', // {String} 关联模型，若为自定义动作，希望关联某一表，可以填写其表名
  params: {}, // {Object} 请求参数，会拼接到 url 后
  paths: {}, // 路径参数，例如 url = "/user/:user_id/address"，里面的 user_id 参数会被自动替换
  data: {}, // {Object} 请求体参数
  headers: {}, // {Object} 请求头参数
  limit: {}, // {Object} 当前模型执行 GET 时，fetchConfig.params 会强制去继承该对象
  only: false, // {Boolean} 为当前模型所有 RESTful 方法开启请求唯一键设置（需要网络适配器支持）
  silent: false, // {Boolean} 本身无实际效果，会传递到网络适配器中
  loading: false, // {Boolean} 本身无实际效果，会传递到网络适配器中
  customData: undefined // {any} 本身无实际效果，会传递到网络适配器中
}
```