const Service = require('egg').Service
// const NodeRSA = require('node-rsa')
// const axios = require('axios')
// const jwt = require('jsonwebtoken')
module.exports = class AppleService extends Service {

    // // 获取苹果的公钥
    // async getApplePublicKey() {
    //     let res = await axios.request({
    //         method: "GET",
    //         url: "https://appleid.apple.com/auth/keys",
    //         headers: {
    //             'Content-Type': 'application/json'
    //         }
    //     })
    //     let key = res.data.keys[0]
    //     const pubKey = new NodeRSA();
    //     pubKey.importKey({n: Buffer.from(key.n, 'base64'), e: Buffer.from(key.e, 'base64')}, 'components-public');
    //     return pubKey.exportKey(['public']);
    // }

    // // 验证id_token
    // // id_token:  Identity token
    // // audience : app bundle id  , 可以不用
    // // subject : userId , 可以不用
    // async verifyIdToken(id_token, audience, subject, callback) {
    //     const applePublicKey = await this.getApplePublicKey();
    //     // const jwtClaims = jwt.verify(id_token, applePublicKey, { algorithms: 'RS256', issuer: "https://appleid.apple.com", audience, subject });
    //     jwt.verify(id_token, applePublicKey, {algorithms: 'RS256'}, (err, decode) => {

    //         if (err) {
    //             //message: invalid signature  / jwt expired
    //             console.log("JJ: verifyIdToken -> error", err.name, err.message, err.date);
    //             callback && callback(err);
    //         } else if (decode) {

    //             // let decode = {
    //             //     iss: 'https://appleid.apple.com',
    //             //     aud: 'xxxxxxxx',
    //             //     exp: 1579171507,
    //             //     iat: 1579170907,
    //             //     sub: 'xxxxxxxx.xxxx',
    //             //     c_hash: 'xxxxxxxxxxxx',
    //             //     email: 'xxxxx@qq.com',
    //             //     email_verified: 'true',
    //             //     auth_time: 1579170907
    //             // }
    //             console.log("JJ: verifyIdToken -> decode", decode)
    //             callback && callback(decode);
    //         // sub 就是用户的唯一标识, 服务器可以保存它用来检查用户有没用过apple pay login , 至于用户第一次Login时,服务器就默认开一个member 给用户, 还是见到没login 过就自己再通过app 返回到注册页面再接着注册流程, 最后再pass userId 到server 保存. 这个看公司需求.
    //         }
    //     })
    // }
}