// pricing.js - Dynamic Pricing Engine Logic
(function () {
    "use strict";

    // ===== ROUTE BASE PRICES =====
    var routes = {
        "DEL-BOM": { label: "DEL → BOM", base: { economy: 4200, business: 14000, first: 28000 }, dist: 1150 },
        "BOM-BLR": { label: "BOM → BLR", base: { economy: 3800, business: 12500, first: 24000 }, dist: 980 },
        "DEL-GOI": { label: "DEL → GOI", base: { economy: 5200, business: 16000, first: 32000 }, dist: 1900 },
        "BOM-DXB": { label: "BOM → DXB", base: { economy: 11500, business: 38000, first: 75000 }, dist: 1930 },
        "DEL-SIN": { label: "DEL → SIN", base: { economy: 18000, business: 58000, first: 110000 }, dist: 4150 },
        "BLR-MAA": { label: "BLR → MAA", base: { economy: 2800, business: 9000, first: 18000 }, dist: 290 },
        "HYD-GOI": { label: "HYD → GOI", base: { economy: 3600, business: 11000, first: 22000 }, dist: 660 },
        "DEL-LHR": { label: "DEL → LHR", base: { economy: 38000, business: 120000, first: 240000 }, dist: 6700 }
    };

    // seasonal multipliers by month (1=Jan, 12=Dec)
    var seasonMultiplier = {1:1.3, 2:1.1, 3:1.0, 4:1.0, 5:1.15, 6:0.9, 7:0.85, 8:0.9, 9:1.0, 10:1.15, 11:1.25, 12:1.4};
    var seasonLabel = {1:"Peak (New Year)", 2:"High", 3:"Normal", 4:"Normal", 5:"Moderate High", 6:"Low", 7:"Low", 8:"Low", 9:"Normal", 10:"Moderate High", 11:"High (Festive)", 12:"Peak (Christmas)"};

    // demand levels
    var demandLevels = ["Very Low", "Low", "Moderate", "High", "Very High", "Surge"];
    var demandMultiplier = [0.75, 0.88, 1.0, 1.18, 1.35, 1.65];
    var demandFillPct = [10, 28, 55, 72, 88, 100];

    // booking window multipliers (weeks before travel)
    function windowMultiplier(daysAhead) {
        if (daysAhead > 90) return 0.82;
        if (daysAhead > 60) return 0.90;
        if (daysAhead > 30) return 1.0;
        if (daysAhead > 14) return 1.1;
        if (daysAhead > 7) return 1.25;
        if (daysAhead > 3) return 1.45;
        return 1.7;
    }

    // alerts storage
    var priceAlerts = [];
    // history cache
    var historyData = {};

    // current state
    var currentRoute = "DEL-BOM";
    var currentCabin = "economy";
    var currentDaysAhead = 18;
    var currentDemandIdx = 2;
    var currentSeats = 42;
    var currentPrice = 0;
    var currentBase = 0;

    // chart canvas drawing
    var chartCanvas, chartCtx, chartData = {};

    function init() {
        chartCanvas = document.getElementById('priceChart');
        if (chartCanvas) chartCtx = chartCanvas.getContext('2d');

        document.getElementById('searchPriceBtn').addEventListener('click', computePrice);
        document.getElementById('routeSelect').addEventListener('change', computePrice);
        document.getElementById('cabinSelect').addEventListener('change', computePrice);

        // first run
        computePrice();

        // randomize demand slightly every 12 seconds
        setInterval(function () {
            var shift = Math.floor(Math.random() * 3) - 1;
            currentDemandIdx = Math.max(0, Math.min(5, currentDemandIdx + shift));
            currentSeats = Math.max(2, currentSeats + Math.floor(Math.random() * 5) - 2);
            updateDemandUI();
            var newPrice = calcPrice(currentBase, null, null, null);
            updatePriceUI(newPrice, currentPrice);
            currentPrice = newPrice;
        }, 12000);
    }

    function calcPrice(base, daysAhead, demandIdx, monthNum) {
        daysAhead = daysAhead !== null ? daysAhead : currentDaysAhead;
        demandIdx = demandIdx !== null ? demandIdx : currentDemandIdx;
        monthNum = monthNum !== null ? monthNum : (new Date().getMonth() + 1);

        var sm = seasonMultiplier[monthNum] || 1.0;
        var dm = demandMultiplier[demandIdx];
        var wm = windowMultiplier(daysAhead);
        var seatsFactor = currentSeats < 10 ? 1.2 : currentSeats < 20 ? 1.08 : 1.0;

        var price = Math.round(base * sm * dm * wm * seatsFactor);
        return price;
    }

    function computePrice() {
        currentRoute = document.getElementById('routeSelect').value;
        currentCabin = document.getElementById('cabinSelect').value;

        // get days ahead from date input
        var dateInput = document.getElementById('travelDate').value;
        if (dateInput) {
            var travel = new Date(dateInput);
            var today = new Date();
            currentDaysAhead = Math.max(0, Math.round((travel - today) / (1000 * 60 * 60 * 24)));
        }

        currentBase = routes[currentRoute].base[currentCabin];
        currentDemandIdx = Math.floor(Math.random() * 3) + 1; // 1-3
        currentSeats = Math.floor(Math.random() * 80) + 5;

        var newPrice = calcPrice(currentBase, null, null, null);
        updatePriceUI(newPrice, currentPrice);
        currentPrice = newPrice;

        // update banner
        document.getElementById('pbRoute').textContent = routes[currentRoute].label;
        document.getElementById('pbCabin').textContent = currentCabin.charAt(0).toUpperCase() + currentCabin.slice(1) + ' · One Way';

        updateDemandUI();
        drawChart();
        updatePredictions();
        checkAlerts(newPrice);
    }

    function updatePriceUI(newPrice, oldPrice) {
        var el = document.getElementById('pbPrice');
        el.textContent = '₹' + newPrice.toLocaleString('en-IN');

        var pct = oldPrice > 0 ? Math.round(((newPrice - oldPrice) / oldPrice) * 100) : 0;
        var badge = document.getElementById('changeBadge');
        var changeText = document.getElementById('changeText');

        if (oldPrice === 0) { badge.className = 'change-badge neutral'; badge.textContent = 'Live Price'; changeText.textContent = ''; return; }
        if (pct > 0) {
            badge.className = 'change-badge up'; badge.textContent = '↑ +' + pct + '%';
            changeText.textContent = 'vs last check';
            el.classList.add('surge');
        } else if (pct < 0) {
            badge.className = 'change-badge down'; badge.textContent = '↓ ' + pct + '%';
            changeText.textContent = 'price dropped!';
            el.classList.remove('surge');
        } else {
            badge.className = 'change-badge neutral'; badge.textContent = '→ No change';
            changeText.textContent = '';
        }

        // factor pills
        var month = new Date().getMonth() + 1;
        document.getElementById('f1').textContent = '📅 ' + (seasonLabel[month] || 'Normal');
        document.getElementById('f2').textContent = '📊 ' + demandLevels[currentDemandIdx] + ' Demand';
        document.getElementById('f3').textContent = '🕐 ' + currentDaysAhead + ' days ahead';
    }

    function updateDemandUI() {
        document.getElementById('demandVal').textContent = demandLevels[currentDemandIdx];
        document.getElementById('demandFill').style.width = demandFillPct[currentDemandIdx] + '%';
        document.getElementById('demandFill').className = 'meter-fill' + (currentDemandIdx >= 4 ? ' red' : currentDemandIdx === 3 ? ' orange' : '');

        var month = new Date().getMonth() + 1;
        var sm = seasonMultiplier[month] || 1.0;
        document.getElementById('seasonVal').textContent = sm.toFixed(1) + 'x';
        document.getElementById('seasonFill').style.width = Math.round((sm - 0.7) / 0.8 * 100) + '%';
        document.getElementById('seasonHint').textContent = seasonLabel[month] || 'Normal';

        document.getElementById('windowVal').textContent = currentDaysAhead + ' days';
        var wPct = Math.max(5, Math.min(100, Math.round((currentDaysAhead / 90) * 100)));
        document.getElementById('windowFill').style.width = wPct + '%';

        document.getElementById('seatsVal').textContent = currentSeats + ' seats';
        var sPct = Math.round((currentSeats / 180) * 100);
        var sFill = document.getElementById('seatsFill');
        sFill.style.width = Math.round(100 - sPct) + '%';
        sFill.className = 'meter-fill ' + (currentSeats < 10 ? 'red' : currentSeats < 25 ? 'orange' : 'green');
    }

    function generateHistory() {
        var key = currentRoute + '-' + currentCabin;
        if (historyData[key]) return historyData[key];

        var econData = [], bizData = [], labels = [];
        var base = routes[currentRoute].base[currentCabin];
        var bizBase = routes[currentRoute].base.business;

        for (var i = 29; i >= 0; i--) {
            var d = new Date();
            d.setDate(d.getDate() - i);
            labels.push(d.getDate() + '/' + (d.getMonth() + 1));

            var randomFactor = 0.85 + Math.random() * 0.45;
            var weekendBoost = (d.getDay() === 0 || d.getDay() === 6) ? 1.18 : 1.0;
            var peakDay = (i > 22 && i < 27) ? 1.35 : 1.0; // simulate a peak period

            econData.push(Math.round(base * randomFactor * weekendBoost * peakDay));
            bizData.push(Math.round(bizBase * randomFactor * weekendBoost * peakDay));
        }

        historyData[key] = { labels: labels, econ: econData, biz: bizData };
        return historyData[key];
    }

    function drawChart() {
        if (!chartCtx) return;
        var data = generateHistory();
        var cvs = chartCanvas;
        cvs.width = cvs.parentElement.clientWidth;
        cvs.height = 200;
        var W = cvs.width, H = cvs.height;
        var ctx = chartCtx;

        ctx.clearRect(0, 0, W, H);

        var econArr = data.econ;
        var bizArr = data.biz;
        var allVals = econArr.concat(bizArr);
        var minVal = Math.min.apply(null, allVals) * 0.9;
        var maxVal = Math.max.apply(null, allVals) * 1.05;
        var range = maxVal - minVal;

        var padL = 70, padR = 20, padT = 20, padB = 30;
        var plotW = W - padL - padR;
        var plotH = H - padT - padB;
        var n = econArr.length;

        function toX(i) { return padL + (i / (n - 1)) * plotW; }
        function toY(v) { return padT + (1 - (v - minVal) / range) * plotH; }

        // grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (var g = 0; g <= 4; g++) {
            var yg = padT + (g / 4) * plotH;
            ctx.beginPath(); ctx.moveTo(padL, yg); ctx.lineTo(W - padR, yg); ctx.stroke();
            var label = '₹' + Math.round(maxVal - (g / 4) * range).toLocaleString('en-IN');
            ctx.fillStyle = 'rgba(156,163,175,0.7)'; ctx.font = '10px Inter'; ctx.textAlign = 'right';
            ctx.fillText(label, padL - 6, yg + 4);
        }

        // x axis labels (every 5 days)
        ctx.fillStyle = 'rgba(156,163,175,0.7)'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
        for (var d = 0; d < n; d += 5) {
            ctx.fillText(data.labels[d], toX(d), H - 6);
        }

        // fill economy
        ctx.beginPath();
        ctx.moveTo(toX(0), toY(econArr[0]));
        for (var i = 1; i < n; i++) ctx.lineTo(toX(i), toY(econArr[i]));
        ctx.lineTo(toX(n-1), H - padB); ctx.lineTo(toX(0), H - padB); ctx.closePath();
        var ecGrad = ctx.createLinearGradient(0, padT, 0, H);
        ecGrad.addColorStop(0, 'rgba(0,212,255,0.2)'); ecGrad.addColorStop(1, 'rgba(0,212,255,0)');
        ctx.fillStyle = ecGrad; ctx.fill();

        // economy line
        ctx.beginPath();
        ctx.moveTo(toX(0), toY(econArr[0]));
        for (var i = 1; i < n; i++) ctx.lineTo(toX(i), toY(econArr[i]));
        ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 2.5; ctx.stroke();

        // business line
        ctx.beginPath();
        ctx.moveTo(toX(0), toY(bizArr[0]));
        for (var i = 1; i < n; i++) ctx.lineTo(toX(i), toY(bizArr[i]));
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 3]); ctx.stroke();
        ctx.setLineDash([]);

        // update stats
        var minE = Math.min.apply(null, econArr);
        var maxE = Math.max.apply(null, econArr);
        var avgE = Math.round(econArr.reduce(function(a,b){ return a+b; },0) / econArr.length);
        var trend = econArr[n-1] > econArr[n-7] ? '↗ Rising' : '↘ Falling';
        document.getElementById('minPrice').textContent = '₹' + minE.toLocaleString('en-IN');
        document.getElementById('avgPrice').textContent = '₹' + avgE.toLocaleString('en-IN');
        document.getElementById('maxPrice').textContent = '₹' + maxE.toLocaleString('en-IN');
        var tEl = document.getElementById('trendVal');
        tEl.textContent = trend;
        tEl.style.color = trend.includes('Rising') ? 'var(--red)' : 'var(--green)';
    }

    function updatePredictions() {
        var grid = document.getElementById('predictionGrid');
        var days = ['Today', 'Tomorrow', 'In 3 Days', 'In 1 Week', 'In 2 Weeks', 'In 1 Month'];
        var daysAheadArr = [0, 1, 3, 7, 14, 30];
        var html = '';

        for (var i = 0; i < days.length; i++) {
            var dA = currentDaysAhead + daysAheadArr[i];
            var p = calcPrice(currentBase, dA, null, null);
            var pct = Math.round(((p - currentPrice) / currentPrice) * 100);
            var cls = pct > 3 ? 'up' : pct < -3 ? 'down' : 'same';
            var sign = pct > 0 ? '+' : '';
            var rec = pct > 8 ? 'Book later' : pct < -5 ? '🔥 Book now!' : 'Neutral';

            html += '<div class="pred-card">' +
                '<div class="pred-day">' + days[i] + '</div>' +
                '<div class="pred-price">₹' + p.toLocaleString('en-IN') + '</div>' +
                '<span class="pred-change ' + cls + '">' + sign + pct + '%</span>' +
                '<div class="pred-rec">' + rec + '</div>' +
                '</div>';
        }
        grid.innerHTML = html;
    }

    function setAlert() {
        var target = parseInt(document.getElementById('targetPrice').value);
        if (!target || target < 100) return;

        var alert = {
            id: Date.now(),
            route: routes[currentRoute].label,
            cabin: currentCabin,
            target: target,
            current: currentPrice
        };
        priceAlerts.push(alert);
        document.getElementById('targetPrice').value = '';
        renderAlerts();
        checkAlerts(currentPrice);
    }

    function removeAlert(id) {
        priceAlerts = priceAlerts.filter(function(a) { return a.id !== id; });
        renderAlerts();
    }

    function renderAlerts() {
        var container = document.getElementById('activeAlerts');
        if (priceAlerts.length === 0) { container.innerHTML = ''; return; }

        var html = '';
        for (var i = 0; i < priceAlerts.length; i++) {
            var a = priceAlerts[i];
            var met = a.current <= a.target;
            html += '<div class="alert-item">' +
                '<div class="alert-item-left">' + a.route + ' (' + a.cabin + ')</div>' +
                '<div class="alert-item-right">' +
                '<span class="alert-item-price">₹' + a.target.toLocaleString('en-IN') + '</span>' +
                (met ? '<span style="color:var(--green);font-size:12px;">✓ Target met!</span>' : '') +
                '<button class="alert-del" onclick="PricingEngine.removeAlert(' + a.id + ')">✕</button>' +
                '</div></div>';
        }
        container.innerHTML = html;
    }

    function checkAlerts(price) {
        for (var i = 0; i < priceAlerts.length; i++) {
            var a = priceAlerts[i];
            a.current = price;
            if (price <= a.target && typeof NotificationManager !== 'undefined') {
                NotificationManager.showToast({
                    title: '🔔 Price Alert Hit!',
                    message: a.route + ' is now ₹' + price.toLocaleString('en-IN'),
                    type: 'success'
                });
            }
        }
        renderAlerts();
    }

    window.addEventListener('DOMContentLoaded', init);
    window.addEventListener('resize', function() { if(chartCtx) drawChart(); });

    window.PricingEngine = { setAlert: setAlert, removeAlert: removeAlert };
})();
