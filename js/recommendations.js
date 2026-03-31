// recommendations.js
(function () {
    "use strict";

    var preferences = { style: ["beach"], budget: ["mid"], trip: ["solo"] };
    var feedbackHelpful = 0, feedbackNotHelpful = 0;
    var currentCat = "all";
    var votedCards = {};

    // Data pool
    var allItems = [
        { id: 1, type: "destinations", cat: "beach", name: "Goa, India", sub: "Sun, sand & nightlife", price: "₹8,500", priceNote: "per person 3N", rating: 4.7, reviews: 2847, emoji: "🏖️", badge: "Trending", why: ["You liked beaches", "Popular with solo travelers", "Budget-friendly for mid-range"] },
        { id: 2, type: "destinations", cat: "mountain", name: "Manali, Himachal", sub: "Snow peaks & adventure", price: "₹9,200", priceNote: "per person 4N", rating: 4.6, reviews: 1923, emoji: "🏔️", badge: "Adventure Pick", why: ["Top rated mountain destination", "Best in March-April", "Great for solo travelers"] },
        { id: 3, type: "destinations", cat: "heritage", name: "Rajasthan, India", sub: "Forts, palaces & culture", price: "₹11,000", priceNote: "per person 5N", rating: 4.8, reviews: 3201, emoji: "🏰", badge: "Heritage", why: ["Highly rated by historians", "Unique cultural experience", "Loved by couples & families"] },
        { id: 4, type: "destinations", cat: "nature", name: "Kerala Backwaters", sub: "Houseboat & jungle retreat", price: "₹10,500", priceNote: "per person 4N", rating: 4.9, reviews: 2104, emoji: "🌴", badge: "Nature's Best", why: ["Top nature destination in India", "Houseboat experience unique", "Great for mid-range budget"] },
        { id: 5, type: "destinations", cat: "city", name: "Singapore", sub: "Modern city & food paradise", price: "₹32,000", priceNote: "per person 5N", rating: 4.8, reviews: 4821, emoji: "🌆", badge: "International", why: ["Visa on arrival for Indians", "Affordable luxury", "Great street food"] },
        { id: 6, type: "destinations", cat: "beach", name: "Andaman Islands", sub: "Crystal waters & coral reefs", price: "₹14,000", priceNote: "per person 5N", rating: 4.9, reviews: 1547, emoji: "🏝️", badge: "Hidden Gem", why: ["Best beach destination in India", "Scuba diving paradise", "Low crowd vs Goa"] },
        { id: 7, type: "hotels", cat: "beach", name: "Taj Fort Aguada Resort", sub: "Goa · 5-Star Luxury", price: "₹12,500", priceNote: "/night", rating: 4.8, reviews: 892, emoji: "🏨", badge: "Luxury", why: ["Top-rated hotel in Goa", "Beachfront property", "Award-winning spa"] },
        { id: 8, type: "hotels", cat: "city", name: "ITC Maratha Mumbai", sub: "Mumbai · 5-Star Heritage", price: "₹9,800", priceNote: "/night", rating: 4.7, reviews: 1203, emoji: "🏩", badge: "Business", why: ["Close to airport", "Best business hotel Mumbai", "World-class dining"] },
        { id: 9, type: "hotels", cat: "mountain", name: "Span Resort & Spa", sub: "Manali · 4-Star", price: "₹5,500", priceNote: "/night", rating: 4.5, reviews: 634, emoji: "🏔️", badge: "Romance", why: ["River-facing rooms", "Best spa in Manali", "Perfect for couples"] },
        { id: 10, type: "hotels", cat: "beach", name: "Radisson Blu Goa", sub: "Cavelossim Beach · 5-Star", price: "₹7,200", priceNote: "/night", rating: 4.6, reviews: 1089, emoji: "🌊", badge: "Value", why: ["Direct beach access", "Great value for money", "Excellent breakfast included"] },
        { id: 11, type: "hotels", cat: "nature", name: "Kumarakom Lake Resort", sub: "Kerala · Heritage Luxury", price: "₹14,500", priceNote: "/night", rating: 4.9, reviews: 742, emoji: "🌿", badge: "Eco-Luxury", why: ["Voted best Kerala resort", "Private lake villas", "Award-winning Ayurveda"] },
        { id: 12, type: "flights", cat: "budget", name: "IndiGo: DEL → GOA", sub: "Non-stop · 2h 30m", price: "₹4,200", priceNote: "one way", rating: 4.3, reviews: 5621, emoji: "✈️", badge: "Best Price", why: ["Lowest fare today", "On-time performance 89%", "Popular route this season"] },
        { id: 13, type: "flights", cat: "mid", name: "Vistara: BOM → SIN", sub: "Non-stop · 5h 30m", price: "₹18,900", priceNote: "one way", rating: 4.7, reviews: 2341, emoji: "🛫", badge: "Premium", why: ["Best business class on route", "Free meals & entertainment", "High on-time rate"] },
        { id: 14, type: "flights", cat: "mid", name: "Air India: DEL → LHR", sub: "Non-stop · 9h", price: "₹38,500", priceNote: "one way", rating: 4.4, reviews: 1872, emoji: "🛩️", badge: "Non-stop", why: ["Only non-stop Delhi-London", "Full-service carrier", "Price dropped 12% today"] },
        { id: 15, type: "flights", cat: "budget", name: "SpiceJet: BLR → GOI", sub: "Non-stop · 1h 10m", price: "₹2,800", priceNote: "one way", rating: 4.1, reviews: 3204, emoji: "✈️", badge: "Flash Deal", why: ["Best price of the month", "Quick 70-min flight", "Great for weekend trips"] },
    ];

    function getMatchScore(item) {
        var score = 60;
        if (preferences.style.indexOf(item.cat) !== -1) score += 25;
        if (item.badge === "Trending" || item.badge === "Flash Deal") score += 10;
        if (item.rating >= 4.7) score += 5;
        return Math.min(99, score);
    }

    function buildCard(item) {
        var score = getMatchScore(item);
        var voted = votedCards[item.id];
        var whyList = item.why.map(function(w) { return '• ' + w; }).join('<br>');

        return '<div class="reco-card" data-id="' + item.id + '">' +
            '<div class="rc-image">' + item.emoji + '</div>' +
            '<div class="rc-badge">' + item.badge + '</div>' +
            '<div class="match-score">' + score + '% match</div>' +
            '<div class="rc-body">' +
            '  <div class="rc-type">' + item.type + '</div>' +
            '  <div class="rc-name">' + item.name + '</div>' +
            '  <div class="rc-sub">' + item.sub + '</div>' +
            '  <div class="rc-rating">★ ' + item.rating + ' <span>(' + item.reviews.toLocaleString() + ' reviews)</span></div>' +
            '  <div class="rc-price">' + item.price + ' <small>' + item.priceNote + '</small></div>' +
            '  <div class="rc-actions">' +
            '    <button class="rc-book-btn">Book Now</button>' +
            '    <button class="why-btn" onclick="RecoEngine.showWhy(event, ' + item.id + ')">💡 Why this?</button>' +
            '  </div>' +
            '</div>' +
            '<div class="rc-feedback">' +
            '  <button class="rc-fb-btn ' + (voted === 'helpful' ? 'voted-helpful' : '') + '" onclick="RecoEngine.vote(' + item.id + ',\'helpful\')">👍 Helpful</button>' +
            '  <button class="rc-fb-btn not-helpful ' + (voted === 'not' ? 'voted-not' : '') + '" onclick="RecoEngine.vote(' + item.id + ',\'not\')">👎 Not for me</button>' +
            '</div>' +
            '</div>';
    }

    function render() {
        var grid = document.getElementById('recoGrid');
        var items = allItems.filter(function(i) {
            if (currentCat === 'all') return true;
            if (currentCat === 'destinations') return i.type === 'destinations';
            if (currentCat === 'hotels') return i.type === 'hotels';
            if (currentCat === 'flights') return i.type === 'flights';
            return true;
        });

        // sort by match score
        items.sort(function(a, b) { return getMatchScore(b) - getMatchScore(a); });

        grid.innerHTML = items.map(buildCard).join('');
    }

    function showWhy(e, id) {
        e.stopPropagation();
        var item = allItems.find(function(i) { return i.id === id; });
        if (!item) return;
        var tooltip = document.getElementById('whyTooltip');
        tooltip.innerHTML = '<strong>💡 Why we recommend this</strong>' +
            item.why.map(function(w) { return '• ' + w; }).join('<br>');
        tooltip.classList.add('visible');
        var rect = e.target.getBoundingClientRect();
        tooltip.style.top = (rect.bottom + 10 + window.scrollY) + 'px';
        tooltip.style.left = Math.max(10, rect.left - 80) + 'px';
        setTimeout(function() { tooltip.classList.remove('visible'); }, 4000);
    }

    function vote(id, type) {
        if (votedCards[id]) return;
        votedCards[id] = type;
        if (type === 'helpful') {
            feedbackHelpful++;
        } else {
            feedbackNotHelpful++;
            // remove from future recs
            allItems = allItems.filter(function(i) { return i.id !== id; });
        }
        updateFeedbackStats();
        render();
    }

    function updateFeedbackStats() {
        document.getElementById('fsHelpful').textContent = feedbackHelpful;
        document.getElementById('fsNotHelpful').textContent = feedbackNotHelpful;
        var total = feedbackHelpful + feedbackNotHelpful;
        var acc = total > 0 ? Math.round((feedbackHelpful / total) * 100) : 0;
        document.getElementById('fsAccuracy').textContent = 'Accuracy: ' + acc + '%';
    }

    function init() {
        render();

        // tabs
        var tabs = document.querySelectorAll('.reco-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].addEventListener('click', function() {
                document.querySelectorAll('.reco-tab').forEach(function(t) { t.classList.remove('active'); });
                this.classList.add('active');
                currentCat = this.getAttribute('data-cat');
                render();
            });
        }

        // preference chips
        var chips = document.querySelectorAll('.pref-chip');
        for (var c = 0; c < chips.length; c++) {
            chips[c].addEventListener('click', function() {
                this.classList.toggle('active');
            });
        }

        // update prefs button
        document.getElementById('updatePrefBtn').addEventListener('click', function() {
            var activeChips = document.querySelectorAll('.pref-chip.active');
            preferences.style = [];
            activeChips.forEach(function(ch) {
                preferences.style.push(ch.getAttribute('data-val'));
            });
            render();
        });

        // close tooltip on click anywhere
        document.addEventListener('click', function(e) {
            if (!e.target.classList.contains('why-btn')) {
                document.getElementById('whyTooltip').classList.remove('visible');
            }
        });
    }

    window.addEventListener('DOMContentLoaded', init);
    window.RecoEngine = { showWhy: showWhy, vote: vote };
})();
