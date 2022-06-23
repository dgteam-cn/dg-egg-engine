```javascript 
'use strict';
const Query = {}
const Check = {}
const {Logic} = require('@dgteam/egg-engine')
module.exports = class extends Logic {
    constructor(app, options) {
        super(app, options)
        this.title = '客户'
        this.RESTful = {
            admin: {
                GET: this.mixin([Query, Logic.defaultQuery]),
                // POST: this.mixin([{}, Check]),
                // PUT: this.mixin(Check, {mode: 'auto'}),
                DELETE: {}
            },
            default: {
                GET: this.mixin([Query, Logic.defaultQuery]),
                DELETE: {}
            },
            none: {}
        }
        this.actions = {

        }
    }
}
```