// notifications.js - Notification Manager
// handles browser push notifications and in-app toast alerts

(function () {
    "use strict";

    var notifPermission = "default"; // default, granted, denied
    var toastContainer = null;
    var toastCount = 0;
    var MAX_TOASTS = 5;

    // notification sound - we'll use a short beep via AudioContext
    var audioCtx = null;

    function playNotifSound() {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            var oscillator = audioCtx.createOscillator();
            var gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.frequency.value = 880;
            oscillator.type = "sine";
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.3);
        } catch (e) {
            // audio not supported, ignore
        }
    }

    // set up toast container
    function initToastContainer() {
        if (toastContainer) return;
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        document.body.appendChild(toastContainer);
    }

    // request browser notification permission
    function requestPermission() {
        if (!("Notification" in window)) {
            console.log("Browser doesn't support notifications");
            notifPermission = "denied";
            return;
        }

        if (Notification.permission === "granted") {
            notifPermission = "granted";
            return;
        }

        if (Notification.permission !== "denied") {
            Notification.requestPermission().then(function (perm) {
                notifPermission = perm;
            });
        }
    }

    // send browser notification
    function sendBrowserNotif(title, body, tag) {
        if (notifPermission !== "granted") return;

        try {
            var notif = new Notification(title, {
                body: body,
                icon: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%231a1a2e" width="100" height="100" rx="15"/><text x="50" y="65" text-anchor="middle" fill="%2300d4ff" font-size="50">✈</text></svg>'),
                tag: tag || "flight-update-" + Date.now(),
                requireInteraction: false
            });

            // auto-close after 6 seconds
            setTimeout(function () {
                notif.close();
            }, 6000);
        } catch (e) {
            console.log("Notification error:", e);
        }
    }

    // show in-app toast notification
    function showToast(options) {
        initToastContainer();

        // options: { title, message, type, duration }
        // type: info, success, warning, danger, update
        var type = options.type || "info";
        var duration = options.duration || 5000;

        var toast = document.createElement("div");
        toast.className = "toast-notification toast-" + type;
        toastCount++;
        toast.id = "toast-" + toastCount;

        // icon based on type
        var icon;
        switch (type) {
            case "danger":
            case "warning":
                icon = "⚠";
                break;
            case "success":
                icon = "✓";
                break;
            case "update":
                icon = "↻";
                break;
            default:
                icon = "✈";
        }

        toast.innerHTML =
            '<div class="toast-icon">' + icon + '</div>' +
            '<div class="toast-content">' +
            '<div class="toast-title">' + (options.title || "Update") + '</div>' +
            '<div class="toast-message">' + (options.message || "") + '</div>' +
            '</div>' +
            '<button class="toast-close" onclick="this.parentElement.classList.add(\'toast-exit\')">&times;</button>';

        // add to container
        toastContainer.appendChild(toast);

        // trigger enter animation
        requestAnimationFrame(function () {
            toast.classList.add("toast-enter");
        });

        // play sound
        playNotifSound();

        // auto remove after duration
        setTimeout(function () {
            toast.classList.add("toast-exit");
            setTimeout(function () {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 400);
        }, duration);

        // limit number of toasts on screen
        var allToasts = toastContainer.querySelectorAll(".toast-notification");
        if (allToasts.length > MAX_TOASTS) {
            var oldest = allToasts[0];
            oldest.classList.add("toast-exit");
            setTimeout(function () {
                if (oldest.parentNode) oldest.parentNode.removeChild(oldest);
            }, 400);
        }
    }

    // combined notification - sends both browser + toast
    function notify(options) {
        // always show toast
        showToast(options);

        // also try browser notification if permitted
        sendBrowserNotif(
            options.title || "Flight Update",
            options.message || "",
            options.tag
        );
    }

    // map update types to notification styles
    function notifyFlightUpdate(update) {
        var typeMap = {
            "delay": "danger",
            "delay_extended": "warning",
            "status_change": "info",
            "eta_update": "update",
            "gate_change": "warning"
        };

        var toastType = typeMap[update.type] || "info";

        // special: landed is success
        if (update.flight && update.flight.status === "Landed") {
            toastType = "success";
        }

        notify({
            title: update.message,
            message: update.detail || "",
            type: toastType,
            tag: "flight-" + (update.flight ? update.flight.id : Date.now())
        });
    }

    // ========== EXPORT ==========

    window.NotificationManager = {
        requestPermission: requestPermission,
        showToast: showToast,
        notify: notify,
        notifyFlightUpdate: notifyFlightUpdate,
        sendBrowserNotif: sendBrowserNotif
    };

})();
