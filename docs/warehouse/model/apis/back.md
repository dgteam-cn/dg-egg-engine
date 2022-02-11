### 单模块调用示例

<CodeGroup>
  <CodeGroupItem title="Proxy调用" active>

```vue
<template>
  <div>
    <h6>模型名称: {{ $models.user.name }} </6>
    <li v-for="item in $models.user.list" :key="item.id">
      <span>ID - {{ item.id }}</span>
    </li>
    <button @click="$models.user.get(1, {size: 10})">加载数据</button>
  </div>
</template>
```

  </CodeGroupItem>
  <CodeGroupItem title="Mixin调用" active>

```vue
<template>
  <div>
    <h6>模型名称: {{ Main.name }} </6>
    <li v-for="item in Main.list" :key="item.id">
      <span>ID - {{ item.id }}</span>
    </li>
    <button @click="Get(1)">加载数据</button>
  </div>
</template>
<script>
import StoreMix from '@dgteam/model/dist/mixins/store.js'
export default {
  mixins: [StoreMix],
  model: 'user'
}
</script>
```

  </CodeGroupItem>
  <CodeGroupItem title="Vuex调用" active>

```vue
<template>
  <div>
    <h6>模型名称: {{ $store.state.user.name }} </6>
    <li v-for="item in $store.state.user.list" :key="item.id">
      <span>ID - {{ item.id }}</span>
    </li>
    <button @click="$store.dispatch('GET_USER', {params: {page: 1, size: 10}})">加载数据</button>
  </div>
</template>
```

  </CodeGroupItem>
</CodeGroup>

### 多模块调用示例

<CodeGroup>
  <CodeGroupItem title="Proxy调用" active>

```vue
<template>
  <div>
    <h6>模型名称: {{ $models.account.customer.name }} </6>
    <li v-for="item in $models.account.customer.list" :key="item.id">
      <span>ID - {{ item.id }}</span>
    </li>
    <button @click="$models.account.customer.get(1, {size: 10})">加载数据</button>
  </div>
</template>
```

  </CodeGroupItem>
  <CodeGroupItem title="Mixin调用" active>

```vue
<template>
  <div>
    <h6>模型名称: {{ Main.name }} </6>
    <li v-for="item in Main.list" :key="item.id">
      <span>ID - {{ item.id }}</span>
    </li>
    <button @click="Get(1)">加载数据</button>
  </div>
</template>
<script>
import StoreMix from '@dgteam/model/dist/mixins/store.js'
export default {
  mixins: [StoreMix],
  model: 'account/customer'
}
</script>
```

  </CodeGroupItem>
  <CodeGroupItem title="Vuex调用" active>

```vue
<template>
  <div>
    <h6>模型名称: {{ $store.state.account.customer.name }} </6>
    <li v-for="item in $store.state.account.customer.list" :key="item.id">
      <span>ID - {{ item.id }}</span>
    </li>
    <button @click="$store.dispatch('account/GET_CUSTOMER', {params: {page: 1, size: 10}})">加载数据</button>
  </div>
</template>
```

  </CodeGroupItem>
</CodeGroup>