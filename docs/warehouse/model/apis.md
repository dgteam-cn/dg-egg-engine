---
title: 介绍
---

# Apis

## 调用模式说明

### Table Proxy 方式
框架会检测出所有的数据模型，封装成 TableProxy 对象挂载到 $models 节点中，可以在任意 Vue Components 中进行调用。TableProxy 除了拥有 table 的属性，还封装了操作 table 的常用方法。

<CodeGroup>
  <CodeGroupItem title="单模块调用" active>

```vue
<template>
  <div>
    <h4>模型名称: {{ $models.user.name }}</h4>
    <ul>
      <li v-for="item in $models.user.list" :key="item.id">
        <span>{{ item.id }}</span>
        <span>{{ item.name }}</span>
      </li>
    </ul>    
    <button @click="$models.user.get(1)">加载列表</button>
    <button @click="$models.user.post({name: 'new user'})">新增数据</button>
  </div>
</template>
```

  </CodeGroupItem>
  <CodeGroupItem title="多模块调用">

```vue
<template>
  <div>
    <h4>模型名称: {{ $models.account.customer.name }}</h4>
    <ul>
      <li v-for="item in $models.account.customer.list" :key="item.id">
        <span>{{ item.id }}</span>
        <span>{{ item.name }}</span>
      </li>
    </ul>    
    <button @click="$models.account.customer.get(1)">加载列表</button>
    <button @click="$models.account.customer.post({name: 'new customer'})">新增数据</button>
  </div>
</template>
```

  </CodeGroupItem>
</CodeGroup>



### Components Mixin 方式
框架封装了常用的方法，通过 Vue Mixin 的方式混合到 Vue Components 中，方便调用。

<CodeGroup>
  <CodeGroupItem title="单模块调用" active>

```vue
<template>
  <div>
    <h4>模型名称: {{ Main.name }}</h4>
    <ul>
      <li v-for="item in Main.list" :key="item.id">
        <span>{{ item.id }}</span>
        <span>{{ item.name }}</span>
      </li>
    </ul>    
    <button @click="Get()">加载列表</button>
    <div>
      <span>用户名称</span>
      <input v-model="Params.name" />
      <button @click="submit()">新增数据</button>
    </div>
  </div>
</template>
<script>
import StoreMix from '@dgteam/models/dist/mixins/store.js'
export default {
  mixins: [StoreMix],
  model: 'user', // 为当前 Components 指定一个默认的数据模型，格式为 "命名空间/表名称"
  data() {
    return {
      // 若执行 Get、GetFilter、GetMore 方法但没有指定 filter 时候，框架默认会尝试从 this.Filter 获取
      Filter: {
        size: 16,
        type: 1
      },
      // 若执行 Post、Put 方法但没有指定 data 时候，框架默认会尝试从 this.Params 获取
      Params: {
        name: ''
      }
    }
  },
  computed: {
    // 若填写了 model 那么会自动映射出一个 Main 对象指向当前模型代理
    // 若页面需要提取其他模型的护具，也可以手动 computed 其他的模型：
    // User: vm => vm.$store.state.user, // 返回 table 实例
    // User: vm => vm.$models.user // 返回 tableProxy 实例（和 Main 对象等价）
  },
  methods: {
    // 会自动注入 Get、GetInit、Post、Put... 等方法
    // 若填写了 model, 那么以上方法的 path 将会有默认值，默认指向当前模型
    // 也可以手动填写其他模型的 path 取操作其他模型
    submit() {
      if (!this.Params.name) return window.alert('请填写名称') 
      return this.Post().then(res => {
        console.log(res)
        if (!res.err) {
          window.alert('提交成功')
          this.Params.name = ''
        }
        return res
      })
    }
  }
}
</script>
```

  </CodeGroupItem>
  <CodeGroupItem title="多模块调用" active>

