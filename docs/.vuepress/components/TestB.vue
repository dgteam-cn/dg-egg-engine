
<style lang="scss" scoped>
.t-badge {
    margin-left: 0.5rem;
    .text {
        font-size: 16px; font-weight: bold; color: #F60;
    }
}
</style>
<template>
    <div class="t-badge">
        <span class="text">test component, {{ param }}, {{ bbb }}</span>
   </div>
</template>

<script>
export default {
    name: 'testC',
    data() {
        return {
            bbb: 2
        }
    },
    props: {
        param: {
            type: String,
            default: 'param'
        }
    },
    methods: {},
    mounted() {
        console.log(123)
    }
}
</script>
