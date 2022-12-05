'use strict';
const GenId = require('./app/library/genid.class.js')
module.exports = app => {
    app.messenger.once('egg-ready', () => {
        app.messenger.sendToAgent('egg-genid:init', {pid: process.pid})
    })
    app.messenger.once('egg-genid:reply', ({index}) => {
        const {WorkerId} = app.config.genid.client
        const genid = new GenId({...app.config.genid.client, WorkerId: Number(WorkerId) + Number(index)})
        app.genid = () => genid.NextId()
    })
}