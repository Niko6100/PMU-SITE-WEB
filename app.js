document.addEventListener("DOMContentLoaded", () => {

  // =======================
  // SUPABASE
  // =======================
  const client = supabase.createClient("https://pngssqjrzkbbydwrqqtp.supabase.co/", "sb_publishable_DZV3RS-ZPiBEPlqRZNO9XQ_f2RifsOt");

  // =======================
  // MAP
  // =======================
  const map = L.map('map').setView([48.8, 0.1], 8);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    .addTo(map);

  // =======================
  // VARIABLES
  // =======================
  let pmuData = [];
  let markers = [];

  let selectedLat = null;
  let selectedLng = null;

  // =======================
  // LOAD PMU
  // =======================
  async function loadPMU() {

    const { data, error } = await client.from("pmu").select("*");

    if (error) {
      console.error("Erreur chargement:", error);
      return;
    }

    pmuData = data;
    render();
  }

  // =======================
  // RENDER MAP + LIST
  // =======================
  function render() {

    // clear markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const list = document.getElementById("list");
    list.innerHTML = "";

    pmuData.forEach(p => {

      if (!p.lat || !p.lng) return;

      // marker
      const marker = L.marker([p.lat, p.lng]).addTo(map);

      marker.on("click", () => showPMU(p));

      markers.push(marker);

      // list
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `<b>${p.name}</b><br>${p.address}`;

      div.onclick = () => {
        map.setView([p.lat, p.lng], 15);
        showPMU(p);
      };

      list.appendChild(div);
    });

    document.getElementById("count").innerText =
      pmuData.length + " PMU trouvés";
  }

  // =======================
  // CARD PMU
  // =======================
  function showPMU(p) {

    const card = document.getElementById("pmuCard");

    card.innerHTML = `
      <div class="pmu-header">${p.name}</div>
      <div class="pmu-body">
        📍 ${p.address}<br>
        📞 ${p.phone || ""}<br>
        🕒 ${p.open_hour || ""} - ${p.close_hour || ""}<br>
        🧩 ${(p.services || []).join(", ")}
      </div>
    `;

    card.classList.remove("hidden");
  }

  // =======================
  // SEARCH
  // =======================
  const search = document.getElementById("search");

  if (search) {
    search.oninput = () => {
      const filtered = pmuData.filter(p =>
        p.name.toLowerCase().includes(search.value.toLowerCase())
      );
      renderFiltered(filtered);
    };
  }

  function renderFiltered(data) {
    const list = document.getElementById("list");
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
  // AUTH CHECK
  // =======================
  async function checkAuthUI() {

    const { data: { session } } = await client.auth.getSession();

    const addBtn = document.getElementById("addBtn");

    if (!session) {
      addBtn.style.display = "none";
    }
  }

  checkAuthUI();

  // =======================
  // FORM STEPPER
  // =======================
  let step = 1;

  const formPopup = document.getElementById("formPopup");
  const stepContent = document.getElementById("stepContent");
  const progressBar = document.getElementById("progressBar");

  let formData = {
    name: "",
    address: "",
    phone: "",
    open: "",
    close: "",
    services: []
  };

  function renderStep() {

    progressBar.style.width = (step * 25) + "%";

    let html = "";

    // STEP 1
    if (step === 1) {
      html = `
        <input id="name" placeholder="Nom" value="${formData.name}">
        <input id="address" placeholder="Adresse" value="${formData.address}">
        <input id="phone" placeholder="Téléphone" value="${formData.phone}">
      `;
    }

    // STEP 2
    if (step === 2) {
      html = `
        <input id="open" placeholder="Ouverture (08:00)" value="${formData.open}">
        <input id="close" placeholder="Fermeture (20:00)" value="${formData.close}">
      `;
    }

    // STEP 3
    if (step === 3) {
      html = `
        <div class="services">
          ${["PMU","Tabac","FDJ","Presse"].map(s => `
            <label>
              <input type="checkbox" value="${s}" ${formData.services.includes(s) ? "checked" : ""}>
              ${s}
            </label>
          `).join("")}
        </div>
      `;
    }

    // STEP 4 → MAP MODE
    if (step === 4) {
      formPopup.classList.add("hidden");
      alert("Clique sur la carte pour choisir 📍");
      return;
    }

    stepContent.innerHTML = html;
  }

  // =======================
  // NAV BUTTONS
  // =======================
  document.getElementById("nextBtn").onclick = () => {

    if (step === 1) {
      formData.name = document.getElementById("name").value;
      formData.address = document.getElementById("address").value;
      formData.phone = document.getElementById("phone").value;
    }

    if (step === 2) {
      formData.open = document.getElementById("open").value;
      formData.close = document.getElementById("close").value;
    }

    if (step === 3) {
      formData.services = [...document.querySelectorAll(".services input:checked")]
        .map(e => e.value);
    }

    step++;
    renderStep();
  };

  document.getElementById("prevBtn").onclick = () => {
    if (step > 1) {
      step--;
      renderStep();
    }
  };

  // =======================
  // MAP CLICK → INSERT
  // =======================
  map.on("click", async e => {

    if (step !== 4) return;

    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;

    const { data: { session } } = await client.auth.getSession();

    if (!session) {
      alert("Connecte-toi !");
      return;
    }

    const pmu = {
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      open_hour: formData.open,
      close_hour: formData.close,
      services: formData.services,
      lat: selectedLat,
      lng: selectedLng,
      user_id: session.user.id
    };

    const { error } = await client.from("pmu").insert([pmu]);

    if (error) {
      console.error(error);
      alert("Erreur insertion ❌");
      return;
    }

    alert("PMU ajouté ✅");

    // reset
    step = 1;
    formData = {
      name: "",
      address: "",
      phone: "",
      open: "",
      close: "",
      services: []
    };

    formPopup.classList.remove("hidden");
    renderStep();
    loadPMU();
  });

  // =======================
  // OPEN FORM
  // =======================
  document.getElementById("addBtn").onclick = () => {
    formPopup.classList.remove("hidden");
    renderStep();
  };

  // =======================
  // INIT
  // =======================
  loadPMU();

});
