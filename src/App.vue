<template>
  <div id="app">
    <div>
      {{ computedCount }}
    </div>
    <div>
      {{ state }}
    </div>
    <div>
      <button @click="setCount()">count++</button>
    </div>
    <div>
      <input v-model="customCount" />
    </div>
    <div>
      <transition-group appear tag="div" name="slide-fade">
        <div v-for="(item, index) in customCount" :key="index">
          {{ item }}
        </div>
      </transition-group>
    </div>
    {{ num }}
  </div>
</template>

<script>
import { toValue } from './reactivity';
import { computedCount, setCount, state, customCount } from './test/test';

export default {
  name: 'App',
  components: {
  },
  data() {
    return {
      customCount,
      num:1
    }
  },
  created() {
    window.setNum = () => {
      this.num++
    }
  },
  computed: {
    state() {
      return state
    },
    computedCount() {
      return toValue(computedCount)
    }
  },
  methods: {
    setCount
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

.slide-fade-enter-active {
  transition: all .3s ease;
}
.slide-fade-leave-active {
  transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}
.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateX(10px);
  opacity: 0;
}
</style>
