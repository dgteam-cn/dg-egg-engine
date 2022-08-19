'use strict';

const path = require('path')

module.exports = app => {
    app.ready(async () => {
        const directory = path.join(app.config.baseDir, 'app/queue')
        app.loader.loadToApp(directory, 'queue')
    })
}