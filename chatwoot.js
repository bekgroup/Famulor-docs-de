// Chatwoot Live-Chat Widget (BEK Service Support)
// Wird von Mintlify automatisch auf jeder Seite eingebunden.
window.chatwootSettings = {
  position: "right",
  type: "standard",
  launcherTitle: ""
};

(function (d, t) {
  var BASE_URL = "https://support.pro.server5.de";
  var g = d.createElement(t);
  var s = d.getElementsByTagName(t)[0];
  g.src = BASE_URL + "/packs/js/sdk.js";
  g.async = true;
  s.parentNode.insertBefore(g, s);
  g.onload = function () {
    window.chatwootSDK.run({
      websiteToken: "JauDY12yMMsbgzcgrRKgXodB",
      baseUrl: BASE_URL
    });
  };
})(document, "script");
