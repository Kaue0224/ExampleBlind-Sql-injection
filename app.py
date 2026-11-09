"""
CRUD DE DEMONSTRACAO - vulneravel a SQL Injection (inclusive Blind) de proposito.
Fins didaticos apenas. NUNCA use este padrao em producao.

Separacao de telas:
- "/"            -> tela inicial (login ou criar conta)
- "/cadastro"    -> criar conta
- "/admin"       -> painel, SOMENTE para quem esta logado como admin
"""

from flask import Flask, request, jsonify, send_from_directory, session, redirect
import sqlite3

app = Flask(__name__, static_folder="static")
app.secret_key = "demo-secret-key-nao-use-em-producao"  # so para fins didaticos
DB_PATH = "users.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ---------------------------------------------------------
# PAGINAS (HTML)
# ---------------------------------------------------------
@app.route("/")
def index():
    return send_from_directory("static", "login.html")


@app.route("/cadastro")
def cadastro_page():
    return send_from_directory("static", "cadastro.html")


@app.route("/admin")
def admin_page():
    # Protecao no lado do servidor: so entra quem tem sessao de admin.
    # (O conteudo da pagina em si so e liberado apos essa checagem.)
    if not session.get("is_admin"):
        return redirect("/")
    return send_from_directory("static", "admin.html")


# ---------------------------------------------------------
# LOGIN - Vulneravel de proposito (concatenacao direta)
# Esse e o ponto principal da demonstracao de Blind SQLi.
# ---------------------------------------------------------
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    email = data.get("email", "")
    password = data.get("password", "")

    conn = get_connection()
    cur = conn.cursor()

    # VULNERAVEL: concatenacao direta
    query = f"SELECT id, name, email, is_admin FROM users WHERE email = '{email}' AND password = '{password}'"

    try:
        cur.execute(query)
        user = cur.fetchone()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 200

    conn.close()

    if user:
        session["user_id"] = user["id"]
        session["is_admin"] = bool(user["is_admin"])
        return jsonify({
            "message": "Login realizado",
            "is_admin": bool(user["is_admin"])
        })
    else:
        return jsonify({"error": "Email ou senha invalidos"}), 200


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logout realizado"})


# ---------------------------------------------------------
# CADASTRO - tambem vulneravel (check de email existente)
# Esse e o cenario que voce perguntou antes.
# ---------------------------------------------------------
@app.route("/api/users", methods=["POST"])
def create_user():
    data = request.get_json(force=True)
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    # Validacao: nome, email e senha sao obrigatorios
    if not name or not email or not password:
        return jsonify({"error": "Nome, email e senha sao obrigatorios"}), 200

    conn = get_connection()
    cur = conn.cursor()

    # VULNERAVEL: concatenacao direta na checagem de email duplicado
    check_query = f"SELECT id FROM users WHERE email = '{email}'"
    try:
        cur.execute(check_query)
        existing = cur.fetchone()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 200

    if existing:
        conn.close()
        return jsonify({"error": "Email ja cadastrado"}), 200

    insert_query = f"INSERT INTO users (name, email, password) VALUES ('{name}', '{email}', '{password}')"
    try:
        cur.execute(insert_query)
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 200

    conn.close()
    return jsonify({"message": "Usuario criado com sucesso"})


# ---------------------------------------------------------
# A PARTIR DAQUI: SOMENTE ADMIN
# ---------------------------------------------------------
def admin_required():
    return session.get("is_admin") is True


@app.route("/api/users", methods=["GET"])
def list_users():
    if not admin_required():
        return jsonify({"error": "Acesso negado"}), 403

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, is_admin FROM users")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(rows)


@app.route("/api/users/search", methods=["POST"])
def search_user():
    if not admin_required():
        return jsonify({"error": "Acesso negado"}), 403

    data = request.get_json(force=True)
    name = data.get("name", "")

    conn = get_connection()
    cur = conn.cursor()

    # VULNERAVEL: concatenacao direta (uso restrito a admin logado,
    # mas serve para estudar o ataque "de dentro" tambem)
    query = f"SELECT id, name, email, is_admin FROM users WHERE name LIKE '%{name}%'"
    try:
        cur.execute(query)
        rows = [dict(r) for r in cur.fetchall()]
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": str(e)}), 200

    conn.close()
    return jsonify(rows)


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    if not admin_required():
        return jsonify({"error": "Acesso negado"}), 403

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Usuario removido"})


@app.route("/api/me", methods=["GET"])
def me():
    return jsonify({
        "logged_in": "user_id" in session,
        "is_admin": session.get("is_admin", False)
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
