import { defineClientAppEnhance } from '@vuepress/client'

export default defineClientAppEnhance(({ app, router, siteData }) => {
    console.log('defineClientAppEnhance', app, router, siteData)
})