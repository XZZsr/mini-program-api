//app.js
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