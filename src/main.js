import Vue from 'vue'
import App from './App.vue'
import TransformReactive from '@/hooks/reactivity'

Vue.config.productionTip = false
// eslint-disable-next-line
const app = new Vue({
  render: h => h(App),
})

Vue.use(TransformReactive, {
  proxyVm: app
})

app.$mount('#app')