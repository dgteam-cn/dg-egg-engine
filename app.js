module.exports = app => {
    app.config.coreMiddleware.push('checkup')
}