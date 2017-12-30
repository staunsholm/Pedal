<template>
    <div id="app">
        <div class="world">
            <World/>
        </div>

        <div class="sensorsui">
            <SensorsUI/>
        </div>

        <div class="devices">
            <Devices/>
        </div>

        <div class="playground">
            <Playground/>
        </div>
    </div>
</template>

<script>
    import SensorsUI from './components/SensorsUI/SensorsUI';
    import Playground from './components/Playground/Playground';
    import Devices from './components/Devices/Devices';
    import World from './components/World/World';

    export default {
        name: 'GameScreen',

        components: {
            SensorsUI,
            Playground,
            Devices,
            World,
        },
    };
</script>

<style>
    body {
        margin: 0;
    }

    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: #eee;
    }

    .world {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    .sensorsui {
        position: absolute;
        top: 20px;
        left: 20px;
        width: 200px;
    }

    .playground {
        position: absolute;
        top: 30px;
        right: 20px;
        width: 200px;
        height: 200px;
    }

    .devices {
        position: absolute;
        bottom: 20px;
        width: 100%;
        text-align: center;
    }
</style>
