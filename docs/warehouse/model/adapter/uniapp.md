---
title: uniapp
---

```javascript

let count = 0
export default function(opt = {}) {
    const {
        url = '',
        method = 'GET',
        headers = {},
        params = {},
        data = {},
        dataType = 'json',
        silent = false, // 次字段为自定义字段
        loading = false, // 次字段为自定义字段
        timeout = 15000
    } = opt
    const config = {
        baseURL: 'https://www.project.com' // 填写自己的服务器 API 地址
    }

    // URL 自动拼接
    url = config.baseURL + url
    if (id) {
        url = `${url}/${id}`
    }
    if (params) {
        url += '?'
        for (let key in params) {
            if (params[key] !== undefined) {
                if (typeof params[key] === 'string' || typeof params[key] === 'number') {
                    url += `${key}=${params[key]}&`
                } else {
                    url += `${key}=${JSON.stringify(params[key])}&`
                }
            }
        }
    }
    
    // 为所有接口添加鉴权令牌（根据后端的需求）
    // const token = uni.getStorageSync('token')
    // if (token) {
    //    headers['Authorization'] = 'Bearer ' + uni.getStorageSync('token')
    // }

    return new Promise((resolve, reject) => {
        count ++
        let config = {...opt, id: count}
        let requestTask = {}
        if (config.getCancel) {
            config.getCancel(count, () => {
                try {
                    requestTask.abort() // 此处填写取消的方法
                } catch (err) {

                }
            })
        }
        const toast = title => {
            if (!silent) {
                uni.showToast({title, duration: 1500, icon: 'none'})
            }
        }
        if (loading) {
            uni.showLoading({title: typeof loading === 'string' ? loading : '', mask: true})
        }
        requestTask = uni.request({
            url, data, header: headers, method, dataType, timeout,
            success: res => {
                if (loading) {
                    uni.hideLoading()
                }
                const App = getApp()
                try {
                    if (!~res.header['content-type'].indexOf('application/json')) {
                        console.log('[ajax] content type error.')
                        uni.showToast({title: 'content type error.', duration: 1500, icon: 'none'})
                    }
                } catch (e) {

                }
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
                    if (res.data.code) {
                        res.data.err = res.data.code // 有些 JAVA 或后端把 code 作为 err
                    }
                    if (res.data.err) {
                        toast(res.data.msg)
                    }
                } else {
                    const {statusCode: status} = res

                    console.log({...res, config: {url, data, header: headers, method, dataType, timeout: config.timeout}})

                    if (typeof res.data != 'object') res.data = {err: status, msg: 'service error.', result: null, orginBody: res.data}
                    if (res.data.err && typeof res.data.err === 'string') res.data.err = Number(res.data.err)
                    if (!res.data.err || res.data.err < 400) res.data.err = res.statusCode
                    // res.data.err = status
                    if (!silent) {
                        if (res.data.err == 401) {
                            console.log('401 token is invalid.')
                            // #ifndef MP
                            uni.showModal({
                                title: '温馨提示', content: '授权令牌已失效，请重新登录',
                                showCancel: false,
                                success: res => {
                                    App.$store.dispatch('base/RELOGIN', {login: true})
                                }
                            })
                            // #endif
                        } else if (res.data.err == 402) {
                            console.log('402 invalid.')
                        } else if (res.data.err == 404) {
                            toast('not found.')
                        } else if (res.data.err == 422) {
                            // if (typeof res.data.result === 'object' && typeof res.data.result[Object.keys(res.data.result)[0]] === 'string') {
                            //     toast(res.data.result[Object.keys(res.data.result)[0]])
                            // } else if (res.data.msg){
                            //     toast(res.data.msg)
                            // } else {
                            //     toast('error code: 422')
                            // }
                            toast(res.data.msg ? res.data.msg : '请求失败')
                        } else {
                            toast(res.data.msg ? res.data.msg : '请求失败')
                        }
                    } else if (res.data.err == 401) {
                        Helper.Cache('token', null)
                    }
                }
                // console.log({ config, ...res }, res)
                resolve({config, ...res})
            },
            fail: err => {
                console.log('ajax fail', config, err)
                if (loading) uni.hideLoading()
                resolve({config, statusCode: 500, data: {err: 500, msg: '服务器未响应', result: null}})
            }
        })
    })
}
```