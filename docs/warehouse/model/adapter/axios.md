---
title: axios
---

```javascript
import axios from 'axios'
const {CancelToken} = axios

const ajax = axios.create({
    baseURL: 'https://www.project.com', // 请填写自己的域名
    auth: false,
    timeout: 12000
})

/* 
 * 添加请求拦截器
 */
ajax.interceptors.request.use(config => {
    // 可根据服务端接口鉴权要求，添加鉴权令牌（token）
    // const token = localStorage.getItem('token')
    // if (token) config.headers['Authorization'] = token
    return config
}, error => {    
    console.warn('请求拦截器：请求错误', error)
    return Promise.reject(error)
})

/* 
 * 添加响应拦截器
 * 框架要求数据格式为
 * {
 *     err: 0, // 错误码，0 表示没有错误
 *     result: [], // 返回结果，如果是请求列表，返回 Array; 其他情况返回 Object 或 null
 *     page: 1, // 当前请求的是第几页
 *     marker: '', // [可选] 分页标记，对应移动端 “触底加载更多功能”
 *     count: 10, // [可选] 数据总条数
 *     total: 1, // 数组总页码数
 * }
 */
ajax.interceptors.response.use(res => {
    // 此处可以
    return res
}, error => {
    console.warn('响应拦截器：本地网络错误，或服务器无响应', error)
    return Promise.reject({
        data: {
            err: 500,
            data: null,
            msg: `${error.name ? error.name + ':' : ''}${error.message}`
        }
    })
})

let count = 0
export default function(config={}) {

    // 计数器
    count ++
    // 取消令牌
    let cancel = null
    let cancelToken = new CancelToken( fun => {
        cancel = fun
        if (config.getCancel) {
            config.getCancel(count, cancel)
        }
    })
    // 返回封装后的 ajax 对象
    return ajax({
        validateStatus: status => {
            return status >= 200 && status < 600
        },
        id: count,
        cancelToken, cancel,
        ...config
    })
}
```