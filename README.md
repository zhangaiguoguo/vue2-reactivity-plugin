# vue2-reactive-transform-vue3-reactive-plugin-tree-master
vue2-reactive-transform-vue3-reactive-plugin/tree/master

该项目是一个可以在vue2版本下 通过proxy加一层来方向代理vue2响应式 解决了对象set delete 数组新增项 修改项... 无法直接触发响应的问题 该项目集成了vue3现有reactive hooks函数 在reactivity模块下
可以直接通过use 把hooks注册到vue实例上 也可以单独引入

import Vue from 'vue'
import App from './App.vue'
import TransformReactive,{ref,reactive} from '@/reactivity'

Vue.config.productionTip = false
// eslint-disable-next-line
const app = new Vue({
  render: h => h(App),
})

Vue.use(TransformReactive, {
  proxyVm: app
})

app.$mount('#app')