```vue
<template>
  <div>
    <h4>模型名称: {{ Main.name }}</h4>
    <ul>
      <li v-for="item in Main.list" :key="item.id">
        <span>{{ item.id }}</span>
        <span>{{ item.name }}</span>
      </li>
    </ul>    
    <button @click="Get()">加载列表</button>
    <div>
      <span>用户名称</span>
      <input v-model="Params.name" />
      <button @click="submit()">新增数据</button>
    </div>
  </div>
</template>
<script>
import StoreMix from '@dgteam/models/dist/mixins/store.js'
export default {
  mixins: [StoreMix],
  model: 'account/customer', // 为当前 Components 指定一个默认的数据模型，格式为 "命名空间/表名称"
  data() {
    return {
      // 若执行 Get、GetFilter、GetMore 方法但没有指定 filter 时候，框架默认会尝试从 this.Filter 获取
      Filter: {
        size: 16,
        type: 1
      },
      // 若执行 Post、Put 方法但没有指定 data 时候，框架默认会尝试从 this.Params 获取
      Params: {
        name: ''
      }
    }
  },
  computed: {
    // 若填写了 model 那么会自动映射出一个 Main 对象指向当前模型代理
    // 若页面需要提取其他模型的护具，也可以手动 computed 其他的模型：
    // User: vm => vm.$store.state.account.customer, // 返回 table 实例
    // User: vm => vm.$models.account.customer // 返回 tableProxy 实例（和 Main 对象等价）
  },
  methods: {
    // 会自动注入 Get、GetInit、Post、Put... 等方法
    // 若填写了 model, 那么以上方法的 path 将会有默认值，默认指向当前模型
    // 也可以手动填写其他模型的 path 取操作其他模型
    submit() {
      if (!this.Params.name) return window.alert('请填写名称') 
      return this.Post().then(res => {
        console.log(res)
        if (!res.err) {
          window.alert('提交成功')
          this.Params.name = ''
        }
        return res
      })
    }
  }
}
</script>
```

  </CodeGroupItem>
</CodeGroup>

### Vuex Api 方式
Proxy 与 Mixin 都是基于 Vuex Api 进行上层封装，Vuex Api 方式调用仅提供一些比较底层的接口。

<CodeGroup>
  <CodeGroupItem title="单模块调用" active>

```vue
<template>
  <div>
    <h4>模型名称: {{ $store.state.user.name }}</h4>
    <ul>
      <li v-for="item in $models.user.list" :key="item.id">
        <span>{{ item.id }}</span>
        <span>{{ item.name }}</span>
      </li>
    </ul>    
    <button @click="get">加载列表</button>
    <button @click="post">新增数据</button>
  </div>
</template>
<script>
export default {
  methods: {
    get() {
      this.$store.dispatch('GET_USER', {params: {page: 1, size: 10}})
    },
    post() {
      const data = {name: 'new user'}
      this.$store.dispatch('POST_USER', {data})
    }
  }
}
</script>
```

  </CodeGroupItem>
  <CodeGroupItem title="多模块调用">

```vue
<template>
  <div>
    <h4>模型名称: {{ $store.state.account.customer.name }}</h4>
    <ul>
      <li v-for="item in $store.state.account.customer.list" :key="item.id">
        <span>{{ item.id }}</span>
        <span>{{ item.name }}</span>
      </li>
    </ul>
    <button @click="$store.dispatch('account/GET_CUSTOMER', {params: {page: 1, size: 10}})">加载列表</button>
    <button @click="$store.dispatch('account/GET_CUSTOMER', {data: {name: 'new customer'}})">新增数据</button>
  </div>
</template>
```

  </CodeGroupItem>
</CodeGroup>


## 接口列表
### Get - 加载数据
+ 按照分页的模式去加载数据列表
<CodeGroup>
  <CodeGroupItem title="Proxy" active>

```javascript
/**
 * @param {Number} page - 列表页码, 默认: 1
 * @param {Object} filter - 过滤器, 会赋值给 FetchConfig.params
 * @param {FetchConfig} opt - fetch 参数
 */
this.$models.model.get(page, filter, opt)
```

  </CodeGroupItem>
  <CodeGroupItem title="Mixin">

```javascript
/**
 * @param {Number} page - 列表页码, 默认: 1
 * @param {String} path - 模型路径, 不传则默认从 this.$options.model 中获取
 * @param {Object} filter - 过滤器, 不传自动尝试从 this.Filter 中获取, 会赋值给 FetchConfig.params
 * @param {FetchConfig} opt - fetch 参数
 */
this.Get(page, path, filter, opt)
```

  </CodeGroupItem>
  <CodeGroupItem title="Vuex">

```javascript
/**
 * @param {String} namespace - 多模块下需要传命名空间（属于 Vuex 规范）
 * @param {String} MODEL - 表名称（大写）
 * @param {FetchConfig} opt - fetch 参数
 */
this.$store.dispatch(`${namespace}/GET_${MODEL}`, opt)
```

  </CodeGroupItem>
</CodeGroup>




### GetInit - 初始化数据
> 普通的加载数据，若数据已经存在默认不会重新加载   
> 一般用于比较小的数据列表（无需翻页）例如一些枚举数据，或者快速加载第一页数据使用
<CodeGroup>
  <CodeGroupItem title="Proxy" active>

