/* eslint-disable no-restricted-properties */
function cuberoot(x) {
    const y = Math.pow(Math.abs(x), 1 / 3);
    return x < 0 ? -y : y;
}

// TODO: get rid of epsilon. Maybe optimise using lookup? Needs test cases
function solveCubic(a, b, c, d) {
    const epsilon = 1e-8;
    if (Math.abs(a) < epsilon) {
        // Quadratic case, ax^2+bx+c=0
        a = b;
        b = c;
        c = d;
        if (Math.abs(a) < epsilon) {
            // Linear case, ax+b=0
            a = b;
            b = c;
            // Degenerate case
            if (Math.abs(a) < epsilon) {
                return [];
            }
            return [-b / a];
        }

        const D = b * b - 4 * a * c;
        if (Math.abs(D) < epsilon) {
            return [-b / (2 * a)];
        }
        if (D > 0) {
            return [(-b + Math.sqrt(D)) / (2 * a), (-b - Math.sqrt(D)) / (2 * a)];
        }
        return [];
    }

    // Convert to depressed cubic t^3+pt+q = 0 (subst x = t - b/3a)
    const p = (3 * a * c - b * b) / (3 * a * a);
    const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
    let roots;

    if (Math.abs(p) < epsilon) {
        // p = 0 -> t^3 = -q -> t = -q^1/3
        roots = [cuberoot(-q)];
    } else if (Math.abs(q) < epsilon) {
        // q = 0 -> t^3 + pt = 0 -> t(t^2+p)=0
        roots = [0].concat(p < 0 ? [Math.sqrt(-p), -Math.sqrt(-p)] : []);
    } else {
        const D = q * q / 4 + p * p * p / 27;
        if (Math.abs(D) < 1e-8) {
            // D = 0 -> two roots
            roots = [-1.5 * q / p, 3 * q / p];
        } else if (D > 0) {
            // Only one real root
            const u = cuberoot(-q / 2 - Math.sqrt(D));
            roots = [u - p / (3 * u)];
        } else {
            // D < 0, three roots, but needs to use complex numbers/trigonometric solution
            // D < 0 implies p < 0 and acos argument in [-1..1]
            const u = 2 * Math.sqrt(-p / 3);
            const t = Math.acos(3 * q / p / u) / 3;
            const k = 2 * Math.PI / 3;
            roots = [u * Math.cos(t), u * Math.cos(t - k), u * Math.cos(t - 2 * k)];
        }
    }

    // Convert back from depressed cubic
    for (let i = 0; i < roots.length; i += 1) {
        roots[i] -= b / (3 * a);
    }

    return roots;
}
/* eslint-enable */

/**
 *
 * @param power watts
 * @param Cx air penetration
 * @param f road friction
 * @param W cyclist weight
 * @param slope in percent
 * @param headwind in m/s at 10m high
 * @param elevation in meters
 * @returns number (speed in m/s)
 */
export function getSpeedInMetersPerSecond({ power, Cx, f, W, slope, headwind, elevation }) {
    const airPressure = 1 - 0.000104 * elevation;
    const airPenetration = Cx * airPressure;
    const G = 9.81;
    const headwindAtRoad = (0.1 ** 0.143) * headwind;

    const roots = solveCubic(
        airPenetration,
        2 * airPenetration * headwindAtRoad,
        airPenetration * headwindAtRoad ** 2 + W * G * (slope / 100.0 + f),
        -power,
    );
    const calculatedSpeed = roots[0];

    // we don't want to ride backwards
    return calculatedSpeed > 0 ? calculatedSpeed : 0;
}

/**
 *
 * @param power in watts
 * @param totalMass of rider+bike
 * @param wheelWeight per wheel
 * @param wheelRadius in mm
 * @param speed in m/s
 * @returns {number} measured in m/s^2
 */
export function getAcceleration({ power, totalMass, wheelWeight, wheelRadius, speed }) {
    const c = wheelRadius * 2 * Math.PI / 1000;
    const angularVelocity = (speed / c) * 2 * Math.PI;

    if (angularVelocity === 0) {
        return 0.001;
    }

    const torque = power / angularVelocity;
    const wheelInertia = wheelWeight * wheelRadius ** 2;
    return torque / (wheelRadius * totalMass + 2 * wheelInertia / wheelRadius);
}

