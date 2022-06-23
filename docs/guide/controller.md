## 什么是 Controller

简单的说 Controller 负责接对外暴露 Api 接口，通过 HTTP 接收前端的调用并返回对应的处理结果   
在比较简单的场景，仅使用 Controller 即可完成写接口的工作，在企业级应用中推荐与 Logic、Model、Service 配合使用  
所有的 Controller 文件都必须放在 app/controller 目录下，可以支持多级目录，访问的时候可以通过目录名级联访问   

得益于 Router 模块，Controller 可以自动地安装文件目录位置去暴露 Api ，无需手动书写路由

## RESTFullController
### 快速体验

```javascript
'use strict';
const {Controller} = require('@dgteam/egg-engine')
module.exports = class PostController extends Controller {
    constructor(ctx) {
        super(ctx)
        this.options = {
            RESTful: {
                none: {
                    GET: {}
                }
            }
        }
    }
    // 声明自定义 Action
    async statis() {
        const msg = this.getCustomdata()
        this.json(msg)
    }
    // 声明内部方法，在当前控制器中使用 this 可访问，不会对外暴露 api
    getCustomdata = async () => {
        return 'custom data'
    }
}
```
我们通过上面的代码定义了一个 PostController 的类, Router 模块会根据 Controller 文件夹的位置自动生成接口   
例该 Controller 放到 app/controller/api/post.js 中，那么会自动生成以下路由
```
GET /api/post
GET /api/post/:id
POST /api/post/:id
PUT /api/post/:id
DELETE /api/post/:id
ALL /api/post/statis
```
### 基本配置
框架已经内置了一套快速生成 RESTFull API 的方案，仅需简单配置即可快速输出接口
```javascript 
'use strict';
const {Controller} = require('@dgteam/egg-engine')
const options = {
    RESTful: {
        admin: {
            GET: {}, // 为 admin 角色开放 GET 接口，角色鉴权相见 Logic 模块
            POST: {} // 为 admin 角色开放 POST 接口
        },
        // 为 default 角色开放接口
        default: {
            // limit {Object | Function => Object} - 增加限制条件
            // 例如限制该用户只能 GET PUT DELETE user_id 等于自己的数据
            // 相应地，该角色 POST 数据时候，系统会强制写入该限制条件
            limit: async RESTful => {
                return {user_id: RESTful.user.base.id}
            },
            // lock {Object | Function => String} - 资源锁
            // 当操作数据时候会自动加锁，资源锁名称相同的数据会队列操作
            // 一定程度上解决高并发场景下的数据冲突问题
            // 该加锁方案为 redlock with redis，因此需要 redis 支持，否则无效
            // 如果操作频率过快会返回 503 错误
            lock: async RESTful => 'lock',
            GET: {
                // field {Array<String>} - 过滤字段，仅查询指定的字段，仅 GET 可配置
                // fieldReverse {Array<String>} - 反向过滤字段，除了指定字段其他字段都查询
                // include {Array | Object} - 关联查询，详见 Model 模块，仅 GET 可配置
                limit: async RESTful => ({}), // 单独为 GET 接口设置 limit 条件
                item: {
                    // GET list 与 GET item 可以分开进行配置，若不填则 item 设置取外层
                }
            },
            POST: {
                // limit: async RESTful => ({}),
                // lock: async RESTful => ({})
            },
            PUT: {
                // accurate {Boolean = false} - 是否精确修改，仅 PUT 与 DELETE 下有效
                //   - 若为 true 则先执行 GET :id 后再进行对应操作
                //   - 可在 After 钩子中通过 ctx.RESTful.beforeRowUpdate 获取操作前对象
                //   - 默认为假，则不查询对象而直接进行操作，性能较高
                accurate: false
            },
            DELETE: {
                // force {Boolean = false} - 是否物理删除数据（默认为逻辑删除）
                force: false,
                // accurate {Boolean = false} - 是否精确删除
                //   - 可在 After 钩子中通过 ctx.RESTful.beforeRowDelete 获取操作前对象
                accurate: false
            }                    
        },
        none: {
            GET: {}, // 为 none 角色开放 GET 接口
            limit: {user_id: 0} // 限制查询条件
        }
    }
}
module.exports = class PostController extends Controller {
    constructor(ctx) {
        super(ctx)
        this.options = options
    }
}
```
### 钩子
```javascript 
'use strict';
const {Controller} = require('@dgteam/egg-engine')
module.exports = class PostController extends Controller {
    constructor(ctx) {
        super(ctx)
        this.options = {
            RESTful: {
                default: {
                    GET: {},
                    POST: {},
                    PUT: {},
                    DELETE: {}
                },
                none: {}
            }
        }
    }
    // 前置钩子，此时 Item 对象还没有提交给数据库
    BeforePOST = async ctx => {
        // 如果返回 false 或者 ctx.err() 那么将会中指请求，返回错误给前端
    }
    // 后置钩子，此时已经成功把 Item 对象提交给数据库
    AfterPOST = async ctx => {
        // 可以通过修改 this.ctx.body 来调整返回体对象
    }
    // 指定身份的钩子
    BeforePOST_default = async ctx => {

    }
}
```
## 用户鉴权 & 表单验证
在默认的情况下，想要使用 RESTful 配置快速输入接口，系统要求声明对应的 Logic 配置，否则会返回 405 错误
Logic 的具体写法，请查看 Logic 章节

