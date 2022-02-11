---
title: 声明模型
---

# 声明模型

## 基本配置
为了应对复杂业务需求，以及打通 Dgx 与 [Vuex](https://next.vuex.vuejs.org/zh/index.html) 数据交互问题，声明数据模型是在创建 [Vuex](https://next.vuex.vuejs.org/zh/index.html) 中完成的，框架体统了 Model 类去拓展 Vuex 的接口，完整的配置项请参见 [TableConfig](./objects#TableConfig) 对象。
> 注意: 在多模块架构下，会强制要求开始 [命名空间](https://next.vuex.vuejs.org/zh/guide/modules.html#%E5%91%BD%E5%90%8D%E7%A9%BA%E9%97%B4) 的配置，即 namespaced = true

```javascript
import dgx from '@dgteam/model'
const { Model } = dgx
const options = new Model({
  state: {
    // 声明一个 user 模型
    user: {
      // 传入模型配置
      options: {
        url: 'http://api.project.com/user', // 该路径仅做示范
          POST: {
            interact: true
          }
      },
      // 可以声明任意自定义参数
      title: '用户列表',
      customData: {
        msg: '自定义数据',
      }
    }
    // 可以添加其他自定义的 vuex.state
  },

  // 多模块创建示例
  modules: {
    account: new Model({
      state: {
        customer: {
          options: {
            url: 'http://api.project.com/account/customer // 该路径仅做示范
          }
        }
      }
    })
  },

  // 以下参数为 vuex 配置原生参数
  getters: {},
  actions: {},
  mutations: {},
  plugins: {},
  strict: false,
  devtools: false
  // namespaced: true // 多模块下强制要求开启
})
```
创建 options 对象后，再加载进 vuex 中
<CodeGroup>
  <CodeGroupItem title="Vue2" active>

```javascript
import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
const Store = new Vuex.Store(options)
Vue.prototype.$store = Store
export default Store
```
  </CodeGroupItem>
  <CodeGroupItem title="Vue3" active>

```javascript
import { createStore } from 'vuex'
export default createStore(options)
```
  </CodeGroupItem>
  <CodeGroupItem title="Nuxt2" active>

```javascript
export const state = () => options.state
export const getters = options.getters
export const actions = options.actions
export const mutations = options.mutations
export const namespaced = true
```
  </CodeGroupItem>
</CodeGroup>