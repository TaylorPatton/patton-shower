/* Newspaper Flipbook
   - Drag/swipe to flip pages
   - Tap left/right edge or buttons
   - Keyboard navigation (Arrow keys, PageUp/PageDown, Space)
*/

(() => {
  // Stabilize viewport sizing across browsers (desktop + mobile address bars)
  const setVh = () => {
    document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
  };
  setVh();
  window.addEventListener("resize", setVh);

  const pages = [
    { src: "assets/pages/page-1.jpg", label: "Page 1" },
    { src: "assets/pages/page-2.jpg", label: "Page 2" },
    { src: "assets/pages/page-3.jpg", label: "Page 3" },
    { src: "assets/pages/page-4.jpg", label: "Page 4" },
  ];

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const flipbook = document.getElementById("flipbook");
  const shell = flipbook.closest(".flipbook-shell");
  // Match the flipbook aspect ratio to the real page images (prevents subtle cropping/letterboxing).
  const probe = new Image();
  probe.onload = () => {
    flipbook.style.aspectRatio = `${probe.naturalWidth} / ${probe.naturalHeight}`;
  };
  probe.src = pages[0].src;

  const runCoachHint = () => {
    const key = "db_coach_seen";
    try {
      if (localStorage.getItem(key)) return;
      flipbook.classList.add("coach");
      setTimeout(() => {
        flipbook.classList.remove("coach");
      }, 1200);
      localStorage.setItem(key, "1");
    } catch (_err) {
      // Ignore storage restrictions; fail gracefully without persistent state.
      flipbook.classList.add("coach");
      setTimeout(() => {
        flipbook.classList.remove("coach");
      }, 1200);
    }
  };

  const base = document.getElementById("base");
  const sheet = document.getElementById("sheet");
  const front = document.getElementById("front");
  const back = document.getElementById("back");
  const indicator = document.getElementById("indicator");

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const tapPrev = document.getElementById("tapPrev");
  const tapNext = document.getElementById("tapNext");
  const dotsEl = document.querySelector(".dots");
  const dots = Array.from(document.querySelectorAll(".dot"));
  const helpBtn = document.getElementById("helpBtn");
  const helpPop = document.getElementById("helpPop");

  // Lightbox elements (optional; only active if markup exists)
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");
  const lightboxScroller = document.getElementById("lightboxScroller");

  let lightboxOpen = false;
  let helpOpen = false;

  const closeHelp = () => {
    if (!helpPop) return;
    helpOpen = false;
    helpPop.hidden = true;
  };

  const toggleHelp = () => {
    if (!helpPop) return;
    helpOpen = !helpOpen;
    helpPop.hidden = !helpOpen;
  };

  const syncLightbox = () => {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = pages[index].src;
    lightboxImg.alt = pages[index].label;
    if (lightboxTitle) lightboxTitle.textContent = `Page ${index + 1} of ${pages.length}`;
    if (lightboxPrev) lightboxPrev.disabled = !canFlipPrev();
    if (lightboxNext) lightboxNext.disabled = !canFlipNext();
  };

  const openLightbox = () => {
    if (!lightbox) return;
    if (lightboxOpen) return;
    lightboxOpen = true;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    if (lightboxScroller) {
      lightboxScroller.classList.remove("is-zoomed");
      lightboxScroller.scrollTo(0, 0);
    }
    syncLightbox();
    lightboxClose?.focus?.({ preventScroll: true });
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightboxOpen = false;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    if (lightboxScroller) lightboxScroller.classList.remove("is-zoomed");
  };

  const toggleLightboxZoom = () => {
    if (!lightboxOpen || !lightboxScroller) return;
    const willZoom = !lightboxScroller.classList.contains("is-zoomed");
    lightboxScroller.classList.toggle("is-zoomed");
    if (!willZoom) lightboxScroller.scrollTo(0, 0);
  };

  const setPageInstant = (target) => {
    const t = Number(target);
    if (Number.isNaN(t)) return;
    const clamped = clamp(t, 0, pages.length - 1);
    if (clamped === index) return;
    index = clamped;
    renderIdle();
  };

  // Lightbox gesture support (swipe pages, double tap zoom)
  let lbGesture = { active: false, startX: 0, startY: 0, lastTapTs: 0, lastTapX: 0, lastTapY: 0 };
  const onLightboxPointerDown = (e) => {
    if (!lightboxOpen) return;
    lbGesture.active = true;
    lbGesture.startX = e.clientX;
    lbGesture.startY = e.clientY;
  };
  const onLightboxPointerUp = (e) => {
    if (!lightboxOpen) return;
    if (!lbGesture.active) return;
    lbGesture.active = false;

    const dx = e.clientX - lbGesture.startX;
    const dy = e.clientY - lbGesture.startY;

    // Swipe pages (disabled when zoomed)
    if (lightboxScroller && !lightboxScroller.classList.contains("is-zoomed")) {
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        lbGesture.lastTapTs = 0;
        if (dx < 0) setPageInstant(index + 1);
        else setPageInstant(index - 1);
        return;
      }
    }

    // Double tap zoom (touch)
    if (e.pointerType && e.pointerType !== "mouse") {
      const now = Date.now();
      const ddx = Math.abs(e.clientX - lbGesture.lastTapX);
      const ddy = Math.abs(e.clientY - lbGesture.lastTapY);
      const isTap = Math.abs(dx) < 10 && Math.abs(dy) < 10;
      if (isTap && lbGesture.lastTapTs && (now - lbGesture.lastTapTs) < 320 && ddx < 18 && ddy < 18) {
        lbGesture.lastTapTs = 0;
        toggleLightboxZoom();
        return;
      }
      if (isTap) {
        lbGesture.lastTapTs = now;
        lbGesture.lastTapX = e.clientX;
        lbGesture.lastTapY = e.clientY;
      }
    }
  };

  let index = 0;
  let isAnimating = false;
  let currentAngle = 0;
  let animToken = 0;

  let drag = {
    active: false,
    pointerId: null,
    startX: 0,
    lastX: 0,
    direction: null, // "next" | "prev"
    progress: 0,
  };
  let centerTap = { lastTapTs: 0, lastTapX: 0, lastTapY: 0 };
  const resetCenterTap = () => {
    centerTap.lastTapTs = 0;
  };
  const syncShellEdges = () => {
    if (!shell) return;
    shell.classList.toggle("edge-left", flipbook.classList.contains("edge-left"));
    shell.classList.toggle("edge-right", flipbook.classList.contains("edge-right"));
  };
  const clearEdgeHints = () => {
    flipbook.classList.remove("edge-left", "edge-right");
    syncShellEdges();
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const canFlipNext = () => index < pages.length - 1;
  const canFlipPrev = () => index > 0;

  const setBg = (el, src) => {
    el.style.backgroundImage = `url("${src}")`;
  };

  const setLighting = (progress) => {
    const p = clamp(progress, 0, 1);
    const mid = 1 - Math.abs(p - 0.5) * 2;
    const shade = clamp(p * 0.55, 0, 0.55);
    const shade2 = clamp((1 - p) * 0.25, 0, 0.25);
    const hinge = clamp(mid * 0.22, 0, 0.22);
    const glint = clamp(mid * 0.16, 0, 0.16);
    const cast = clamp(mid * 0.18, 0, 0.18);
    const liftShadow = clamp(mid * 0.22, 0, 0.22);
    flipbook.style.setProperty("--shade", shade.toFixed(3));
    flipbook.style.setProperty("--shade2", shade2.toFixed(3));
    flipbook.style.setProperty("--hinge", hinge.toFixed(3));
    flipbook.style.setProperty("--glint", glint.toFixed(3));
    flipbook.style.setProperty("--cast", cast.toFixed(3));
    flipbook.style.setProperty("--liftShadow", liftShadow.toFixed(3));
  };

  const setSheetTransform = (angle, opts = {}) => {
    const tiltX = opts.tiltX ?? 0;
    const tiltZ = opts.tiltZ ?? 0;
    const liftPx = opts.liftPx ?? 0;
    currentAngle = angle;
    sheet.style.transform = `translateZ(${liftPx.toFixed(3)}px) rotateX(${tiltX.toFixed(3)}deg) rotateZ(${tiltZ.toFixed(3)}deg) rotateY(${angle.toFixed(3)}deg)`;
  };

  const setDots = () => {
    dots.forEach((d) => d.setAttribute("aria-selected", "false"));
    const active = dots[index];
    if (active) active.setAttribute("aria-selected", "true");
  };

  const setRailPreview = (targetIndex) => {
    const clamped = clamp(targetIndex, 0, pages.length - 1);
    indicator.textContent = `${clamped + 1} / ${pages.length}`;
    const progress = pages.length === 1 ? 0 : clamped / (pages.length - 1);
    dotsEl?.style.setProperty("--p", progress.toFixed(4));
    dots.forEach((d) => d.setAttribute("aria-selected", "false"));
    const active = dots[clamped];
    if (active) active.setAttribute("aria-selected", "true");
  };

  const updateUI = () => {
    indicator.textContent = `${index + 1} / ${pages.length}`;
    prevBtn.disabled = !canFlipPrev();
    nextBtn.disabled = !canFlipNext();
    shell?.classList.toggle("can-prev", canFlipPrev());
    shell?.classList.toggle("can-next", canFlipNext());
    const stackProgress = pages.length > 1 ? index / (pages.length - 1) : 0;
    const progress = pages.length === 1 ? 0 : index / (pages.length - 1);
    flipbook.style.setProperty("--stackProgress", stackProgress.toFixed(3));
    dotsEl?.style.setProperty("--p", progress.toFixed(4));
    setDots();
    if (lightboxOpen) syncLightbox();
  };

  const renderIdle = () => {
    flipbook.classList.remove("dir-next", "dir-prev");
    setSheetTransform(0);
    sheet.style.transformOrigin = "50% 50%";
    setLighting(0);

    setBg(base, pages[index].src);
    setBg(front, pages[index].src);

    // Preload neighbors to make flips feel instant
    const nextIdx = canFlipNext() ? index + 1 : index;
    const prevIdx = canFlipPrev() ? index - 1 : index;
    setBg(back, pages[nextIdx].src);

    // Warm up cache
    [nextIdx, prevIdx].forEach((i) => {
      const img = new Image();
      img.src = pages[i].src;
    });

    updateUI();
  };

  const prepareFlip = (direction) => {
    // Base shows the target page behind the flipping sheet
    if (direction === "next") {
      if (!canFlipNext()) return false;
      flipbook.classList.add("dir-next");
      flipbook.classList.remove("dir-prev");

      sheet.style.transformOrigin = "0% 50%"; // hinge on left
      setBg(front, pages[index].src);
      setBg(back, pages[index + 1].src);
      setBg(base, pages[index + 1].src);
      return true;
    }

    if (direction === "prev") {
      if (!canFlipPrev()) return false;
      flipbook.classList.add("dir-prev");
      flipbook.classList.remove("dir-next");

      sheet.style.transformOrigin = "100% 50%"; // hinge on right
      setBg(front, pages[index].src);
      setBg(back, pages[index - 1].src);
      setBg(base, pages[index - 1].src);
      return true;
    }

    return false;
  };

  const finishFlip = (direction) => {
    if (direction === "next") index = Math.min(pages.length - 1, index + 1);
    if (direction === "prev") index = Math.max(0, index - 1);
    renderIdle();
  };

  const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

  const animateAngleTo = (targetAngle, ms, onDone) => {
    const token = ++animToken;
    const startAngle = currentAngle;
    const startTs = performance.now();
    isAnimating = true;

    const tick = (now) => {
      if (token !== animToken) return;
      const elapsed = now - startTs;
      const t = ms <= 0 ? 1 : clamp(elapsed / ms, 0, 1);
      const eased = easeOutQuint(t);
      const angle = startAngle + (targetAngle - startAngle) * eased;
      setSheetTransform(angle);
      setLighting(Math.abs(angle) / 180);

      if (t < 1) {
        requestAnimationFrame(tick);
        return;
      }

      onDone?.();
    };

    requestAnimationFrame(tick);
  };

  const animateWithSettle = (targetAngle, direction, ms, onDone) => {
    const overshootDeg = direction === "next" ? -7 : 7;
    const phase1 = Math.round(ms * 0.82);
    const phase2 = Math.max(40, ms - phase1);
    animateAngleTo(targetAngle + overshootDeg, phase1, () => {
      animateAngleTo(targetAngle, phase2, onDone);
    });
  };

  const quickSwap = (direction) => {
    // Reduced motion mode: quick fade then swap
    if (isAnimating) return;
    if (direction === "next" && !canFlipNext()) return;
    if (direction === "prev" && !canFlipPrev()) return;

    isAnimating = true;
    flipbook.style.transition = "opacity 160ms linear";
    flipbook.style.opacity = "0.0";

    setTimeout(() => {
      if (direction === "next") index = Math.min(pages.length - 1, index + 1);
      if (direction === "prev") index = Math.max(0, index - 1);
      renderIdle();

      flipbook.style.opacity = "1.0";

      setTimeout(() => {
        flipbook.style.transition = "";
        isAnimating = false;
      }, 180);
    }, 170);
  };

  const flipNext = () => {
    if (isAnimating) return;
    if (!canFlipNext()) return;

    if (prefersReducedMotion) {
      quickSwap("next");
      return;
    }

    if (!prepareFlip("next")) return;
    setRailPreview(index + 1);
    animateWithSettle(-180, "next", 460, () => {
      isAnimating = false;
      finishFlip("next");
    });
  };

  const flipPrev = () => {
    if (isAnimating) return;
    if (!canFlipPrev()) return;

    if (prefersReducedMotion) {
      quickSwap("prev");
      return;
    }

    if (!prepareFlip("prev")) return;
    setRailPreview(index - 1);
    animateWithSettle(180, "prev", 460, () => {
      isAnimating = false;
      finishFlip("prev");
    });
  };

  const goTo = (target) => {
    const t = Number(target);
    if (Number.isNaN(t) || t < 0 || t >= pages.length) return;
    if (t === index) return;

    // For multi-page jumps, use quick sequential flips for consistency.
    const step = t > index ? "next" : "prev";
    const stepFn = step === "next" ? flipNext : flipPrev;

    const run = () => {
      if (index === t) return;
      stepFn();
      // Wait until current animation ends, then continue
      const tick = () => {
        if (!isAnimating) run();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    run();
  };

  // Pointer drag / swipe
  const onPointerDown = (e) => {
    if (isAnimating) return;
    if (e.button !== undefined && e.button !== 0) return;

    // If the pointer started on an edge tap button, let its click handler run
    if (e.target && e.target.closest && e.target.closest(".tapzone")) return;

    drag.active = true;
    drag.pointerId = e.pointerId;
    drag.startX = e.clientX;
    drag.lastX = e.clientX;
    drag.direction = null;
    drag.progress = 0;

    clearEdgeHints();
    flipbook.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!drag.active) {
      const rect = flipbook.getBoundingClientRect();
      const nx = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      if (nx < 0.18) {
        flipbook.classList.add("edge-left");
        flipbook.classList.remove("edge-right");
        syncShellEdges();
      } else if (nx > 0.82) {
        flipbook.classList.add("edge-right");
        flipbook.classList.remove("edge-left");
        syncShellEdges();
      } else {
        clearEdgeHints();
      }
      return;
    }
    if (drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.startX;
    drag.lastX = e.clientX;

    // Decide direction after small threshold
    if (!drag.direction) {
      if (Math.abs(dx) < 10) return;

      drag.direction = dx < 0 ? "next" : "prev";
      resetCenterTap();
      flipbook.classList.add("is-dragging");
      clearEdgeHints();
      if (!prepareFlip(drag.direction)) {
        drag.direction = null;
        drag.active = false;
        flipbook.classList.remove("is-dragging");
        renderIdle();
        return;
      }
    }

    const rect = flipbook.getBoundingClientRect();
    const maxDrag = rect.width * 0.9;
    const raw = Math.abs(dx) / maxDrag;
    drag.progress = clamp(raw, 0, 1);

    const angle = drag.direction === "next"
      ? -drag.progress * 180
      :  drag.progress * 180;
    const y = e.clientY - rect.top;
    const ny = clamp(y / rect.height, 0, 1);
    const t = clamp((ny - 0.5) * 2, -1, 1);
    const tiltX = clamp(-t * 6, -6, 6);
    const tiltZ = clamp(t * 2.2, -2.2, 2.2);
    const mid = 1 - Math.abs(drag.progress - 0.5) * 2;
    const liftPx = mid * 10;
    setSheetTransform(angle, { tiltX, tiltZ, liftPx });
    setLighting(drag.progress);
  };

  const onPointerUp = (e) => {
    if (!drag.active) return;
    if (drag.pointerId !== e.pointerId) return;

    flipbook.releasePointerCapture?.(e.pointerId);
    flipbook.classList.remove("is-dragging");

    // If user didn't drag far, treat as a tap based on region.
    if (!drag.direction) {
      drag.active = false;
      const rect = flipbook.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const nx = x / rect.width;
      const ny = y / rect.height;
      const inCenter = nx > 0.28 && nx < 0.72 && ny > 0.18 && ny < 0.82;
      if (inCenter) {
        if (e.pointerType && e.pointerType !== "mouse") {
          const now = Date.now();
          const ddx = Math.abs(x - centerTap.lastTapX);
          const ddy = Math.abs(y - centerTap.lastTapY);
          if (centerTap.lastTapTs && (now - centerTap.lastTapTs) < 320 && ddx < 18 && ddy < 18) {
            resetCenterTap();
            openLightbox();
            return;
          }
          centerTap.lastTapTs = now;
          centerTap.lastTapX = x;
          centerTap.lastTapY = y;
        }
        return;
      }
      if (nx > 0.55) {
        resetCenterTap();
        flipNext();
      } else if (nx < 0.45) {
        resetCenterTap();
        flipPrev();
      }
      return;
    }

    const commit = drag.progress > 0.33;

    if (commit) {
      const endAngle = drag.direction === "next" ? -180 : 180;
      const dir = drag.direction;
      const targetIndex = dir === "next" ? index + 1 : index - 1;
      drag.active = false;
      resetCenterTap();
      setRailPreview(targetIndex);
      animateWithSettle(endAngle, dir, 320, () => {
        isAnimating = false;
        finishFlip(dir);
      });
      return;
    }

    // Snap back
    drag.active = false;
    animateAngleTo(0, 220, () => {
      isAnimating = false;
      renderIdle();
    });
  };

  // Keyboard navigation
  const onKeyDown = (e) => {
    // Ignore typing inside inputs
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea" || tag === "select") return;

    if (e.key === "Escape" && helpOpen) {
      e.preventDefault();
      closeHelp();
      return;
    }

    if (lightboxOpen) {
      if (e.key === "Escape") { e.preventDefault(); closeLightbox(); return; }
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); setPageInstant(index + 1); return; }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); setPageInstant(index - 1); return; }
      if (e.key === "Home") { e.preventDefault(); setPageInstant(0); return; }
      if (e.key === "End") { e.preventDefault(); setPageInstant(pages.length - 1); return; }
      if (e.key === "z" || e.key === "Z") { e.preventDefault(); toggleLightboxZoom(); return; }
      return;
    }

    if (e.key === "z" || e.key === "Z") {
      e.preventDefault();
      openLightbox();
      return;
    }
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault();
      flipNext();
      return;
    }

    if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      flipPrev();
      return;
    }

    if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
      return;
    }

    if (e.key === "End") {
      e.preventDefault();
      goTo(pages.length - 1);
    }
  };

  // Wire controls
  prevBtn.addEventListener("click", flipPrev);
  nextBtn.addEventListener("click", flipNext);

  // Edge tap buttons (avoid double-trigger with pointer tap logic)
  tapPrev.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    flipPrev();
  });
  tapNext.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    flipNext();
  });

  dots.forEach((d) => d.addEventListener("click", () => goTo(d.dataset.page)));

  flipbook.addEventListener("pointerdown", onPointerDown);
  flipbook.addEventListener("pointermove", onPointerMove);
  flipbook.addEventListener("pointerup", onPointerUp);
  flipbook.addEventListener("pointercancel", onPointerUp);
  flipbook.addEventListener("pointerleave", () => {
    if (!drag.active) clearEdgeHints();
  });

  document.addEventListener("keydown", onKeyDown);

  if (helpBtn && helpPop) {
    helpBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleHelp();
    });
    document.addEventListener("click", (e) => {
      if (!helpOpen) return;
      const target = e.target;
      if (helpBtn.contains(target) || helpPop.contains(target)) return;
      closeHelp();
    });
  }

  // Double click opens the lightbox
  flipbook.addEventListener("dblclick", (e) => {
    e.preventDefault();
    openLightbox();
  });

  // Lightbox wiring (if markup exists)
  if (lightbox) {
    lightboxClose?.addEventListener("click", closeLightbox);
    lightboxPrev?.addEventListener("click", () => setPageInstant(index - 1));
    lightboxNext?.addEventListener("click", () => setPageInstant(index + 1));

    // Click backdrop to close
    lightbox.querySelectorAll("[data-lb-close]").forEach((el) => {
      el.addEventListener("click", (ev) => { ev.preventDefault(); closeLightbox(); });
    });

    // Double click zoom (desktop)
    lightboxScroller?.addEventListener("dblclick", (e) => { e.preventDefault(); toggleLightboxZoom(); });

    // Swipe pages and double tap zoom (mobile)
    lightboxScroller?.addEventListener("pointerdown", onLightboxPointerDown);
    lightboxScroller?.addEventListener("pointerup", onLightboxPointerUp);
    lightboxScroller?.addEventListener("pointercancel", onLightboxPointerUp);
  }

  // Initial paint
  renderIdle();
  runCoachHint();
})();
