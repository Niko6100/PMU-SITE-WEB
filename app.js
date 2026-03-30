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

  let selectedLat = null;
  let selectedLng = null;

  // =======================
  // LOAD PMU
  // =======================
  async function loadPMU() {
    const { data, error } = await client.from("pmu").select("*");

    if (error) {
      console.error(error);
      return;
    }

    pmuData = data;
    renderAll();
  }

  // =======================
  // RENDER
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

    const count = document.getElementById("count");
    if (count) {
      count.innerText = pmuData.length + " PMU trouvés";
    }
  }

  // =======================
  // LIST
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
  // CARD PMU
  // =======================
  function showPMU(p) {
    const card = document.getElementById("pmuCard");
    if (!card) return;

    card.innerHTML = `
      <div class="pmu-header">${p.name}</div>
      <div class="pmu-body">
        📍 ${p.address}<br>
        📞 ${p.phone || ""}<br>
        🕒 ${p.open || ""} - ${p.close || ""}<br>
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
      renderList(
        pmuData.filter(p =>
          p.name.toLowerCase().includes(search.value.toLowerCase())
        )
      );
    };
  }

  // =======================
  // AUTH CHECK
  // =======================
  async function checkAuthUI() {
    const { data: { session } } = await client.auth.getSession();

    const addBtn = document.getElementById("addBtn");

    if (!session) {
      if (addBtn) addBtn.style.display = "none";
    }
  }

  checkAuthUI();

  // =======================
  // OPEN FORM
  // =======================
  const addBtn = document.getElementById("addBtn");
  const formPopup = document.getElementById("formPopup");

  if (addBtn && formPopup) {
    addBtn.onclick = () => {
      formPopup.classList.remove("hidden");
    };
  }

  // =======================
  // MULTI STEP FORM
  // =======================
  let currentStep = 1;
  const totalSteps = 4;

  const steps = [
    document.getElementById("step1"),
    document.getElementById("step2"),
    document.getElementById("step3"),
    document.getElementById("step4")
  ];

  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  function showStep(n) {
    steps.forEach((s, i) => {
      if (!s) return;
      s.classList.toggle("hidden", i !== n - 1);
    });

    if (prevBtn) {
      prevBtn.style.display = n === 1 ? "none" : "block";
    }

    if (nextBtn) {
      nextBtn.innerText = n === totalSteps ? "Valider ✅" : "Suivant ➡";
    }
  }

  showStep(currentStep);

  // NEXT
  if (nextBtn) {
    nextBtn.onclick = async () => {

      if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
      } else {

        const { data: { session } } = await client.auth.getSession();

        if (!session) {
          alert("Connecte-toi !");
          return;
        }

        if (!selectedLat) {
          alert("Clique sur la carte !");
          return;
        }

        const services = [...document.querySelectorAll(".services input:checked")]
          .map(e => e.value);

        const pmu = {
          name: document.getElementById("name").value,
          address: document.getElementById("address").value,
          phone: document.getElementById("phone").value,
          open: document.getElementById("open").value,
          close: document.getElementById("close").value,
          services,
          lat: selectedLat,
          lng: selectedLng,
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
      }
    };
  }

  // PREV
  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
      }
    };
  }

  // =======================
  // MAP CLICK (STEP 4 ONLY)
  // =======================
  map.on("click", e => {

    if (currentStep !== 4) return;

    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;

    const preview = document.getElementById("coordsPreview");

    if (preview) {
      preview.innerText =
        `📍 ${selectedLat.toFixed(5)}, ${selectedLng.toFixed(5)}`;
    }
  });

  // =======================
  // INIT
  // =======================
  loadPMU();

});
