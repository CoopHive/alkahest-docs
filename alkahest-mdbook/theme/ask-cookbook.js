(function () {
  const COOKBOOK_PUBLIC_API_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmZiMTE5MTBkYmQ2MTkwYjgzZGIyYmMiLCJpYXQiOjE3Mjc3MzAwNjUsImV4cCI6MjA0MzMwNjA2NX0.yD2cb9bklEsN0D2wjeAtDCN1MsqB4KXW_eTiXLiv2QY";
  var element = document.getElementById("__cookbook");
  if (!element) {
    element = document.createElement("div");
    element.id = "__cookbook";
    element.dataset.apiKey = COOKBOOK_PUBLIC_API_KEY;
    document.body.appendChild(element);
  }
  var script = document.getElementById("__cookbook-script");
  if (!script) {
    script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/@cookbookdev/docsbot/dist/standalone/index.cjs.js";
    script.id = "__cookbook-script";
    script.defer = true;
    document.body.appendChild(script);
  }
})();
