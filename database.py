import sqlite3
import os
from werkzeug.security import generate_password_hash
from datetime import datetime

# 🔥 Define caminho fixo do banco na mesma pasta do projeto
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CAMINHO_BANCO = os.path.join(BASE_DIR, "sistema.db")

def conectar_bd():
    conn = sqlite3.connect(CAMINHO_BANCO, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with conectar_bd() as db:

        # ================= USUÁRIOS =================
        db.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT,
                email TEXT,
                usuario TEXT UNIQUE,
                senha TEXT,
                nome_completo TEXT,
                matricula TEXT,
                cargo TEXT
            )
        """)

        # ================= PRODUTOS =================
        db.execute("""
            CREATE TABLE IF NOT EXISTS produtos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                preco REAL NOT NULL,
                qtd INTEGER NOT NULL,
                promocao REAL DEFAULT 0,
                ativo INTEGER DEFAULT 1
            )
        """)

        # ================= COMBOS =================
        db.execute("""
            CREATE TABLE IF NOT EXISTS combos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                descricao TEXT,
                desconto REAL DEFAULT 0,
                preco_final REAL NOT NULL,
                ativo INTEGER DEFAULT 1
            )
        """)

        # ================= COMBO_ITENS =================
        db.execute("""
            CREATE TABLE IF NOT EXISTS combo_itens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                combo_id INTEGER,
                produto_id INTEGER,
                quantidade INTEGER,
                FOREIGN KEY(combo_id) REFERENCES combos(id),
                FOREIGN KEY(produto_id) REFERENCES produtos(id)
            )
        """)

        # ================= MIGRAÇÃO AUTOMÁTICA =================
        try:
            db.execute("ALTER TABLE produtos ADD COLUMN ativo INTEGER DEFAULT 1")
        except:
            pass

        try:
            db.execute("ALTER TABLE combos ADD COLUMN ativo INTEGER DEFAULT 1")
        except:
            pass

        # ================= USUÁRIO PADRÃO =================
        if not db.execute("SELECT * FROM usuarios").fetchone():
            db.execute("""
                INSERT INTO usuarios 
                (nome, email, usuario, senha, nome_completo, matricula, cargo)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                "Administrador",
                "admin@email.com",
                "admin",
                generate_password_hash("123"),
                "Administrador",
                "ADM-001",
                "Gerente"
            ))

        db.commit()
        
        # ================= LOGS =================
        db.execute("""
            CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT,
            acao TEXT,
            data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

def registrar_log(usuario, acao, db=None):

    fechar_conexao = False

    if db is None:
        db = conectar_bd()
        fechar_conexao = True

    db.execute("""
        INSERT INTO logs (usuario, acao, data_hora)
        VALUES (?, ?, CURRENT_TIMESTAMP)
    """, (usuario, acao))

    if fechar_conexao:
        db.commit()