---
home: true
title: 首页
actions:
  - text: 快速上手
    link: /zh/guide/getting-started.html
    type: primary
  - text: 项目简介
    link: /zh/guide/
    type: secondary
features:
  - title: 简洁至上
    details: 以 Markdown 为中心的项目结构，以最少的配置帮助你专注于写作。
  - title: Vue 驱动
    details: 享受 Vue 的开发体验，可以在 Markdown 中使用 Vue 组件，又可以使用 Vue 来开发自定义主题。
  - title: 高性能
    details: VuePress 会为每个页面预渲染生成静态的 HTML，同时，每个页面被加载的时候，将作为 SPA 运行。
footer: MIT Licensed | Copyright © 2018-present Evan You
---
# 您好2

后端路由将由5个部分组成，举例：https://www.myproject.com/v1/user/address
*协议	*域名	版本（非必要）	*模型（资源）地址	资源动作
https://	www.myproject.com	v1	user/order	null  ||  {id} ||  {action} 

<CodeGroup>
  <CodeGroupItem title="YARN" active>

```bash
yarn remove vuepress
yarn add -D vuepress-vite@next
```

  </CodeGroupItem>
  <CodeGroupItem title="NPM">

```bash
npm uninstall vuepress
npm install -D vuepress-vite@next
```

  </CodeGroupItem>
</CodeGroup>