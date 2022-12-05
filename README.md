0.1.13
    [修复] core/logic 在不指定 integer length 时，自动设置 min & max 值错误的问题
    [移除] 移除 app.log ctx.log helper.log 方法
    [决定] 逐步废弃 app.tools 对象
    
0.1.12
    [优化] 恢复开启默认日志打印
    [优化] 多处 console.warn 与 console.error 替换为 app.logger 方法
    [优化] 内置 model sequelize 默认主键类型调整为 bigint
    [优化] 内置 model sequelize 支持了 scope 的方法，在配置中通过 options.scopes 声明，在实例中通过 table.scope('name') 使用
    [优化] 内置 model sequelize 优化了 addMany 方法，支持原生配置的 “若存在则更新” 的功能
    [优化] 内置 sequelize order 新增函数式支持
    [优化]  模型文件中，先声明关联再创建模型会报错
    [优化] 优化所有插件 config 格式
    [优化] 优化 docs 插件在新版 postman 下 :id 为空导致解析错误的问题
    [新增] 新增 genid 插件（默认关闭）：优化版的雪花算法生成分布式 ID （但暂时不支持集群部署）
    [新增] 新增 bull 插件（默认关闭）：一款基于 redis 的轻型消息队列，支持延迟消息
    [修复] 在 controller RESTful 配置中，里层的 null 无法覆盖外层 value 的问题
    
0.1.11
    [修复] ctx.redis(key, value, timeout) 中 timeout 传参不生效的问题

0.1.10
    [调整] 标记弃用 core/controller this.storePath，使用 this.tablePath 替代
    [优化] plugin/docs 新增 json5 解析器插件
    [修复] 修复部分 RESTful 字段命名错误，并预留兼容函数

0.1.9
    [修复] 浮点数自动注入规则错误的bug
    [修复] 字符串类型 length 无法指定固定值的错误
    [废弃] 废弃 logic.ApplyCheck 方法

0.1.7
    [修复] @dgteam/validator 非 string 的空字符串，应当以 undefined 处理
    [修复] @dgteam/validator需要支持动态鉴权
    [修复] @dgteam/validator in 类型时，填空字符串也能通过
    [新增] plugin/logic 应当先执行用户鉴权在进行表单验证（最好可以设为可配置）
    [修复] logic mixin() options.field 字段含义错误
    [新增] model 新增 logging 方法打印 SQL 函数
    [新增] 默认增加 lodash 库，并挂在在 app 与 ctx 下
    [新增] plugin/router 支持路径自动蛇形转驼峰的配置项
    [优化] RESFul 中 PUT 方法调整为使用 Sequelize 的原生 RowUpdate 策略
        - 如果使用原生策略会导致需要请求两次才能完成 update 请求
        - 新增 PUT / DELETE 精确修改字段 accurate, 使用此字段会修改后可以在 ctx.RESTful.beforeRowUpdate / ctx.RESTful.beforeRowDelete 获取到修改前的数据
        - 同时触发不一样的 Sequelize 钩子函数
        - 如果在 BeforePUT、BeforeDELETE 中获取并赋值给 ctx.RESTful.row 那么优先获取该对象
    [优化] 优化在 marker 中，除了 id 外增加 created_at 兼容性
    [优化] 在 model 中强化 order 的排序

0.1.5
    [修复] 在 package.json 漏配置 files 导致发布时文件缺失的问题

0.1.2
    [优化] 2021-07-27 调整了 marker 翻页查询，从第二页开始不加载 count 以此提升性能
    [修复] 2021-07-27 修复了 findAndCountAll 在包含 include 关联查询模式下的 count 字段不符合预期的问题
    [修复] 2021-07-27 修复 marker 翻页查询结果返回的参数有误问题
    [修复] 2021-07-20 修复 RESTFul API 的字段过滤逻辑（field）错误的问题
        - 某些情况 field 不生效的问题
        - 某些情况 field 与 fieldReverse 相互冲突
    [优化] 2021-07-20 增加 model 中 where 方法，自动过滤 undefined 的功能（仅支持一层）
    [优化] 2021-07-20 设置 sequelize.factory 的默认字符集（charset）为 'utf8mb4'
    [优化] 2021-07-20 加强 logic 中 identitys 字段的兼容性