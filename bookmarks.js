/* Local Safari bookmark importer + robust folder navigation. */
(function () {
  "use strict";
  const STORAGE_KEY = "myWebFavourites.safariBookmarks.v1";

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }

  function parseBookmarks(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const root = doc.querySelector('h3[id="BookmarksBar"]');
    if (!root) return null;
    const mainDL = root.nextElementSibling;
    if (!mainDL) return [];
    const result = [];

    function readFolder(name, dl) {
      const links = [];
      let node = dl.firstElementChild;
      while (node) {
        if (node.tagName === "DT") {
          const h3 = node.querySelector(":scope > H3");
          const childDL = node.querySelector(":scope > DL");
          if (h3 && childDL) readFolder(h3.textContent.trim(), childDL);
          const a = node.querySelector(":scope > A");
          if (a) links.push({ title: a.textContent.trim(), url: a.href });
        }
        node = node.nextElementSibling;
      }
      result.push({ name, links });
    }

    let node = mainDL.firstElementChild;
    while (node) {
      if (node.tagName === "DT") {
        const h3 = node.querySelector(":scope > H3");
        const dl = node.querySelector(":scope > DL");
        if (h3 && dl) readFolder(h3.textContent.trim(), dl);
      }
      node = node.nextElementSibling;
    }
    return result;
  }

  const stored = getStored();
  if (stored) {
    const parsed = parseBookmarks(stored);
    if (parsed) {
      const data = {};
      parsed.forEach(folder => { data[folder.name] = folder.links; });
      window.__IMPORTED_BOOKMARKS__ = data;
      window.__IMPORTED_FOLDER_ORDER__ = parsed.map(folder => folder.name);
    }
  }

  function installNavigationCSS() {
    if (document.getElementById("fixedFolderNavigationCSS")) return;
    const style = document.createElement("style");
    style.id = "fixedFolderNavigationCSS";
    style.textContent = `
      .home-view { flex: 0 0 auto !important; min-height: 0 !important; }
      .folders-grid { flex: 0 0 auto !important; min-height: 0 !important; }
      .home-view.hidden { display: none !important; }
      .detail-view { display: none !important; }
      .detail-view.active {
        display: flex !important;
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100dvh !important;
        max-width: none !important;
        margin: 0 !important;
        padding: max(14px, env(safe-area-inset-top)) 14px max(20px, env(safe-area-inset-bottom)) !important;
        overflow-y: auto !important;
        z-index: 1000 !important;
        background: transparent !important;
      }
      body:has(.detail-view.active) { overflow: hidden !important; }
      body:has(.detail-view.active) .header,
      body:has(.detail-view.active) .top-bar { display: none !important; }
      .detail-view.active .detail-header { width: 100%; max-width: 920px; margin: 0 auto; }
      .detail-view.active .links-grid { width: 100%; max-width: 920px; margin: 0 auto; padding-bottom: 30px; }
      @media (min-width: 600px) {
        .folders-grid { margin-bottom: 0 !important; padding-bottom: 10px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function addImportButton() {
    const top = document.querySelector(".top-bar, .top");
    if (!top || document.getElementById("localBookmarkImport")) return;
    const wrap = document.createElement("div");
    wrap.id = "localBookmarkImport";
    wrap.style.cssText = "display:flex;align-items:center;justify-content:center;";
    if (top.classList.contains("top-bar")) wrap.style.marginLeft = "auto";
    else wrap.style.marginTop = "12px";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = stored ? "Change Bookmarks" : "Import Bookmarks";
    button.className = "refresh-btn";
    button.setAttribute("aria-label", button.textContent);

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".html,.htm,text/html";
    input.style.display = "none";
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        const html = await file.text();
        if (!parseBookmarks(html)) {
          alert("This does not appear to be a Safari bookmark export.");
          input.value = "";
          return;
        }
        localStorage.setItem(STORAGE_KEY, html);
        location.reload();
      } catch (error) {
        console.error(error);
        alert("The bookmark file could not be imported.");
      }
    });
    button.addEventListener("click", () => input.click());
    wrap.append(button, input);
    top.appendChild(wrap);
  }

  function initialise() {
    installNavigationCSS();
    addImportButton();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialise);
  else initialise();
})();
