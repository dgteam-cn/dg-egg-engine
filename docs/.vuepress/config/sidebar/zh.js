module.exports = {
    '/guide/': [
        {
            text: '',
            children: [
                {text: '目录结构', link: '/guide/structure.md'},
                {text: '内置对象', link: '/guide/objects.md'},
                {text: '运行环境', link: '/guide/env.md'}
            ]
        },
        {
            text: '基础功能',
            children: [
                {text: '配置', link: '/guide/config.md'},
                {text: '中间件', link: '/guide/middleware.md'},
                {text: '路由', link: '/guide/router.md'},
                {text: '上下文', link: '/guide/context.md'}
            ]
        },
        {
            text: '业务功能',
            children: [
                {text: '控制器 Controller', link: '/guide/controller.md'},
                {text: '逻辑 Logic', link: '/guide/logic.md'},
                {text: '数据模型 Model', link: '/guide/model.md'},
                {text: '服务 Service', link: '/guide/service.md'},
                {text: '模板渲染 View', link: '/guide/view.md'}
            ]
        },
        {
            text: '进阶功能',
            children: [
                {text: 'Cookie & Session', link: '/guide/cookie.md'},
                {text: '国际化', link: '/guide/i18n.md'},
                {text: '定时任务', link: '/guide/schedule.md'},
                {text: '启动自定义', link: '/guide/start.md'},
                {text: '通讯', link: '/guide/cluster.md'},
                {text: '异常处理', link: '/guide/error-handling.md'},
                
                
                // {text: '控制器 Controller', link: '/guide/controller.md'},
                // {text: '逻辑 Logic', link: '/guide/logic.md'},
                // {text: '数据模型 Model', link: '/guide/model.md'}
            ]
        },
        {
            text: '拓展',
            children: [
                {text: '加载器', link: '/guide/plugin.md'},
                {text: '插件', link: '/guide/plugin.md'},
                {text: '插件开发', link: '/guide/plugin.md'},
                {text: '框架开发', link: '/guide/plugin.md'},
                {text: '框架拓展', link: '/guide/extend.md'}                
                // {text: '控制器 Controller', link: '/guide/controller.md'},
                // {text: '逻辑 Logic', link: '/guide/logic.md'},
                // {text: '数据模型 Model', link: '/guide/model.md'}
            ]
        }
    ],
    '/warehouse/model': [
        {
            text: '基础',
            children: [
                {text: '介绍', link: '/warehouse/model/introduction.md'},
                {text: '安装', link: '/warehouse/model/installation.md'},
                {text: '快速入门'}
            ]
        },
        {
            text: '教程',
            children: [
                {text: '声明模型', link: '/warehouse/model/statement.md'},
                {text: '调用模型', link: '/warehouse/model/apis.md'},
                {text: '内置对象', link: '/warehouse/model/objects.md'}
            ]
        },
        {
            text: '进阶',
            children: [
                {text: '网络适配器'}
            ]
        },
        {
            text: '相关文献',
            children: [
                {text: '后端接口规范'},
                {text: '性能优化'}
            ]
        }
    ]
}