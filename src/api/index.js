import axios from 'axios'
import { Loading } from 'element-ui'
import msgBoxErr from '@/common/msgbox-err.js'
// import store from '@/vuex/store.js'
import { urlMatcher } from '@/common/util.js'
import { each } from 'lodash'
// import qs from 'qs'

const loadingInstances = {}

export const http = axios.create({
  baseURL: process.env.API_HOST,
  // withCredentials: process.env.NODE_ENV === 'production',
  timeout: 20000
  // transformRequest: [data => {
  //   if (data) {
  //     return qs.stringify(data)
  //   }
  //   return data
  // }]
})

function closeLoading(url) {
  const loadingInstance = loadingInstances[url]
  if (loadingInstance) {
    loadingInstance.close()
    delete loadingInstances[url]
  }
}

// http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
http.interceptors.request.use(config => {
  // config.headers.common['x-auth-token'] = store.getters.token
  config.url = urlMatcher(config.url, config.pathParams)
  // if (config.params && config.params.page) {
  //   config.params.page = config.params.page - 1
  // }

  if (config.loadingMaskTarget) {
    loadingInstances[config.url] = Loading.service({
      target: config.loadingMaskTarget
    })
  }
  return config
})

http.interceptors.response.use(res => {
  closeLoading(res.config.url)
  const data = res.data
  if (!data.code && data.resultCode === 'SUCCESS') {
    data.code = 200
  } else if (!data.code) {
    data.code = 400
  }

  if (data.code === 200) {
    return res
  }

  if (data.code === 419 || data.code === 401) {
    // if (res.config.skipAuth) {
    //   store.dispatch('logout', true)
    // } else {
    msgBoxErr(data.message || '无访问权限！', data.code)
    //   store.dispatch('logout')
    // }
  } else if (data.code === 400) {
    msgBoxErr(data.message || '请求失败！', data.code)
  } else if (data.code === 403) {
    msgBoxErr(data.message || '您无此权限！', data.code)
  } else if (data.code === 404) {
    msgBoxErr(data.message || '访问错误！', data.code)
  } else if (data.code === 500 || data.code === 502) {
    msgBoxErr(data.message || '抱歉！服务器忙。', data.code)
  } else {
    msgBoxErr(data.message || '请求失败！', data.code)
  }
  // return res
  return Promise.reject(res)
}, err => {
  err.config && closeLoading(err.config.url)
  msgBoxErr(err.message.indexOf('timeout') > -1 ? '请求超时' : '抱歉，服务器忙！', 'SERVER')
  return Promise.reject(err)
})

export const APIS = [{
  name: 'coinMenus',
  url: '/coin_menus',
  methods: ['get']
}]

const apiCollection = {}

each(APIS, (api) => {
  each(api.methods, m => {
    apiCollection[api.name] = {}
    if (m === 'get') {
      apiCollection[api.name].get = (data, config) => http.get(api.url, { params: data, ...config })
    } else {
      apiCollection[api.name][m] = (data, config) => http[m](api.url, data, config)
    }
  })
})

export default apiCollection
