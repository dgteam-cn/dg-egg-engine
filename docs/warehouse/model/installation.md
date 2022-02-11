---
title: 安装
---

# 安装

## 安装依赖
我们建议您使用包管理器 (Yarn、Npm) 安装, 使用打包工具 (Vite、Webpack) 进行构建

<CodeGroup>
  <CodeGroupItem title="Yarn" active>

```shell
yarn add @dgteam/model
```

  </CodeGroupItem>
  <CodeGroupItem title="Npm">

```shell
npm install @dgteam/model -S
```

  </CodeGroupItem>
</CodeGroup>

## 使用 HTTP 适配器
DGX 需要 http adapter 提供 tcp 请求的支持。根据使用环境不同，目前支持 [axios](https://www.npmjs.com/package/axios) 与 [uni.request](https://uniapp.dcloud.io/api/request/request) 两种方式。

## 安装 Vuex
Dgx 在 Vue 中是基于 [Vuex](https://next.vuex.vuejs.org/zh/index.html) 实现，在安装 dgx 之前请确保已经安装了 [Vuex](https://next.vuex.vuejs.org/zh/index.html) 相关模块。

## 安装 Dgx

<CodeGroup>
  <CodeGroupItem title="Vue2" active>

```javascript
import Vue from 'vue'
import dgx from '@dgteam/model'
import axios from 'axios'

// 提示: 在安装 DGX 之前，请确保已经安装了 Vuex 模块
Vue.use(dgx, {
    httpAdapter: axios
})
```

  </CodeGroupItem>
  <CodeGroupItem title="Vue3">

```javascript
import { createApp } from 'vue'
import App from './App.vue'
import store from './store/index.js'

import dgx from '@dgteam/model'
import axios from 'axios'

const app = createApp(App)
app.use(store) // 提示: 在安装 DGX 之前，请确保已经安装了 Vuex 模块
app.use(dgx, {
    httpAdapter: axios
})
app.mount('#app')
```

  </CodeGroupItem>
  <CodeGroupItem title="Nuxt2">

```javascript
// ./plugins/dgx.js
import Vue from 'vue'
import dgx from '@dgteam/model'
import axios from 'axios'

// 在此之前需要按照 nuxt2 官方教程引入 vuex 模块，参考链接: https://www.nuxtjs.cn/guide/vuex-store
export default ({app}) => {
    Vue.use(dgx, {
        store: app.store, // 需要传入 store 实例
        httpAdapter: axios
    })
}

```
```javascript
// ./nuxt.config.js
module.exports = {
    plugins: [
        {src: "./plugins/dgx", ssr: true}
    ],
    build: {
        transpile: ['@dgteam/model']
    }
}
```

  </CodeGroupItem>
  <CodeGroupItem title="Nuxt3">

```javascript
// 敬请期待
```

  </CodeGroupItem>
  <CodeGroupItem title="Uniapp">

```javascript
import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import store from './store'
import dgx from '@dgteam/model'
Vue.config.productionTip = false
Vue.prototype.$store = store
dgx.install(Vue, {
	store,
	httpAdapter: uni.request,
	uniRequestAdapter: true // 开启后框架自动会把 uni.request 传参、回参风格 axios 化
})

App.mpType = 'app'
const app = new Vue({
    ...App
})
app.$mount()
// #endif

// #ifdef VUE3
// 敬请期待
// #endif
```

  </CodeGroupItem>
</CodeGroup>