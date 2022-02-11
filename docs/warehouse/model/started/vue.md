---
title: Vue
---


### DGX of Vue
<NpmBadge package="@dgteam/model" />

### 准备
该插件支持能运行 vue 的架构，为能和 vuex 更好的进行数据交互，

### 安装 dgx

<CodeGroup>
  <CodeGroupItem title="YARN" active>

```bash
yarn add @dgteam/model
```

  </CodeGroupItem>
  <CodeGroupItem title="NPM">

```bash
npm i @dgteam/model
```

  </CodeGroupItem>
</CodeGroup>

### 配置网络适配器
本文档提供 [axios](../adapter/axios.md) 或 [uni.request](../adapter/uniapp.md) 两种适配器示例
请根据服务端接口的情况进行修改


### 创建 DGX 基类
```javascript
import Model from '@dgteam/model/src/index'
import axios from '@/plugins/axios.js'
Model.install({
    fetch: {
        // 传入 http adapter 对象
        // 目前支持 axios 与 uni.request,
        // 推荐进一步封装 http adapter 对象，为其添加请求、响应拦截器
        // 可请在 “网络适配器” 文档中查看示例
        ajax: axios
    },
    RESTful: {
        GET: {
            // 数据联动 {Boolean} - 如果开启，执行 GET 成功后会联动更新 Model 的 list、item 等字段
            interact: true
        },
        POST: {
            // 数据联动 {Boolean} or 'start' or 'end'
            // 如果开启，执行 POST 成功后会联动在 Model 的 list 中添加该 item
            interact: false
        },
        PUT: {
            // 数据联动 {Boolean} - 如果开启，执行 PUT 成功后会联动更新 Model 响应的 item 对象
            interact: true
        },
        DELETE: {
            // 数据联动 {Boolean} - 如果开启，执行 DELETE 成功后会联动移除 Model 内响应的 item 对象
            interact: true
        }
    }
})
export default Model
```

## 声明数据模型

## 在页面中引用数据模型