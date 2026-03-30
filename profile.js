const client = supabase.createClient("https://pngssqjrzkbbydwrqqtp.supabase.co/", "sb_publishable_DZV3RS-ZPiBEPlqRZNO9XQ_f2RifsOt");

async function loadProfile() {
  const { data } = await client.auth.getUser();

  if (!data.user) {
    window.location.href = "auth.html";
    return;
  }

  email.innerText = data.user.email;

  const { count } = await client
    .from("pmu")
    .select("*", { count: "exact", head: true })
    .eq("user_id", data.user.id);

  countPMU.innerText = count;
}

logout.onclick = async () => {
  await client.auth.signOut();
  window.location.href = "auth.html";
};

loadProfile();