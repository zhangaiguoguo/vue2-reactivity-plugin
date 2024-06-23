# vue2-reactive-transform-vue3-reactive-plugin-tree-master
vue2-reactive-transform-vue3-reactive-plugin/tree/master

import Vue from 'vue'
import App from './App.vue'
import TransformReactive from '@/reactivity'

Vue.config.productionTip = false
// eslint-disable-next-line
const app = new Vue({
  render: h => h(App),
})

Vue.use(TransformReactive, {
  proxyVm: app
})

app.$mount('#app')