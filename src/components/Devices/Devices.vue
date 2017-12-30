<template>
    <div>
        <button @click="findPowerDevices()">Power</button>
        <button @click="findHeartRateDevices()">Heart Rate</button>
        <button @click="findCadenceDevices()">Cadence</button>
    </div>
</template>

<script>
    import {
        findPowerDevices,
        findHeartRateDevices,
        findCadenceDevices,
    } from 'sensors';

    export default {
        name: 'Devices',
        data() {
            return {};
        },
        methods: {
            findPowerDevices,
            findHeartRateDevices,
            findCadenceDevices,
        },
        created() {
        },
        destroyed() {
        },
    };
</script>

<style scoped>
    button {
        border: 0;
        background-color: #2c3e50;
        color: #fff;
        width: 80px;
        height: 30px;
        line-height: 30px;
        padding: 0;
    }

    button:hover {
        background-color: #3c4e60;
        cursor: pointer;
    }
</style>
