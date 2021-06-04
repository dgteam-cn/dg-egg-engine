'use strict';

const Document = require('./app/class/Document.js')
module.exports = app => {
    app.beforeStart(async () => {
        const document = new Document(app)
        app.document = document
        document.exportJSON()
    })
}