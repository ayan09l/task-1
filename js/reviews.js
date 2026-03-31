// reviews.js
(function () {
    "use strict";

    var ratingVal = 0;
    var uploadedPhotos = [];

    // Seed reviews
    var reviews = [
        { id: 1, type: "hotel", subject: "Taj Fort Aguada Resort, Goa", reviewer: "Priya Sharma", date: "March 28, 2026", rating: 5, title: "Absolutely magical experience!", body: "The resort is breathtaking. Woke up to the sound of waves every morning. The service is impeccable — staff remembered my name by day 2. The infinity pool overlooking the sea is something else. Will definitely be back.", helpful: 42, notHelpful: 2, flagged: false, photos: ["🏖️", "🌊", "🏊"], replies: [{ author: "Hotel Response", text: "Thank you Priya! We loved having you with us. See you next time! 💙" }] },
        { id: 2, type: "flight", subject: "IndiGo 6E269 — Delhi to Mumbai", reviewer: "Rahul Verma", date: "March 25, 2026", rating: 4, title: "Smooth flight, slightly delayed", body: "Flight was delayed by 25 minutes due to traffic congestion but they communicated it clearly. In-flight experience was good, seats were comfortable for a 2-hour journey. Crew was friendly and professional.", helpful: 28, notHelpful: 5, flagged: false, photos: [], replies: [] },
        { id: 3, type: "destination", subject: "Kerala Backwaters", reviewer: "Anjali Nair", date: "March 20, 2026", rating: 5, title: "Best trip of my life!", body: "Spent 3 nights on a houseboat in Alleppey. The sunsets on the backwaters, the fresh fish curry, the silence at night — absolutely unreal. This is the kind of travel that changes how you see the world. Highly recommend solo travelers to try this.", helpful: 67, notHelpful: 1, flagged: false, photos: ["🌴", "🚣", "🌅"], replies: [] },
        { id: 4, type: "hotel", subject: "ITC Maratha Mumbai", reviewer: "Karan Mehta", date: "March 18, 2026", rating: 3, title: "Good hotel but overpriced", body: "The hotel is definitely 5-star quality but given the price I was expecting slightly better. Breakfast was amazing though. Location near the airport is perfect if you have an early flight. Room service was a bit slow.", helpful: 19, notHelpful: 8, flagged: false, photos: [], replies: [{ author: "Hotel Response", text: "Thank you for your feedback Karan. We'll work on improving our room service response times." }] },
        { id: 5, type: "flight", subject: "Vistara UK3404 — Delhi to Bangalore", reviewer: "Sunita Patel", date: "March 15, 2026", rating: 5, title: "Premium experience at reasonable price", body: "Flew business class on Vistara for the first time. The difference from economy is night and day. Complimentary meal was restaurant quality. Staff service was warm and genuinely attentive, not the robotic kind. Totally worth it.", helpful: 54, notHelpful: 3, flagged: false, photos: ["🍽️", "💺"], replies: [] },
        { id: 6, type: "destination", subject: "Manali, Himachal Pradesh", reviewer: "Vikram Singh", date: "March 10, 2026", rating: 4, title: "Snow, mountains & adventure — perfect!", body: "Visited in early March, snow was perfect. Did the Hadimba Temple trek, tried paragliding at Solang Valley. Super affordable compared to other hill stations. Only downside is the traffic on the way back. Book return trip well in advance.", helpful: 31, notHelpful: 4, flagged: false, photos: ["🏔️", "🎿"], replies: [] },
    ];

    var filteredReviews = reviews.slice();
    var currentSort = "newest";
    var currentTypeFilter = "all";
    var currentStarFilter = "all";

    function init() {
        setupStarInput();
        setupPhotoUpload();
        setupFilterSort();
        document.getElementById('submitReviewBtn').addEventListener('click', submitReview);
        renderStats();
        renderReviews();
    }

    function setupStarInput() {
        var stars = document.querySelectorAll('.star-btn');
        stars.forEach(function(s) {
            s.addEventListener('click', function() {
                ratingVal = parseInt(this.getAttribute('data-val'));
                document.getElementById('ratingVal').value = ratingVal;
                stars.forEach(function(st) {
                    st.classList.toggle('active', parseInt(st.getAttribute('data-val')) <= ratingVal);
                });
            });
            s.addEventListener('mouseover', function() {
                var hov = parseInt(this.getAttribute('data-val'));
                stars.forEach(function(st) {
                    st.classList.toggle('active', parseInt(st.getAttribute('data-val')) <= hov);
                });
            });
            s.addEventListener('mouseout', function() {
                stars.forEach(function(st) {
                    st.classList.toggle('active', parseInt(st.getAttribute('data-val')) <= ratingVal);
                });
            });
        });
    }

    function setupPhotoUpload() {
        document.getElementById('photoInput').addEventListener('change', function(e) {
            var files = e.target.files;
            var previews = document.getElementById('photoPreviews');
            for (var i = 0; i < files.length; i++) {
                var f = files[i];
                (function(file) {
                    var reader = new FileReader();
                    reader.onload = function(ev) {
                        uploadedPhotos.push(ev.target.result);
                        var img = document.createElement('img');
                        img.src = ev.target.result;
                        img.className = 'photo-preview';
                        previews.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                })(f);
            }
        });
    }

    function setupFilterSort() {
        document.getElementById('filterType').addEventListener('change', function() {
            currentTypeFilter = this.value;
            applyFilters();
        });
        document.getElementById('filterStar').addEventListener('change', function() {
            currentStarFilter = this.value;
            applyFilters();
        });
        document.getElementById('sortReviews').addEventListener('change', function() {
            currentSort = this.value;
            applyFilters();
        });
    }

    function applyFilters() {
        filteredReviews = reviews.filter(function(r) {
            if (currentTypeFilter !== 'all' && r.type !== currentTypeFilter) return false;
            if (currentStarFilter !== 'all' && r.rating !== parseInt(currentStarFilter)) return false;
            return true;
        });

        if (currentSort === 'newest') filteredReviews.sort(function(a,b) { return b.id - a.id; });
        else if (currentSort === 'helpful') filteredReviews.sort(function(a,b) { return b.helpful - a.helpful; });
        else if (currentSort === 'highest') filteredReviews.sort(function(a,b) { return b.rating - a.rating; });
        else if (currentSort === 'lowest') filteredReviews.sort(function(a,b) { return a.rating - b.rating; });

        renderReviews();
        renderStats();
    }

    function submitReview() {
        var type = document.getElementById('reviewType').value;
        var subject = document.getElementById('reviewSubject').value.trim();
        var name = document.getElementById('reviewerName').value.trim();
        var title = document.getElementById('reviewTitle').value.trim();
        var body = document.getElementById('reviewBody').value.trim();
        var rating = parseInt(document.getElementById('ratingVal').value);

        if (!subject || !name || !title || !body) { alert('Please fill in all fields'); return; }
        if (!rating) { alert('Please select a rating'); return; }

        var newReview = {
            id: Date.now(),
            type: type,
            subject: subject,
            reviewer: name,
            date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
            rating: rating,
            title: title,
            body: body,
            helpful: 0,
            notHelpful: 0,
            flagged: false,
            photos: uploadedPhotos.slice(),
            replies: []
        };

        reviews.unshift(newReview);
        uploadedPhotos = [];
        document.getElementById('photoPreviews').innerHTML = '';
        ratingVal = 0;
        document.getElementById('ratingVal').value = 0;
        document.querySelectorAll('.star-btn').forEach(function(s) { s.classList.remove('active'); });
        ['reviewSubject','reviewerName','reviewTitle','reviewBody'].forEach(function(id) {
            document.getElementById(id).value = '';
        });

        applyFilters();
        window.scrollTo({ top: document.getElementById('reviewsList').offsetTop - 80, behavior: 'smooth' });
    }

    function markHelpful(id) {
        var r = reviews.find(function(r) { return r.id === id; });
        if (r) { r.helpful++; renderReviews(); }
    }

    function flagReview(id) {
        var r = reviews.find(function(r) { return r.id === id; });
        if (r) { r.flagged = !r.flagged; renderReviews(); }
    }

    function addReply(id) {
        var input = document.getElementById('reply-input-' + id);
        var text = input ? input.value.trim() : '';
        if (!text) return;
        var r = reviews.find(function(rv) { return rv.id === id; });
        if (r) {
            r.replies.push({ author: 'You', text: text });
            renderReviews();
        }
    }

    function renderStats() {
        var container = document.getElementById('overallStats');
        var total = filteredReviews.length;
        document.getElementById('reviewTotalCount').textContent = total;

        if (total === 0) { container.innerHTML = ''; return; }

        var avg = (filteredReviews.reduce(function(s, r) { return s + r.rating; }, 0) / total).toFixed(1);
        var stars = ['5', '4', '3', '2', '1'];
        var starStars = '★'.repeat(Math.round(parseFloat(avg))) + '☆'.repeat(5 - Math.round(parseFloat(avg)));

        var barsHtml = stars.map(function(s) {
            var cnt = filteredReviews.filter(function(r) { return r.rating === parseInt(s); }).length;
            var pct = total > 0 ? (cnt / total) * 100 : 0;
            return '<div class="os-bar-row"><div class="os-bar-label">' + s + ' ★</div>' +
                '<div class="os-bar-track"><div class="os-bar-fill" style="width:' + pct.toFixed(0) + '%"></div></div>' +
                '<div class="os-bar-cnt">' + cnt + '</div></div>';
        }).join('');

        container.innerHTML =
            '<div class="os-score">' +
            '  <div class="os-score-num">' + avg + '</div>' +
            '  <div class="os-score-stars">' + '★'.repeat(Math.round(parseFloat(avg))) + '</div>' +
            '  <div class="os-score-count">' + total + ' reviews</div>' +
            '</div>' +
            '<div class="os-bars">' + barsHtml + '</div>';
    }

    function starsHtml(n) {
        var s = '';
        for (var i = 1; i <= 5; i++) s += (i <= n ? '★' : '☆');
        return s;
    }

    function renderReviews() {
        var list = document.getElementById('reviewsList');
        if (filteredReviews.length === 0) {
            list.innerHTML = '<div style="text-align:center;padding:60px;color:var(--muted)">No reviews match your filters</div>';
            return;
        }

        var html = filteredReviews.map(function(r) {
            var photosHtml = r.photos.map(function(p) {
                if (p.startsWith('data:')) return '<img class="rc-photo" src="' + p + '" alt="photo">';
                return '<div class="rc-photo">' + p + '</div>';
            }).join('');

            var repliesHtml = r.replies.map(function(rep) {
                return '<div class="reply-item"><strong>' + rep.author + ':</strong> ' + rep.text + '</div>';
            }).join('');

            return '<div class="review-card' + (r.flagged ? ' flagged' : '') + '" id="rc-' + r.id + '">' +
                '<div class="rc-header">' +
                '  <div class="rc-user">' +
                '    <div class="rc-avatar">' + r.reviewer.charAt(0) + '</div>' +
                '    <div class="rc-user-info"><div class="rc-name">' + r.reviewer + '</div><div class="rc-date">' + r.date + '</div></div>' +
                '  </div>' +
                '  <div class="rc-stars-badge">' +
                '    <span class="rc-stars">' + starsHtml(r.rating) + '</span>' +
                '    <span class="rc-type-tag">' + r.type + '</span>' +
                '  </div>' +
                '</div>' +
                '<div class="rc-subject">' + r.subject + '</div>' +
                '<div class="rc-body-text">' + (r.flagged ? '<em>[Flagged for review]</em>' : r.body) + '</div>' +
                (photosHtml ? '<div class="rc-photos">' + photosHtml + '</div>' : '') +
                '<div class="rc-actions-row">' +
                '  <button class="rc-action-btn" onclick="ReviewsEngine.helpful(' + r.id + ')">👍 Helpful <span class="helpful-count">(' + r.helpful + ')</span></button>' +
                '  <button class="rc-action-btn" onclick="ReviewsEngine.toggleReply(' + r.id + ')">💬 Reply</button>' +
                '  <button class="rc-action-btn flag-btn" onclick="ReviewsEngine.flag(' + r.id + ')">' + (r.flagged ? '🚩 Unflag' : '🚩 Flag') + '</button>' +
                '</div>' +
                '<div class="reply-area" id="reply-area-' + r.id + '" style="display:none">' +
                '  <div class="reply-form">' +
                '    <input class="reply-input" id="reply-input-' + r.id + '" placeholder="Write a reply...">' +
                '    <button class="reply-submit" onclick="ReviewsEngine.addReply(' + r.id + ')">Reply</button>' +
                '  </div>' +
                (repliesHtml ? '<div class="existing-replies">' + repliesHtml + '</div>' : '') +
                '</div>' +
                '</div>';
        }).join('');

        list.innerHTML = html;
        renderStats();
    }

    function toggleReply(id) {
        var area = document.getElementById('reply-area-' + id);
        if (area) area.style.display = area.style.display === 'none' ? 'block' : 'none';
    }

    window.addEventListener('DOMContentLoaded', init);
    window.ReviewsEngine = { helpful: markHelpful, flag: flagReview, addReply: addReply, toggleReply: toggleReply };
})();
