
### 名称解释与层级关系

多模块 > 模块 > 表 > 行
modules > model > table > row 

整个前端项目可以根据业务复杂度有任意个 modules, 也可以不需要 modules
每个 modules 可以挂载任意个 model, 也可以不需要 model
每个 model 可以挂载任意个 table, 若业务不复杂 table 可以直接挂载到 root 节点
每个 table 都会有一个 list 数组, table.list 下可以装载任意个 row, 也可以是空数组
而 row 是单行数据，必须是一个对象，必须至少包含一个主键（id）

modules 与 model 是用于整理层级结构的必要节点
table 与 row 是参照后端数据库进行设计的 "数据表" 与 "数据行" 的概念

<!-- ### row or item 单行数据
在数据表中的每一行数据的实例都是 “单行数据”
组成但行数据的必要条件是：必须是一个对象、至少要有一个主键

### table 数据表
多个 row 可以组成一个数据表

### model 单模块
多个 table 组成

### modules or models 多模块（模型）
整个前端的数据模型是由若然个多模块组成，按照层级关系挂在 root 节点上
modules 是 vuex 中的概念，他和模型的 models 本质上是一样的 -->

