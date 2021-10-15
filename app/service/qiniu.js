'use strict';

const Service = require('egg').Service

const qiniu = require('qiniu') // 开发版本 ^7.2.2
const crypto = require('crypto')
const axios = require('axios')
const querystring = require("querystring")

module.exports = class QiniuService extends Service {

    // 参数
    get QINIU_ACCESS() {
        return this.app.config.qiniu.access
    }
    get QINIU_SECRET() {
        return this.app.config.qiniu.secret
    }
    get mac() {
        return new qiniu.auth.digest.Mac(this.QINIU_ACCESS, this.QINIU_SECRET)
    }
    // get config() {
    //     return new qiniu.conf.Config()
    // }
    get BucketManager() {
        return new qiniu.rs.BucketManager(this.mac, new qiniu.conf.Config())
    }
    get CdnManager() {
        return new qiniu.cdn.CdnManager(this.mac, new qiniu.conf.Config())
    }

    // 生成带有授权 token 的请求头
    headersAuth(url="") {
        return {
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'Authorization': qiniu.util.generateAccessToken(this.mac, url)
        }
    }

    /**
     * 获取上传凭证 (空间|路径|文件名)
     * @param {string} bucket - 需要上传目标的 bucket
     * @param {string} [path=""] - 上传路径
     * @param {string} [name=""] - 文件名
     * @param {object} options - 上传配置
     * @returns {object|fasle}
     */
    uploadToken(bucket = this.app.config.qiniu.bucket_public, path = "", name = "", {mimeLimit = 'image/*', fsizeLimit = 5 * 1024 * 1024, fileType = 0, persistentOps=''} = {}) {
        // 以路径和文件名生成密钥，如果为命名则自动命名
        const key = path + ( name ? name : crypto.createHash('md5').update(new Date() * 1 + Math.floor(Math.random() * 10).toString()).digest('hex'))
        const returnBody = ~mimeLimit.indexOf('image') ?
            '{"err":0,"msg":"上传成功","result":{"key":$(key),"size":$(fsize),"ave":$(imageAve),"type":$(mimeType),"name":$(fname),"width":$(imageInfo.width), "height": $(imageInfo.height)}}' :
            '{"err":0,"msg":"上传成功","result":{"key":$(key),"size":$(fsize),"ave":$(imageAve),"type":$(mimeType),"name":$(fname)}}'

        // 构建上传策略，按排序依次是（上传凭证默认有效期为申请后的一个小时）
        const upToken = new qiniu.rs.PutPolicy({
            scope: bucket + ":" + key, // 上传位置
            detectMime: 0,
            fsizeLimit, // 上传最大限制
            mimeLimit, // 上传类型限制
            returnBody,   // 成功返回信息模版
            fileType, // 存储类型，0 普通， 1 低频,  2 归档
            persistentOps // 预转数据处理命令和保存处理结果的存储空间与资源名（归档存储不支持）
        })

        // 生成上传密钥
        try {
            let token = upToken.uploadToken(this.mac);
            return {key, token}
        } catch (e) {
            return false
        }
    }

    /**
     * 上传文件
     * @param {*} bucket - 需要上传目标的 bucket
     * @param {*} path
     * @param {*} name
     * @param {*} localFile
     * @returns
     */
    async uploadFile(bucket, path, name, localFile) {
        return new Promise(resolve => {
            let formUploader = new qiniu.form_up.FormUploader(this.config);
            let putExtra = new qiniu.form_up.PutExtra();
            let key = path + name
            let upToken = new qiniu.rs.PutPolicy({
                scope: bucket + ":" + key
            })
            let uploadToken = upToken.uploadToken(this.mac);
            formUploader.putFile(uploadToken, key, localFile, putExtra, (respErr, respBody, respInfo) => {
                if (respErr) {
                    throw respErr;
                }
                if (respInfo.statusCode == 200) {
                    resolve({err: 0, result: respBody})
                } else {
                    resolve({err: respInfo.statusCode, result: respBody})
                }
            })
        })
    }
    async fetchFile(bucket, path='', name='', url='') {
        return new Promise(resolve => {
            let bucketManager = new qiniu.rs.BucketManager(this.mac, this.config)
            let key = path + name
            bucketManager.fetch(url, bucket, key, (err, respBody, respInfo) => {
                if (!err && respInfo.statusCode == 200) {
                    resolve({err: 0, result: respBody})
                } else {
                    resolve({err: 500})
                }
            })
        })
    }

    publicToken(path, host = this.app.config.qiniu.domain_public) {
        const bucketManager = new qiniu.rs.BucketManager(this.mac, this.config)
        return bucketManager.publicDownloadUrl(host, path)
    }
    privateToken(path, deadline=parseInt(Date.now() / 1000) + 3600, host = this.app.config.qiniu.domain_private) {
        const bucketManager = new qiniu.rs.BucketManager(this.mac, this.config)
        return bucketManager.privateDownloadUrl(host, path, deadline)
    }

    /**
     * 为字段（私有图片地址）添加访问令牌
     * @param {object} body - 需要授权的返回题
     * @param {Array<String>} keys - 需要授权的字段
     * @param {boolean | string} options.thumb = 是否需要缩略图
     * @returns
     */
    privateTokenBodyFormat(body, keys = [], {thumb = false} = {}) {
        const thumbMaps = {
            'mini': 'w/128/h/128/q/75',
            'small': 'w/256/h/256/q/75',
            'normal': 'w/512/h/512/q/75',
            'big': 'w/768/h/768/q/75',
            'huge': 'w/1024/h/1024/q/75'
        }
        if (typeof keys === 'string') keys = [keys]
        if (keys.length === 0) return body
        const imagePreview = obj => {
            const row = obj.toJSON ? obj.toJSON() : Object.assign({}, obj)
            keys.forEach(key => {
                row[`_${key}`] = row[key] ? Array.from(row[key].split(','), item => this.privateToken(item)).join(',') : ''
                if (typeof thumb === 'string' && thumbMaps[thumb]) {
                    row[`_${key}_thumb`] = row[key] ? Array.from(row[key].split(','), item => this.privateToken(`${item}?imageView2/2/${thumbMaps[thumb]}`)).join(',') : ''
                }
            })
            return row
        }
        return Array.isArray(body) ? Array.from(body, row => imagePreview(row)) : imagePreview(body)
    }

    info(bucket, key) {
        return new Promise(resolve => {
            this.BucketManager.stat(bucket, key, (err, res) => {
                if (!err) {
                    if (res && res.error) {
                        resolve({err: 403, msg: res.error})
                    } else {
                        resolve({err: 0, msg: 'suc', result: res})
                    }
                } else {
                    resolve({err: 500, result: err.message})
                }
            })
        })
    }
    imageinfo(key, type='public') {
        return new Promise(resolve => {
            if (!key) {
                resolve({err: 403, msg: 'key error.', result: null})
            } else {
                key = key + '?imageInfo'
            }

            let url = ''
            if (type === 'public') {
                url = this.publicToken(key)
            }
            if (type === 'private') {
                url = this.privateToken(key)
            }
            axios.get({url, json: true}, ( err, response, body ) => {
                if (body && body.size) {
                    resolve({err: 0, msg: 'suc', result: body})
                } else {
                    resolve({err: 403, msg: 'key error.', result: null})
                }
            })
        })
    }
    // 列表
    list(bucket, {limit, prefix, marker, delimiter}={}) {
        return new Promise(resolve => {
            this.BucketManager.listPrefix(bucket, {limit, prefix, marker, delimiter}, (err, res, info) => {
                if (!err) {
                    let {items: result, commonPrefixes: folders, marker} = res
                    resolve({err: 0, result, folders, marker})
                } else {
                    resolve({err: 502, msg: err.message})
                }
            })
        })
    }
    // 剪切
    move(bucket, key, dstbucket, deskey, force=true) {
        return new Promise(resolve => {
            this.BucketManager.move(bucket, key, dstbucket, deskey, {force}, (err, res, info) => {
                if (!err) {
                    if (res && res.error) {
                        resolve({err: 403, msg: res.error})
                    } else {
                        resolve({err: 0, msg: 'suc', result: res})
                    }
                } else {
                    resolve({err: 502, msg: err.message})
                }
            })
        })
    }
    // 复制
    copy(bucket, key, dstbucket, deskey) {
        return new Promise(resolve => {
            this.BucketManager.copy(bucket, key, dstbucket, deskey, {force: true}, (err, res, info) => {
                if (!err) {
                    if (res && res.error) {
                        resolve({err: 403, msg: res.error})
                    } else {
                        resolve({err: 0, msg: 'suc', result: res})
                    }
                } else {
                    resolve({err: 502, msg: err.message})
                }
            })
        })
    }
    // 删除
    delete(bucket, key) {
        return new Promise(resolve => {
            this.BucketManager.delete(bucket, key, (err, res) => {
                if (!err) {
                    if (res && res.error) {
                        resolve({err: 403, msg: res.error})
                    } else {
                        resolve({err: 0, msg: 'suc', result: res})
                    }
                } else {
                    resolve({err: 502, msg: err.message})
                }
            })
        })
    }
    // 到期时间
    expire(bucket, key, days) {
        return new Promise(resolve => {
            this.BucketManager.deleteAfterDays(bucket, key, days, (err, res) => {
                if (!err) {
                    if (res && res.error) {
                        resolve({err: 403, msg: res.error})
                    } else {
                        resolve({err: 0, msg: 'suc', result: res})
                    }
                } else {
                    resolve({err: 502, msg: err.message})
                }
            })
        })
    }
    // 批量
    batch(bucket, type='list', list=[]) {
        const queue = []
        const dir = {
            'list': 'statOp', // 文件信息 [bucket、key]
            'change': 'changeMimeOp', // 修改文件类型： [bucket、key、type]
            'delete': 'deleteOp', // 批量删除 [bucket、key]
            'move': 'moveOp', // 批量剪切 [bucket、key、bucket2、key2]
            'copy': 'copyOp', // 批量复制 [bucket、key、bucket2、key2]
            'expire': 'deleteAfterDaysOp', // 更新有效期 [bucket、key、time]
            'type': 'changeTypeOp' // 存储类型 [bucket、key、type] type=0普通 type=1低频
        }
        return new Promise(resolve => {
            let typeName = dir[type]
            if (typeName && list) {
                for (let item of list) {
                    queue.push(qiniu.rs[typeName](bucket, ...item))
                }
            } else {

            }
            this.BucketManager.batch(queue, (err, res) => {
                if (!err) {
                    resolve({err: 0, msg: 'suc', result: res})
                } else {
                    resolve({err: 500, result: err.message})
                }
            })
        })
    }

    async Api(action='', {params={}}={}) {
        let actionMap = {
            // 查询空间
            buckets: {method: 'GET', host: 'rs.qbox.me', path: 'buckets'},
            // 统计
            space: {method: 'GET', host: 'api.qiniu.com', path: 'v6/space'},
            count: {method: 'GET', host: 'api.qiniu.com', path: 'v6/count'},
            space_line: {method: 'GET', host: 'api.qiniu.com', path: 'v6/space_line'},
            count_line: {method: 'GET', host: 'api.qiniu.com', path: 'v6/count_line'},
            space_archive: {method: 'GET', host: 'api.qiniu.com', path: 'v6/space_archive'},
            count_archive: {method: 'GET', host: 'api.qiniu.com', path: 'v6/count_archive'},
            blob_transfer: {method: 'GET', host: 'api.qiniu.com', path: 'v6/blob_transfer', params: {select: 'size'}}, // 获取跨区域同步流量统计
            rs_chtype: {method: 'GET', host: 'api.qiniu.com', path: 'v6/rs_chtype', params: {select: 'hits'}}, // 获取存储类型请求次数统计
            blob_io: {method: 'GET', host: 'api.qiniu.com', path: 'v6/blob_io', params: {select: 'flow'}}, // 获取外网流出流量统计，CDN回源流出流量统计，数据读取统计， GET请求次数统计
            rs_put: {method: 'GET', host: 'api.qiniu.com', path: 'v6/rs_put', params: {select: 'hits'}} // 获取 PUT 请求次数统计
        }
        if (actionMap[action]) {
            let {method, host, path, params: _params} = actionMap[action]
            let url = `https://${host}/${path}`
            if (!this.ctx.isEmpty(params) || _params) {
                url = `${url}?${querystring.stringify( this.ctx.extend(_params, params) )}`
            }
            return new Promise(resolve => {
                axios({method, url, headers: this.headersAuth(url), data: {}, json: true}).then(res => {
                    if (res.status === 200 && res.data) {
                        resolve({err: 0, msg: '请求成功', result: res.data})
                    } else {
                        resolve({err: 500, msg: '网络链接失败', result: null})
                    }
                }, err => resolve({err: 504}))
            })
        } else {
            return Promise.resolve({err: 404})
        }
    }
}