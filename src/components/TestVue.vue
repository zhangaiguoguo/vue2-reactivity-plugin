<script>
import { useState } from '@/reactivity';

export default {
    data() {
        useState({
            num2: 1
        }, this)
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
    </div>
</template>