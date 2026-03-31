// app.js - Main Application Logic
// ties everything together: search, tracking, rendering, live updates

(function () {
    "use strict";

    // ========== STATE ==========
    var trackedFlightIds = []; // array of flight IDs the user is tracking
    var currentFilter = "all";
    var searchTimeout = null;

    // DOM refs
    var searchInput = document.getElementById("searchInput");
    var searchResults = document.getElementById("searchResults");
    var flightsGrid = document.getElementById("flightsGrid");
    var flightModal = document.getElementById("flightModal");
    var modalContent = document.getElementById("modalContent");
    var liveClock = document.getElementById("liveClock");
    var notifPermBtn = document.getElementById("notifPermBtn");
    var flightCountBadge = document.getElementById("flightCount");

    // stat counters
    var statTracking = document.getElementById("statTracking");
    var statOnTime = document.getElementById("statOnTime");
    var statDelayed = document.getElementById("statDelayed");
    var statInAir = document.getElementById("statInAir");
    var statLanded = document.getElementById("statLanded");

    // ========== INIT ==========

    function init() {
        // load saved tracked flights from localStorage
        loadTrackedFlights();

        // render the dashboard
        renderFlights();

        // start live updates
        FlightAPI.startLiveUpdates(onLiveUpdate, 10000);

        // set up search
        searchInput.addEventListener("input", onSearchInput);
        searchInput.addEventListener("focus", onSearchFocus);
        document.addEventListener("click", function (e) {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.remove("active");
            }
        });

        // filter tabs
        var filterBtns = document.querySelectorAll(".filter-tab");
        for (var i = 0; i < filterBtns.length; i++) {
            filterBtns[i].addEventListener("click", onFilterClick);
        }

        // modal close
        flightModal.addEventListener("click", function (e) {
            if (e.target === flightModal) {
                closeModal();
            }
        });

        // notification permission button
        notifPermBtn.addEventListener("click", function () {
            NotificationManager.requestPermission();
            NotificationManager.showToast({
                title: "Notifications enabled",
                message: "You'll get alerts for flight status changes",
                type: "success",
                duration: 3000
            });
        });

        // keyboard - escape closes modal
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeModal();
        });

        // start clock
        updateClock();
        setInterval(updateClock, 1000);

        // request notification permission on load
        NotificationManager.requestPermission();

        // if no flights tracked, auto-add a few for demo
        if (trackedFlightIds.length === 0) {
            autoAddDemoFlights();
        }
    }

    // ========== CLOCK ==========
    function updateClock() {
        var now = new Date();
        var h = now.getHours();
        var m = now.getMinutes();
        var s = now.getSeconds();
        var ampm = h >= 12 ? "PM" : "AM";
        h = h % 12;
        if (h === 0) h = 12;
        m = m < 10 ? "0" + m : m;
        s = s < 10 ? "0" + s : s;
        liveClock.textContent = h + ":" + m + ":" + s + " " + ampm;
    }

    // ========== LOCAL STORAGE ==========
    function loadTrackedFlights() {
        try {
            var saved = localStorage.getItem("skypulse_tracked");
            if (saved) {
                trackedFlightIds = JSON.parse(saved);
            }
        } catch (e) {
            trackedFlightIds = [];
        }
    }

    function saveTrackedFlights() {
        try {
            localStorage.setItem("skypulse_tracked", JSON.stringify(trackedFlightIds));
        } catch (e) {
            // storage full or blocked, ignore
        }
    }

    // add first 3 flights as demo
    function autoAddDemoFlights() {
        var allFlights = FlightAPI.getAllFlights();
        var count = Math.min(3, allFlights.length);
        for (var i = 0; i < count; i++) {
            trackedFlightIds.push(allFlights[i].id);
        }
        saveTrackedFlights();
        renderFlights();
    }

    // ========== SEARCH ==========
    function onSearchInput() {
        clearTimeout(searchTimeout);
        var query = searchInput.value.trim();

        if (query.length < 1) {
            searchResults.classList.remove("active");
            return;
        }

        searchTimeout = setTimeout(function () {
            var results = FlightAPI.searchFlights(query);
            renderSearchResults(results);
        }, 200); // small debounce
    }

    function onSearchFocus() {
        var query = searchInput.value.trim();
        if (query.length >= 1) {
            var results = FlightAPI.searchFlights(query);
            renderSearchResults(results);
        }
    }

    function renderSearchResults(flights) {
        if (flights.length === 0) {
            searchResults.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">No flights found</div>';
            searchResults.classList.add("active");
            return;
        }

        var html = "";
        for (var i = 0; i < flights.length; i++) {
            var f = flights[i];
            var isTracked = trackedFlightIds.indexOf(f.id) !== -1;
            var statusClass = getStatusClass(f.status);

            html += '<div class="search-result-item" data-id="' + f.id + '">';
            html += '<span class="sr-flight-num">' + f.flightNumber + '</span>';
            html += '<span class="sr-route">' + f.originCity + ' → ' + f.destCity + '</span>';
            html += '<span class="sr-status status-badge ' + statusClass + '">' + f.status + '</span>';

            if (isTracked) {
                html += '<span class="sr-add-btn added">Tracking</span>';
            } else {
                html += '<button class="sr-add-btn" onclick="App.addFlight(\'' + f.id + '\')">+ Track</button>';
            }

            html += '</div>';
        }

        searchResults.innerHTML = html;
        searchResults.classList.add("active");
    }

    // ========== TRACKING ==========
    function addFlight(flightId) {
        if (trackedFlightIds.indexOf(flightId) !== -1) return; // already tracking

        trackedFlightIds.push(flightId);
        saveTrackedFlights();

        var flight = FlightAPI.getFlightById(flightId);
        if (flight) {
            NotificationManager.showToast({
                title: "Flight added",
                message: flight.flightNumber + " (" + flight.originCity + " → " + flight.destCity + ")",
                type: "success",
                duration: 3000
            });
        }

        renderFlights();

        // refresh search results to show updated state
        if (searchInput.value.trim().length > 0) {
            var results = FlightAPI.searchFlights(searchInput.value.trim());
            renderSearchResults(results);
        }
    }

    function removeFlight(flightId, e) {
        if (e) {
            e.stopPropagation(); // don't trigger card click
        }

        var idx = trackedFlightIds.indexOf(flightId);
        if (idx !== -1) {
            trackedFlightIds.splice(idx, 1);
            saveTrackedFlights();
            renderFlights();
        }
    }

    // ========== FILTERS ==========
    function onFilterClick(e) {
        var filterBtns = document.querySelectorAll(".filter-tab");
        for (var i = 0; i < filterBtns.length; i++) {
            filterBtns[i].classList.remove("active");
        }
        e.target.classList.add("active");
        currentFilter = e.target.getAttribute("data-filter");
        renderFlights();
    }

    function filterFlights(flights) {
        if (currentFilter === "all") return flights;

        var filtered = [];
        for (var i = 0; i < flights.length; i++) {
            var f = flights[i];
            if (currentFilter === "active") {
                if (f.status !== "Landed" && f.status !== "Cancelled") {
                    filtered.push(f);
                }
            } else if (currentFilter === "delayed") {
                if (f.status === "Delayed" || f.delayMinutes > 0) {
                    filtered.push(f);
                }
            } else if (currentFilter === "completed") {
                if (f.status === "Landed") {
                    filtered.push(f);
                }
            }
        }
        return filtered;
    }

    // ========== RENDER FLIGHTS ==========
    function renderFlights() {
        var trackedFlights = [];
        for (var i = 0; i < trackedFlightIds.length; i++) {
            var flight = FlightAPI.getFlightById(trackedFlightIds[i]);
            if (flight) {
                trackedFlights.push(flight);
            }
        }

        // update stats
        updateStats(trackedFlights);

        // apply filter
        var displayFlights = filterFlights(trackedFlights);

        // update count badge
        flightCountBadge.textContent = trackedFlights.length;

        if (displayFlights.length === 0) {
            if (trackedFlights.length === 0) {
                flightsGrid.innerHTML =
                    '<div class="empty-state">' +
                    '<div class="empty-icon">✈</div>' +
                    '<h3>No flights tracked yet</h3>' +
                    '<p>Search for a flight above and click "+ Track" to add it to your dashboard</p>' +
                    '</div>';
            } else {
                flightsGrid.innerHTML =
                    '<div class="empty-state">' +
                    '<div class="empty-icon">🔍</div>' +
                    '<h3>No flights match this filter</h3>' +
                    '<p>Try a different filter to see your tracked flights</p>' +
                    '</div>';
            }
            return;
        }

        var html = "";
        for (var j = 0; j < displayFlights.length; j++) {
            html += buildFlightCard(displayFlights[j]);
        }

        flightsGrid.innerHTML = html;

        // attach click handlers to cards
        var cards = flightsGrid.querySelectorAll(".flight-card");
        for (var k = 0; k < cards.length; k++) {
            (function (card) {
                card.addEventListener("click", function () {
                    var fid = card.getAttribute("data-flight-id");
                    openFlightDetail(fid);
                });
            })(cards[k]);
        }
    }

    function buildFlightCard(flight) {
        var statusClass = getStatusClass(flight.status);
        var progress = getFlightProgress(flight);

        // check if departure has been revised
        var depTimeHtml = FlightAPI.formatTime(flight.estimatedDeparture);
        var arrTimeHtml = FlightAPI.formatTime(flight.estimatedArrival);
        var depExtra = "";
        var arrExtra = "";

        if (flight.delayMinutes > 0) {
            depExtra = '<div class="time-original">' + FlightAPI.formatTime(flight.scheduledDeparture) + '</div>';
            depTimeHtml = '<span class="time-value revised">' + FlightAPI.formatTime(flight.estimatedDeparture) + '</span>';
            arrExtra = '<div class="time-original">' + FlightAPI.formatTime(flight.scheduledArrival) + '</div>';
            arrTimeHtml = '<span class="time-value revised">' + FlightAPI.formatTime(flight.estimatedArrival) + '</span>';
        } else {
            depTimeHtml = '<span class="time-value">' + depTimeHtml + '</span>';
            arrTimeHtml = '<span class="time-value">' + arrTimeHtml + '</span>';
        }

        var delayReasonHtml = "";
        if (flight.delayReason) {
            delayReasonHtml = '<span class="delay-reason">⚠ ' + flight.delayReason + '</span>';
        }

        var durationH = Math.floor(flight.durationMin / 60);
        var durationM = flight.durationMin % 60;
        var durationStr = (durationH > 0 ? durationH + "h " : "") + durationM + "m";

        var updatedAgo = getTimeAgo(flight.lastUpdated);

        var card =
            '<div class="flight-card" data-flight-id="' + flight.id + '">' +
            '  <div class="card-top">' +
            '    <div class="card-airline">' +
            '      <div class="airline-logo">' + flight.airlineCode + '</div>' +
            '      <div class="card-airline-info">' +
            '        <div class="flight-num">' + flight.flightNumber + '</div>' +
            '        <div class="airline-name">' + flight.airlineName + '</div>' +
            '      </div>' +
            '    </div>' +
            '    <div class="card-actions">' +
            '      <span class="status-badge ' + statusClass + '">' + flight.status + '</span>' +
            '      <button class="remove-btn" onclick="App.removeFlight(\'' + flight.id + '\', event)" title="Remove from tracking">✕</button>' +
            '    </div>' +
            '  </div>' +

            '  <div class="card-route">' +
            '    <div class="route-line">' +
            '      <div class="route-city">' +
            '        <div class="city-code">' + flight.origin + '</div>' +
            '        <div class="city-name">' + flight.originCity + '</div>' +
            '      </div>' +
            '      <div class="route-path">' +
            '        <div class="route-path-line">' +
            '          <div class="route-path-progress" style="width:' + progress + '%"></div>' +
            '        </div>' +
            '        <span class="route-path-plane" style="left:' + Math.max(5, Math.min(95, progress)) + '%">✈</span>' +
            '      </div>' +
            '      <div class="route-city">' +
            '        <div class="city-code">' + flight.destination + '</div>' +
            '        <div class="city-name">' + flight.destCity + '</div>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +

            '  <div class="card-times">' +
            '    <div class="time-block">' +
            '      <div class="time-label">Departure</div>' +
            '      ' + depTimeHtml +
            '      ' + depExtra +
            '    </div>' +
            '    <div class="time-block" style="text-align:center">' +
            '      <div class="time-label">Duration</div>' +
            '      <span class="time-value">' + durationStr + '</span>' +
            '    </div>' +
            '    <div class="time-block right-align">' +
            '      <div class="time-label">Arrival (ETA)</div>' +
            '      ' + arrTimeHtml +
            '      ' + arrExtra +
            '    </div>' +
            '  </div>' +

            '  <div class="card-footer">' +
            '    <div class="card-footer-left">' +
            '      <span>🚪 Gate ' + flight.gate + '</span>' +
            '      <span>🏢 ' + flight.terminal + '</span>' +
            '      ' + delayReasonHtml +
            '    </div>' +
            '    <div class="card-footer-right">' +
            '      Updated ' + updatedAgo +
            '    </div>' +
            '  </div>' +
            '</div>';

        return card;
    }

    // ========== FLIGHT DETAIL MODAL ==========
    function openFlightDetail(flightId) {
        var flight = FlightAPI.getFlightById(flightId);
        if (!flight) return;

        var statusClass = getStatusClass(flight.status);
        var progress = getFlightProgress(flight);

        var originInfo = FlightAPI.airports[flight.origin];
        var destInfo = FlightAPI.airports[flight.destination];

        // build timeline
        var timelineHtml = "";
        for (var i = flight.statusHistory.length - 1; i >= 0; i--) {
            var entry = flight.statusHistory[i];
            var tlClass = "";
            if (entry.status === "Delayed") tlClass = "delay";
            if (entry.status === "Landed") tlClass = "success";

            var entryTime = new Date(entry.timestamp);
            var timeStr = FlightAPI.formatTime(entry.timestamp);

            timelineHtml +=
                '<div class="timeline-item ' + tlClass + '">' +
                '  <div class="tl-status">' + entry.status + '</div>' +
                '  <div class="tl-message">' + entry.message + '</div>' +
                '  <div class="tl-time">' + timeStr + '</div>' +
                '</div>';
        }

        var durationH = Math.floor(flight.durationMin / 60);
        var durationM = flight.durationMin % 60;
        var durationStr = (durationH > 0 ? durationH + "h " : "") + durationM + "m";

        var delayHtml = "";
        if (flight.delayMinutes > 0) {
            delayHtml =
                '<div class="detail-item">' +
                '  <div class="detail-label">Delay</div>' +
                '  <div class="detail-value" style="color:var(--accent-red)">' + FlightAPI.formatDelay(flight.delayMinutes) + '</div>' +
                '  <div class="detail-sub">' + (flight.delayReason || "N/A") + '</div>' +
                '</div>';
        }

        var html =
            '<div class="modal-header">' +
            '  <div class="modal-flight-info">' +
            '    <h2>' + flight.flightNumber + '</h2>' +
            '    <div class="modal-airline">' + flight.airlineName + ' &middot; <span class="status-badge ' + statusClass + '">' + flight.status + '</span></div>' +
            '  </div>' +
            '  <button class="modal-close" onclick="App.closeModal()">✕</button>' +
            '</div>' +

            '<div class="modal-route">' +
            '  <div class="modal-airport">' +
            '    <div class="airport-code">' + flight.origin + '</div>' +
            '    <div class="airport-city">' + originInfo.city + '</div>' +
            '    <div class="airport-name">' + originInfo.name + '</div>' +
            '  </div>' +
            '  <div class="modal-route-mid">' +
            '    <div class="duration">' + durationStr + '</div>' +
            '    <div class="route-icon">✈ ─────</div>' +
            '  </div>' +
            '  <div class="modal-airport dest">' +
            '    <div class="airport-code">' + flight.destination + '</div>' +
            '    <div class="airport-city">' + destInfo.city + '</div>' +
            '    <div class="airport-name">' + destInfo.name + '</div>' +
            '  </div>' +
            '</div>' +

            '<div class="modal-details">' +
            '  <div class="detail-item">' +
            '    <div class="detail-label">Scheduled Departure</div>' +
            '    <div class="detail-value">' + FlightAPI.formatTime(flight.scheduledDeparture) + '</div>' +
            '    <div class="detail-sub">' + FlightAPI.formatDate(flight.scheduledDeparture) + '</div>' +
            '  </div>' +
            '  <div class="detail-item">' +
            '    <div class="detail-label">Scheduled Arrival</div>' +
            '    <div class="detail-value">' + FlightAPI.formatTime(flight.scheduledArrival) + '</div>' +
            '    <div class="detail-sub">' + FlightAPI.formatDate(flight.scheduledArrival) + '</div>' +
            '  </div>' +
            '  <div class="detail-item">' +
            '    <div class="detail-label">Estimated Departure</div>' +
            '    <div class="detail-value' + (flight.delayMinutes > 0 ? '" style="color:var(--accent-orange)' : '') + '">' + FlightAPI.formatTime(flight.estimatedDeparture) + '</div>' +
            '  </div>' +
            '  <div class="detail-item">' +
            '    <div class="detail-label">Estimated Arrival</div>' +
            '    <div class="detail-value' + (flight.delayMinutes > 0 ? '" style="color:var(--accent-orange)' : '') + '">' + FlightAPI.formatTime(flight.estimatedArrival) + '</div>' +
            '  </div>' +
            '  <div class="detail-item">' +
            '    <div class="detail-label">Gate</div>' +
            '    <div class="detail-value">' + flight.gate + '</div>' +
            '  </div>' +
            '  <div class="detail-item">' +
            '    <div class="detail-label">Terminal</div>' +
            '    <div class="detail-value">' + flight.terminal + '</div>' +
            '  </div>' +
            delayHtml +
            '</div>' +

            '<div class="modal-timeline">' +
            '  <div class="timeline-title">Status Timeline</div>' +
            '  <div class="timeline-list">' +
            timelineHtml +
            '  </div>' +
            '</div>';

        modalContent.innerHTML = html;
        flightModal.classList.add("active");
    }

    function closeModal() {
        flightModal.classList.remove("active");
    }

    // ========== LIVE UPDATES HANDLER ==========
    function onLiveUpdate(updates) {
        var shouldRerender = false;

        for (var i = 0; i < updates.length; i++) {
            var update = updates[i];
            var flightId = update.flight.id;

            // only notify if we're tracking this flight
            if (trackedFlightIds.indexOf(flightId) !== -1) {
                NotificationManager.notifyFlightUpdate(update);
                shouldRerender = true;

                // pulse animation on the card
                var card = document.querySelector('.flight-card[data-flight-id="' + flightId + '"]');
                if (card) {
                    card.classList.remove("status-updated");
                    // force reflow
                    void card.offsetWidth;
                    card.classList.add("status-updated");
                }
            }
        }

        if (shouldRerender) {
            // small delay so notification shows first
            setTimeout(function () {
                renderFlights();
            }, 500);
        }
    }

    // ========== STATS ==========
    function updateStats(flights) {
        var onTime = 0, delayed = 0, inAir = 0, landed = 0;

        for (var i = 0; i < flights.length; i++) {
            var s = flights[i].status;
            if (s === "On Time" || s === "Scheduled") onTime++;
            if (s === "Delayed") delayed++;
            if (s === "In Air" || s === "Departed") inAir++;
            if (s === "Landed") landed++;
        }

        statTracking.textContent = flights.length;
        statOnTime.textContent = onTime;
        statDelayed.textContent = delayed;
        statInAir.textContent = inAir;
        statLanded.textContent = landed;
    }

    // ========== HELPERS ==========
    function getStatusClass(status) {
        var map = {
            "Scheduled": "status-scheduled",
            "On Time": "status-ontime",
            "Boarding": "status-boarding",
            "Departed": "status-departed",
            "In Air": "status-inair",
            "Landed": "status-landed",
            "Delayed": "status-delayed",
            "Cancelled": "status-cancelled"
        };
        return map[status] || "status-scheduled";
    }

    function getFlightProgress(flight) {
        var statusMap = {
            "Scheduled": 0,
            "On Time": 5,
            "Boarding": 12,
            "Delayed": 8,
            "Departed": 25,
            "In Air": 60,
            "Landed": 100
        };
        return statusMap[flight.status] || 0;
    }

    function getTimeAgo(timestamp) {
        var diff = Date.now() - timestamp;
        var seconds = Math.floor(diff / 1000);

        if (seconds < 10) return "just now";
        if (seconds < 60) return seconds + "s ago";
        var mins = Math.floor(seconds / 60);
        if (mins < 60) return mins + "m ago";
        var hrs = Math.floor(mins / 60);
        return hrs + "h ago";
    }

    // ========== RUN ==========
    // wait for DOM to be ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    // ========== PUBLIC API (for inline handlers) ==========
    window.App = {
        addFlight: addFlight,
        removeFlight: removeFlight,
        closeModal: closeModal
    };

})();
