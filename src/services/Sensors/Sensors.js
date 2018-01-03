import store from '@/store';
import * as log from 'loglevel';
import { getSpeedInMetersPerSecond, getAcceleration } from '../PlayerCalculations';

// let cumulativeCrankRevolutions;
let crankEventTime;

export const sensors = {
    bpm: 0,
    watts: 0,
    rpm: 0,
    speed: 0,
    ratio: '-',
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

function updateSpeed() {
    sensors.targetSpeed = getSpeedInMetersPerSecond({
        power: sensors.watts,
        Cx: 0.25,
        f: 0.1,
        W: 80,
        slope: 0,
        headwind: 0,
        elevation: 0,
    });

    sensors.acceleration = getAcceleration({
        power: sensors.watts,
        totalMass: 80,
        speed: sensors.targetSpeed,
        wheelRadius: 315,
        wheelWeight: 1,
    });

    sensors.ratio = '-';
    sensors.speed = 0;

    store.dispatch('updateSensors', sensors);
}

function handleHeartRateChange(e) {
    const value = e.target.value;
    const controlByte = value.getUint8(0);
    const is8bitValue = (controlByte & 0b100000) === 0;

    const bpm = is8bitValue ? value.getUint8(1) : value.getUint16(2);

    sensors.bpm = bpm;
    sensors.bpmBuffer.push({ time: Date.now(), bpm });

    updateSpeed();
}

export function findHeartRateDevices() {
    findDevice({
        serviceName: 'heart_rate',
        characteristicName: 'heart_rate_measurement',
        handleChange: handleHeartRateChange,
    });
}

function handlePowerChange(e) {
    const value = e.target.value;
    const watts = value.getInt16(2);

    sensors.watts = watts;
    sensors.wattsBuffer.push({ time: Date.now(), watts });

    updateSpeed();
}

export function findPowerDevices() {
    findDevice({
        serviceName: 'cycling_power',
        characteristicName: 'cycling_power_measurement',
        handleChange: handlePowerChange,
    });
}

function handleCadenceChange(e) {
    const value = e.target.value;
    const controlByte = value.getUint8(0);
    const hasCrankRevolutionData = (controlByte & 0b10000000) === 0b10000000;

    if (hasCrankRevolutionData) {
        // const newCumulativeCrankRevolutions = value.getUint16(8);
        const newCrankEventTime = value.getUint16(10);
        // rpm = (newCumulativeCrankRevolutions - cumulativeCrankRevolutions) /
        //       (newCrankEventTime - crankEventTime) * 1024 * 60;
        const rpm = Math.round(crankEventTime * 60 / 1024);
        // cumulativeCrankRevolutions = newCumulativeCrankRevolutions;
        crankEventTime = newCrankEventTime;

        if (!isNaN(rpm)) {
            sensors.rpm = rpm;
            sensors.rpmBuffer.push({ time: Date.now(), rpm });

            updateSpeed();
        }
    }
}

export function findCadenceDevices() {
    findDevice({
        serviceName: 'cycling_speed_and_cadence',
        characteristicName: 'csc_measurement',
        handleChange: handleCadenceChange,
    });
}