## 调用 Service
我们并不想在 Controller 中实现太多业务逻辑，所以提供了一个 Service 层进行业务逻辑的封装，这不仅能提高代码的复用性，同时可以让我们的业务逻辑更好测试。   
在 Controller 中可以调用任何一个 Service 上的任何方法，同时 Service 是懒加载的，只有当访问到它的时候框架才会去实例化它。   
Service 的具体写法，请查看 Service 章节

## 设置响应体
当业务逻辑完成之后，Controller 的最后一个职责就是将业务逻辑的处理结果通过 HTTP 响应发送给用户。
RESTful API 会自动设置响应体，
### 普通设置
```
class PostController extends Controller {
    async statis() {        
        this.ctx.status = 201; // 设置状态码为 201
        this.ctx.body = {msg: 123}; // 设置 response body
    }
}
```
### 渲染模板
### JSONP
### JSONP
## Api

### controller.get(key, value)
> 获取请求体 request.query (URL) 参数
+ key {String} - 获取参数的字段名，若不填则获取整个 request.query 对象
+ value {any} - 如果传入此值，会对 request.query 指定 key 进行设置

### controller.param(key, value)
> 效果同 ontroller.get

### controller.post(key, value)
> 获取请求体 request.body (POST) 参数，请求体 request.body 必须是 JSON 对象
> 如果前端以 form-data 或 x-www-form-urlencoded 提交，那么系统会自动尝试转为 JSON 格式
> 该方法不支持获取文件类型的字段
+ key {String} - 获取参数的字段名，若不填则获取整个 body 对象
+ value {any} - 如果传入此值，会对 request.body 指定 key 进行设置

### controller.table(path)
> 获取数据模型实例
+ path {String} - 模型路径，不填默认当前控制器路径
+ @returan {Model}

### controller.model(path)
> 效果同 controller.table


### controller.ctx.json(data) 
> 返回 JSON 数据
+ data {any} - 返回的数据

### controller.ctx.suc(data, msg, status)
> 快速以 JSON 格式返回响应数据
+ data {any} - 返回的数据
+ msg {any} - 返回题消息，默认 "successful."
+ status {Number} - http 状态码，默认 200
```javascript
class extends Controller {
    async action() {
        this.ctx.suc({})
    }
}
// 前端得到对象格式大致如下
// {
    // err: 0,
    // msg: 'successful.',
    // result: {}
// }
```

### controller.ctx.err(status, msg, data)
> 快速以 JSON 格式返回响应数据
+ status {Number} - 错误码
+ msg {any} - 返回题消息，若不填则自动根据 status 生成
+ data {Number} - 返回数据，默认 null
```javascript
// 内置 statusMsg 一览
const map = {
    400: 'parameter error.',             // 400  用户请求错误（原因不明）
    401: 'need login.',                  // 401  未登录，或授权令牌过期
    402: 'need permission.',             // 402  已登录，但无相应权限
    403: 'need permission.',             // 403  权限不足
    404: 'not found.',                   // 404  请求或资源不存在
    405: 'method not allowed.',          // 405  请求类型错误
    406: 'need security verification.',  // 406  账户安全风险，需要安全验证
    408: 'request timeout.',             // 408  请求超时
    409: 'need security verification.',  // 409  账户安全风险，需要安全验证
    422: 'unprocessable entity.',        // 422  语义错误
    429: 'too many requests.',           // 429  请求频率过快

    500: 'server error.',                // 500  服务器未执行（原因不明）
    501: 'server reject request.',       // 501  服务器拒绝执行
    502: 'server is not responding.',    // 502  第三方服务未响应
    503: 'server is busy.',              // 503  当前服务器繁忙（也有可能是资源锁）
    504: 'server maintenance.',          // 504  服务器维护
    505: 'protocol not supported.',      // 505  请求协议不支持
    510: 'server resources deficient.'   // 510  服务器内部错误（一般用于测试环境的错误栈追踪）
}
```
```javascript
class extends Controller {
    async action() {
        this.ctx.err(404)
    }
}
// 前端得到对象格式大致如下
// {
//     err: 404,
//     msg: 'not found.',
//     result: null
// }
```