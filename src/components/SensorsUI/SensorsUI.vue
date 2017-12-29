<template>
    <div class="SensorsUI">
        bpm: {{ bpm }}<br>
        rpm: {{ rpm }}<br>
        watts: {{ watts }}<br>
    </div>
</template>

<script>
    import { sensorsEmitter } from 'sensors';

    function sensorValues(sensors) {
        this.bpm = sensors.bpm;
        this.watts = sensors.watts;
        this.rpm = sensors.rpm;
    }

    export default {
        name: 'SensorsUI',
        data() {
            return {
                rpm: 0,
                bpm: 0,
                watts: 0,
            };
        },
        created() {
            sensorsEmitter.on('update', sensorValues.bind(this));
        },
        destroyed() {
            sensorsEmitter.removeListener('update', sensorValues);
        },
    };
</script>

<style scoped>
</style>
