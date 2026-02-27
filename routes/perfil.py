from flask import Blueprint, request, jsonify, session
from database import conectar_bd

perfil_bp = Blueprint('perfil', __name__)

@perfil_bp.route('/atualizar_perfil', methods=['POST'])
def atualizar_perfil():

    if 'usuario_id' not in session:
        return jsonify({"mensagem": "Sessão inválida"}), 401

    dados = request.json
    db = conectar_bd()

    db.execute("""
        UPDATE usuarios
        SET nome_completo = ?, matricula = ?, cargo = ?
        WHERE id = ?
    """, (
        dados['nome'],
        dados['matricula'],
        dados['cargo'],
        session['usuario_id']
    ))

    db.commit()

    session['nome_completo'] = dados['nome']
    session['matricula'] = dados['matricula']
    session['cargo'] = dados['cargo']

    return jsonify({"status": "ok"})