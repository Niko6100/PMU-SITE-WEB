const supabase = supabase.createClient(
  "https://pngssqjrzkbbydwrqqtp.supabase.co",
  "sb_publishable_DZV3RS-ZPiBEPlqRZNO9XQ_f2RifsOt"
);

// MAP
const map = L.map('map').setView([48.8, 0.1], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
  .addTo(map);

// Charger PMU
async function loadPMU() {
  const { data } = await supabase
    .from('pmu')
    .select('*');

  data.forEach(p => {
    L.marker([p.lat, p.lng])
      .addTo(map)
      .bindPopup(`<b>${p.name}</b><br>${p.address}`);
  });
}

loadPMU();

// FORMULAIRE
const formContainer = document.getElementById("formContainer");
const addBtn = document.getElementById("addBtn");

addBtn.onclick = () => {
  formContainer.classList.toggle("hidden");
};

// Click map pour coords
map.on("click", function(e) {
  document.getElementById("lat").value = e.latlng.lat;
  document.getElementById("lng").value = e.latlng.lng;
});

// Envoi
document.getElementById("pmuForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const pmu = {
    name: document.getElementById("name").value,
    address: document.getElementById("address").value,
    phone: document.getElementById("phone").value,
    lat: parseFloat(document.getElementById("lat").value),
    lng: parseFloat(document.getElementById("lng").value)
  };

  const { error } = await supabase.from("pmu").insert([pmu]);

  if (error) {
    console.error(error);
    alert("Erreur !");
  } else {
    alert("PMU ajouté !");
    location.reload();
  }
});
