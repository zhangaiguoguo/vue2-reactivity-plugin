<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
  </div>
</template>

<script>
import { reactive, watch } from './hooks/reactivity';


export default {
  name: 'App',
  components: {
  },
  created() {
    const array = reactive(new Map())

    console.log(array);

    watch(() => array.size, (v) => {
      console.log(v);
    })

    window.array = array;
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
