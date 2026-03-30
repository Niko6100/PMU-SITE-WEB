const client = supabase.createClient("https://pngssqjrzkbbydwrqqtp.supabase.co/", "sb_publishable_DZV3RS-ZPiBEPlqRZNO9XQ_f2RifsOt");

const map = L.map('map').setView([48.8, 0.1], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let pmuData = [];
let markers = [];

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
      📍 ${p.address}<br><br>
      📞 ${p.phone || ""}
    </div>
  `;
  pmuCard.classList.remove("hidden");
}

addBtn.onclick = () => formPopup.classList.remove("hidden");

submitPMU.onclick = async () => {
  const { data } = await client.auth.getUser();

  if (!data.user) {
    alert("Connecte-toi !");
    return;
  }

  await client.from("pmu").insert([{
    name: name.value,
    address: address.value,
    phone: phone.value,
    lat: parseFloat(lat.value),
    lng: parseFloat(lng.value),
    user_id: data.user.id
  }]);

  location.reload();
};

search.oninput = () => {
  renderList(
    pmuData.filter(p => p.name.toLowerCase().includes(search.value.toLowerCase()))
  );
};

loadPMU();