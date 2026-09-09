/* Local Safari bookmark importer for the new folder/detail UI. */
(function () {
  "use strict";
  const STORAGE_KEY = "myWebFavourites.safariBookmarks.v1";

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function parseSafari(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const root = doc.querySelector('h3[id="BookmarksBar"]');
    if (!root) return null;
    const mainDL = root.nextElementSibling;
    if (!mainDL) return null;
    const folders = {};
    const order = [];

    function readFolder(name, dl) {
      const links = [];
      let node = dl.firstElementChild;
      while (node) {
        if (node.tagName === "DT") {
          const childFolder = node.querySelector(":scope > H3");
          const childDL = node.querySelector(":scope > DL");
          if (childFolder && childDL) readFolder(childFolder.textContent.trim(), childDL);
          const a = node.querySelector(":scope > A");
          if (a) links.push({ title: a.textContent.trim(), url: a.href });
        }
        node = node.nextElementSibling;
      }
      folders[name] = links;
      if (!order.includes(name)) order.push(name);
    }

    let node = mainDL.firstElementChild;
    while (node) {
      if (node.tagName === "DT") {
        const folder = node.querySelector(":scope > H3");
        const dl = node.querySelector(":scope > DL");
        if (folder && dl) readFolder(folder.textContent.trim(), dl);
      }
      node = node.nextElementSibling;
    }
    return { folders, order };
  }

  const stored = getStored();
  if (stored) {
    const parsed = parseSafari(stored);
    if (parsed) {
      window.__IMPORTED_BOOKMARKS__ = parsed.folders;
      window.__IMPORTED_FOLDER_ORDER__ = parsed.order;
    }
  }

  function addImportControl() {
    const top = document.querySelector(".top-bar");
    if (!top || document.getElementById("localBookmarkImport")) return;
    const button = document.createElement("button");
    button.id = "localBookmarkImport";
    button.type = "button";
    button.className = "refresh-btn";
    button.textContent = stored ? "Change Bookmarks" : "Import Bookmarks";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".html,.htm,text/html";
    input.style.display = "none";
    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const html = await file.text();
      const parsed = parseSafari(html);
      if (!parsed) {
        alert("This does not appear to be a Safari bookmark export.");
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY, html);
        location.reload();
      } catch (e) {
        alert("The bookmarks could not be saved on this device.");
      }
    });
    button.addEventListener("click", () => input.click());
    top.appendChild(button);
    top.appendChild(input);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addImportControl);
  else addImportControl();
})();
