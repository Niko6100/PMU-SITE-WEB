document.addEventListener("DOMContentLoaded", () => {

  const client = supabase.createClient("https://pngssqjrzkbbydwrqqtp.supabase.co/", "sb_publishable_DZV3RS-ZPiBEPlqRZNO9XQ_f2RifsOt");

// MAP
const map = L.map('map').setView([48.8, 0.1], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
.addTo(map);

// =======================
// DATA
// =======================
let pmuData = [];
let selectedLat = null;
let selectedLng = null;

// =======================
// LOAD PMU
// =======================
async function loadPMU() {
const { data } = await client.from("pmu").select("*");
pmuData = data;
render();
}

function render() {
list.innerHTML = "";

pmuData.forEach(p => {
if (!p.lat) return;

const m = L.marker([p.lat, p.lng]).addTo(map);

m.on("click", () => showPMU(p));

const div = document.createElement("div");
div.className = "card";
div.innerHTML = `<b>${p.name}</b><br>${p.address}`;

div.onclick = () => {
map.setView([p.lat, p.lng], 15);
};

list.appendChild(div);
});

count.innerText = pmuData.length + " PMU";
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
// FORM STEPPER
// =======================
let step = 1;

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

if (step === 1) {
html = `
<input id="name" placeholder="Nom" value="${formData.name}">
<input id="address" placeholder="Adresse" value="${formData.address}">
<input id="phone" placeholder="Téléphone" value="${formData.phone}">
`;
}

if (step === 2) {
html = `
<input id="open" placeholder="Ouverture" value="${formData.open}">
<input id="close" placeholder="Fermeture" value="${formData.close}">
`;
}

if (step === 3) {
html = `
<div class="services">
${["PMU","Tabac","FDJ","Presse"].map(s => `
<label><input type="checkbox" value="${s}" ${formData.services.includes(s)?"checked":""}> ${s}</label>
`).join("")}
</div>
`;
}

if (step === 4) {
formPopup.classList.add("hidden");
alert("Clique sur la carte 📍");
return;
}

stepContent.innerHTML = html;
}

// NAV
nextBtn.onclick = () => {

if (step === 1) {
formData.name = name.value;
formData.address = address.value;
formData.phone = phone.value;
}

if (step === 2) {
formData.open = open.value;
formData.close = close.value;
}

if (step === 3) {
formData.services = [...document.querySelectorAll(".services input:checked")].map(e=>e.value);
}

step++;
renderStep();
};

prevBtn.onclick = () => {
if (step > 1) {
step--;
renderStep();
}
};

// =======================
// MAP CLICK
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
...formData,
lat: selectedLat,
lng: selectedLng,
user_id: session.user.id
};

await client.from("pmu").insert([pmu]);

alert("PMU ajouté ✅");

step = 1;
formPopup.classList.remove("hidden");
renderStep();
loadPMU();

});

// OPEN FORM
addBtn.onclick = () => {
formPopup.classList.remove("hidden");
renderStep();
};

loadPMU();

});
