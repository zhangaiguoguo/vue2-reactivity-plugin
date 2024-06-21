import Vue from 'vue'
import App from './App.vue'
import TransformReactive, { toValue } from '@/reactivity'

Vue.config.productionTip = false
// eslint-disable-next-line
const app = new Vue({
  // render: h => h(App),
  render: h => h('div', [toValue(0 || arrayComputed), h("button", {
    on: {
      click() { array.a++ }
    },
    attrs: {
      num: toValue(array.a)
    }
  }, '点击'), [h("br"), h("br")], (array.flag || false) + "", h("button", {
    on: {
      click() { array.flag = !array.flag }
    },
  }, '切换')])
})

function Fn() {
  return 1
}

// Vue.use(TransformReactive, {
//   proxyVm: app
// })

import { reactive, watchPostEffect, computed, watchSyncEffect } from '@/reactivity'
import { } from 'vue'
const array = reactive({ a: 1 });

const arrayComputed = computed(() => {
  console.log('computed dispatch', 1);
  return array.a
});

arrayComputed.value

watchSyncEffect(() => {
  if (array.flag) {
    console.log(2, 'watchSyncEffect true');
  } else {
    arrayComputed.value
    console.log(2, 'watchSyncEffect false');
  }
}, {
  onTrigger(target) {
    // console.log(target)
  },
  onTrack(target) {
    // console.log(target);
  }
})

watchSyncEffect(() => {
  array.a
})

window.array = array

window.arrayComputed = arrayComputed

app.$mount('#app')