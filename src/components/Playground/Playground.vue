<template>
    <div class="Playground">
        <div class="player" v-bind:style="{ transform: 'translate(' + x + 'px, ' + y + 'px)' }"></div>
        <div></div>
    </div>
</template>

<script>
    export default {
        name: 'Playground',
        data() {
            return {
                x: 0,
                y: 0,
                r: 0,
            };
        },
        created() {
            this.x = 100;
        },
        destroyed() {
        },
    };
</script>

<style scoped>
    .player {
        position: absolute;
        width: 16px;
        height: 16px;
        background: aqua;
    }
</style>
