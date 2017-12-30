# Tech Debt

##### 30-12-2018
Importing methods from three.js currently imports the entire bundle
(of which a good chunk is never used).

##### 30-12-2018
Acceleration is currently bodged, ie not real. Lacking a proper way
of adding speed. Also braking is not handled. And speed calculation
really needs to take into account the current speed (ie no power when
going down hill).

##### 30-12-2018
Needs central data store.Vuex is probably the way to go, but could
also just be a global object (for better performance)?

##### 30-12-2018
Needs unit tests. Especially important for speed calculations.

##### 30-12-2018
Speed calculations can most likely be heavily optimised, however this
should not be done until we have something that is 100% correct.
