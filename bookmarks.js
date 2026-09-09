/* Local Safari bookmark importer. Imported bookmarks stay in this browser. */
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

  function addImportButton() {
    const style = document.createElement("style");
    style.textContent = ".home-view.hidden{display:none!important}.detail-view{display:none}.detail-view.active{display:flex!important}";
    document.head.appendChild(style);
    const top = document.querySelector(".top-bar, .top");
    if (!top || document.getElementById("localBookmarkImport")) return;
    const wrap = document.createElement("div");
    wrap.id = "localBookmarkImport";
    wrap.style.cssText = "margin-top:12px;display:flex;justify-content:center;";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = stored ? "Change Bookmarks" : "Import Bookmarks";
    button.style.cssText = "border:1px solid rgba(255,255,255,.72);border-radius:18px;padding:7px 14px;background:rgba(255,255,255,.62);backdrop-filter:blur(10px);cursor:pointer;font:inherit;font-size:13px;color:#17202a;";

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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addImportButton);
  else addImportButton();
})();
