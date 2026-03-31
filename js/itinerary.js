// itinerary.js
(function () {
    "use strict";

    var trip = null;
    var days = {}; // dayIndex -> array of activities
    var currentDay = 0;
    var currentActivityType = "activity";

    var typeIcons = { activity: "🎯", hotel: "🏨", flight: "✈️", food: "🍽️", transport: "🚗" };

    var suggestions = {
        "goa": [
            { icon: "🏖️", name: "Baga Beach", cost: "₹0" },
            { icon: "🤿", name: "Scuba Diving", cost: "₹2,500" },
            { icon: "🎉", name: "Club Tito's", cost: "₹800" },
            { icon: "🚢", name: "Cruise Dinner", cost: "₹1,500" },
            { icon: "🏊", name: "Waterpark", cost: "₹600" },
            { icon: "🍗", name: "Fisherman's Wharf", cost: "₹700" }
        ],
        "manali": [
            { icon: "🪂", name: "Paragliding", cost: "₹1,800" },
            { icon: "🏔️", name: "Rohtang Pass Trip", cost: "₹1,200" },
            { icon: "🎿", name: "Skiing at Solang", cost: "₹2,000" },
            { icon: "🌊", name: "River Rafting", cost: "₹500" },
            { icon: "🏛️", name: "Hadimba Temple", cost: "₹0" },
            { icon: "🍕", name: "Johnson's Café", cost: "₹600" }
        ],
        "default": [
            { icon: "🏛️", name: "Museum Visit", cost: "₹200" },
            { icon: "🛍️", name: "Local Market", cost: "₹0" },
            { icon: "🚌", name: "City Tour Bus", cost: "₹500" },
            { icon: "📸", name: "Sunset Viewpoint", cost: "₹0" },
            { icon: "🍽️", name: "Local Restaurant", cost: "₹400" },
            { icon: "🧘", name: "Yoga / Spa", cost: "₹800" }
        ]
    };

    function getDaysBetween(start, end) {
        var s = new Date(start);
        var e = new Date(end);
        var diff = Math.round((e - s) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff + 1);
    }

    function formatDate(startDate, dayIndex) {
        var d = new Date(startDate);
        d.setDate(d.getDate() + dayIndex);
        return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    function getTotalBudget() {
        var total = 0;
        Object.values(days).forEach(function(dayActivities) {
            dayActivities.forEach(function(a) {
                total += a.cost || 0;
            });
        });
        return total;
    }

    function getTotalActivities() {
        return Object.values(days).reduce(function(sum, d) { return sum + d.length; }, 0);
    }

    function init() {
        document.getElementById('createTripBtn').addEventListener('click', createTrip);
        document.getElementById('addActBtn').addEventListener('click', addActivity);

        // activity type tabs
        var typeTabs = document.querySelectorAll('.act-type');
        typeTabs.forEach(function(t) {
            t.addEventListener('click', function() {
                typeTabs.forEach(function(tt) { tt.classList.remove('active'); });
                this.classList.add('active');
                currentActivityType = this.getAttribute('data-type');
            });
        });

        // set defaults
        var today = new Date();
        var end = new Date(); end.setDate(end.getDate() + 5);
        document.getElementById('startDate').value = today.toISOString().split('T')[0];
        document.getElementById('endDate').value = end.toISOString().split('T')[0];

        // try load from storage
        var saved = localStorage.getItem('tripsmart_itinerary');
        if (saved) {
            try {
                var s = JSON.parse(saved);
                trip = s.trip;
                days = s.days;
                renderAll();
            } catch(e) {}
        }
    }

    function createTrip() {
        var name = document.getElementById('tripName').value.trim();
        var start = document.getElementById('startDate').value;
        var end = document.getElementById('endDate').value;
        var dest = document.getElementById('destination').value.trim();

        if (!name || !start || !end || !dest) { alert('Please fill all fields'); return; }
        if (new Date(end) < new Date(start)) { alert('End date must be after start date'); return; }

        var numDays = getDaysBetween(start, end);
        days = {};
        for (var i = 0; i < numDays; i++) days[i] = [];

        trip = { name: name, start: start, end: end, dest: dest, numDays: numDays };
        currentDay = 0;
        save();
        renderAll();
    }

    function renderAll() {
        if (!trip) return;
        document.getElementById('tripSummaryBar').style.display = 'flex';
        document.getElementById('daysPlanner').style.display = 'grid';
        document.getElementById('suggestionsSection').style.display = 'block';

        document.getElementById('tsb-name').textContent = trip.name;
        document.getElementById('tsb-dest').textContent = trip.dest;
        document.getElementById('tsb-days').textContent = trip.numDays + ' days';
        document.getElementById('tsb-activities').textContent = getTotalActivities();
        document.getElementById('tsb-budget').textContent = '₹' + getTotalBudget().toLocaleString('en-IN');

        renderDaysList();
        renderActivities();
        renderSuggestions();
    }

    function renderDaysList() {
        var list = document.getElementById('daysList');
        var html = '';
        for (var i = 0; i < trip.numDays; i++) {
            var cnt = days[i] ? days[i].length : 0;
            html += '<div class="day-pill' + (i === currentDay ? ' active' : '') + '" onclick="ItineraryBuilder.selectDay(' + i + ')">' +
                '<div class="day-pill-label">Day ' + (i + 1) + '</div>' +
                '<div class="day-pill-date">' + formatDate(trip.start, i) + '</div>' +
                (cnt > 0 ? '<div class="day-pill-cnt">' + cnt + ' item' + (cnt > 1 ? 's' : '') + '</div>' : '') +
                '</div>';
        }
        list.innerHTML = html;
    }

    function selectDay(idx) {
        currentDay = idx;
        renderDaysList();
        renderActivities();
    }

    function renderActivities() {
        var header = document.getElementById('dpDayHeader');
        header.textContent = 'Day ' + (currentDay + 1) + ' — ' + formatDate(trip.start, currentDay);

        var list = document.getElementById('activitiesList');
        var acts = days[currentDay] || [];

        if (acts.length === 0) {
            list.innerHTML = '<div class="empty-day">No activities yet for this day.<br>Add something above! 👆</div>';
            return;
        }

        acts.sort(function(a, b) { return (a.time || '99:99').localeCompare(b.time || '99:99'); });

        list.innerHTML = acts.map(function(a) {
            return '<div class="activity-item">' +
                '<div class="ai-time">' + (a.time || '--:--') + '</div>' +
                '<div class="ai-icon">' + (typeIcons[a.type] || '📍') + '</div>' +
                '<div class="ai-info">' +
                '  <div class="ai-title">' + a.title + '</div>' +
                (a.note ? '<div class="ai-note">' + a.note + '</div>' : '') +
                '</div>' +
                (a.cost ? '<div class="ai-cost">₹' + a.cost.toLocaleString('en-IN') + '</div>' : '') +
                '<button class="ai-del" onclick="ItineraryBuilder.removeActivity(' + currentDay + ',' + a.id + ')">✕</button>' +
                '</div>';
        }).join('');
    }

    function addActivity() {
        var title = document.getElementById('actTitle').value.trim();
        var time = document.getElementById('actTime').value;
        var cost = parseInt(document.getElementById('actCost').value) || 0;
        var note = document.getElementById('actNote').value.trim();

        if (!title) { alert('Please enter a title'); return; }

        if (!days[currentDay]) days[currentDay] = [];
        days[currentDay].push({ id: Date.now(), type: currentActivityType, title: title, time: time, cost: cost, note: note });

        document.getElementById('actTitle').value = '';
        document.getElementById('actTime').value = '';
        document.getElementById('actCost').value = '';
        document.getElementById('actNote').value = '';

        save();
        renderAll();
    }

    function removeActivity(dayIdx, id) {
        if (days[dayIdx]) {
            days[dayIdx] = days[dayIdx].filter(function(a) { return a.id !== id; });
            save();
            renderAll();
        }
    }

    function addSuggestion(name, cost) {
        if (!days[currentDay]) days[currentDay] = [];
        var numCost = parseInt(cost.replace(/[^0-9]/g, '')) || 0;
        days[currentDay].push({ id: Date.now(), type: 'activity', title: name, time: '', cost: numCost, note: 'Suggested activity' });
        save();
        renderAll();
    }

    function renderSuggestions() {
        var destLow = (trip.dest || '').toLowerCase();
        var key = 'default';
        if (destLow.includes('goa')) key = 'goa';
        if (destLow.includes('manali')) key = 'manali';

        var list = suggestions[key];
        var grid = document.getElementById('suggestionsGrid');
        grid.innerHTML = list.map(function(s) {
            return '<div class="sugg-card" onclick="ItineraryBuilder.addSuggestion(\'' + s.name + '\', \'' + s.cost + '\')">' +
                '<div class="sc-icon">' + s.icon + '</div>' +
                '<div class="sc-name">' + s.name + '</div>' +
                '<div class="sc-cost">' + s.cost + '</div>' +
                '<div class="sc-add">+ Add to Day ' + (currentDay + 1) + '</div>' +
                '</div>';
        }).join('');
    }

    function exportPDF() {
        var content = '<h2>' + trip.name + ' — ' + trip.dest + '</h2>';
        content += '<p>' + trip.start + ' to ' + trip.end + ' | ' + trip.numDays + ' days | Budget: ₹' + getTotalBudget().toLocaleString('en-IN') + '</p><hr>';

        for (var i = 0; i < trip.numDays; i++) {
            content += '<h3>Day ' + (i + 1) + ' — ' + formatDate(trip.start, i) + '</h3>';
            var acts = days[i] || [];
            if (acts.length === 0) { content += '<p>No activities planned</p>'; continue; }
            acts.forEach(function(a) {
                content += '<p>' + (a.time || '--') + ' | ' + (typeIcons[a.type] || '') + ' ' + a.title + (a.cost ? ' | ₹' + a.cost : '') + '</p>';
            });
        }

        var w = window.open('', '_blank');
        w.document.write('<html><head><title>' + trip.name + '</title><style>body{font-family:sans-serif;padding:24px;max-width:700px;margin:auto}h2{color:#1d4ed8}h3{margin-top:20px;border-bottom:1px solid #ddd;padding-bottom:6px}p{margin:6px 0;color:#555}hr{margin:16px 0}</style></head><body>' + content + '<br><button onclick="window.print()" style="padding:10px 20px;background:#1d4ed8;color:#fff;border:none;border-radius:6px;cursor:pointer">Print/Save PDF</button></body></html>');
    }

    function clearTrip() {
        if (!confirm('Clear this trip? All data will be lost.')) return;
        trip = null; days = {};
        localStorage.removeItem('tripsmart_itinerary');
        document.getElementById('tripSummaryBar').style.display = 'none';
        document.getElementById('daysPlanner').style.display = 'none';
        document.getElementById('suggestionsSection').style.display = 'none';
    }

    function save() {
        try { localStorage.setItem('tripsmart_itinerary', JSON.stringify({ trip: trip, days: days })); } catch(e) {}
    }

    window.addEventListener('DOMContentLoaded', init);
    window.ItineraryBuilder = { selectDay: selectDay, removeActivity: removeActivity, addSuggestion: addSuggestion, exportPDF: exportPDF, clearTrip: clearTrip };
})();
