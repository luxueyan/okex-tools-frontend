import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: __dirname,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  },
  routes: [{
    path: '/',
    name: 'index',
    component: () => import('@/views/Index.vue')
  }, {
    path: '/btc_ms',
    name: 'btcMS',
    component: () => import('@/views/BtcMS.vue')
  }, {
    path: '/btc_m',
    bame: 'btcM',
    component: () => import('@/views/BtcM.vue')
  }]
})
