### Get - 获取列表数据

```javascript
/**
 * Get(page, paths, filter, opt)
 * @param {Number} page - 列表页码，默认加载第一页
 * @param {String} paths - 模型路径，不传则默认从 this.store 中获取
 * @param {Object} filter - 过滤器（筛选参数），不传则默认从 this.Filter 中获取
 * @param {Object} opt - 参数集，会传递到 FETCH 方法中，可见相关参数说明
 * @param {Boolean} opt.clean - 请求前是否先清空模型 list 数据
 * @param {any} opt[key] - 其他参数会保留并传递给其他中间件
 * @returns {Promise}
 */
```
<CodeGroup>
  <CodeGroupItem title="使用示例" active>

```javascript
this.Get(1) // 加载第一页, 默认当前页面所绑定的模型
this.Get(2, 'mine/order') // 为指定模型同步指定的页码列表
this.Get(3, 'mine/order', {size: 12}, {loading: true}) // 带参数
```

  </CodeGroupItem>
  <CodeGroupItem title="源码预览">

```javascript
Get(page, paths, filter, opt = {}) {
    if (typeof page === 'string') {
        filter = paths
        paths = page
        page = 1
    }
    const params = copyJSON(typeof filter === 'object' ? filter : this.Filter) || {}
    params.page = page ? page : 1
    if (typeof opt === 'object' && opt.clean) {
        const {store, model} = this.ModelFormat(paths, 'get')
        this.Cm(`${store}/MODEL_RESET`, model)
    }
    return this.Dp(this.ModelFormat(paths, 'get'), {...opt, params})
}
```

  </CodeGroupItem>
</CodeGroup>



### GetInit - 初始化数据列表
> 初始化列表，此方法初始化过一次后便不会重复拉取请求
> 比较常见的用于拉去枚举类型的列表数据
```javascript
/**
 * 初始化数据
 * @overview 
 * @param {string} [paths] - 模型路径，不传则默认从 this.store 中获取
 * @param {object} [filter] - 筛选参数，默认没有 page 参数，若有 page 的需求可以在此对象中传递
 * @param {object} [opt] - 参数集，会传递到 Fetch 方法中
 * @param {number} [opt.cache] - 缓存时间，秒为单位，超时后会强制重新来去
 * @param {boolean} [opt.strict] - 严格的，将会比对 filter 条件，如果不同将会触发重新来去
 * @param {boolean} [opt.immediate] - 立即执行，强制重新拉取
 * @param {boolean} [opt.clean] - 触发请求前清空源列表（若判断读取缓存，该参数无效）
 * @returns {Promise}
 */
```

<CodeGroup>
  <CodeGroupItem title="使用示例" active>

```javascript
this.GetInit() // 使用默认模型初始化模型数据
this.GetInit('base/banner') // 初始化指定模型数据
this.GetInit('base/banner', {size: 12}, {cache: 3600}) // 带参数
```

  </CodeGroupItem>
  <CodeGroupItem title="源码预览">

```javascript
GetInit(paths, filter = {}, opt = {}) {
    const {cache, strict, immediate, clean} = opt
    const model = this.ModelFormat(paths, 'get')
    let needFetch = !model.main.init || Boolean(immediate)
    if (typeof filter !== 'object') filter = {}
    const fetchHandle = () => {
        if (clean) this.Cm(`${model.store}/MODEL_RESET`, model.model) // 清理模型
        return this.Dp(model, {...opt, params: filter}).then(res => {
            if (!res.err) {
                const update = this.Time(new Date(), 'yyyy/MM/dd hh:mm:ss') // TODO Time 方法替换
                this.Cm(`${model.store}/MODEL_UPDATE`, [model.model, 'update', update]) // 把本次请求的时间戳记录起来，便以判断是否缓存超时
                return {...res, filter, fetch: true}
            }
            return {...res, result: [], filter, fetch: true}
        })
    }
    if (model.main.list.length === 0) {
        needFetch = true // 如果列表为空表示则缓存无效
    } else if (typeof cache === 'number' && model.main.update && !needFetch) {
        // 判断是否缓存超时需要重新拉取
        const update = new Date(model.main.update).getTime()
        const expire = update + cache * 1000
        needFetch = Date.now() > expire // 如果 当前时间 > 到期时间 需要重新加载
    } else if (strict) {
        // 如果是严格的，需要坚持筛选条件
        try {
            needFetch = JSON.stringify(model.main.filter) !== JSON.stringify(filter)
        } catch (err) {
            // eslint-disable-next-line no-console
            console.log('DGX GetInit: filter is invalid.')
        }
    }
    return needFetch ? fetchHandle() : Promise.resolve({err: 0, msg: '', result: model.main.list, filter: model.main.filter, fetch: false})
}
```

  </CodeGroupItem>
</CodeGroup>