(function () {
  // Prevent duplicate injections but re-init if needed
  if (document.getElementById("qfm-overlay-host")) {
     // If it's already there but we want to show a new one, we might need to remove it or update it.
     // For now, let's just remove the old one to be safe.
     const oldHost = document.getElementById("qfm-overlay-host");
     if (oldHost) oldHost.remove();
  }

  // Icons (Simple SVGs)
  const ICONS = {
    copy: '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
  };

  window.QFM_SHOW = function (data) {
    const { text, author, category, pillar, duration, showBio } = data;

    // Slugify author for link
    const authorSlug = author
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    
    const bioUrl = "https://quotesformotivation.com/author/" + authorSlug;

    // Fetch CSS first
    const cssUrl = chrome.runtime.getURL("content/overlay.css");
    fetch(cssUrl)
      .then((response) => response.text())
      .then((cssText) => {
        // Create Host
        const host = document.createElement("div");
        host.id = "qfm-overlay-host";
        const shadow = host.attachShadow({ mode: "closed" });

        // Style
        const style = document.createElement("style");
        style.textContent = cssText;
        shadow.appendChild(style);

        // Wrapper
        const wrapper = document.createElement("div");
        wrapper.className = "toast";

        const iconUrl = chrome.runtime.getURL("assets/icons/icon-48.png");

        // UI Logic for Bio Link
        let authorHtml = "";
        if (author) {
          authorHtml = '<div class="author">' + author + '</div>';
          if (showBio) {
            authorHtml += '<a href="' + bioUrl + '" target="_blank" class="bio-link">More from ' + author.split(" ")[0] + ' &rarr;</a>';
          }
        }

        // Display Pillar Name (fallback to category if pillar missing)
        const pillarName = (pillar || category || "Motivation").toUpperCase();
        const pillarClass = (pillar || "drive").toLowerCase();

        // Construct HTML safely using concatenation to avoid template literal escaping issues
        wrapper.innerHTML = 
          '<button class="close-btn" id="btn-close" title="Close">' + ICONS.close + '</button>' +
          '<div class="header">' +
            '<div class="brand">' +
              '<img src="' + iconUrl + '" alt="" />' +
              '<span>Quotes For Motivation</span>' +
            '</div>' +
            '<div class="pillar-badge pillar-' + pillarClass + '">' + pillarName + '</div>' +
          '</div>' +
          '<div class="quote">"' + text + '"</div>' +
          '<div class="footer">' +
            '<div class="author-box">' +
              authorHtml +
            '</div>' +
            '<div class="actions">' +
              '<button class="icon-btn" id="btn-copy" title="Copy to Clipboard">' +
                ICONS.copy +
              '</button>' +
              '<button class="icon-btn" id="btn-share" title="Share on X">' +
                ICONS.x +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="tooltip" id="tooltip">Copied!</div>';

        shadow.appendChild(wrapper);
        (document.documentElement || document.body).appendChild(host);

        // --- Interactions ---

        function closeOverlay() {
            if (host) host.remove();
        }

        // Auto Close Logic
        let autoCloseTimer = setTimeout(closeOverlay, duration);

        // Hold on hover
        wrapper.addEventListener("mouseenter", () => {
          if (autoCloseTimer) clearTimeout(autoCloseTimer);
        });

        // Resume close timer on mouse leave (short grace period)
        wrapper.addEventListener("mouseleave", () => {
          autoCloseTimer = setTimeout(closeOverlay, 5000);
        });

        // Close Button
        const btnClose = wrapper.querySelector("#btn-close");
        if (btnClose) {
            btnClose.addEventListener("click", (e) => {
                e.stopPropagation();
                closeOverlay();
            });
        }

        // Copy
        const btnCopy = wrapper.querySelector("#btn-copy");
        const tooltip = wrapper.querySelector("#tooltip");
        if (btnCopy) {
            btnCopy.addEventListener("click", (e) => {
              e.stopPropagation(); // Don't close toast
              navigator.clipboard.writeText('"' + text + '" - ' + author).then(() => {
                tooltip.classList.add("show");
                setTimeout(() => tooltip.classList.remove("show"), 1500);
              });
            });
        }

        // Share
        const btnShare = wrapper.querySelector("#btn-share");
        if (btnShare) {
            btnShare.addEventListener("click", (e) => {
              e.stopPropagation();
              const tweetText = encodeURIComponent('"' + text + '" - ' + author + '\n\nvia @fuelforambition');
              const url = "https://twitter.com/intent/tweet?text=" + tweetText + "&url=https://quotesformotivation.com";
              window.open(url, "_blank");
            });
        }

      })
      .catch((err) => console.error("QFM: Failed to load styles", err));
  };
})();