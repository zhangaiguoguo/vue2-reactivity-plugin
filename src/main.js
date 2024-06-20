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
      aaa: toValue(array.a)
    },
    slots: {
      default: [h('div', 1)]
    }
  }, '点击')])
})

function Fn() {
  return 1
}

// Vue.use(TransformReactive, {
//   proxyVm: app
// })

import { reactive, watchPostEffect, computed2 as computed } from '@/reactivity'
import { } from 'vue'
const array = reactive({ a: 1 });

const arrayComputed = computed(() => {
  console.log('computed dispatch');
  return array.a
});

arrayComputed.value

watchPostEffect(() => {
  console.log(arrayComputed.value);
}, {
  onTrigger(target) {
    console.log(target)
  },
  onTrack(target) {
    // console.log(target);
  }
})


window.array = array

window.arrayComputed = arrayComputed

app.$mount('#app')