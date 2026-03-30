// connexion Supabase
const client = window.supabase.createClient(
  "https://pngssqjrzkbbydwrqqtp.supabase.co",
  "sb_publishable_DZV3RS-ZPiBEPlqRZNO9XQ_f2RifsOt"
);

const map = L.map('map').setView([48.8, 0.1], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let userPos = null;
let pmuData = [];
let markers = [];

// 📍 géolocalisation
document.getElementById("locate").onclick = () => {
  navigator.geolocation.getCurrentPosition(pos => {
    userPos = [pos.coords.latitude, pos.coords.longitude];
    map.setView(userPos, 12);
  });
};

// ❤️ favoris
function getFavorites() {
  return JSON.parse(localStorage.getItem("fav") || "[]");
}

function toggleFav(id) {
  let fav = getFavorites();
  if (fav.includes(id)) {
    fav = fav.filter(f => f !== id);
  } else {
    fav.push(id);
  }
  localStorage.setItem("fav", JSON.stringify(fav));
  renderList(pmuData);
}

// 📊 distance
function getDistance(a, b) {
  return map.distance(a, b) / 1000;
}

// 🔥 charger PMU
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

    m.on("click", () => showPopup(p));

    markers.push(m);
  });
}

// 📋 sidebar
function renderList(data) {
  const list = document.getElementById("list");
  list.innerHTML = "";

  const fav = getFavorites();

  data.forEach(p => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <b>${p.name}</b><br>
      ${p.address}<br>
      <button onclick="event.stopPropagation(); toggleFav('${p.id}')">
        ${fav.includes(p.id) ? "❤️" : "🤍"}
      </button>
    `;

    div.onclick = () => {
      map.setView([p.lat, p.lng], 15);
      showPopup(p);
    };

    list.appendChild(div);
  });
}

// 📍 popup
function showPopup(p) {
  const popup = document.getElementById("popup");

  popup.innerHTML = `
    <h3>${p.name}</h3>
    <p>${p.address}</p>
    <p>${p.phone || ""}</p>
  `;

  popup.classList.remove("hidden");
}

// 🔍 filtre distance
document.getElementById("search").addEventListener("input", e => {
  const val = e.target.value.toLowerCase();

  const filtered = pmuData.filter(p =>
    p.name.toLowerCase().includes(val)
  );

  renderList(filtered);
});

loadPMU();
