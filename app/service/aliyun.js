'use strict';

const Service = require('egg').Service

// 模块依赖
// const crypto = require('crypto')
// const request = require('request')
const Core = require('@alicloud/pop-core')

// // 公共请求参数
// const HEADERS = {
//     'cache-control': 'no-cache',
//     'content-type': 'application/x-www-form-urlencoded'
// }

const VERSION = {
    SMS: {endpoint: 'https://dysmsapi.aliyuncs.com', apiVersion: '2017-05-25'},
    DNS: {url: 'https://alidns.aliyuncs.com/', Version: '2015-01-09'},
    CDN: {url: 'https://cdn.aliyuncs.com/', Version: '2014-11-11'},
    MAIL: {url: 'https://dm.aliyuncs.com/', Version: '2015-11-23'}
}

module.exports = class AliyunService extends Service {

    get ID() {
        return this.app.config.aliyun.id
    }
    get SERCRET() {
        return this.app.config.aliyun.secret
    }

    // 发送短信
    // @ 发送手机号 / 发送信息包 / 发送名称 / 发送模版
    async SMS(PhoneNumbers, param, SignName, TemplateCode) {
        const Client = new Core({
            accessKeyId: this.ID,
            accessKeySecret: this.SERCRET,
            ...VERSION.SMS
        })
        return new Promise(resolve => {
            Client.request('SendSms', {
                PhoneNumbers,
                SignName,
                TemplateCode,
                TemplateParam: JSON.stringify(param)
            }, {method: 'POST'}).then(res => {
                const {Code, Message} = res
                if (Code === 'OK') {
                    resolve({
                        err: 0,
                        msg: '发送成功',
                        result: {mobile: PhoneNumbers}
                    })
                } else {
                    resolve({
                        err: 500,
                        msg: Message,
                        result: {mobile: PhoneNumbers}
                    })
                }
                resolve({
                    err: 500,
                    msg: '服务器错误，请联系管理员。',
                    result: {mobile: PhoneNumbers}
                })
            })
        })
    }

    async BatchSMS(PhoneNumbers, param, SignName, TemplateCode) {
        if (typeof PhoneNumbers === 'number') PhoneNumbers = [PhoneNumbers]
        if (typeof PhoneNumbers === 'string') PhoneNumbers = PhoneNumbers.replace(/\s/g, "").split(',')
        if (PhoneNumbers.length > 100) {
            return Promise.resolve({err: 500, msg: '单次批量发送最多 100 条短信'})
        }
        if (typeof SignName === 'string') SignName = new Array(PhoneNumbers.length).fill(SignName.replace(/\s/g, ""), 0, PhoneNumbers.length)

        const TemplateParamJson = JSON.stringify(new Array(PhoneNumbers.length).fill(param, 0, PhoneNumbers.length))
        const Client = new Core({
            accessKeyId: this.ACCESS,
            accessKeySecret: this.SECRET,
            ...VERSION.SMS
        })
        // Fn.log('BatchSMS', PhoneNumbers, param, SignName, TemplateCode)
        return new Promise(resolve => {
            Client.request('SendBatchSms', {PhoneNumberJson: JSON.stringify(PhoneNumbers), SignNameJson: JSON.stringify(SignName), TemplateCode, TemplateParamJson}, {method: 'POST'}).then(res => {
                const {Code, Message} = res
                if (Code === 'OK') {
                    resolve({err: 0, msg: '发送成功', result: true})
                } else {
                    resolve({err: 500, msg: Message, result: null})
                }
            }, err => {
                resolve({err: 500, msg: '发送失败', result: null})
            })
        })
    }

    // // 发送邮件
    // // @ 发送地址 / 邮件标题 / 邮件内容 / 发件人名称
    // async Mail(address, title, body, name) {
    //     return this.Api('MAIL', 'SingleSendMail', {
    //         AccountName: 'dg@email.donguayx.com',
    //         ReplyToAddress: true,
    //         AddressType: 1,
    //         ToAddress: address || '', //多个地址用逗号隔开，最多 100 个地址
    //         FromAlias: this.UrlEncode(name)  || '',
    //         Subject: this.UrlEncode(title) || '', // 邮件标题
    //         HtmlBody: this.UrlEncode(body)  || '' // 邮件内容
    //     })
    // }

    // async MQ(name, district) {
    //     return new AliMNS.MQ(name, this.MQ_ACCOUNT, district)
    // }

    // -----------------------------------------------------

    // Api(Tpye, Action, Data) {

    //     let obj = VERSION[Tpye]
    //     let form = this.getParams(obj.Version, Action, Data)

    //     return new Promise((resolve, reject) => {
    //         request.post({
    //             url: obj.url,
    //             headers: HEADERS,
    //             json: true,
    //             form
    //         }, (error, response, body) => {
    //             resolve({
    //                 err: response.statusCode==200 ? 0 : response.statusCode,
    //                 msg: response.statusCode==200 ? '请求成功' : body.Message,
    //                 result: body
    //             })
    //         })
    //     })
    // }
    // // 整合请求包
    // getParams(Version, Action, Data) {
    //     // 公共
    //     let params = {
    //         Version,
    //         SignatureNonce: this.getRandomStr(25),
    //         Timestamp: new Date().toISOString()
    //     }
    //     // 请求参数
    //     Object.assign(params, this.COMMONPARAMS, {Action}, Data)
    //     // 获取签名
    //     params.Signature = this.getSignature(params)

    //     return params
    // }


    // // 获取随机数
    // getRandomStr(length) {
    //     return Array.from({length}).map((value) => {
    //         return Math.floor(Math.random() * 10)
    //     }).join('')
    // }
    // // 获取签名
    // getSignature(params) {
    //     let paramsStr = this.toQueryString(params)
    //     let signTemp = `POST&${encodeURIComponent('/')}&${encodeURIComponent(paramsStr)}`
    //     let signature = crypto.createHmac('sha1', `${this.SECRET}&`).update(signTemp).digest('base64')
    //     return signature
    // }
    // // 转换请求删除为字符串
    // toQueryString(params) {
    //     return Object.keys(params).sort().map(key => {
    //         return `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    //     }).join('&')
    // }
    // // url编码
    // UrlEncode(str="") {
    //     //str = encodeURIComponent(str)
    //     str = str.replace(/\%20/g, " ")
    //     str = str.replace(/\%3A/g, ":")
    //     str = str.replace(/\%2F/g, "/")
    //     str = str.replace(/\%3F/g, "?")
    //     str = str.replace(/\%3D/g, "=")
    //     str = str.replace(/\%26/g, "&")
    //     str = str.replace(/\%23/g, "#")
    //     str = str.replace(/\%27/g, "'")
    //     str = str.replace(/\%22/g, '"')
    //     return str
    // }
}