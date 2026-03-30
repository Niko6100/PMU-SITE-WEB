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
  const { data } = await client.from("pmu").select("*");
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

  document.getElementById("count").innerText =
    pmuData.length + " PMU trouvés";
}

// =======================
// SIDEBAR LIST
// =======================
function renderList(data) {
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
// PMU CARD
// =======================
function showPMU(p) {
  const card = document.getElementById("pmuCard");

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
document.getElementById("search").addEventListener("input", e => {
  const val = e.target.value.toLowerCase();

  const filtered = pmuData.filter(p =>
    p.name.toLowerCase().includes(val)
  );

  renderList(filtered);
});

// =======================
// AUTH CHECK (IMPORTANT)
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
// ADD PMU
// =======================
const addBtn = document.getElementById("addBtn");
const formPopup = document.getElementById("formPopup");

addBtn.onclick = () => {
  formPopup.classList.remove("hidden");
};

// =======================
// CLICK MAP → auto coords
// =======================
map.on("click", function(e) {
  document.getElementById("lat").value = e.latlng.lat;
  document.getElementById("lng").value = e.latlng.lng;
});

// =======================
// SUBMIT PMU (FIX SESSION)
// =======================
document.getElementById("submitPMU").onclick = async () => {

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
    console.error(error);
    alert("Erreur lors de l'ajout ❌");
  } else {
    alert("PMU ajouté ✅");

    formPopup.classList.add("hidden");

    loadPMU();
  }
};

// =======================
// INIT
// =======================
loadPMU();
