document.addEventListener("DOMContentLoaded", () => {

  const client = supabase.createClient("https://pngssqjrzkbbydwrqqtp.supabase.co/", "sb_publishable_DZV3RS-ZPiBEPlqRZNO9XQ_f2RifsOt");

  const map = L.map('map').setView([48.8, 0.1], 8);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    .addTo(map);

  let pmuData = [];
  let markers = [];

  let selectedLat = null;
  let selectedLng = null;

  // =======================
  // LOAD PMU
  // =======================
  async function loadPMU() {
    const { data } = await client.from("pmu").select("*");
    pmuData = data;
    renderAll();
  }

  function renderAll() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    renderList(pmuData);

    pmuData.forEach(p => {
      if (!p.lat) return;

      const m = L.marker([p.lat, p.lng]).addTo(map);

      m.on("click", () => showPMU(p));

      markers.push(m);
    });

    count.innerText = pmuData.length + " PMU trouvés";
  }

  function renderList(data) {
    list.innerHTML = "";

    data.forEach(p => {
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `<b>${p.name}</b><br>${p.address}`;

      div.onclick = () => {
        map.setView([p.lat, p.lng], 15);
        showPMU(p);
      };

      list.appendChild(div);
    });
  }

  function showPMU(p) {
    pmuCard.innerHTML = `
      <div class="pmu-header">${p.name}</div>
      <div class="pmu-body">
        📍 ${p.address}<br>
        📞 ${p.phone || ""}<br>
        🕒 ${p.open || ""} - ${p.close || ""}<br>
        🧩 ${(p.services || []).join(", ")}
      </div>
    `;
    pmuCard.classList.remove("hidden");
  }

  // =======================
  // SEARCH
  // =======================
  search.oninput = () => {
    renderList(
      pmuData.filter(p =>
        p.name.toLowerCase().includes(search.value.toLowerCase())
      )
    );
  };

  // =======================
  // AUTH CHECK
  // =======================
  async function checkAuthUI() {
    const { data: { session } } = await client.auth.getSession();

    if (!session) addBtn.style.display = "none";
  }

  checkAuthUI();

  // =======================
  // ADD BTN
  // =======================
  addBtn.onclick = () => {
    formPopup.classList.remove("hidden");
  };

  // =======================
  // MODE SWITCH
  // =======================
  document.querySelectorAll('input[name="mode"]').forEach(r => {
    r.onchange = () => {
      if (r.value === "manual" && r.checked) {
        coordsInputs.classList.remove("hidden");
      } else {
        coordsInputs.classList.add("hidden");
      }
    };
  });

  // =======================
  // CLICK MAP
  // =======================
  map.on("click", e => {

    const mode = document.querySelector('input[name="mode"]:checked').value;

    if (mode !== "map") return;

    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;

    alert("Position sélectionnée ✅");
  });

  // =======================
  // SUBMIT
  // =======================
  submitPMU.onclick = async () => {

    const { data: { session } } = await client.auth.getSession();

    if (!session) {
      alert("Connecte-toi !");
      return;
    }

    let lat, lng;
    const mode = document.querySelector('input[name="mode"]:checked').value;

    if (mode === "map") {
      if (!selectedLat) {
        alert("Clique sur la carte !");
        return;
      }
      lat = selectedLat;
      lng = selectedLng;
    } else {
      lat = parseFloat(latInput.value);
      lng = parseFloat(lngInput.value);
    }

    const services = [...document.querySelectorAll(".services input:checked")]
      .map(e => e.value);

    const pmu = {
      name: name.value,
      address: address.value,
      phone: phone.value,
      lat,
      lng,
      open: open.value,
      close: close.value,
      services,
      user_id: session.user.id
    };

    const { error } = await client.from("pmu").insert([pmu]);

    if (error) {
      console.error(error);
      alert("Erreur ❌");
    } else {
      alert("PMU ajouté ✅");
      location.reload();
    }
  };

  loadPMU();

});
