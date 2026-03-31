// hotels.js
(function () {
    "use strict";

    var allHotels = [
        { id: 1, name: "Taj Fort Aguada Resort & Spa", location: "Sinquerim Beach, Goa", stars: 5, rating: 4.8, reviews: 2341, price: 12500, emoji: "🏰", amenities: ["pool", "spa", "restaurant", "wifi", "beach", "gym"], type: "resort", avail: 2, tag: "Beachfront Luxury" },
        { id: 2, name: "Radisson Blu Resort Goa", location: "Cavelossim South, Goa", stars: 5, rating: 4.6, reviews: 1872, price: 7200, emoji: "🌊", amenities: ["pool", "wifi", "restaurant", "beach", "gym", "parking"], type: "resort", avail: 8, tag: "Sea View" },
        { id: 3, name: "The Park Calangute", location: "Calangute, Goa", stars: 4, rating: 4.3, reviews: 1124, price: 4500, emoji: "🏖️", amenities: ["pool", "wifi", "restaurant", "ac"], type: "boutique", avail: 14, tag: "Party Hub" },
        { id: 4, name: "Alila Diwa Goa", location: "Majorda Beach, Goa", stars: 5, rating: 4.9, reviews: 987, price: 9800, emoji: "🌴", amenities: ["pool", "spa", "restaurant", "wifi", "beach", "gym"], type: "resort", avail: 3, tag: "Most Loved" },
        { id: 5, name: "Zostel Goa", location: "Vagator, Goa", stars: 2, rating: 4.1, reviews: 3456, price: 800, emoji: "🎒", amenities: ["wifi", "ac"], type: "budget", avail: 22, tag: "Solo Traveler" },
        { id: 6, name: "Lemon Tree Amarante Beach", location: "Candolim, Goa", stars: 4, rating: 4.4, reviews: 2108, price: 5600, emoji: "🍋", amenities: ["pool", "wifi", "restaurant", "gym", "ac", "parking"], type: "resort", avail: 6, tag: "Value Pick" },
        { id: 7, name: "Heritage Resort Hampi", location: "Hampi, Karnataka", stars: 3, rating: 4.2, reviews: 876, price: 2800, emoji: "🏛️", amenities: ["wifi", "restaurant", "pool", "ac"], type: "boutique", avail: 11, tag: "Heritage" },
        { id: 8, name: "ITC Grand Chola Chennai", location: "Guindy, Chennai", stars: 5, rating: 4.7, reviews: 1432, price: 10500, emoji: "👑", amenities: ["pool", "spa", "restaurant", "wifi", "gym", "parking"], type: "resort", avail: 4, tag: "Grand Luxury" },
        { id: 9, name: "Span Resort & Spa Manali", location: "Kullu Valley, Manali", stars: 4, rating: 4.5, reviews: 634, price: 5500, emoji: "🏔️", amenities: ["spa", "restaurant", "wifi", "ac"], type: "resort", avail: 7, tag: "River-Facing" },
        { id: 10, name: "The Kumarakom Lake Resort", location: "Kumarakom, Kerala", stars: 5, rating: 4.9, reviews: 742, price: 14500, emoji: "🌿", amenities: ["pool", "spa", "restaurant", "wifi", "beach"], type: "resort", avail: 2, tag: "Eco-Luxury" },
        { id: 11, name: "OYO Townhouse Bangalore", location: "Koramangala, Bangalore", stars: 3, rating: 3.9, reviews: 5234, price: 1800, emoji: "🏠", amenities: ["wifi", "ac", "parking"], type: "budget", avail: 30, tag: "Budget Friendly" },
        { id: 12, name: "The Oberoi Udaivilas", location: "Udaipur, Rajasthan", stars: 5, rating: 4.9, reviews: 1102, price: 28000, emoji: "🦚", amenities: ["pool", "spa", "restaurant", "wifi", "gym"], type: "resort", avail: 1, tag: "Royal Stay" },
    ];

    var displayedHotels = allHotels.slice();
    var bookingHotel = null;

    function init() {
        renderHotels();
        document.getElementById('searchHotelBtn').addEventListener('click', searchHotels);
        document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
        document.getElementById('sortHotels').addEventListener('change', applySortOnly);
        document.getElementById('priceFilter').addEventListener('input', function() {
            document.getElementById('priceFilterVal').textContent = '₹' + parseInt(this.value).toLocaleString('en-IN');
        });
        document.getElementById('bookingModal').addEventListener('click', function(e) {
            if (e.target === this) closeBookingModal();
        });
    }

    function searchHotels() {
        var city = document.getElementById('hotelCity').value.toLowerCase().trim();
        displayedHotels = allHotels.filter(function(h) {
            return h.location.toLowerCase().includes(city) || h.name.toLowerCase().includes(city);
        });
        renderHotels();
    }

    function applyFilters() {
        var maxPrice = parseInt(document.getElementById('priceFilter').value);
        var checkedStars = [];
        document.querySelectorAll('.star-filter-group input:checked').forEach(function(cb) {
            checkedStars.push(parseInt(cb.value));
        });
        var checkedAmenities = [];
        document.querySelectorAll('#amenityFilters input:checked').forEach(function(cb) {
            checkedAmenities.push(cb.value);
        });

        displayedHotels = allHotels.filter(function(h) {
            if (h.price > maxPrice) return false;
            if (checkedStars.length && checkedStars.indexOf(h.stars) === -1) return false;
            if (checkedAmenities.length) {
                for (var i = 0; i < checkedAmenities.length; i++) {
                    if (h.amenities.indexOf(checkedAmenities[i]) === -1) return false;
                }
            }
            return true;
        });

        applySortOnly();
    }

    function applySortOnly() {
        var sort = document.getElementById('sortHotels').value;
        if (sort === 'price-low') displayedHotels.sort(function(a,b) { return a.price - b.price; });
        else if (sort === 'price-high') displayedHotels.sort(function(a,b) { return b.price - a.price; });
        else if (sort === 'rating') displayedHotels.sort(function(a,b) { return b.rating - a.rating; });
        else displayedHotels.sort(function(a,b) { return b.rating * b.reviews - a.rating * a.reviews; });
        renderHotels();
    }

    function starsStr(n) { return '⭐'.repeat(n); }

    function amenityLabel(a) {
        var map = { pool:'🏊 Pool', wifi:'📶 WiFi', spa:'💆 Spa', gym:'🏋️ Gym', restaurant:'🍽️ Restaurant', parking:'🚗 Parking', beach:'🏖️ Beach', ac:'❄️ AC' };
        return map[a] || a;
    }

    function renderHotels() {
        var grid = document.getElementById('hotelsGrid');
        var count = document.getElementById('resultsCount');
        count.textContent = 'Showing ' + displayedHotels.length + ' hotel' + (displayedHotels.length !== 1 ? 's' : '');

        if (displayedHotels.length === 0) {
            grid.innerHTML = '<div style="text-align:center;padding:60px;color:var(--muted)">No hotels match your criteria</div>';
            return;
        }

        grid.innerHTML = displayedHotels.map(function(h) {
            var availCls = h.avail <= 3 ? 'low' : 'good';
            var availTxt = h.avail <= 3 ? '🔥 Only ' + h.avail + ' left!' : '✓ ' + h.avail + ' rooms available';

            return '<div class="hotel-card">' +
                '<div class="hc-image">' + h.emoji + '</div>' +
                '<div class="hc-body">' +
                '  <div class="hc-header">' +
                '    <div>' +
                '      <div class="hc-name">' + h.name + '</div>' +
                '      <div class="hc-location">📍 ' + h.location + '</div>' +
                '    </div>' +
                '    <div style="text-align:right;flex-shrink:0">' +
                '      <div style="font-size:11px;background:var(--orange-dim);color:var(--orange);border:1px solid rgba(245,158,11,0.3);padding:3px 10px;border-radius:20px;font-weight:700">' + h.tag + '</div>' +
                '    </div>' +
                '  </div>' +
                '  <div class="hc-stars-row">' + starsStr(h.stars) + ' <span class="hc-rating">★ ' + h.rating + '</span> <span class="hc-review-cnt">(' + h.reviews.toLocaleString() + ' reviews)</span></div>' +
                '  <div class="hc-amenities">' + h.amenities.slice(0, 5).map(function(a) { return '<span class="amenity-tag">' + amenityLabel(a) + '</span>'; }).join('') + '</div>' +
                '  <div class="hc-footer">' +
                '    <div class="hc-price"><div class="hc-price-num">₹' + h.price.toLocaleString('en-IN') + '</div><div class="hc-price-note">per night</div></div>' +
                '    <div>' +
                '      <div class="hc-avail ' + availCls + '">' + availTxt + '</div>' +
                '      <button class="hc-book-btn" onclick="HotelEngine.openBooking(' + h.id + ')" style="margin-top:8px">Book Now →</button>' +
                '    </div>' +
                '  </div>' +
                '</div>' +
                '</div>';
        }).join('');
    }

    function openBooking(id) {
        bookingHotel = allHotels.find(function(h) { return h.id === id; });
        if (!bookingHotel) return;

        var ci = document.getElementById('checkIn').value;
        var co = document.getElementById('checkOut').value;
        var nights = 3;
        if (ci && co) {
            nights = Math.max(1, Math.round((new Date(co) - new Date(ci)) / (1000 * 60 * 60 * 24)));
        }

        var total = bookingHotel.price * nights;

        document.getElementById('bookingModalBox').innerHTML =
            '<div class="bm-title">📋 Complete Your Booking</div>' +
            '<div class="bm-hotel-name">' + bookingHotel.name + '</div>' +
            '<div class="bm-hotel-loc">📍 ' + bookingHotel.location + '</div>' +
            '<div class="bm-row">' +
            '  <div class="bm-field"><label>Full Name</label><input type="text" id="bm-name" placeholder="Your full name"></div>' +
            '  <div class="bm-field"><label>Email</label><input type="email" id="bm-email" placeholder="email@example.com"></div>' +
            '</div>' +
            '<div class="bm-row">' +
            '  <div class="bm-field"><label>Check-in</label><input type="date" id="bm-ci" value="' + (ci||'') + '"></div>' +
            '  <div class="bm-field"><label>Check-out</label><input type="date" id="bm-co" value="' + (co||'') + '"></div>' +
            '</div>' +
            '<div class="bm-row">' +
            '  <div class="bm-field"><label>Guests</label><select id="bm-guests"><option>1 Guest</option><option selected>2 Guests</option><option>3 Guests</option><option>4 Guests</option></select></div>' +
            '  <div class="bm-field"><label>Room Type</label><select id="bm-room"><option>Standard</option><option>Deluxe</option><option>Suite</option></select></div>' +
            '</div>' +
            '<div class="bm-total"><span>' + nights + ' night' + (nights>1?'s':'') + ' × ₹' + bookingHotel.price.toLocaleString('en-IN') + '</span><span>₹' + total.toLocaleString('en-IN') + '</span></div>' +
            '<div class="bm-actions">' +
            '  <button class="bm-confirm" onclick="HotelEngine.confirmBooking()">Confirm & Book</button>' +
            '  <button class="bm-cancel" onclick="HotelEngine.closeBooking()">Cancel</button>' +
            '</div>';

        document.getElementById('bookingModal').classList.add('active');
    }

    function confirmBooking() {
        var name = document.getElementById('bm-name').value.trim();
        var email = document.getElementById('bm-email').value.trim();
        if (!name || !email) { alert('Please fill in your name and email'); return; }

        document.getElementById('bookingModalBox').innerHTML =
            '<div class="bm-success">' +
            '  <div class="tick">✅</div>' +
            '  <h3>Booking Confirmed!</h3>' +
            '  <p>Your booking at <strong>' + bookingHotel.name + '</strong> is confirmed.<br>' +
            '  A confirmation has been sent to <strong>' + email + '</strong>.</p>' +
            '  <p style="margin-top:12px;font-family:monospace;color:var(--blue);font-size:18px;font-weight:700">' +
            '  Ref: TS-' + Math.floor(Math.random() * 900000 + 100000) + '</p>' +
            '  <button onclick="HotelEngine.closeBooking()" style="margin-top:20px;padding:10px 28px;background:linear-gradient(135deg,var(--blue),var(--purple));border:none;border-radius:10px;color:#0a0e1a;font-weight:700;cursor:pointer;font-size:14px">Done</button>' +
            '</div>';
    }

    function closeBookingModal() {
        document.getElementById('bookingModal').classList.remove('active');
    }

    window.addEventListener('DOMContentLoaded', init);
    window.HotelEngine = { openBooking: openBooking, confirmBooking: confirmBooking, closeBooking: closeBookingModal };
})();
