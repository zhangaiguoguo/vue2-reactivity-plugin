import Vue from 'vue'
import App from './App.vue'
import TransformReactive, { toValue } from '@/reactivity'

Vue.config.productionTip = false
// eslint-disable-next-line
const app = new Vue({
  // render: h => h(App),
  render: h => h('div', [toValue(arrayComputed), h("button", {
    on: {
      click() { array.a++ }
    },
    attrs: {
      num: toValue(array.a)
    }
  }, '点击')])
})

function Fn() {
  return 1
}

// Vue.use(TransformReactive, {
//   proxyVm: app
// })

import { reactive, watchPostEffect, computed2 as computed, watchSyncEffect } from '@/reactivity'
import { } from 'vue'
const array = reactive({ a: 1 });

const arrayComputed = computed(() => {
  console.log('computed dispatch');
  return array.a
});

arrayComputed.value

watchSyncEffect(() => {
  console.log(arrayComputed.value, 'watchSyncEffect');
}, {
})

watchSyncEffect(() => {
  console.log(array.a)
})

window.array = array

window.arrayComputed = arrayComputed

app.$mount('#app')