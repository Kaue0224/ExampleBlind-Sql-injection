# Demonstração de SQL Injection e Blind SQL Injection

Aplicação web desenvolvida com fins exclusivamente educacionais, para demonstrar
na prática como vulnerabilidades de SQL Injection (incluindo Blind SQL Injection)
ocorrem e como podem ser exploradas em um sistema de autenticação e cadastro
de usuários.

## Aviso

Este projeto contém vulnerabilidades introduzidas de forma intencional.
O código não deve ser utilizado como referência de implementação segura e
não deve ser hospedado em ambientes de produção ou acessível publicamente
na internet.

O objetivo é unicamente demonstrar, em ambiente local e controlado, como
falhas de segurança em consultas SQL permitem a um atacante burlar
autenticação e extrair dados do banco.

## Tecnologias utilizadas

- Python 3
- Flask
- SQLite
- HTML, CSS e JavaScript puros

## Estrutura do projeto

```
crud_v2/
├── app.py
├── users.db
└── static/
    ├── login.html
    ├── cadastro.html
    ├── admin.html
    ├── style.css
    ├── login.js
    ├── cadastro.js
    └── admin.js
```

## Funcionalidades

- Cadastro de usuário (nome, email e senha obrigatórios)
- Autenticação por email e senha
- Painel administrativo restrito a usuários com permissão de administrador
- Listagem, busca e exclusão de usuários, disponíveis apenas ao administrador

## Instalação

Pré-requisitos: Python 3 instalado.

```bash
python -m pip install flask
```

## Execução

Dentro da pasta do projeto:

```bash
python app.py
```

A aplicação ficará disponível em:

```
http://localhost:5000
```

## Usuários de teste

| Email | Senha | Perfil |
|---|---|---|
| admin@sistema.com | S3nh4SuperSecreta! | Administrador |
| joao@email.com | 123456 | Usuário comum |
| maria@email.com | senha123 | Usuário comum |

## Natureza da vulnerabilidade

As consultas SQL das rotas de login, cadastro e busca de usuários são
construídas por concatenação direta de strings, sem uso de consultas
parametrizadas. Essa prática permite que valores enviados pelo usuário
sejam interpretados como código SQL, resultando em SQL Injection.

Exemplo da query vulnerável utilizada no login:

```python
query = f"SELECT id, name, email, is_admin FROM users WHERE email = '{email}' AND password = '{password}'"
```

## Exemplos de exploração

### Bypass de autenticação

No campo de email da tela de login:

```
admin@sistema.com' --
```

O caractere `--` comenta o restante da consulta SQL, eliminando a
verificação de senha e permitindo acesso como administrador sem
conhecimento da senha real.

### Blind SQL Injection

Na tela de cadastro, a verificação de email já existente retorna apenas
uma resposta booleana (email já cadastrado ou não), sem exibir dados.
Essa característica permite inferir informações do banco de dados
caractere por caractere, sem que nenhum dado seja exibido diretamente
na aplicação.

Descoberta do tamanho da senha:

```
admin@sistema.com' AND LENGTH(password)=18
```

Descoberta de cada caractere da senha:

```
admin@sistema.com' AND SUBSTR(password,1,1)='S
```

A resposta da aplicação (email já cadastrado ou não) indica se a condição
testada é verdadeira, permitindo reconstruir o valor da senha de forma
incremental.

## Correção recomendada

A mitigação consiste em substituir a concatenação de strings por consultas
parametrizadas, nas quais os valores fornecidos pelo usuário são tratados
exclusivamente como dados, nunca como código SQL executável.

```python
query = "SELECT id, name, email, is_admin FROM users WHERE email = ? AND password = ?"
cursor.execute(query, (email, password))
```

Outras boas práticas recomendadas:

- Armazenamento de senhas com hash (bcrypt ou argon2), nunca em texto puro
- Validação e sanitização de entradas no servidor
- Princípio do menor privilégio na conta de acesso ao banco de dados
- Monitoramento de logs para identificar padrões anômalos de requisições

## Licença

Projeto de uso educacional, sem licença comercial associada.
