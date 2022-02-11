
   
// const { path } = require('@vuepress/shared-utils')

// module.exports = {
//   enhanceAppFiles: [
//     path.resolve(__dirname, 'enhanceAppFile.js')
//   ],

//   globalUIComponents: 'BackToTop'
// }
// import type { Plugin } from '@vuepress/core'
// import { path } from '@vuepress/utils'

// export type BackToTopPluginOptions = Record<never, never>

// export const backToTopPlugin: Plugin<BackToTopPluginOptions> = (_, app) => {
//   if (app.env.isDev && app.options.bundler.endsWith('vite')) {
//     // eslint-disable-next-line import/no-extraneous-dependencies
//     app.options.bundlerConfig.viteOptions = require('vite').mergeConfig(
//       app.options.bundlerConfig.viteOptions,
//       {
//         optimizeDeps: {
//           exclude: ['ts-debounce'],
//         },
//       }
//     )
//   }

//   return {
//     name: '@vuepress/plugin-back-to-top',

//     clientAppRootComponentFiles: path.resolve(
//       __dirname,
//       '../client/components/BackToTop.js'
//     ),
//   }
// }
const { path } = require('@vuepress/utils')
module.exports = (options, ctx) => {
    return {
        name: '@vuepress/plugin-test', // 插件的名称
        multiple: false, // 插件是否能够被多次使用    
        clientAppEnhanceFiles: path.resolve(__dirname, '../client/clientAppEnhance.js'),// 该 Hook 中的文件会在客户端 App 创建后被调用，用以对其进行一些增强
        // clientAppRootComponentFiles: path.resolve(__dirname, '../client/components/BackToTop.js'), // 该 Hook 中的组件会被渲染到客户端 App 的根节点。
        define: {
            __DOCSEARCH_OPTIONS__: {num: 123},
        }
    }
}