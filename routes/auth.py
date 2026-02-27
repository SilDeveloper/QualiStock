from flask import Blueprint, render_template, request, redirect, session, jsonify
from database import conectar_bd
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint('auth', __name__)

# ============ ROTAS PÚBLICAS ============

@auth_bp.route('/')
def index():
    return redirect('/login')


@auth_bp.route('/login')
def login_page():
    return render_template('login.html')


@auth_bp.route('/cadastro')
def cadastro():
    return render_template('cadastro.html')


@auth_bp.route('/registrar', methods=['POST'])
def registrar():

    nome = request.form.get('nome')
    email = request.form.get('email')
    usuario = request.form.get('usuario')
    senha = request.form.get('senha')

    db = conectar_bd()

    existente = db.execute(
        "SELECT * FROM usuarios WHERE usuario = ?",
        (usuario,)
    ).fetchone()

    if existente:
        return jsonify({"mensagem": "Usuário já existe."}), 400

    db.execute("""
        INSERT INTO usuarios
        (nome, email, usuario, senha, nome_completo, matricula, cargo)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        nome,
        email,
        usuario,
        generate_password_hash(senha),
        nome,
        "—",
        "Operador"
    ))

    db.commit()

    return jsonify({"status": "sucesso"})

@auth_bp.route('/login', methods=['POST'])
def login():

    usuario = request.form.get('usuario')
    senha_digitada = request.form.get('senha')

    db = conectar_bd()

    # 🔎 Busca apenas pelo usuário
    auth = db.execute(
        'SELECT * FROM usuarios WHERE usuario = ?',
        (usuario,)
    ).fetchone()

    if not auth:
        return jsonify({"status": "erro", "mensagem": "Usuário ou senha inválidos"}), 401

    # 🔐 Agora compara o hash corretamente
    if not check_password_hash(auth['senha'], senha_digitada):
        return jsonify({"status": "erro", "mensagem": "Usuário ou senha inválidos"}), 401

    # 🔒 Sessão real baseada no banco
    session['usuario_id'] = auth['id']
    session['nome_completo'] = auth['nome_completo']
    session['matricula'] = auth['matricula']
    session['cargo'] = auth['cargo']

    return jsonify({"status": "sucesso"})


@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect('/login')

# BLUEPRINT - MODULARIZAÇÃO DO FLASK
'''
📦 Uma forma de dividir seu aplicativo Flask em blocos organizados.
Em vez de colocar todas as rotas dentro de um único app.py, você cria “mini-aplicações” 
e depois conecta tudo no app principal.
'''