
const client = supabase.createClient("https://pngssqjrzkbbydwrqqtp.supabase.co/", "sb_publishable_DZV3RS-ZPiBEPlqRZNO9XQ_f2RifsOt");

const map = L.map('map').setView([48.8, 0.1], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let pmuData = [];
let markers = [];

/* LOAD */
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

    m.on("click", () => showPMU(p));

    markers.push(m);
  });

  document.getElementById("count").innerText = pmuData.length + " PMU trouvés";
}

/* LIST */
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

/* PMU CARD */
function showPMU(p) {
  const card = document.getElementById("pmuCard");

  card.innerHTML = `
    <div class="pmu-header">${p.name}</div>
    <div class="pmu-body">
      📍 ${p.address}<br><br>
      📞 ${p.phone || ""}
    </div>
  `;

  card.classList.remove("hidden");
}

/* ADD PMU */
document.getElementById("addBtn").onclick = () => {
  document.getElementById("formPopup").classList.remove("hidden");
};

document.getElementById("submitPMU").onclick = async () => {

  const { data } = await client.auth.getUser();

  if (!data.user) {
    alert("Connecte-toi !");
    return;
  }

  const pmu = {
    name: name.value,
    address: address.value,
    phone: phone.value,
    lat: parseFloat(lat.value),
    lng: parseFloat(lng.value),
    user_id: data.user.id
  };

  await client.from("pmu").insert([pmu]);

  location.reload();
};

/* SEARCH */
document.getElementById("search").addEventListener("input", e => {
  const val = e.target.value.toLowerCase();

  renderList(
    pmuData.filter(p => p.name.toLowerCase().includes(val))
  );
});

loadPMU();
