const Model = require('../../core/model.js')
const _ = require('lodash')
const helper = require('@dgteam/helper')
const {md5, base64} = require('@dgteam/helper/dist/hash.js')
module.exports = {
    helper, _, // lodash
    get models() {
        return this.model.models
    },
    table(name) {
        return new Model(name, this) // 获取数据模型
    },
    tools: {
        log(...obj) {
            // eslint-disable-next-line no-console
            console.log('\n', ...obj, '\n')
        },
        randomInt(number) {
            return (Math.random() + '').substring(2, 2+number)
        },
        uuid(n, num) {
            const box = num ?
                ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] :
                [
                    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
                    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'm', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
                ]
            let res = ""
            for (let i = 0; i < n; i ++) {
                const id = Math.ceil(Math.random() * box.length)
                res += box[id - 1]
            }
            return res
        },
        verifyImg(num, options={}) {
            const captchapng = require('captchapng')
            const {width, height} = helper.extend({width: 100, height: 30}, options)
            const code = new captchapng( width, height, num)
            code.color(0, 0, 0, 0) // 背景颜色
            code.color(60, 60, 60, 255) // 字体颜色
            return Buffer.from(code.getBase64(), 'base64')
        },

        md5,
        base64
    }
}