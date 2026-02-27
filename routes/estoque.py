from flask import Blueprint, request, jsonify, session
from database import conectar_bd, registrar_log
from ia import analisar_estoque_ia

estoque_bp = Blueprint('estoque', __name__)


@estoque_bp.route('/repor_lote', methods=['POST'])
def repor_lote():

    dados = request.json
    db = conectar_bd()

    usuario = session.get("nome_completo", "Sistema")

    for item in dados:

        produto_id = item['id']

        if "-" in produto_id:
            produto_id = produto_id.split("-")[1]

        quantidade = int(item['quantidade'])

        # 🔎 Buscar nome do produto
        produto = db.execute(
            "SELECT nome FROM produtos WHERE id = ?",
            (produto_id,)
        ).fetchone()

        # 🔄 Atualizar estoque
        db.execute(
            "UPDATE produtos SET qtd = qtd + ? WHERE id = ?",
            (quantidade, produto_id)
        )

        # 📝 Registrar log
        registrar_log(
            usuario,
            f"Reabasteceu produto: {produto['nome']} (+{quantidade})",
            db
        )

    db.commit()

    return jsonify({
        "status": "sucesso",
        "mensagem_ia": analisar_estoque_ia()
    })