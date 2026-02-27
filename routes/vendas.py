from flask import Blueprint, request, jsonify, session
from database import conectar_bd, registrar_log
from ia import analisar_estoque_ia

vendas_bp = Blueprint('vendas', __name__)


@vendas_bp.route('/finalizar_venda', methods=['POST'])
def finalizar_venda():

    carrinho = request.json
    db = conectar_bd()

    # 1️⃣ VALIDAR ESTOQUE
    for item in carrinho:

        tipo = item.get("tipo", "produto")
        quantidade = int(item["quantidade"])

        if tipo == "produto":

            p = db.execute(
                "SELECT * FROM produtos WHERE id = ?",
                (item["id"],)
            ).fetchone()

            if not p or p["qtd"] < quantidade:
                return jsonify({"mensagem": "Estoque insuficiente"}), 400

        elif tipo == "combo":

            itens_combo = db.execute("""
                SELECT produto_id, quantidade
                FROM combo_itens
                WHERE combo_id = ?
            """, (item["id"],)).fetchall()

            for ic in itens_combo:
                produto = db.execute(
                    "SELECT qtd FROM produtos WHERE id = ?",
                    (ic["produto_id"],)
                ).fetchone()

                qtd_necessaria = ic["quantidade"] * quantidade

                if not produto or produto["qtd"] < qtd_necessaria:
                    return jsonify({"mensagem": "Estoque insuficiente para combo"}), 400

    # 2️⃣ DESCONTAR ESTOQUE
    for item in carrinho:

        tipo = item.get("tipo", "produto")
        quantidade = int(item["quantidade"])

        if tipo == "produto":

            db.execute("""
                UPDATE produtos
                SET qtd = qtd - ?
                WHERE id = ?
            """, (quantidade, item["id"]))

        elif tipo == "combo":

            itens_combo = db.execute("""
                SELECT produto_id, quantidade
                FROM combo_itens
                WHERE combo_id = ?
            """, (item["id"],)).fetchall()

            for ic in itens_combo:

                qtd_necessaria = ic["quantidade"] * quantidade

                db.execute("""
                    UPDATE produtos
                    SET qtd = qtd - ?
                    WHERE id = ?
                """, (qtd_necessaria, ic["produto_id"]))

    # 3️⃣ CALCULAR TOTAL DA VENDA
    total = 0

    for item in carrinho:
        preco = float(item.get("preco", 0))
        quantidade = int(item["quantidade"])
        total += preco * quantidade

    db.commit()

    usuario = session.get("nome_completo", "Sistema")

    itens_str = ", ".join([item["nome"] for item in carrinho])

    registrar_log(
        usuario,
        f"Venda: {itens_str} | Total: R$ {total:.2f}"
    )

    return jsonify({
        "status": "sucesso",
        "mensagem_ia": analisar_estoque_ia()
    })