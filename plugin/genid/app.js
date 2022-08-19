'use strict';
const GenId = require('./app/library/genid.class.js')
module.exports = app => {

    // function create (config = {}, app) {
    //     // WorkerId
    //     return new GenId(app, config)
    // }

    // app.genid = () => {
    //     return new Promise(resolve => {
    //         const timer = setTimeout(() => {
    //             resolve(null)
    //         }, 3000)
    //         app.messenger.sendToAgent('egg-genid:next-id', {pid: process.pid})
    //         app.messenger.once('egg-genid:callback', key => {
    //             clearTimeout(timer)
    //             resolve(key)
    //         })
    //     })
    // }

    app.messenger.once('egg-ready', () => {
        app.messenger.sendToAgent('egg-genid:init', {pid: process.pid})
    })
    app.messenger.once('egg-genid:reply', ({index}) => {
        const {WorkerId} = app.config.genid.client
        const genid = new GenId({...app.config.genid.client, WorkerId: Number(WorkerId) + Number(index)})
        app.genid = () => genid.NextId()
    })

    // const genid = new GenId(app.config.genid.client)
    // app.genid = () => genid.NextId()
}