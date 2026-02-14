/**
 * GUY&AUGUST Valentine — behavior
 * - Nav: active tab based on visible section
 * - Lock page: toggle locked/unlocked (set unlocked = true when August arrives in USA)
 */

(function () {
  "use strict";

  /* --------------------------------------------------------------------------
     Lock page state
     Set to true when August arrives in the USA to reveal "next chapter"
     -------------------------------------------------------------------------- */
  let unlocked = false;

  const lockLockedEl = document.getElementById("lock-locked");
  const lockUnlockedEl = document.getElementById("lock-unlocked");

  function renderLockState() {
    if (!lockLockedEl || !lockUnlockedEl) return;
    if (unlocked) {
      lockLockedEl.setAttribute("aria-hidden", "true");
      lockLockedEl.hidden = true;
      lockUnlockedEl.setAttribute("aria-hidden", "false");
      lockUnlockedEl.hidden = false;
    } else {
      lockLockedEl.setAttribute("aria-hidden", "false");
      lockLockedEl.hidden = false;
      lockUnlockedEl.setAttribute("aria-hidden", "true");
      lockUnlockedEl.hidden = true;
    }
  }

  renderLockState();

  /* --------------------------------------------------------------------------
     Navigation: highlight active section
     -------------------------------------------------------------------------- */
  const navLinks = document.querySelectorAll(".nav-link[data-section]");
  const sections = [
    document.getElementById("home"),
    document.getElementById("memories"),
    document.getElementById("photobooth"),
    document.getElementById("lock"),
  ].filter(Boolean);

  function setActiveNav(sectionId) {
    navLinks.forEach(function (link) {
      const isActive = link.getAttribute("data-section") === sectionId;
      link.classList.toggle("is-active", isActive);
    });
  }

  function getVisibleSection() {
    const navHeight = 60;
    const viewportMid = window.scrollY + window.innerHeight * 0.4;

    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      const top = section.offsetTop - navHeight;
      const bottom = top + section.offsetHeight;
      if (viewportMid >= top && viewportMid <= bottom) {
        return section.id;
      }
    }
    return sections[0] ? sections[0].id : "home";
  }

  function onScrollOrResize() {
    setActiveNav(getVisibleSection());
  }

  // Update active tab on scroll/resize
  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);

  // Set active tab on load (e.g. if URL is #memories or #lock)
  const hash = window.location.hash.slice(1);
  if (hash && sections.some(function (s) { return s.id === hash; })) {
    setActiveNav(hash);
  } else {
    onScrollOrResize();
  }

  // When user clicks a nav link, active state is set by scroll when section comes into view
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      const sectionId = link.getAttribute("data-section");
      if (sectionId) setActiveNav(sectionId);
    });
  });

  /* --------------------------------------------------------------------------
     Frame adjust — double-click or double-tap photo to show position overlay
     -------------------------------------------------------------------------- */
  var frameOverlay = null;
  var frameOverlayPhoto = null;

  function openFrameOverlay(photoEl) {
    if (!photoEl) return;
    if (!frameOverlay) {
      var positions = [
        "top left", "top center", "top right",
        "center left", "center center", "center right",
        "bottom left", "bottom center", "bottom right"
      ];
      var labels = ["↖", "↑", "↗", "←", "●", "→", "↙", "↓", "↘"];
      var panel = document.createElement("div");
      panel.className = "memory-frame-overlay-panel";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", "Adjust frame position");
      positions.forEach(function (pos, i) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "frame-pos-btn";
        btn.setAttribute("data-pos", pos);
        btn.textContent = labels[i];
        btn.addEventListener("click", function () {
          if (frameOverlayPhoto) {
            frameOverlayPhoto.setAttribute("data-frame", pos);
            panel.querySelectorAll(".frame-pos-btn").forEach(function (b) {
              b.setAttribute("aria-pressed", b === btn ? "true" : "false");
            });
          }
          closeFrameOverlay();
        });
        panel.appendChild(btn);
      });
      frameOverlay = document.createElement("div");
      frameOverlay.className = "memory-frame-overlay";
      frameOverlay.setAttribute("aria-hidden", "true");
      frameOverlay.hidden = true;
      frameOverlay.appendChild(panel);
      frameOverlay.addEventListener("click", function (e) {
        if (e.target === frameOverlay) closeFrameOverlay();
      });
      document.body.appendChild(frameOverlay);
    }
    frameOverlayPhoto = photoEl;
    var currentPos = photoEl.getAttribute("data-frame") || "center center";
    frameOverlay.querySelectorAll(".frame-pos-btn").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-pos") === currentPos ? "true" : "false");
    });
    frameOverlay.setAttribute("aria-hidden", "false");
    frameOverlay.hidden = false;
  }

  function closeFrameOverlay() {
    if (frameOverlay) {
      frameOverlay.hidden = true;
      frameOverlay.setAttribute("aria-hidden", "true");
      frameOverlayPhoto = null;
    }
  }

  document.querySelectorAll(".memory-photo").forEach(function (photoEl) {
    photoEl.setAttribute("title", "Double-click to adjust frame");
    photoEl.addEventListener("dblclick", function (e) {
      e.preventDefault();
      openFrameOverlay(photoEl);
    });
    var lastTap = 0;
    photoEl.addEventListener("touchend", function (e) {
      var now = Date.now();
      if (now - lastTap < 400) {
        e.preventDefault();
        openFrameOverlay(photoEl);
        lastTap = 0;
      } else {
        lastTap = now;
      }
    }, { passive: false });
  });

  /* --------------------------------------------------------------------------
     Memory photo/video upload — button opens file picker, image or video shows in frame
     -------------------------------------------------------------------------- */
  document.querySelectorAll(".memory-photo-wrap").forEach(function (wrap) {
    var input = wrap.querySelector(".memory-upload-input");
    var btn = wrap.querySelector(".memory-upload-btn");
    var photoEl = wrap.querySelector(".memory-photo");
    if (!input || !btn || !photoEl) return;

    btn.addEventListener("click", function () {
      input.click();
    });

    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      if (!file) return;
      var isImage = file.type.startsWith("image/");
      var isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) return;

      var url = URL.createObjectURL(file);

      if (isImage) {
        var img = photoEl.querySelector("img");
        photoEl.querySelectorAll("video").forEach(function (v) { v.remove(); });
        if (!img) {
          img = document.createElement("img");
          img.alt = "Uploaded photo";
          photoEl.appendChild(img);
        }
        img.src = url;
      } else {
        photoEl.querySelectorAll("img").forEach(function (i) { i.remove(); });
        var video = photoEl.querySelector("video");
        if (!video) {
          video = document.createElement("video");
          video.controls = true;
          video.playsInline = true;
          video.preload = "metadata";
          photoEl.appendChild(video);
        }
        video.src = url;
      }

      input.value = "";
    });
  });

  /* --------------------------------------------------------------------------
     Photo Booth — camera capture, photos shown below buttons
     -------------------------------------------------------------------------- */
  (function () {
    var cameraEl = document.querySelector(".photobooth-camera");
    var video = document.getElementById("photobooth-video");
    var placeholder = document.getElementById("photobooth-placeholder");
    var startBtn = document.getElementById("photobooth-start");
    var captureBtn = document.getElementById("photobooth-capture");
    var gallery = document.getElementById("photobooth-gallery");
    var stream = null;

    function setLive(live) {
      if (cameraEl) cameraEl.classList.toggle("is-live", !!live);
      if (captureBtn) captureBtn.disabled = !live;
      if (startBtn) startBtn.textContent = live ? "Stop camera" : "Start camera";
      if (placeholder && !live) placeholder.textContent = "Allow camera to start";
    }

    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach(function (t) { t.stop(); });
        stream = null;
      }
      if (video) video.srcObject = null;
      setLive(false);
    }

    if (startBtn) {
      startBtn.addEventListener("click", function () {
        if (stream) {
          stopCamera();
          return;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          placeholder.textContent = "Camera not supported";
          return;
        }
        placeholder.textContent = "Starting…";
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
          .then(function (s) {
            stream = s;
            if (!video || !cameraEl) return;
            video.srcObject = s;
            cameraEl.classList.add("is-live");
            if (captureBtn) captureBtn.disabled = false;
            if (startBtn) startBtn.textContent = "Stop camera";
            video.play().catch(function () {});
          })
          .catch(function () {
            placeholder.textContent = "Camera access denied";
          });
      });
    }

    if (captureBtn) {
      captureBtn.addEventListener("click", function () {
        if (!video || !stream || !gallery) return;
        var canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        var ctx = canvas.getContext("2d");
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        var img = document.createElement("img");
        img.src = canvas.toDataURL("image/png");
        img.alt = "Photo Booth capture";
        img.className = "photobooth-captured-img";
        var wrap = document.createElement("div");
        wrap.className = "photobooth-captured-wrap";
        var delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "photobooth-delete-btn";
        delBtn.innerHTML = "&times;";
        delBtn.title = "Delete photo";
        delBtn.setAttribute("aria-label", "Delete photo");
        delBtn.addEventListener("click", function () { wrap.remove(); });
        wrap.appendChild(img);
        wrap.appendChild(delBtn);
        gallery.appendChild(wrap);
      });
    }
  })();
})();
