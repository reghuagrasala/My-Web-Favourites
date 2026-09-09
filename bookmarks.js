/*
   Local bookmark importer
   ------------------------
   Personal Safari bookmarks are kept in this browser's localStorage.
   No personal bookmark file is required in the public repository.
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

    // The existing index.html expects to fetch "Bookmarks.html".
    // Redirect that request to the locally stored copy instead of the public repo.
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

            // Return an empty valid bookmark document so the old loader does
            // not make a network request for the personal file.
            return new Response(
                "<!doctype html><html><body><h3 id=\"BookmarksBar\"></h3><dl></dl></body></html>",
                {
                    status: 200,
                    headers: { "Content-Type": "text/html; charset=utf-8" }
                }
            );
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

    // The header already exists when bookmarks.js is loaded.
    addImportControl();
})();
