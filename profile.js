const client = supabase.createClient("https://pngssqjrzkbbydwrqqtp.supabase.co/", "sb_publishable_DZV3RS-ZPiBEPlqRZNO9XQ_f2RifsOt");

async function loadProfile() {
  const { data } = await client.auth.getUser();

  if (!data.user) {
    window.location.href = "auth.html";
    return;
  }

  email.innerText = data.user.email;

  const { count: pmuCount } = await client
    .from("pmu")
    .select("*", { count: "exact", head: true })
    .eq("user_id", data.user.id);

  countPMU.innerText = pmuCount;

  const { count: favCount } = await client
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", data.user.id);

  countFav.innerText = favCount;

  const { data: reviews } = await client
    .from("reviews")
    .select("rating")
    .eq("user_id", data.user.id);

  let avg = 0;

  if (reviews.length > 0) {
    avg = reviews.reduce((a, b) => a + b.rating, 0) / reviews.length;
  }

  avgNote.innerText = avg.toFixed(1);
}

logout.onclick = async () => {
  await client.auth.signOut();
  window.location.href = "auth.html";
};

loadProfile();