const path = require('path')
const isDev = process.env.NODE_ENV !== 'production'
const navbar = require('./config/navbar/index.js')
const sidebar = require('./config/sidebar/index.js')

module.exports = {
    
    host: '0.0.0.0', port: 8082, base: '/',    
    head: [
        // ['link', { rel: 'icon', href: '/images/logo.png' }]
    ],    
    locales: {
        '/': {lang: 'zh-CN', title: 'DGTEAM', description: ''},
        // '/en/': {lang: 'en-US', title: 'DGTEAM', description: ''}
    },
    themeConfig: {
        home: '/',
        logo: 'https://vuejs.org/images/logo.png',
        // logoDark: '',        
        darkMode: true, // 可开启夜间模式
        repo: 'https://github.com/dgteam-cn/egg-engine',
        // repoLabel: '',
        locales: {
            '/': {
                selectLanguageName: '简体中文',
                selectLanguageText: '选择语言',
                selectLanguageAriaLabel: '选择语言',
                editLink: false,
                editLinkText: '在 Gitee 上编辑此页',
                lastUpdatedText: '上次更新',
                contributorsText: '贡献者',
                tip: '提示',
                warning: '注意',
                danger: '警告',
                notFound: [
                    '这里什么都没有',
                    '我们怎么到这来了？',
                    '这是一个 404 页面',
                    '看起来我们进入了错误的链接',
                ],
                backToHome: '返回首页',
                openInNewWindow: '在新窗口打开',
                toggleDarkMode: '切换夜间模式',
                toggleSidebar: '切换侧边栏',
                navbar: navbar.zh,
                sidebar: sidebar.zh,
                sidebarDepth: 0 // 侧边栏生成最大深度
            },
            '/en/': {
                navbar: [
                    {text: 'Home', link: '/en/'}
                ]
            }
        }
    },
    alias: {
        // '@': path.resolve(__dirname, './path/to/some/dir')
    },
    markdown: {
        // anchor: false // {Boolean = true} 标题左边自动生成锚点
    },
    plugins: [
        // ['@vuepress/plugin-docsearch', {
        //     apiKey: '3a539aab83105f01761a137c61004d85',
        //     indexName: 'vuepress',
        //     searchParameters: {
        //         facetFilters: ['tags:v2']
        //     },
        //     locales: {
        //         '/': {placeholder: '搜索文档'},
        //         '/zh/': {placeholder: 'Search'}
        //     }
        // }], // https://docsearch.algolia.com/ 第三方搜索插件
        [path.resolve(__dirname, './plugin/testPlugin/node')], // 插件测试
        ['@vuepress/plugin-search', {
            locales: {
                '/': {placeholder: '搜索'},
                '/zh/': {placeholder: 'Search'}
            }
        }], // 简单全文搜索
        ['@vuepress/plugin-register-components', {componentsDir: path.resolve(__dirname, './components')}], // 自定义 components 组件
        ['@vuepress/plugin-shiki', isDev ? false : {theme: 'dark-plus'}] // shiki 语法高亮
    ]
}