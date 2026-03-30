const client = supabase.createClient("https://pngssqjrzkbbydwrqqtp.supabase.co/", "sb_publishable_DZV3RS-ZPiBEPlqRZNO9XQ_f2RifsOt");

signup.onclick = async () => {
  const { error } = await client.auth.signUp({
    email: email.value,
    password: password.value
  });

  alert(error ? error.message : "Compte créé !");
};

login.onclick = async () => {
  const { error } = await client.auth.signInWithPassword({
    email: email.value,
    password: password.value
  });

  if (!error) window.location.href = "index.html";
};