
    自定义主键规则
    自定义次级主键规则（sn）
    由于 _ 会导致某些冲突，所有路由、路径等都不应用蛇形命名法
        - 应给予框架级别的提示
    优化 model 实例操作时的时间格式
    logic validator 新增配置增加新规则或动态增减规则

!0.1.8


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

0.1.6
    [] logic 支持 config 配置参数
    // logic 支持动态配置语言

0.1.5
    [修复] 在 package.json 漏配置 files 导致发布时文件缺失的问题

0.1.2
    [优化] 2021-07-27 调整了 marker 翻页查询，从第二页开始不加载 count 以此提升性能
    [修复] 2021-07-27 修复了 findAndCountAll 在包含 include 关联查询模式下的 count 字段不符合预期的问题
    [修复] 2021-07-27 修复 marker 翻页查询结果返回的参数有误问题
    [修复] 2021-07-20 修复 RESTFull API 的字段过滤逻辑（field）错误的问题
        - 某些情况 field 不生效的问题
        - 某些情况 field 与 fieldReverse 相互冲突
    [优化] 2021-07-20 增加 model 中 where 方法，自动过滤 undefined 的功能（仅支持一层）
    [优化] 2021-07-20 设置 sequelize.factory 的默认字符集（charset）为 'utf8mb4'
    [优化] 2021-07-20 加强 logic 中 identitys 字段的兼容性