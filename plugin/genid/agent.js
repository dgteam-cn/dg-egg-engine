'use strict';
module.exports = agent => {
    let index = 0
    agent.messenger.on('egg-genid:init', ({pid}) => {
        agent.messenger.sendTo(pid, 'egg-genid:reply', {
            index: index ++
        })
    })
}