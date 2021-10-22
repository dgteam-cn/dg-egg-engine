    dg-validator 非 string 的空字符串，应当以 undefined 处理
    dg-validator 需要支持动态鉴权
    dg-validator in 类型时，填空字符串也能通过
    [新增] plugin/logic 应当先执行用户鉴权在进行表单验证（最好可以设为可配置）
    [修复] logic mixin() options.field 字段含义错误
    [新增] model 新增 logging 方法打印 SQL 函数

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