<script>
import { useState, ref } from '@/reactivity';

export default {
    data() {
        window.aaa = this.useState({
            num2: 1,
            num2Computed: this.computed(() => window.aaa[0].num2),
            obj: this.reactive({
                a: 1
            })
        })
        this.watch(() => aaa, (v) => {
            console.log(v);
        })
        return {
            num: 1
        }
    },
    created() {
        console.log(this);
    }
}
</script>

<template>
    <div>
        {{ num }}
        <div>
            <button @click="num++">点击</button>
        </div>
        <hr>
        {{ Date.now() }}
        <br>
        {{ num2 }}
        <div>
            <button @click="num2++">点击</button>
        </div>
    </div>
</template>