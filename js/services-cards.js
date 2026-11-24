(() => {
  const root = document.querySelector("[data-services-cards]");
  if (!root) return;

  const SUIT_PATHS = {
    spade:
      "M50 4C50 4 14 40 14 62c0 13.8 10.5 24 24.5 24 3.2 0 6.2-.7 8.5-1.9 0 0 .8 7.4-.5 14.9H50h3.5c-1.3-7.5-.5-14.9-.5-14.9 2.3 1.2 5.3 1.9 8.5 1.9C75.5 86 86 75.8 86 62 86 40 50 4 50 4z",
    heart:
      "M50 92C50 92 8 62 8 36 8 22.2 18.5 12 31.5 12c7.4 0 13.4 3.6 16.5 9.1C51.1 15.6 57.1 12 64.5 12 77.5 12 88 22.2 88 36c0 26-42 56-42 56z",
    diamond: "M50 4L92 50 50 96 8 50z",
    club:
      "M50 34c-1.2 0-2.3.1-3.4.3C45.2 22.8 36.8 14 26 14 14.4 14 5 23.4 5 35s9.4 21 21 21c2.8 0 5.4-.5 7.8-1.5C30.6 64 26 72.2 26 72.2h48S69.4 64 66.2 54.5c2.4 1 5 1.5 7.8 1.5 11.6 0 21-9.4 21-21S85.6 14 74 14c-10.8 0-19.2 8.8-20.6 20.3-1.1-.2-2.2-.3-3.4-.3zm-8 38.2c-.8 6.4.2 15.8.2 15.8h15.6s1-9.4.2-15.8H42z",
  };

  if (!document.getElementById("services-suit-foil")) {
    const sprite = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sprite.setAttribute("aria-hidden", "true");
    sprite.setAttribute("focusable", "false");
    sprite.id = "services-suit-foil-sprite";
    sprite.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    sprite.innerHTML = `
      <defs>
        <linearGradient id="services-suit-foil" x1="8%" y1="4%" x2="92%" y2="96%">
          <stop offset="0%" stop-color="#2a4578"/>
          <stop offset="35%" stop-color="#5b8cff"/>
          <stop offset="70%" stop-color="#d4e2ff"/>
          <stop offset="100%" stop-color="#3a5f9a"/>
        </linearGradient>
      </defs>`;
    document.body.appendChild(sprite);
  }

  function suitSvg(suit, sizeClass) {
    const path = SUIT_PATHS[suit] || SUIT_PATHS.spade;
    return `<svg class="${sizeClass}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="${path}" fill="url(#services-suit-foil)"/></svg>`;
  }

  root.querySelectorAll(".playing-card").forEach((card) => {
    const suit = card.getAttribute("data-suit") || "spade";
    const main = card.querySelector(".playing-card__suit");
    if (main) {
      main.innerHTML = suitSvg(suit, "playing-card__suit-svg");
      main.classList.add("playing-card__suit--svg");
    }
    card.querySelectorAll(".playing-card__pip").forEach((pip) => {
      pip.innerHTML = suitSvg(suit, "playing-card__pip-svg");
      pip.classList.add("playing-card__pip--svg");
    });
  });
})();
