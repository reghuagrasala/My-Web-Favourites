/*
   Local Safari bookmark importer + folder viewer
   ----------------------------------------------
   Imported bookmarks are stored only in this browser's localStorage.
   Until the public Bookmarks.html file is removed, browsers without a
   local import continue to use that file as a safe migration fallback.
*/

(function () {
    "use strict";

    const STORAGE_KEY = "myWebFavourites.safariBookmarks.v1";

    function getStoredBookmarks() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            console.warn("Local bookmark storage is unavailable:", error);
            return null;
        }
    }

    function saveBookmarks(html) {
        try {
            localStorage.setItem(STORAGE_KEY, html);
            return true;
        } catch (error) {
            console.error("Could not save local bookmarks:", error);
            alert("The bookmarks could not be saved on this device.");
            return false;
        }
    }

    // Use the local copy when one exists. Otherwise keep the old public-file
    // fallback during the migration period.
    const originalFetch = window.fetch.bind(window);

    window.fetch = async function (input, init) {
        const url = typeof input === "string" ? input : (input && input.url) || "";

        if (url === "Bookmarks.html" || url.endsWith("/Bookmarks.html")) {
            const stored = getStoredBookmarks();

            if (stored) {
                return new Response(stored, {
                    status: 200,
                    headers: { "Content-Type": "text/html; charset=utf-8" }
                });
            }

            return originalFetch(input, init);
        }

        return originalFetch(input, init);
    };

    function addImportControl() {
        const top = document.querySelector(".top");
        if (!top || document.getElementById("localBookmarkImport")) return;

        const wrapper = document.createElement("div");
        wrapper.id = "localBookmarkImport";
        wrapper.style.marginTop = "12px";
        wrapper.style.display = "flex";
        wrapper.style.justifyContent = "center";
        wrapper.style.gap = "8px";
        wrapper.style.flexWrap = "wrap";

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = getStoredBookmarks() ? "Change Bookmarks" : "Import Bookmarks";
        button.style.border = "1px solid rgba(255,255,255,.72)";
        button.style.borderRadius = "18px";
        button.style.padding = "7px 14px";
        button.style.background = "rgba(255,255,255,.62)";
        button.style.backdropFilter = "blur(10px)";
        button.style.webkitBackdropFilter = "blur(10px)";
        button.style.cursor = "pointer";
        button.style.font = "inherit";
        button.style.fontSize = "13px";
        button.style.color = "#17202a";

        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".html,.htm,text/html";
        input.style.display = "none";

        input.addEventListener("change", async function () {
            const file = input.files && input.files[0];
            if (!file) return;

            try {
                const html = await file.text();
                const doc = new DOMParser().parseFromString(html, "text/html");

                if (!doc.querySelector('h3[id="BookmarksBar"]')) {
                    alert("This does not appear to be a Safari bookmark export.");
                    input.value = "";
                    return;
                }

                if (saveBookmarks(html)) {
                    location.reload();
                }
            } catch (error) {
                console.error("Could not import bookmarks:", error);
                alert("The bookmark file could not be imported.");
            }
        });

        button.addEventListener("click", function () {
            input.click();
        });

        wrapper.appendChild(button);
        wrapper.appendChild(input);
        top.appendChild(wrapper);
    }

    function parseAllFolders(html) {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const root = doc.querySelector('h3[id="BookmarksBar"]');
        if (!root) return [];

        const result = [];
        const mainDL = root.nextElementSibling;
        if (!mainDL) return result;

        function readFolder(folderTitle, dl) {
            const links = [];
            let node = dl.firstElementChild;

            while (node) {
                if (node.tagName === "DT") {
                    const childFolder = node.querySelector(":scope > H3");
                    const childDL = node.querySelector(":scope > DL");

                    if (childFolder && childDL) {
                        readFolder(childFolder.textContent.trim(), childDL);
                    }

                    const link = node.querySelector(":scope > A");
                    if (link) {
                        links.push({
                            title: link.textContent.trim(),
                            url: link.href
                        });
                    }
                }
                node = node.nextElementSibling;
            }

            result.push({ name: folderTitle, links: links });
        }

        let node = mainDL.firstElementChild;
        while (node) {
            if (node.tagName === "DT") {
                const folder = node.querySelector(":scope > H3");
                const dl = node.querySelector(":scope > DL");
                if (folder && dl) {
                    readFolder(folder.textContent.trim(), dl);
                }
            }
            node = node.nextElementSibling;
        }

        return result;
    }

    function addLink(links, bookmark) {
        const a = document.createElement("a");
        a.className = "site";
        a.href = bookmark.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.title = bookmark.title;

        const img = document.createElement("img");
        try {
            img.src = "https://www.google.com/s2/favicons?domain=" +
                encodeURIComponent(new URL(bookmark.url).hostname);
            img.alt = "";
        } catch {
            img.style.display = "none";
        }

        a.appendChild(img);
        links.appendChild(a);
    }

    function installFolderBehavior() {
        const style = document.createElement("style");
        style.textContent = `
            #folders .folder .links { display: none; }
            #folders .folder.open .links { display: flex; }
            #folders .folder { cursor: pointer; }
            #folders .folder.open { min-height: 100px; }
            #folders .folder.open .folder-name::after {
                content: "  ▲";
                font-size: 10px;
                opacity: .55;
            }
            #folders .folder:not(.open) .folder-name::after {
                content: "  ▼";
                font-size: 10px;
                opacity: .55;
            }
        `;
        document.head.appendChild(style);

        const container = document.getElementById("folders");
        if (!container || container.dataset.folderBehaviorInstalled) return;
        container.dataset.folderBehaviorInstalled = "1";

        container.addEventListener("click", function (event) {
            const link = event.target.closest("a");
            if (link) return;

            const folder = event.target.closest(".folder");
            if (!folder) return;

            document.querySelectorAll("#folders .folder.open").forEach(function (item) {
                if (item !== folder) item.classList.remove("open");
            });

            folder.classList.toggle("open");
        });
    }

    async function enhanceFolders() {
        const container = document.getElementById("folders");
        if (!container) return;

        try {
            const response = await fetch("Bookmarks.html");
            if (!response.ok) return;
            const html = await response.text();
            const folders = parseAllFolders(html);
            if (!folders.length) return;

            const byName = new Map(folders.map(folder => [folder.name, folder.links]));

            container.querySelectorAll(":scope > .folder").forEach(function (card) {
                const nameElement = card.querySelector(":scope > .folder-name");
                const links = card.querySelector(":scope > .links");
                if (!nameElement || !links) return;

                const allLinks = byName.get(nameElement.textContent.trim());
                if (!allLinks) return;

                links.innerHTML = "";
                allLinks.forEach(function (bookmark) {
                    addLink(links, bookmark);
                });
            });

            installFolderBehavior();
        } catch (error) {
            console.warn("Could not enhance bookmark folders:", error);
        }
    }

    addImportControl();
    installFolderBehavior();

    // loadSafariBookmarks() in index.html runs just after this file and is
    // asynchronous. Retry briefly until its generated folder cards exist.
    let attempts = 0;
    const timer = setInterval(function () {
        attempts += 1;
        enhanceFolders();
        const count = document.querySelectorAll("#folders > .folder").length;
        if (count > 0 || attempts >= 30) clearInterval(timer);
    }, 200);
})();
