const searchResult = document.getElementById("searchResult");
const tableBody = document.querySelector("#usersTable tbody");

document.getElementById("btnLogout").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "/";
});

document.getElementById("btnSearch").addEventListener("click", async () => {
  const name = document.getElementById("searchName").value;

  const resp = await fetch("/api/users/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  const data = await resp.json();

  if (data.error) {
    searchResult.textContent = "❌ " + data.error;
    searchResult.style.color = "#f44336";
  } else {
    searchResult.textContent = `Encontrados: ${data.length}`;
    searchResult.style.color = "#4caf50";
    renderUsers(data);
  }
});

document.getElementById("btnList").addEventListener("click", loadUsers);

async function loadUsers() {
  const resp = await fetch("/api/users");
  if (resp.status === 403) {
    window.location.href = "/";
    return;
  }
  const data = await resp.json();
  renderUsers(data);
}

function renderUsers(users) {
  tableBody.innerHTML = "";
  users.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email || ""}</td>
      <td>${u.is_admin ? "Sim" : "Não"}</td>
      <td><button class="delete-btn" data-id="${u.id}">Excluir</button></td>
    `;
    tableBody.appendChild(tr);
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      loadUsers();
    });
  });
}

loadUsers();
