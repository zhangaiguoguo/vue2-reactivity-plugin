<template>
  <div id="app">
  </div>
</template>

<script>
import { computed as computed2 } from "vue"
import { reactive, watch, shallowReactive, markRaw, ref, toValue, computed, customRef, toRefs, triggerRef } from './hooks/reactivity';


export default {
  name: 'App',
  components: {
  },
  created() {

    const obj = ref([])

    console.log(obj);

    const computedObj = computed({
      get: () => toValue(obj),
      set(v) {
        obj.value = v
      }
    })

    const obj2 = customRef((track, trigger) => {
      let _value = 1
      let timer = null
      return {
        set(v) {
          clearTimeout(timer)
          timer = setTimeout(() => {
            trigger()
          }, 220)
          _value = v;
        },
        get() {
          track()
          return _value
        }
      }
    })

    watch(() => toValue(computedObj), (v) => {
      console.log(v);
    }, {
      deep: true,
      onTrigger(c){
        console.log(c);
      }
    })

    window.obj = obj;
    window.computedObj = computedObj
    window.obj2 = obj2
    window.triggerRef = triggerRef
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