```javascript
/**
 * @param {Number} page - 列表页码, 默认: 1
 * @param {Object} filter - 过滤器, 会赋值给 FetchConfig.params
 * @param {FetchConfig} opt - fetch 参数
 */
this.$models.model.getInit(page, filter, opt)
```

  </CodeGroupItem>
  <CodeGroupItem title="Mixin">

```javascript
/**
 * @param {Number} page - 列表页码, 默认: 1
 * @param {String} path - 模型路径, 不传则默认从 this.$options.model 中获取
 * @param {Object} filter - 过滤器, 会赋值给 FetchConfig.params
 * @param {FetchConfig} opt - fetch 参数
 */
this.GetInit(page, path, filter, opt)
```

  </CodeGroupItem>
  <CodeGroupItem title="Vuex">

```javascript
// 无对应方法，需要在 Get 方法基础上自行封装
this.$store.dispatch(`${namespace}/GET_${MODEL}`, opt)
```

  </CodeGroupItem>
</CodeGroup>



### GetFilter - 根据筛选条件加载数据
> 一般用于用户改变列表的筛选条件，需要重新加载整个数据列表情形下使用
<CodeGroup>
  <CodeGroupItem title="Proxy" active>

```javascript
/**
 * @param {Object} filter - 过滤器
 * @param {FetchConfig} opt - fetch 参数
 */
this.$models.model.getFilter(page, filter, opt)
```

  </CodeGroupItem>
  <CodeGroupItem title="Mixin">

```javascript
/**
 * @param {String} path - 模型路径, 不传则默认从 this.$options.model 中获取
 * @param {Object} filter - 过滤器, 不传自动尝试从 this.Filter 中获取, 会赋值给 FetchConfig.params
 * @param {FetchConfig} opt - fetch 参数
 */
this.GetFilter(path, filter, opt)
```

  </CodeGroupItem>
  <CodeGroupItem title="Vuex">

```javascript
// 无对应方法，需要在 Get 方法基础上自行封装
this.$store.dispatch(`${namespace}/GET_${MODEL}`, opt)
```

  </CodeGroupItem>
</CodeGroup>


### GetMore - 加载下一页数据
> 一般用于移动端的触底加载更多，会自动判断是否满足加载下一页的条件，不满足不会触发
<CodeGroup>
  <CodeGroupItem title="Proxy" active>

```javascript
/**
 * @param {Object} filter - 过滤器
 * @param {FetchConfig} opt - fetch 参数
 */
this.$models.model.getMore(filter, opt)
```

  </CodeGroupItem>
  <CodeGroupItem title="Mixin">

```javascript
/**
 * @param {String} path - 模型路径, 不传则默认从 this.$options.model 中获取
 * @param {Object} filter - 过滤器, 不传自动尝试从 this.Filter 中获取, 会赋值给 FetchConfig.params
 * @param {FetchConfig} opt - fetch 参数
 */
this.GetMore(path, filter, opt)
```

  </CodeGroupItem>
  <CodeGroupItem title="Vuex">

```javascript
// 无对应方法，需要在 Get 方法基础上自行封装
this.$store.dispatch(`${namespace}/GET_${MODEL}`, opt)
```

  </CodeGroupItem>
</CodeGroup>



### GetItem - 加载当行数据
> 若加载成功后会自动对该数据执行 activeRow 方法
<CodeGroup>
  <CodeGroupItem title="Proxy" active>

```javascript
/**
 * @param {Number|String} id - 行数据主键
 * @param {Object} params - 请求参数, 会赋值给 FetchConfig.params
 * @param {FetchConfig} opt - fetch 参数
 */
this.$models.model.getItem(id)
```

  </CodeGroupItem>
  <CodeGroupItem title="Mixin">

```javascript
/**
 * @param {Number|String} id - 行数据主键
 * @param {String} path - 模型路径, 不传则默认从 this.$options.model 中获取
 * @param {Object} params - 过滤器, 会赋值给 FetchConfig.params
 * @param {FetchConfig} opt - fetch 参数
 */
this.GetItem(id, path, params, opt)
```

  </CodeGroupItem>
  <CodeGroupItem title="Vuex">

```javascript
// 无对应方法，需要在 Get 方法基础上自行封装
this.$store.dispatch(`${namespace}/GET_${MODEL}`, opt)
```

  </CodeGroupItem>
</CodeGroup>
