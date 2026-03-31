// mockApi.js - Flight Data Engine
// Handles all the flight data, status updates, and simulates a real API

(function () {
    "use strict";

    // ========== FLIGHT DATABASE ==========
    // all times stored as offsets in minutes from "now" when app loads
    // positive = future, negative = past

    var airlines = {
        "AI": { name: "Air India", code: "AI" },
        "6E": { name: "IndiGo", code: "6E" },
        "SG": { name: "SpiceJet", code: "SG" },
        "UK": { name: "Vistara", code: "UK" },
        "QP": { name: "Akasa Air", code: "QP" },
        "EK": { name: "Emirates", code: "EK" },
        "SQ": { name: "Singapore Airlines", code: "SQ" },
        "BA": { name: "British Airways", code: "BA" },
        "LH": { name: "Lufthansa", code: "LH" },
        "AA": { name: "American Airlines", code: "AA" }
    };

    var airports = {
        "DEL": { city: "New Delhi", name: "Indira Gandhi Intl", country: "India" },
        "BOM": { city: "Mumbai", name: "Chhatrapati Shivaji Intl", country: "India" },
        "BLR": { city: "Bangalore", name: "Kempegowda Intl", country: "India" },
        "MAA": { city: "Chennai", name: "Chennai Intl", country: "India" },
        "CCU": { city: "Kolkata", name: "Netaji Subhas Chandra Bose Intl", country: "India" },
        "HYD": { city: "Hyderabad", name: "Rajiv Gandhi Intl", country: "India" },
        "GOI": { city: "Goa", name: "Manohar Intl", country: "India" },
        "DXB": { city: "Dubai", name: "Dubai Intl", country: "UAE" },
        "SIN": { city: "Singapore", name: "Changi Airport", country: "Singapore" },
        "LHR": { city: "London", name: "Heathrow Airport", country: "UK" },
        "JFK": { city: "New York", name: "John F. Kennedy Intl", country: "USA" },
        "FRA": { city: "Frankfurt", name: "Frankfurt Airport", country: "Germany" }
    };

    // reasons for delays - common real-world reasons
    var delayReasons = [
        "Weather conditions at destination",
        "Technical inspection required",
        "Crew scheduling adjustment",
        "Air traffic congestion",
        "Late arriving aircraft",
        "Runway maintenance at origin",
        "Fog and low visibility",
        "Security check delays",
        "Baggage loading delay",
        "Medical emergency on previous flight",
        "Bird strike inspection",
        "De-icing operations"
    ];

    // gate numbers pool
    var gates = ["A1", "A2", "A3", "A5", "A7", "B1", "B2", "B4", "B6", "C1", "C3", "C5", "D2", "D4", "D8", "E1", "E3"];
    var terminals = ["T1", "T2", "T3", "T1D", "T2D"];

    // status lifecycle order
    var statusOrder = ["Scheduled", "On Time", "Boarding", "Departed", "In Air", "Landed"];

    // the base time when the app loaded
    var baseTime = Date.now();

    // generate a random flight number
    function makeFlightNum(airlineCode) {
        var num = Math.floor(Math.random() * 9000) + 100;
        return airlineCode + num;
    }

    // helper to pick random item from array
    function pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // helper to get random int between min and max
    function randBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // format time from timestamp
    function formatTime(ts) {
        var d = new Date(ts);
        var h = d.getHours();
        var m = d.getMinutes();
        var ampm = h >= 12 ? "PM" : "AM";
        h = h % 12;
        if (h === 0) h = 12;
        m = m < 10 ? "0" + m : m;
        return h + ":" + m + " " + ampm;
    }

    function formatDate(ts) {
        var d = new Date(ts);
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return d.getDate() + " " + months[d.getMonth()];
    }

    // ========== GENERATE FLIGHT DATA ==========

    var flightsList = [];
    var flightsMap = {}; // quick lookup by id

    // define specific routes for variety
    var routes = [
        { from: "DEL", to: "BOM", airline: "6E", durationMin: 130 },
        { from: "BOM", to: "BLR", airline: "AI", durationMin: 100 },
        { from: "DEL", to: "BLR", airline: "UK", durationMin: 160 },
        { from: "BLR", to: "MAA", airline: "SG", durationMin: 55 },
        { from: "CCU", to: "DEL", airline: "6E", durationMin: 145 },
        { from: "HYD", to: "GOI", airline: "QP", durationMin: 80 },
        { from: "DEL", to: "GOI", airline: "AI", durationMin: 150 },
        { from: "BOM", to: "DXB", airline: "EK", durationMin: 195 },
        { from: "DEL", to: "SIN", airline: "SQ", durationMin: 330 },
        { from: "DEL", to: "LHR", airline: "BA", durationMin: 540 },
        { from: "BOM", to: "JFK", airline: "AI", durationMin: 960 },
        { from: "BLR", to: "FRA", airline: "LH", durationMin: 600 },
        { from: "MAA", to: "DXB", airline: "EK", durationMin: 240 },
        { from: "HYD", to: "BOM", airline: "6E", durationMin: 90 },
        { from: "DEL", to: "CCU", airline: "UK", durationMin: 140 },
        { from: "GOI", to: "DEL", airline: "SG", durationMin: 155 },
        { from: "BOM", to: "MAA", airline: "AI", durationMin: 120 }
    ];

    function generateFlights() {
        flightsList = [];
        flightsMap = {};

        for (var i = 0; i < routes.length; i++) {
            var route = routes[i];
            var airlineInfo = airlines[route.airline];

            // stagger departure times: some past, some near, some future
            var offsetMinutes = randBetween(-120, 300); // -2h to +5h from now
            var departureTime = baseTime + (offsetMinutes * 60 * 1000);
            var arrivalTime = departureTime + (route.durationMin * 60 * 1000);

            // figure out a sensible starting status based on time offset
            var status;
            if (offsetMinutes > 90) {
                status = "Scheduled";
            } else if (offsetMinutes > 30) {
                status = "On Time";
            } else if (offsetMinutes > 5) {
                status = "Boarding";
            } else if (offsetMinutes > -30) {
                status = "Departed";
            } else if (offsetMinutes > -(route.durationMin - 20)) {
                status = "In Air";
            } else {
                status = "Landed";
            }

            var flightId = "FL-" + (1000 + i);
            var flightNum = makeFlightNum(route.airline);

            var flight = {
                id: flightId,
                flightNumber: flightNum,
                airlineCode: route.airline,
                airlineName: airlineInfo.name,
                origin: route.from,
                originCity: airports[route.from].city,
                originAirport: airports[route.from].name,
                destination: route.to,
                destCity: airports[route.to].city,
                destAirport: airports[route.to].name,
                scheduledDeparture: departureTime,
                scheduledArrival: arrivalTime,
                estimatedDeparture: departureTime,
                estimatedArrival: arrivalTime,
                status: status,
                gate: pickRandom(gates),
                terminal: pickRandom(terminals),
                delayMinutes: 0,
                delayReason: null,
                durationMin: route.durationMin,
                statusHistory: [
                    {
                        status: status,
                        timestamp: Date.now(),
                        message: "Flight " + flightNum + " status: " + status
                    }
                ],
                lastUpdated: Date.now()
            };

            flightsList.push(flight);
            flightsMap[flightId] = flight;
        }
    }

    // generate on load
    generateFlights();

    // ========== API METHODS ==========

    function getAllFlights() {
        // return a copy so external code doesn't mess with our data
        return JSON.parse(JSON.stringify(flightsList));
    }

    function getFlightById(id) {
        if (flightsMap[id]) {
            return JSON.parse(JSON.stringify(flightsMap[id]));
        }
        return null;
    }

    function searchFlights(query) {
        if (!query || query.trim() === "") return getAllFlights();

        query = query.toLowerCase().trim();
        var results = [];

        for (var i = 0; i < flightsList.length; i++) {
            var f = flightsList[i];
            var searchable = [
                f.flightNumber,
                f.airlineName,
                f.originCity,
                f.destCity,
                f.origin,
                f.destination,
                f.status
            ].join(" ").toLowerCase();

            if (searchable.indexOf(query) !== -1) {
                results.push(JSON.parse(JSON.stringify(f)));
            }
        }
        return results;
    }

    // ========== LIVE UPDATE ENGINE ==========

    var updateIntervalId = null;
    var updateCallbacks = [];

    function advanceStatus(flight) {
        var currentIdx = statusOrder.indexOf(flight.status);

        // if already landed or cancelled, nothing to do
        if (flight.status === "Landed" || flight.status === "Cancelled") {
            return null;
        }

        // random chance to introduce a delay (only for pre-departure flights)
        var canDelay = (currentIdx <= 2); // scheduled, on time, or boarding
        var willDelay = canDelay && Math.random() < 0.2; // 20% chance

        if (willDelay && flight.delayMinutes === 0) {
            // introduce a new delay
            var delayMins = pickRandom([15, 30, 45, 60, 90, 120]);
            flight.delayMinutes = delayMins;
            flight.delayReason = pickRandom(delayReasons);
            flight.estimatedDeparture = flight.scheduledDeparture + (delayMins * 60 * 1000);
            flight.estimatedArrival = flight.scheduledArrival + (delayMins * 60 * 1000);
            flight.status = "Delayed";

            var msg = "Delayed by " + delayMins + " min — " + flight.delayReason;
            flight.statusHistory.push({
                status: "Delayed",
                timestamp: Date.now(),
                message: msg
            });
            flight.lastUpdated = Date.now();

            return {
                type: "delay",
                flight: JSON.parse(JSON.stringify(flight)),
                message: flight.flightNumber + " delayed by " + formatDelay(delayMins),
                detail: flight.delayReason,
                delayMinutes: delayMins
            };
        }

        // if currently delayed, sometimes recover or advance
        if (flight.status === "Delayed") {
            // 40% chance to move forward from delay
            if (Math.random() < 0.4) {
                // jump to boarding or departed depending on time
                flight.status = "Boarding";
                flight.statusHistory.push({
                    status: "Boarding",
                    timestamp: Date.now(),
                    message: "Now boarding at Gate " + flight.gate
                });
                flight.lastUpdated = Date.now();

                return {
                    type: "status_change",
                    flight: JSON.parse(JSON.stringify(flight)),
                    message: flight.flightNumber + " is now Boarding",
                    detail: "Gate " + flight.gate + " | Terminal " + flight.terminal
                };
            }
            // sometimes the delay gets worse
            if (Math.random() < 0.15) {
                var extraDelay = pickRandom([15, 30, 45]);
                flight.delayMinutes += extraDelay;
                flight.estimatedDeparture = flight.scheduledDeparture + (flight.delayMinutes * 60 * 1000);
                flight.estimatedArrival = flight.scheduledArrival + (flight.delayMinutes * 60 * 1000);

                var updateMsg = "Delay extended to " + flight.delayMinutes + " min";
                flight.statusHistory.push({
                    status: "Delayed",
                    timestamp: Date.now(),
                    message: updateMsg
                });
                flight.lastUpdated = Date.now();

                return {
                    type: "delay_extended",
                    flight: JSON.parse(JSON.stringify(flight)),
                    message: flight.flightNumber + " delay extended to " + formatDelay(flight.delayMinutes),
                    detail: flight.delayReason
                };
            }
            return null;
        }

        // normal status progression
        if (currentIdx < statusOrder.length - 1) {
            var shouldAdvance = Math.random() < 0.35; // 35% chance each tick
            if (shouldAdvance) {
                var newStatus = statusOrder[currentIdx + 1];

                // sometimes skip "Boarding" for quick departures
                if (newStatus === "Boarding" && Math.random() < 0.2) {
                    newStatus = "Departed";
                }

                flight.status = newStatus;

                var detail = "";
                if (newStatus === "Boarding") detail = "Gate " + flight.gate + " | Terminal " + flight.terminal;
                if (newStatus === "Departed") detail = "Departed from " + airports[flight.origin].city;
                if (newStatus === "In Air") detail = "Cruising altitude reached";
                if (newStatus === "Landed") detail = "Arrived at " + airports[flight.destination].city;

                flight.statusHistory.push({
                    status: newStatus,
                    timestamp: Date.now(),
                    message: flight.flightNumber + " — " + newStatus + (detail ? " (" + detail + ")" : "")
                });
                flight.lastUpdated = Date.now();

                // gate change sometimes
                if (newStatus === "Boarding" && Math.random() < 0.3) {
                    var oldGate = flight.gate;
                    flight.gate = pickRandom(gates);
                    if (flight.gate !== oldGate) {
                        flight.statusHistory.push({
                            status: "Gate Change",
                            timestamp: Date.now(),
                            message: "Gate changed from " + oldGate + " to " + flight.gate
                        });
                    }
                }

                return {
                    type: "status_change",
                    flight: JSON.parse(JSON.stringify(flight)),
                    message: flight.flightNumber + " is now " + newStatus,
                    detail: detail
                };
            }
        }

        // random ETA adjustment for in-air flights
        if (flight.status === "In Air" && Math.random() < 0.25) {
            var etaShift = pickRandom([-10, -5, 5, 10, 15]);
            flight.estimatedArrival += (etaShift * 60 * 1000);

            var etaMsg = etaShift > 0
                ? "ETA pushed by " + etaShift + " min"
                : "ETA improved by " + Math.abs(etaShift) + " min";

            flight.statusHistory.push({
                status: "ETA Update",
                timestamp: Date.now(),
                message: etaMsg
            });
            flight.lastUpdated = Date.now();

            return {
                type: "eta_update",
                flight: JSON.parse(JSON.stringify(flight)),
                message: flight.flightNumber + " — " + etaMsg,
                detail: "New ETA: " + formatTime(flight.estimatedArrival)
            };
        }

        return null; // no change this tick
    }

    function formatDelay(minutes) {
        if (minutes < 60) return minutes + " min";
        var h = Math.floor(minutes / 60);
        var m = minutes % 60;
        if (m === 0) return h + "h";
        return h + "h " + m + "m";
    }

    function runUpdateCycle() {
        // pick 1-3 random flights to potentially update
        var numToUpdate = randBetween(1, 3);
        var updates = [];

        for (var i = 0; i < numToUpdate; i++) {
            var randomFlight = flightsList[randBetween(0, flightsList.length - 1)];
            var update = advanceStatus(randomFlight);
            if (update) {
                updates.push(update);
            }
        }

        // fire callbacks if we have updates
        if (updates.length > 0) {
            for (var c = 0; c < updateCallbacks.length; c++) {
                try {
                    updateCallbacks[c](updates);
                } catch (err) {
                    console.error("Update callback error:", err);
                }
            }
        }
    }

    function startLiveUpdates(callback, intervalMs) {
        if (callback) {
            updateCallbacks.push(callback);
        }

        // default interval: random between 8-15 seconds
        if (!intervalMs) intervalMs = randBetween(8000, 15000);

        if (!updateIntervalId) {
            // first update comes quickly so user sees something happen
            setTimeout(function () {
                runUpdateCycle();
            }, 3000);

            updateIntervalId = setInterval(function () {
                runUpdateCycle();
            }, intervalMs);
        }
    }

    function stopLiveUpdates() {
        if (updateIntervalId) {
            clearInterval(updateIntervalId);
            updateIntervalId = null;
        }
        updateCallbacks = [];
    }

    // ========== EXPORT ==========

    window.FlightAPI = {
        getAllFlights: getAllFlights,
        getFlightById: getFlightById,
        searchFlights: searchFlights,
        startLiveUpdates: startLiveUpdates,
        stopLiveUpdates: stopLiveUpdates,
        formatTime: formatTime,
        formatDate: formatDate,
        formatDelay: formatDelay,
        airports: airports,
        airlines: airlines
    };

})();
