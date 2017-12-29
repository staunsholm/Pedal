import * as EventEmitter from 'eventemitter3';
import * as log from 'loglevel';

let bpm = 0;
let watts = 0;
let rpm = 0;
// let cumulativeCrankRevolutions;
let crankEventTime;

class SensorsEmitter extends EventEmitter {
}

export const sensorsEmitter = new SensorsEmitter();

export const sensors = {
    bpm,
    watts,
    rpm,
    bpmBuffer: [],
    rpmBuffer: [],
    wattsBuffer: [],
};

function getMockHeartRateValue() {
    const value = Math.round(Math.random() * 5 + 123);
    const buffer = new ArrayBuffer(4);
    const encodedValue = new DataView(buffer);
    const controlByte = 0x80; // 16-bit value
    encodedValue.setUint8(0, controlByte);
    encodedValue.setUint8(1, 0);
    encodedValue.setUint16(2, value);

    return encodedValue;
}

function getMockPowerValue() {
    const value = Math.round(Math.random() * 30 + 180);
    const buffer = new ArrayBuffer(4);
    const encodedValue = new DataView(buffer);
    encodedValue.setInt16(2, value);

    return encodedValue;
}

let mockCumulativeCrankRevolutions = 0;

function getMockCadenceValue() {
    const value = Math.round(Math.random() * 10 + 90);
    const buffer = new ArrayBuffer(12);
    const encodedValue = new DataView(buffer);
    const controlByte = 0x80; // hasCrankRevolutionData
    mockCumulativeCrankRevolutions += Math.round(value / 60);
    const mockCrankEventTime = value / 60 * 1024;
    encodedValue.setUint8(0, controlByte);
    encodedValue.setUint16(8, mockCumulativeCrankRevolutions);
    encodedValue.setUint16(10, mockCrankEventTime);

    return encodedValue;
}

function findDevice({ serviceName, characteristicName, handleChange }) {
    log.debug('mock findDevice', serviceName, characteristicName);

    // wait a bit then start broadcasting mock data every second
    setTimeout(() => {
        setInterval(() => {
            let value;

            switch (serviceName) {
                case 'heart_rate':
                    value = getMockHeartRateValue();
                    break;
                case 'cycling_power':
                    value = getMockPowerValue();
                    break;
                case 'cycling_speed_and_cadence':
                    value = getMockCadenceValue();
                    break;
                default:
            }

            handleChange({
                target: {
                    value,
                },
            });
        }, 1000);
    }, 500);
}

function handleHeartRateChange(e) {
    const value = e.target.value;
    const controlByte = value.getUint8(0);
    const is8bitValue = (controlByte & 0x80) === 0;

    bpm = is8bitValue ? value.getUint8(1) : value.getUint16(2);

    sensors.bpm = bpm;
    sensors.bpmBuffer.push({ time: Date.now(), bpm });

    sensorsEmitter.emit('update', sensors);
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
    watts = value.getInt16(2);

    sensors.watts = watts;
    sensors.wattsBuffer.push({ time: Date.now(), watts });

    sensorsEmitter.emit('update', sensors);
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
    const hasCrankRevolutionData = (controlByte & 0x80) === 0x80;

    if (hasCrankRevolutionData) {
        // const newCumulativeCrankRevolutions = value.getUint16(8);
        const newCrankEventTime = value.getUint16(10);
        // rpm = (newCumulativeCrankRevolutions - cumulativeCrankRevolutions) /
        //       (newCrankEventTime - crankEventTime) * 1024 * 60;
        rpm = Math.round(crankEventTime * 60 / 1024);
        // cumulativeCrankRevolutions = newCumulativeCrankRevolutions;
        crankEventTime = newCrankEventTime;

        if (!isNaN(rpm)) {
            sensors.rpm = rpm;
            sensors.rpmBuffer.push({ time: Date.now(), rpm });

            sensorsEmitter.emit('update', sensors);
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
