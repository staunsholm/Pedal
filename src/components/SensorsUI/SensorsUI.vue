<template>
    <div class="SensorsUI">
        bpm: {{ bpm }}<br>
        rpm: {{ rpm }}<br>
        watts: {{ watts }}<br>
        {{ speedInKmH }} km/h<br>
        gear: {{ ratio }}<br>
    </div>
</template>

<script>
    import { mapGetters } from 'vuex';

    export default {
        name: 'SensorsUI',

        computed: {
            ...mapGetters({
                speed: 'targetSpeed',
                rpm: 'rpm',
                bpm: 'bpm',
                watts: 'watts',
                ratio: 'ratio',
            }),

            speedInKmH() {
                return Math.round(this.speed * 3.6);
            },
        },
    };
</script>

<style scoped>
</style>
