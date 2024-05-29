import { computed, customRef, reactive, watch } from "@/reactivity";

const state = reactive({
    count: 1
})

function setCount(v) {
    if (arguments.length) {
        state.count = +v;
    } else {
        state.count++
    }
}

const customCount = customRef((track, trigger) => {
    let count = '0'
    let timer;
    return {
        get() {
            track()
            return count
        },
        set(v) {
            count = v
            clearTimeout(timer)
            timer = setTimeout(() => {
                trigger()
            }, 150)
        }
    }
})

watch(customCount, (v) => {
    if ((v + "").length > 20) {
        customCount.value = v.slice(0, -1)
    }
})

const computedCount = computed(() => {
    return state.count * 2
})

watch(computedCount, (v) => {
    console.log(v);
}, {
})

window.setCount = setCount

export {
    setCount,
    state,
    computedCount,
    customCount
}