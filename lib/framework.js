const path = require('path')
const egg = require('egg')

const EGG_PATH = Symbol.for('egg#eggPath')
class Application extends egg.Application {
    get [EGG_PATH]() {
        return path.dirname(__dirname);
    }
}
class Agent extends egg.Agent {
    get [EGG_PATH]() {
        return path.dirname(__dirname);
    }
}

const Controller = require('../core/controller.js')
const Logic = require('../core/logic.js')
const Model = require('../core/model.js')
const SequelizeFactory = require('../core/sequelize.factory.js')

module.exports = Object.assign(egg, {
    Application, Agent,
    Controller, Logic, Model, SequelizeFactory
})