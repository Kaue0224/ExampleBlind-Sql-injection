const loginResult = document.getElementById("loginResult");

document.getElementById("btnLogin").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const resp = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await resp.json();

  if (data.error) {
    loginResult.textContent = "❌ " + data.error;
    loginResult.style.color = "#f44336";
  } else {
    loginResult.textContent = "✅ " + data.message;
    loginResult.style.color = "#4caf50";

    if (data.is_admin) {
      window.location.href = "/admin";
    } else {
      loginResult.textContent += " (usuário comum, sem acesso ao painel admin)";
    }
  }
});
