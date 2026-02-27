from flask import Blueprint, session, request, jsonify
from database import conectar_bd, registrar_log

produtos_bp = Blueprint('produtos', __name__)

# ============ PRODUTOS ============

@produtos_bp.route('/cadastrar_produto', methods=['POST'])
def cadastrar_produto():

    dados = request.json
    db = conectar_bd()

    db.execute("""
        INSERT INTO produtos (nome, preco, qtd, promocao)
        VALUES (?, ?, ?, 0)
    """, (
        dados['nome'],
        dados['preco'],
        dados['qtd']
    ))

    db.commit()

    usuario = session.get("nome_completo", "Sistema")
    registrar_log(usuario, f"Cadastrou produto: {dados['nome']}")

    return jsonify({"status": "ok"})


@produtos_bp.route('/remover_produto/<int:id>', methods=['DELETE'])
def remover_produto(id):

    db = conectar_bd()

    # 🔎 Buscar nome do produto
    produto = db.execute(
        "SELECT nome FROM produtos WHERE id = ?",
        (id,)
    ).fetchone()

    if not produto:
        return jsonify({"mensagem": "Produto não encontrado"}), 404

    # 🔎 Verificar combos antes de remover
    combos = db.execute("""
        SELECT c.nome
        FROM combos c
        JOIN combo_itens ci ON ci.combo_id = c.id
        WHERE ci.produto_id = ?
    """, (id,)).fetchall()

    nomes_combos = [c["nome"] for c in combos]

    # 🗑️ Desativar produto
    db.execute(
        "UPDATE produtos SET ativo = 0 WHERE id = ?",
        (id,)
    )

    usuario = session.get("nome_completo", "Sistema")

    # 🔥 Log profissional
    registrar_log(
        usuario,
        f"Desativou produto: {produto['nome']}",
        db
    )

    # 🔥 Logar combos afetados (opcional e elegante)
    for nome_combo in nomes_combos:
        registrar_log(
            usuario,
            f"Combo tornou-se incompleto: {nome_combo} (Produto desativado)",
            db
        )

    db.commit()

    return jsonify({
        "status": "ok",
        "combos_afetados": nomes_combos
    })

@produtos_bp.route('/reativar_produto/<int:id>', methods=['PUT'])
def reativar_produto(id):

    dados = request.json or {}
    quantidade = dados.get("quantidade", 0)

    db = conectar_bd()

    # 🔎 Buscar nome do produto
    produto = db.execute(
        "SELECT nome FROM produtos WHERE id = ?",
        (id,)
    ).fetchone()

    if not produto:
        return jsonify({"mensagem": "Produto não encontrado"}), 404

    # 🔄 Reativar produto
    db.execute("""
        UPDATE produtos
        SET ativo = 1,
            qtd = ?
        WHERE id = ?
    """, (quantidade, id))

    usuario = session.get("nome_completo", "Sistema")

    # 🔥 Log da reativação
    registrar_log(
        usuario,
        f"Reativou produto: {produto['nome']} (Estoque inicial: {quantidade})",
        db
    )

    # 🔎 Verificar combos que usam esse produto
    combos = db.execute("""
        SELECT c.id, c.nome
        FROM combos c
        JOIN combo_itens ci ON ci.combo_id = c.id
        WHERE ci.produto_id = ?
    """, (id,)).fetchall()

    for combo in combos:

        itens = db.execute("""
            SELECT p.ativo
            FROM combo_itens ci
            JOIN produtos p ON p.id = ci.produto_id
            WHERE ci.combo_id = ?
        """, (combo["id"],)).fetchall()

        # Se TODOS os produtos estiverem ativos
        if all(item["ativo"] == 1 for item in itens):

            registrar_log(
                usuario,
                f"Combo voltou a ficar completo: {combo['nome']}",
                db
            )

    db.commit()

    return jsonify({"mensagem": "Produto reativado"})

@produtos_bp.route('/listar_produtos_inativos')
def listar_produtos_inativos():

    db = conectar_bd()

    produtos = db.execute(
        "SELECT * FROM produtos WHERE ativo = 0"
    ).fetchall()

    lista = [dict(p) for p in produtos]

    return jsonify(lista)

@produtos_bp.route('/listar_produtos')
def listar_produtos():

    db = conectar_bd()
    produtos = db.execute(
        "SELECT * FROM produtos WHERE ativo = 1"
    ).fetchall()

    lista = []

    for p in produtos:
        lista.append({
            "id": p["id"],
            "nome": p["nome"],
            "preco": p["preco"],
            "qtd": p["qtd"],
            "promocao": p["promocao"]
        })

    return jsonify(lista)


@produtos_bp.route('/aplicar_desconto', methods=['POST'])
def aplicar_desconto():

    dados = request.json
    produto_id = dados.get("id")
    desconto = float(dados.get("desconto", 0))

    if desconto < 0 or desconto > 100:
        return jsonify({"mensagem": "Desconto inválido"}), 400

    db = conectar_bd()

    produto = db.execute(
        "SELECT nome, preco, promocao FROM produtos WHERE id = ?",
        (produto_id,)
    ).fetchone()

    if not produto:
        return jsonify({"mensagem": "Produto não encontrado"}), 404

    # 🔎 Descobrir o preço base real
    preco_atual = produto["preco"]
    promocao_atual = produto["promocao"] or 0

    if promocao_atual > 0:
        preco_original = preco_atual / (1 - promocao_atual / 100)
    else:
        preco_original = preco_atual

    # 🎯 Calcular novo preço
    novo_preco = preco_original - (preco_original * desconto / 100)

    # 🔥 Atualiza apenas a promoção
    db.execute("""
        UPDATE produtos
        SET promocao = ?
        WHERE id = ?
    """, (desconto, produto_id))

    # 🎨 Formatação bonita
    desconto_formatado = (
        int(desconto)
        if desconto.is_integer()
        else round(desconto, 2)
    )

    preco_original_formatado = f"R$ {preco_original:.2f}"
    novo_preco_formatado = f"R$ {novo_preco:.2f}"

    registrar_log(
        session.get("nome_completo", "Sistema"),
        f"Aplicou {desconto_formatado}% no produto {produto['nome']} "
        f"(De {preco_original_formatado} para {novo_preco_formatado})",
        db
    )

    db.commit()

    return jsonify({"status": "ok"})