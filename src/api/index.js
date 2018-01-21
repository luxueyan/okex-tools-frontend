import axios from 'axios'
import { Loading } from 'element-ui'
import msgBoxErr from '@/common/msgbox-err.js'
// import store from '@/vuex/store.js'
import { urlMatcher } from '@/common/util.js'
import { each } from 'lodash'

const loadingInstances = {}

export const http = axios.create({
  baseURL: process.env.API_HOST,
  timeout: 20000
})

function closeLoading(url) {
  const loadingInstance = loadingInstances[url]
  if (loadingInstance) {
    loadingInstance.close()
    delete loadingInstances[url]
  }
}

http.interceptors.request.use(config => {
  // config.headers.common['x-auth-token'] = store.getters.token
  config.url = urlMatcher(config.url, config.pathParams)
  if (config.loadingMaskTarget) {
    loadingInstances[config.url] = Loading.service({
      target: config.loadingMaskTarget
    })
  }
  return config
})

http.interceptors.response.use(res => {
  closeLoading(res.config.url)
  const { data, status } = res
  if (status === 200) {
    return res
  }

  if (status === 419 || status === 401) {
    // if (res.config.skipAuth) {
    //   store.dispatch('logout', true)
    // } else {
    msgBoxErr(data.message || '无访问权限！', status)
    //   store.dispatch('logout')
    // }
  } else if (status === 400) {
    msgBoxErr(data.message || '请求失败！', status)
  } else if (status === 403) {
    msgBoxErr(data.message || '您无此权限！', status)
  } else if (status === 404) {
    msgBoxErr(data.message || '访问错误！', status)
  } else if (status === 500 || status === 502) {
    msgBoxErr(data.message || '抱歉！服务器忙。', status)
  } else {
    msgBoxErr(data.message || '请求失败！', status)
  }
  // return res
  return Promise.reject(res)
}, err => {
  err.config && closeLoading(err.config.url)
  msgBoxErr(err.message.indexOf('timeout') > -1 ? '请求超时' : '抱歉，服务器忙！', 'SERVER')
  return Promise.reject(err)
})

// api define
export const APIS = [{
  name: 'coinMenus',
  url: '/coin_menus',
  methods: ['get']
}, {
  name: 'restartSystem',
  url: '/restart_system',
  methods: ['get', 'post']
}]

const apiCollection = {}

each(APIS, (api) => {
  each(api.methods, m => {
    apiCollection[api.name] = apiCollection[api.name] || {}
    if (m === 'get') {
      apiCollection[api.name].get = (data, config) => http.get(api.url, { params: data, ...config })
    } else {
      apiCollection[api.name][m] = (data, config) => http[m](api.url, data, config)
    }
  })
})

export default apiCollection
