const {
    extend, originJSON,
    big, price, priceUppercase, prefixZero, uuid,
    time, timestamp
} = require('@dgteam/helper')
const {md5, base64, base64Decode, base64Encode, base64EncodeURI} = require('@dgteam/helper/dist/hash.js')

module.exports = {

    // 常用方法
    extend, originJSON,

    // 数学方法
    big, price, priceUppercase, prefixZero, uuid,

    // 时间方法
    time, timestamp,

    // 哈希算法
    md5, base64, base64Decode, base64Encode, base64EncodeURI,

    log(...msg) {
        // eslint-disable-next-line no-console
        console.log('\n', ...msg, '\n')
    }
}