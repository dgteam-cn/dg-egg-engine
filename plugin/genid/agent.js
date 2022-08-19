
const GenId = require('./app/library/genid.class.js')
module.exports = agent => {

    // const genid = new GenId(agent.config.genid.client)
    // agent.messenger.on('egg-ready', () => {
    //     agent.messenger.on('egg-genid:next-id', ({pid}) => {
    //         if (pid) {
    //             agent.messenger.sendTo(pid, 'egg-genid:callback', genid.NextId())
    //         }
    //     })
    // })

    let index = 0
    agent.messenger.on('egg-genid:init', ({pid}) => {
        agent.messenger.sendTo(pid, 'egg-genid:reply', {
            index: index ++
        })
    })
}