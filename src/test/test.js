// import { computed, customRef, reactive, ref, toRaw, toVRef, toValue, useObserverHandle, watch, watchEffect } from "@/reactivity";

// const state = reactive({
//     count: 1,
//     list: [

//     ],
//     listValue: "dome",
//     listValueStatus: true,
//     mpa: new Map(),
//     obj: {

//     }
// })

// const countRef = ref(1)

// // watch(() => {
// //     for (let w of state.mpa) {
// //         console.log(w);
// //     }
// //     return state.mpa.size
// // }, (v) => {
// //     console.log(v);
// // },{
// //     onTrigger(v){
// //         console.log(v);
// //     },
// //     onTrack(v){
// //         console.log(v);
// //     }
// // })

// function setCount(v) {
//     if (arguments.length) {
//         state.count = +v;
//     } else {
//         state.count++
//     }
// }

// function addStateList() {
//     if (state.listValue == "" || state.listValue === "") {
//         state.listValueStatus = false
//         return
//     }
//     state.list.push({
//         value: state.listValue,
//         id: Date.now()
//     })
//     state.listValue = ""
// }

// const customCount = customRef((track, trigger) => {
//     let count = '0'
//     let timer;
//     return {
//         get() {
//             track()
//             return count
//         },
//         set(v) {
//             count = v
//             clearTimeout(timer)
//             timer = setTimeout(() => {
//                 trigger()
//             }, 150)
//         }
//     }
// })

// watch(customCount, (v) => {
//     if ((v + "").length > 20) {
//         customCount.value = v.slice(0, -1)
//     }
// })

// const computedCount = computed(() => {
//     return state.count
// })

// // watch(computedCount, (v) => {
// //     console.log(v);
// // }, {
// // })

// // watchEffect(() => {

// //     for (let w in state) {
// //         console.log(state[w]);
// //     }

// //     console.log(toValue(customCount));

// // }, {
// // })

// window.state = state

// window.setCount = setCount

// let customCount2Value = 100

// const customCountHooks = useObserverHandle()

// const customCount2 = toVRef({
//     get value() {
//         customCountHooks[0]()
//         return customCount2Value
//     },
//     set value(v) {
//         customCount2Value = v
//         customCountHooks[1]()
//     }
// })

// window.customCount2 = customCount2

// window.countRef = countRef

// export {
//     setCount,
//     state,
//     computedCount,
//     customCount, customCount2, addStateList,countRef
// }