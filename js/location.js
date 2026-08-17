(() => {
  const mockLocation = {
    district: "Hai Bà Trưng",
    city: "Hà Nội",
    label: "ĐHBKHN, Quận Hai Bà Trưng, Hà Nội",
    latitude: 20.9984,
    longitude: 105.8436,
  };

  window.MatchUpLocation = mockLocation;

  const applyMockLocation = () => {
    document.querySelectorAll("[data-user-location]").forEach((element) => {
      element.textContent = mockLocation.label;
    });
    document.querySelectorAll("[data-user-district]").forEach((element) => {
      element.textContent = mockLocation.district;
    });
    document.querySelectorAll("[data-user-city]").forEach((element) => {
      element.textContent = mockLocation.city;
    });
    document.dispatchEvent(
      new CustomEvent("matchup:location-ready", { detail: mockLocation }),
    );
  };

  const applyPendingLocation = () => {
    document.querySelectorAll("[data-user-location]").forEach((element) => {
      element.textContent = "Chưa bật vị trí";
    });
    document.querySelectorAll("[data-user-district]").forEach((element) => {
      element.textContent = "gần bạn";
    });
  };

  const showPermissionDialog = () => {
    const style = document.createElement("style");
    style.textContent = `
      .mock-location-layer {
        position: fixed;
        inset: 0;
        z-index: 100;
        display: grid;
        place-items: center;
        padding: 20px;
        background: rgba(18, 36, 26, .48);
        backdrop-filter: blur(3px);
      }
      .mock-location-dialog {
        width: min(390px, 100%);
        padding: 24px;
        border-radius: 22px;
        background: #fff;
        box-shadow: 0 24px 70px rgba(14, 38, 24, .28);
        text-align: center;
      }
      .mock-location-icon {
        width: 56px;
        height: 56px;
        margin: 0 auto 15px;
        display: grid;
        place-items: center;
        border-radius: 17px;
        color: #1d7049;
        background: #ccf645;
      }
      .mock-location-icon .material-symbols-rounded {
        font-size: 29px;
      }
      .mock-location-dialog h2 {
        margin: 0;
        color: #18251f;
        font: 800 20px/1.25 "Plus Jakarta Sans", sans-serif;
        letter-spacing: -.5px;
      }
      .mock-location-dialog p {
        margin: 9px 0 0;
        color: #68756d;
        font: 13px/1.55 "DM Sans", sans-serif;
      }
      .mock-location-dialog small {
        display: block;
        margin-top: 9px;
        color: #87938b;
        font: 11px/1.4 "DM Sans", sans-serif;
      }
      .mock-location-actions {
        display: grid;
        grid-template-columns: 1fr 1.25fr;
        gap: 9px;
        margin-top: 20px;
      }
      .mock-location-actions button {
        padding: 11px;
        border: 1px solid #dce7de;
        border-radius: 10px;
        background: #fff;
        color: #5b6c61;
        font: 800 12px "DM Sans", sans-serif;
      }
      .mock-location-actions .accept {
        border-color: #ccf645;
        background: #ccf645;
        color: #183b2a;
      }
    `;
    document.head.appendChild(style);

    const layer = document.createElement("div");
    layer.className = "mock-location-layer";
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    layer.setAttribute("aria-labelledby", "mock-location-title");
    layer.innerHTML = `
      <div class="mock-location-dialog">
        <div class="mock-location-icon">
          <span class="material-symbols-rounded">my_location</span>
        </div>
        <h2 id="mock-location-title">Cho phép MatchUp dùng vị trí?</h2>
        <p>
          Để gợi ý sân và kèo gần bạn nhất, MatchUp cần vị trí của bạn.
        </p>
        <small>
          Sau khi đồng ý, MatchUp sẽ dùng vị trí của bạn để gợi ý sân
          và kèo gần nhất.
        </small>
        <div class="mock-location-actions">
          <button type="button" data-location-later>Để sau</button>
          <button type="button" class="accept" data-location-accept>
            Đồng ý
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(layer);
    layer.querySelector("[data-location-later]").addEventListener("click", () => layer.remove());
    layer.querySelector("[data-location-accept]").addEventListener("click", () => {
      sessionStorage.setItem("matchup-mock-location-approved", "true");
      applyMockLocation();
      layer.remove();
    });
  };

  if (sessionStorage.getItem("matchup-mock-location-approved") === "true") {
    applyMockLocation();
  } else {
    applyPendingLocation();
    showPermissionDialog();
  }
})();
