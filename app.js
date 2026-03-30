document.addEventListener("DOMContentLoaded", () => {

  const client = supabase.createClient("https://pngssqjrzkbbydwrqqtp.supabase.co/", "sb_publishable_DZV3RS-ZPiBEPlqRZNO9XQ_f2RifsOt");

  // =======================
  // MAP
  // =======================
  const map = L.map('map').setView([48.8, 0.1], 8);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    .addTo(map);

  let pmuData = [];
  let markers = [];

  // =======================
  // LOAD PMU
  // =======================
  async function loadPMU() {
    const { data, error } = await client.from("pmu").select("*");

    if (error) {
      console.error("Erreur load PMU :", error);
      return;
    }

    pmuData = data;
    renderAll();
  }

  // =======================
  // RENDER MAP + LIST
  // =======================
  function renderAll() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    renderList(pmuData);

    pmuData.forEach(p => {
      if (!p.lat || !p.lng) return;

      const m = L.marker([p.lat, p.lng]).addTo(map);

      m.on("click", () => showPMU(p));

      markers.push(m);
    });

    const countEl = document.getElementById("count");
    if (countEl) {
      countEl.innerText = pmuData.length + " PMU trouvés";
    }
  }

  // =======================
  // SIDEBAR LIST
  // =======================
  function renderList(data) {
    const list = document.getElementById("list");
    if (!list) return;

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

  // =======================
  // PMU CARD
  // =======================
  function showPMU(p) {
    const card = document.getElementById("pmuCard");
    if (!card) return;

    card.innerHTML = `
      <div class="pmu-header">${p.name}</div>
      <div class="pmu-body">
        📍 ${p.address}<br><br>
        📞 ${p.phone || "Non dispo"}
      </div>
    `;

    card.classList.remove("hidden");
  }

  // =======================
  // SEARCH
  // =======================
  const searchInput = document.getElementById("search");

  if (searchInput) {
    searchInput.addEventListener("input", e => {
      const val = e.target.value.toLowerCase();

      const filtered = pmuData.filter(p =>
        p.name.toLowerCase().includes(val)
      );

      renderList(filtered);
    });
  }

  // =======================
  // AUTH CHECK (SESSION FIX)
  // =======================
  async function checkAuthUI() {
    const { data: { session } } = await client.auth.getSession();

    const addBtn = document.getElementById("addBtn");

    if (!session) {
      if (addBtn) addBtn.style.display = "none";
    } else {
      if (addBtn) addBtn.style.display = "block";
    }
  }

  checkAuthUI();

  // =======================
  // ADD PMU BUTTON
  // =======================
  const addBtn = document.getElementById("addBtn");
  const formPopup = document.getElementById("formPopup");

  if (addBtn && formPopup) {
    addBtn.onclick = () => {
      formPopup.classList.remove("hidden");
    };
  }

  // =======================
  // CLICK MAP → auto coords
  // =======================
  map.on("click", function(e) {
    const latInput = document.getElementById("lat");
    const lngInput = document.getElementById("lng");

    if (latInput && lngInput) {
      latInput.value = e.latlng.lat;
      lngInput.value = e.latlng.lng;
    }
  });

  // =======================
  // SUBMIT PMU
  // =======================
  const submitBtn = document.getElementById("submitPMU");

  if (submitBtn) {
    submitBtn.onclick = async () => {

      const { data: { session } } = await client.auth.getSession();

      if (!session) {
        alert("Connecte-toi !");
        return;
      }

      const user = session.user;

      const pmu = {
        name: document.getElementById("name").value,
        address: document.getElementById("address").value,
        phone: document.getElementById("phone").value,
        lat: parseFloat(document.getElementById("lat").value),
        lng: parseFloat(document.getElementById("lng").value),
        user_id: user.id
      };

      const { error } = await client.from("pmu").insert([pmu]);

      if (error) {
        console.error("Erreur insert :", error);
        alert("Erreur ❌");
      } else {
        alert("PMU ajouté ✅");

        if (formPopup) {
          formPopup.classList.add("hidden");
        }

        loadPMU();
      }
    };
  }

  // =======================
  // INIT
  // =======================
  loadPMU();

});
