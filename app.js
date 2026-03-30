// connexion Supabase
const client = window.supabase.createClient(
  "https://pngssqjrzkbbydwrqqtp.supabase.co",
  "sb_publishable_DZV3RS-ZPiBEPlqRZNO9XQ_f2RifsOt"
);

// =======================
// MAP
// =======================
const map = L.map('map').setView([48.8, 0.1], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
  .addTo(map);

// =======================
// CHARGER LES PMU
// =======================
async function loadPMU() {
  const { data, error } = await client
    .from('pmu')
    .select('*');

  if (error) {
    console.error("Erreur chargement :", error);
    return;
  }

  data.forEach(p => {
    if (p.lat && p.lng) {
      L.marker([p.lat, p.lng])
        .addTo(map)
        .bindPopup(`<b>${p.name}</b><br>${p.address || ""}`);
    }
  });
}

loadPMU();

// =======================
// FORMULAIRE
// =======================
const formContainer = document.getElementById("formContainer");
const addBtn = document.getElementById("addBtn");

addBtn.onclick = () => {
  formContainer.classList.toggle("hidden");
};

// =======================
// CLICK MAP → coordonnées
// =======================
map.on("click", function(e) {
  document.getElementById("lat").value = e.latlng.lat;
  document.getElementById("lng").value = e.latlng.lng;
});

// =======================
// ENVOI FORMULAIRE
// =======================
document.getElementById("pmuForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const pmu = {
    name: document.getElementById("name").value,
    address: document.getElementById("address").value,
    phone: document.getElementById("phone").value,
    lat: parseFloat(document.getElementById("lat").value),
    lng: parseFloat(document.getElementById("lng").value)
  };

  const { error } = await client.from("pmu").insert([pmu]);

  if (error) {
    console.error("Erreur insertion :", error);
    alert("Erreur lors de l'ajout ❌");
  } else {
    alert("PMU ajouté ✅");

    // recharge les markers sans reload
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    loadPMU();
  }
});

// =======================
// AUTHENTIFICATION
// =======================

document.addEventListener("DOMContentLoaded", () => {

  const signupBtn = document.getElementById("signup");
  const loginBtn = document.getElementById("login");
  const logoutBtn = document.getElementById("logout"); // optionnel

  // =======================
  // INSCRIPTION
  // =======================
if (signupBtn) {
  signupBtn.onclick = async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Remplis les champs !");
      return;
    }

    const { data, error } = await client.auth.signUp({
      email: email,
      password: password
    });

    console.log("SIGNUP:", data, error);

    if (error) {
      alert(error.message);
    } else {
      alert("Compte créé !");
    }
  };
}

  // =======================
  // CONNEXION
  // =======================
  if (loginBtn) {
    loginBtn.onclick = async () => {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const { error } = await client.auth.signInWithPassword({
        email,
        password
  });

      if (error) {
        alert(error.message);
      } else {
        alert("Connecté !");
        checkUser(); // met à jour l'état
      }
    };
  }

  // =======================
  // DECONNEXION (OPTIONNEL)
  // =======================
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      await client.auth.signOut();
      alert("Déconnecté !");
      checkUser();
    };
  }

  // =======================
  // VERIFIER UTILISATEUR
  // =======================
  async function checkUser() {
    const { data } = await client.auth.getUser();

    if (data.user) {
      console.log("Utilisateur connecté :", data.user.email);

      // exemple : afficher email
      if (document.getElementById("userEmail")) {
        document.getElementById("userEmail").innerText = data.user.email;
      }

    } else {
      console.log("Aucun utilisateur connecté");
    }
  }

  // check au chargement
  checkUser();

});
