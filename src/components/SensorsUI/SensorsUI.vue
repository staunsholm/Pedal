<template>
    <div class="SensorsUI">
        bpm: {{ bpm }}<br>
        rpm: {{ rpm }}<br>
        watts: {{ watts }}<br>
        {{ speed }} km/h<br>
        gear: {{ ratio }}<br>
    </div>
</template>

<script>
    import { sensorsEmitter } from 'sensors';

    function sensorValues(sensors) {
        this.bpm = sensors.bpm;
        this.watts = sensors.watts;
        this.rpm = sensors.rpm;
        this.speed = Math.round(sensors.targetSpeed * 3.6); // km/h
        this.ratio = sensors.ratio;
    }

    export default {
        name: 'SensorsUI',
        data() {
            return {
                rpm: 0,
                bpm: 0,
                watts: 0,
                speed: 0,
                ratio: '-',
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
