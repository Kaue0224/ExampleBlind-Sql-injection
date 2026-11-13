const LAB_STEPS = [
  {
    title: "1. O que é este laboratório",
    body: `
      <p>Esta aplicação é um CRUD de usuários feito para estudo de segurança.</p>
      <p>Ela contém falhas de SQL Injection <strong>de propósito</strong>, para você observar como consultas mal montadas se comportam em um sistema real.</p>
      <ul>
        <li>Use apenas em ambiente local.</li>
        <li>Não hospede publicamente.</li>
        <li>O objetivo é entender a causa e a correção.</li>
      </ul>
    `
  },
  {
    title: "2. Fluxo da aplicação",
    body: `
      <p>Há três telas principais:</p>
      <ul>
        <li><strong>Entrar</strong> — autentica email e senha.</li>
        <li><strong>Criar conta</strong> — cadastra usuário e verifica se o email já existe.</li>
        <li><strong>Painel admin</strong> — lista, busca e remove usuários (somente administrador).</li>
      </ul>
      <p>O backend usa Flask + SQLite. A sessão guarda se o usuário logado é admin.</p>
    `
  },
  {
    title: "3. O problema: concatenação",
    body: `
      <p>Várias rotas montam SQL juntando texto do usuário diretamente na string da consulta.</p>
      <pre class="code-bad">query = f"SELECT ... WHERE email = '{email}' AND password = '{password}'"
cursor.execute(query)</pre>
      <p>Nesse padrão, o valor digitado deixa de ser só <em>dado</em> e pode ser interpretado como <em>parte do SQL</em>.</p>
      <p>É essa mistura entre código e entrada do usuário que cria a vulnerabilidade.</p>
    `
  },
  {
    title: "4. Blind SQL Injection (conceito)",
    body: `
      <p><strong>Blind</strong> significa que a aplicação não devolve o conteúdo do banco na resposta.</p>
      <p>Ainda assim, respostas do tipo “sucesso / erro” ou “email já cadastrado / livre” revelam se uma condição SQL foi verdadeira ou falsa.</p>
      <p>Com isso, um atacante pode <em>inferir</em> informação aos poucos, sem ver uma tabela completa na tela.</p>
      <p>Nesta demo, o cadastro é o exemplo clássico: a checagem de email duplicado responde de forma booleana.</p>
    `
  },
  {
    title: "5. Onde a falha aparece aqui",
    body: `
      <p>Pontos intencionalmente vulneráveis neste projeto:</p>
      <ul>
        <li><code>POST /api/login</code> — autenticação por concatenação.</li>
        <li><code>POST /api/users</code> — checagem e insert de cadastro por concatenação.</li>
        <li><code>POST /api/users/search</code> — busca admin com <code>LIKE</code> concatenado.</li>
      </ul>
      <p>Observe o código em <code>app.py</code>: sempre que houver <code>f"...</code> montando SQL, há risco.</p>
      <p>A exclusão de usuário e a listagem simples já usam (ou podem usar) consultas sem concatenação — compare os trechos.</p>
    `
  },
  {
    title: "6. Como corrigir",
    body: `
      <p>Separe a estrutura do SQL dos valores. Use parâmetros:</p>
      <pre class="code-good">query = "SELECT id, name, email, is_admin FROM users WHERE email = ? AND password = ?"
cursor.execute(query, (email, password))</pre>
      <p>Boas práticas adicionais:</p>
      <ul>
        <li>Guardar senha com hash (bcrypt/argon2), nunca em texto puro.</li>
        <li>Validar entradas no servidor.</li>
        <li>Conceder ao banco apenas as permissões necessárias.</li>
        <li>Monitorar padrões anômalos de requisição.</li>
      </ul>
      <p>Com parâmetros, a entrada continua sendo dado — não vira SQL executável.</p>
    `
  }
];

function createLabSidebar() {
  const root = document.createElement("aside");
  root.className = "lab-sidebar";
  root.setAttribute("aria-label", "Guia pedagógico do laboratório");

  const saved = Number(localStorage.getItem("labStep") || 0);
  let step = Number.isFinite(saved) ? Math.min(Math.max(saved, 0), LAB_STEPS.length - 1) : 0;

  root.innerHTML = `
    <div class="lab-sidebar-header">
      <div>
        <p class="lab-kicker">Laboratório</p>
        <h1 class="lab-title">Guia de estudo</h1>
      </div>
      <button type="button" class="lab-close" aria-label="Fechar guia">×</button>
    </div>
    <ol class="lab-steps" id="labStepsNav"></ol>
    <div class="lab-panel">
      <h2 id="labStepTitle"></h2>
      <div id="labStepBody" class="lab-step-body"></div>
    </div>
    <div class="lab-nav">
      <button type="button" id="labPrev" class="lab-btn secondary">Anterior</button>
      <span id="labCounter" class="lab-counter"></span>
      <button type="button" id="labNext" class="lab-btn">Próximo</button>
    </div>
  `;

  const nav = root.querySelector("#labStepsNav");
  LAB_STEPS.forEach((item, index) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lab-step-btn";
    btn.textContent = item.title.replace(/^\d+\.\s*/, "");
    btn.dataset.index = String(index);
    btn.addEventListener("click", () => {
      step = index;
      render();
    });
    li.appendChild(btn);
    nav.appendChild(li);
  });

  function render() {
    localStorage.setItem("labStep", String(step));
    root.querySelector("#labStepTitle").textContent = LAB_STEPS[step].title;
    root.querySelector("#labStepBody").innerHTML = LAB_STEPS[step].body;
    root.querySelector("#labCounter").textContent = `${step + 1} / ${LAB_STEPS.length}`;
    root.querySelector("#labPrev").disabled = step === 0;
    root.querySelector("#labNext").disabled = step === LAB_STEPS.length - 1;
    root.querySelectorAll(".lab-step-btn").forEach((btn, index) => {
      btn.classList.toggle("active", index === step);
    });
  }

  root.querySelector("#labPrev").addEventListener("click", () => {
    if (step > 0) {
      step -= 1;
      render();
    }
  });

  root.querySelector("#labNext").addEventListener("click", () => {
    if (step < LAB_STEPS.length - 1) {
      step += 1;
      render();
    }
  });

  root.querySelector(".lab-close").addEventListener("click", () => {
    document.body.classList.remove("lab-open");
  });

  render();
  return root;
}

function createLabToggle() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "lab-toggle";
  btn.textContent = "Guia de estudo";
  btn.addEventListener("click", () => {
    document.body.classList.toggle("lab-open");
  });
  return btn;
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("has-lab");
  document.body.appendChild(createLabSidebar());
  document.body.appendChild(createLabToggle());
  if (!localStorage.getItem("labSidebarSeen")) {
    document.body.classList.add("lab-open");
    localStorage.setItem("labSidebarSeen", "1");
  }
});
