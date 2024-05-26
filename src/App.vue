<template>
  <div id="app">
  </div>
</template>

<script>
import { computed as computed2 } from "vue"
import { reactive, watch, shallowReactive, markRaw, ref, toValue, computed } from './hooks/reactivity';


export default {
  name: 'App',
  components: {
  },
  created() {

    const obj = ref({
      size: 1,
      obj: {
        a: 1
      }
    })

    console.log(obj);

    const computedObj = computed(() => toValue(obj))

    watch(() => toValue(computedObj), (v) => {
      console.log(v);
    })

    console.log(computedObj);

    window.obj = obj;
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
