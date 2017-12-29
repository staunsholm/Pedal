# Pedal

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```

## links
Solving quadratics:
https://stackoverflow.com/questions/35795663/fastest-way-to-find-the-smallest-positive-real-root-of-quartic-polynomial-4-degr

Physics of a cyclist:
https://www.ibm.com/developerworks/community/blogs/jfp/entry/Modeling_Cyclist_Power?lang=en

Models for cycling:
http://www.analyticcycling.com/

Nice overview, including formulas:
https://en.wikipedia.org/wiki/Bicycle_performance

Acceleration:
https://www.physicsforums.com/threads/how-to-calculate-bicycle-acceleration.504904/

Torque to/from watts:
https://planetcalc.com/1908/

## algorithms

### Solve ax2+bx+c
Useful for finding minimal root when calculating speed
```
def SolvQuadratic(a, b ,c):
    d = (b**2) - (4*a*c)
    if d < 0:
        return []

    if d > 0:
        square_root_d = math.sqrt(d)
        t1 = (-b + square_root_d) / (2 * a)
        t2 = (-b - square_root_d) / (2 * a)
        if t1 > 0:
            if t2 > 0:
                if t1 < t2:
                    return [t1, t2]
                return [t2, t1]
            return [t1]
        elif t2 > 0:
            return [t2]
        else:
            return []
    else:
        t = -b / (2*a)
        if t > 0:
            return [t]
        return []
```

### Solve for speed
```
def get_speed(power,Cx,f,W,slope,headwind,elevation):
    # slope in percent
    # headwind in m/s at 10 m high
    # elevation in meters
    air_pressure = 1 - 0.000104 * elevation
    Cx = Cx*air_pressure
    G = 9.81
    headwind = (0.1**0.143) * headwind
    roots = np.roots([Cx, 2*Cx*headwind, Cx*headwind**2 + W*G*(slope/100.0+f), -power])
    roots = np.real(roots[np.imag(roots) == 0])
    roots = roots[roots>0]
    speed = np.min(roots)
    if speed + headwind < 0:
        roots = np.roots([-Cx, -2*Cx*headwind, -Cx*headwind**2 + W*G*(slope/100.0+f), -power])
        roots = np.real(roots[np.imag(roots) == 0])
        roots = roots[roots>0]
        if len(roots) > 0:
            speed = np.min(roots)  
    return speed
```

### Acceleration
```
power = torque * angularVelocity
angularVelocity = 2*pi*rpm / 60
torque = power / angularVelocity
acceleration = torque / (wheelRadius * totalMass + 2 * wheelInertia / wheelRadius)
wheelInertia = wheelWeight * wheelSize^2
```
