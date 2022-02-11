module.exports = [
    {text: '首页', link: '/'},
    {text: '呵呵', children: [
        {text: 'title-1', children: [
            {text: 'BASE', link: '/guide/README.md'},
            {text: '首页1', link: '/guide/1.md'},
            {text: '首页2', link: '/guide/2.md'}
        ]},
        {text: 'title-2', children: [
            {text: '首页', link: '/'},
            {text: '首页2', link: '/'}
        ]}
    ]}
]