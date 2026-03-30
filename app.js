// connexion Supabase
const client = window.supabase.createClient(
  "https://pngssqjrzkbbydwrqqtp.supabase.co",
  "sb_publishable_DZV3RS-ZPiBEPlqRZNO9XQ_f2RifsOt"
);

const map = L.map('map').setView([48.8, 0.1], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let pmuData = [];
let markers = [];

/* FAVORIS */
function getFav() {
  return JSON.parse(localStorage.getItem("fav") || "[]");
}

function toggleFav(id) {
  let fav = getFav();

  if (fav.includes(id)) {
    fav = fav.filter(f => f !== id);
  } else {
    fav.push(id);
  }

  localStorage.setItem("fav", JSON.stringify(fav));
  renderList(pmuData);
}

/* LOAD PMU */
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
    const m = L.marker([p.lat, p.lng]).addTo(map);

    m.on("click", () => showPMUCard(p));

    markers.push(m);
  });

  document.getElementById("count").innerText = pmuData.length + " PMU trouvés";
}

/* SIDEBAR */
function renderList(data) {
  const list = document.getElementById("list");
  list.innerHTML = "";

  const fav = getFav();

  data.forEach(p => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <b>${p.name}</b><br>
      ${p.address}<br>

      <div>
        <span class="badge">PMU</span>
        <span class="badge">Tabac</span>
      </div>

      <button onclick="event.stopPropagation(); toggleFav('${p.id}')">
        ${fav.includes(p.id) ? "❤️" : "🤍"}
      </button>
    `;

    div.onclick = () => {
      map.setView([p.lat, p.lng], 15);
      showPMUCard(p);
    };

    list.appendChild(div);
  });
}

/* POPUP PMU */
function showPMUCard(p) {
  const card = document.getElementById("pmuCard");

  card.innerHTML = `
    <div class="pmu-header">${p.name}</div>

    <div class="pmu-body">

      📍 ${p.address}<br><br>
      📞 ${p.phone || "Non dispo"}

      <button class="btn"
        onclick="window.open('https://www.google.com/maps?q=${p.lat},${p.lng}')">
        Itinéraire Google Maps
      </button>

    </div>
  `;

  card.classList.remove("hidden");
}

/* SEARCH */
document.getElementById("search").addEventListener("input", e => {
  const val = e.target.value.toLowerCase();

  const filtered = pmuData.filter(p =>
    p.name.toLowerCase().includes(val)
  );

  renderList(filtered);
});

/* START */
loadPMU();
