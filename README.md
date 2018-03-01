

## 小程序针对request的简单配置

###简介

>在小程序开发中，同样也需要我们进行用户登录，通常情况下我们是token来验证用户信息。这里是我们将request进行的简易封装。

###流程

 1. 调用封装好的request的方法
 2. 执行过程中回到缓存中查找token值，如果没查到则会直接调用getToken方法，重新获取token值
 3. getToken是通过调用小程序的登录和获取用户信息接口拿到的参数调用我们自己的login接口返回token值

###代码

```app.js
const API_URL = 'https://xxxx/api/'  //接口

App({
    asyncRequest(params) {
        let that = this
        let token = wx.getStorageSync('token')
        // 直接使用url，有时候会直接调一些其他的接口
        if (!params.useUrl) {
            params.url = API_URL + params.url

        }
        params.header = {
            Authorization: 'Bearer ' + token,
            Accept: 'application/json'
        }
        params.data = params.data ? params.data : {}

        return new Promise((resolve, reject) => {
            params.success = res => {
                if (200 !== res.statusCode) {
                    reject(res)
                }
                resolve(res)
            }
            params.fail = err => {
                reject(err)
            }
            return wx.request(params)
        })
    },

    request(params) {
        let that = this
        return this.asyncRequest(params).catch(err => {
            if (401 === err.statusCode) {
                return that.getToken(params.data).then(res => {
                    params.useUrl = true
                    return that.asyncRequest(params)
                })
            }
            return Promise.reject(err)
        })
    },
    getToken(options) {  //获取token
        let that = this
        return new Promise((resolve, reject) => {
            wx.login({
                success: res1 => {
                    let { code } = res1
                    // 获取用户信息
                    wx.getUserInfo({ //用户授权拿到encryptedData、iv
                        success: res2 => {
                            let { encryptedData, iv } = res2
                            // 业务登录，获取access_token
                            that.asyncRequest({
                                url: 'login',
                                data: { code, encryptedData, iv },
                                method: 'POST',
                            }).then(res3 => {
                                wx.setStorageSync('token', res3.data.access_token)  //获取token放在storage
                                wx.setStorageSync('user', res3.data.user_info)

                                resolve(res3)
                            }).catch(err3 => {
                                reject(err3)
                            })
                        },
                        fail: err2 => { //如果决绝授权弹窗提醒跳转至用户信息授权页面，授权后跳回首页
                            console.log('err2:', err2)
                            // 提示用户前往授权
                            wx.showModal({
                                // title: '提示',
                                content: '您未授权，请您开启“用户信息”授权。',
                                showCancel: false,
                                confirmText: '确定',
                                complete: () => {
                                    wx.openSetting({
                                        complete: () => {
                                            wx.reLaunch({
                                                url: '/pages/index/index'
                                            })
                                        }
                                    })
                                },
                            })
                            reject(err2)
                        }
                    })
                },
                fail: err1 => {
                    console.log('err1:', err1)
                    reject(err1)
                }
            })
        })
    }
})
```

###调用方法

>官方的用法一样 const app = getApp()
app.request和wx.request一样！
类似https://xxxx/api/login的调用方式
```
app.request({
    url: 'login',
    success: res=>{}
})
```