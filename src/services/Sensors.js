import * as EventEmitter from 'eventemitter3';
import * as log from 'loglevel';

let bpm = 0;
let watts = 0;
let rpm = 0;
let cumulativeCrankRevolutions;
let crankEventTime;

export const sensors = {
    bpm,
    watts,
    rpm,
    bpmBuffer: [],
    rpmBuffer: [],
    wattsBuffer: [],
};

function findDevice({ serviceName, characteristicName, handleChange }) {
    log.debug('findDevice', serviceName);
    navigator.bluetooth.requestDevice({ filters: [{ services: [serviceName] }] })
        .then((device) => {
            log.debug('device', device);
            return device.gatt.connect();
        })
        .then((server) => {
            // Getting Service...
            log.debug('server', server);
            return server.getPrimaryService(serviceName);
        })
        .then((service) => {
            // Getting Characteristic...
            log.debug('service', service);
            return service.getCharacteristic(characteristicName);
        })
        .then((characteristic) => {
            log.debug('characteristic', characteristic);
            characteristic.addEventListener('characteristicvaluechanged', handleChange);
        })
        .catch((error) => {
            log.error(error);
        });
}

function handleHeartRateChange(e) {
    const value = e.target.value;
    const controlByte = value.getUint8(0);
    const is8bitValue = (controlByte & 0x80) === 0;

    bpm = is8bitValue ? value.getUint8(1) : value.getUint16(2);

    sensors.bpm = bpm;
    sensors.bpmBuffer.push({ time: Date.now(), bpm });
}

export function findHeartRateDevices() {
    findDevice({
        serviceName: 'heart_rate',
        characteristicName: 'heart_rate_measurement',
        handleHeartRateChange,
    });
}

function handlePowerChange(e) {
    const value = e.target.value;
    watts = value.getInt16(2);

    sensors.watts = watts;
    sensors.wattsBuffer.push({ time: Date.now(), watts });
}

export function findPowerDevices() {
    findDevice({
        serviceName: 'cycling_power',
        characteristicName: 'cycling_power_measurement',
        handlePowerChange,
    });
}

class SensorsEmitter extends EventEmitter {}
export const sensorsEmitter = new SensorsEmitter();

function handleCadenceChange(e) {
    const value = e.target.value;
    const controlByte = value.getUint8(0);
    const hasCrankRevolutionData = (controlByte & 0x80) === 1;

    if (hasCrankRevolutionData) {
        const newCumulativeCrankRevolutions = value.getUint16(8);
        const newCrankEventTime = value.getUint16(10);
        rpm = (newCumulativeCrankRevolutions - cumulativeCrankRevolutions) /
            (newCrankEventTime - crankEventTime) * 1024 * 60;
        cumulativeCrankRevolutions = newCumulativeCrankRevolutions;
        crankEventTime = newCrankEventTime;

        sensors.rpm = rpm;
        sensors.rpmBuffer.push({ time: Date.now(), rpm });

        sensorsEmitter.emit('update', sensors);
    }
}

export function findCadenceDevices() {
    findDevice({
        serviceName: 'cycling_speed_and_cadence',
        characteristicName: 'csc_measurement',
        handleCadenceChange,
    });
}
