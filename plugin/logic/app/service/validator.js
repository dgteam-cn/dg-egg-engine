const Service = require('egg').Service
const validator = require('../validator.js')

module.exports = class Validator extends Service {
    checkup(params, rules, opt = {}) {
        try {
            const config = this.app.config.logic && this.app.config.logic.validator || {}
            const {locale} = config
            return validator.checkup(rules, params, Object.assign({locale, ctx: this.ctx}, opt))
        } catch (err) {
            return {err: 500, result: {}, errors: {'framework': 'validator rules error.'}}
        }
    }
}