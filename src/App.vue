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

.slide-fade-enter,
.slide-fade-leave-to

/* .slide-fade-leave-active below version 2.1.8 */
  {
  transform: translateX(10px);
  opacity: 0;
}

.flex {
  display: flex;
  justify-content: center;
  align-items: center
}
</style>

<template>
  <div id="app">
    <div>
      computedCount - {{ computedCount }}
    </div>
    <br>
    <div>
      customCount2 - {{ customCount2 }}
    </div>
    <br>
    <div>
      {{ state }}
    </div>
    <br>
    <div>
      <button @click="setCount()">count++</button>
    </div>
    <br>
    <div>
      <button @click="customCount2++">customCount2++</button>
    </div>
    <br>
    <div>
      <input v-model="customCount" />
    </div>
    <br>
    <div>
      <transition-group appear tag="div" name="slide-fade">
        <div v-for="(item, index) in customCount" :key="index">
          {{ item }}
        </div>
      </transition-group>
    </div>
    <br>
    {{ Date.now() }}
    <div>
      <div v-for="(item, index) in state.mpa" :key="index">
        {{ item }}
      </div>
    </div>
    <br>
    <div>
      <input v-model="state.listValue" />
      <button @click="addStateList">新增state-list</button>
      <div v-if="!state.listValueStatus">
        <span style="color:#e43141;">请输入内容</span>
      </div>
    </div>
    <br>
    <transition-group appear tag="div" name="slide-fade">
      <div v-for="(item, index) in state.list" :key=item.id class="flex">
        <div @dblclick="item.dblFlag = true" style="margin-right:10px;">
          <span v-if="!item.dblFlag">{{ item.value }}</span>
          <input v-else v-model="item.value" @blur="item.dblFlag = false" />
        </div>
        <div>
          <button @click="state.list.splice(index, 1)">删除</button>
        </div>
      </div>
    </transition-group>
    <br>
  </div>
</template>

<script>
import { toValue } from './reactivity';
import { computedCount, setCount, state, customCount, customCount2, addStateList } from './test/test';

export default {
  name: 'App',
  components: {
  },
  data() {
    return {
      customCount,
      num: 1
    }
  },
  created() {
    window.setNum = () => {
      this.num++
    }
  },
  watch: {
    'state.listValueStatus'(v) {
      if (!v) {
        this.state.listValue = ""
      }
    },
    "state.listValue"(v) {
      if (!this.state.listValueStatus && v) {
        this.state.listValueStatus = true
      }
    }
  },
  computed: {
    customCount2: {
      set(v) {
        customCount2.value = v
      },
      get() {
        return toValue(customCount2)
      }
    },
    state() {
      return state
    },
    computedCount() {
      return toValue(computedCount);
    }
  },
  methods: {
    addStateList,
    setCount
  }
}
</script>