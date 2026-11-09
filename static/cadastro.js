const regResult = document.getElementById("regResult");

document.getElementById("btnRegister").addEventListener("click", async () => {
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  if (!name || !email || !password) {
    regResult.textContent = "❌ Preencha nome, email e senha";
    regResult.style.color = "#f44336";
    return;
  }

  const resp = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });
  const data = await resp.json();

  if (data.error) {
    regResult.textContent = "❌ " + data.error;
    regResult.style.color = "#f44336";
  } else {
    regResult.textContent = "✅ " + data.message + " — redirecionando para login...";
    regResult.style.color = "#4caf50";
    setTimeout(() => { window.location.href = "/"; }, 1200);
  }
});
