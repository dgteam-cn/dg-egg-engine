---
title: Mixin
---

### 基本配置
> 在使用混合方法之前，请先确认已经加载了对应的方法库
每一个 component 允许绑定一个默认的数据模型
<CodeGroup>
  <CodeGroupItem title="Vue" active>

```javascript
// 某一 component.vue 文件
import StoreMix from '@dgteam/model/dist/mixins/store.js'
export default {
    mixins: [StoreMix],
    data() {
        return {
            // 默认模型的路径，格式为 {模块名}/{模型名}
            // 调用模型但方法没有指定 paths 值时，会默认取该值
            // 且在 computed 中会自动生成一个 Main 对象可以快速指向对应模型
            store: 'base/store',
            // filter 暂存器
            // 调用模型但方法没有指定 filter 值时，会自动尝试从此获取
            Filter: {}, 
            // params 暂存器
            // 调用模型但方法没有指定 params 值时，会自动尝试从此获取
            Params: {}, 
        }
    },
    computed: {
        // 如果每个页面只绑定一个模型不能满足需求，可以手动去引用模型
        Banner: vm => vm.$store.state.base.banner // 手动引用 base 模块下的 banner 模型
    },
    methods: {
        init() {
            this.Get() // 会自动从 this.$data 中获取 paths filter params 参数
            this.Get(1, 'base/banner', {size: 16}) // 或者活动指定模型参数
        }
    },
    mounted() {
        this.init()
    }
}
```

  </CodeGroupItem>
  <CodeGroupItem title="React">

```javascript
// 敬请期待
```

  </CodeGroupItem>
</CodeGroup>

### Get - 获取列表数据
> 根据页码去同步后端列表数据
<CodeGroup>
  <CodeGroupItem title="Vue" active>
  
```javascript
/**
 * @param {Number} page - 列表页码，默认加载第一页
 * @param {String} paths - 模型路径，不传则默认从 this.store 中获取
 * @param {Object} filter - 过滤器（筛选参数），不传则默认从 this.Filter 中获取
 * @param {Object} opt - 参数集，会传递到 FETCH 方法中，可见相关参数说明
 *   @param {Boolean} opt.clean - 请求前是否先清空模型 list 数据
 * @returns {Promise}
 */

this.Get(page, paths, filter, opt)

// this.Get(1) // 加载第一页, 默认当前页面所绑定的模型
// this.Get(2, 'mine/order') // 为指定模型同步指定的页码列表
// this.Get(3, 'mine/order', {size: 12}, {loading: true}) // 带参数
```
  </CodeGroupItem>
</CodeGroup>
   
### GetInit - 初始化模型列表
> 初始化列表，此方法初始化过一次后便不会重复拉取请求，一般用于拉取固定数据
```javascript
/**
 * @param {String} paths - 模型路径，不传则默认从 this.store 中获取
 * @param {Object} filter - 过滤器（筛选参数）
 * @param {Object} opt - 参数集，会传递到 FETCH 方法中，可见相关参数说明
 *   @param {Number} opt.cache - 缓存时间，单位秒（localstorage 方式）
 *   @param {Boolean} opt.strict - 严格模式，要求 filter 要相同才能匹配已初始化数据
 *   @param {Boolean} opt.immediate - 不使用缓存，立即请求线上数据
 *   @param {Boolean} opt.clean - 请求前是否先清空模型 list 数据
 * @returns {Promise}
 */
this.GetInit(paths, filter, opt)
```
   
### GetFilter - 初始化模型列表
> 一般用于用户切换了筛选参数，需要重新刷新整个列表
```javascript
// 语法糖，效果等同于 this.Get(1, paths, filter, {clean: true})
this.GetFilter(paths, filter, opt)
```
   
### GetMore - 加载更多
> 参数与 Get 方法相同，但不能传页码（强制为下一页）
```javascript
this.GetMore(paths, filter, opt) // 触底加更多
```
   
### Item - 根据 ID 获取单行数据实例
```javascript
/**
 * @param {Number | String} id - 数据主键值
 * @param {String} paths - 模型路径，不传则默认从 this.store 中获取
 * @param {Object} filter - 过滤器（筛选参数），不传则默认从 this.Filter 中获取
 * @param {Object} opt - 参数集，会传递到 FETCH 方法中，可见相关参数说明
 * @returns {Promise}
 */
this.Item(id, paths, filter, opt)
```