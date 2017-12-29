import { sensorsEmitter } from '../../services/SensorsMock';

let watts = 0;
let rpm = 0;
let stopped = false;
let distance = 0;
let speed = 1;

let vm;

function update() {
    const drag = 0.1;
    const rollingResistance = 0.5;
    const resistance = rollingResistance + drag;
    speed += watts / 10000;
    speed *= resistance;
    if (speed < 0) speed = 0;
    distance += speed;

    vm.x = Math.cos(distance) * 200 + 300;
    vm.y = Math.sin(distance) * 200 + 300;
    vm.r = rpm;

    if (!stopped) {
        requestAnimationFrame(update);
    }
}

const sensorValues = (sensors) => {
    watts = sensors.watts;
    rpm = sensors.rpm;
};

export function start(_vm) {
    vm = _vm;

    sensorsEmitter.on('update', sensorValues);

    requestAnimationFrame(update);
}

export function stop() {
    stopped = true;
    sensorsEmitter.removeListener('update', sensorValues);
}
