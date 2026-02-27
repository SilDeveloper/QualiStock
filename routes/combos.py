from flask import Blueprint, request, jsonify, session
from database import conectar_bd, registrar_log

combos_bp = Blueprint('combos', __name__)

@combos_bp.route('/toggle_combo/<int:id>', methods=['PUT'])
def toggle_combo(id):
    db = conectar_bd()

    combo = db.execute(
        "SELECT nome, ativo FROM combos WHERE id = ?",
        (id,)
    ).fetchone()

    if not combo:
        return jsonify({"erro": "Combo não encontrado"}), 404

    novo_status = 0 if combo["ativo"] == 1 else 1

    db.execute(
        "UPDATE combos SET ativo = ? WHERE id = ?",
        (novo_status, id)
    )

    acao = "Desativou" if combo["ativo"] == 1 else "Ativou"

    registrar_log(
        session.get("nome_completo", "Sistema"),
        f"{acao} combo: {combo['nome']}",
        db
    )

    db.commit()

    return jsonify({"mensagem": "Status atualizado"})

@combos_bp.route('/listar_combos')
def listar_combos():

    db = conectar_bd()
    combos = db.execute("SELECT * FROM combos").fetchall()

    lista = []

    for c in combos:

        itens = db.execute("""
            SELECT produto_id, quantidade
            FROM combo_itens
            WHERE combo_id = ?
        """, (c["id"],)).fetchall()

        total_original = 0
        incompleto = False  # 🔥 novo

        for item in itens:

            produto = db.execute("""
                SELECT preco, promocao, ativo
                FROM produtos
                WHERE id = ?
            """, (item["produto_id"],)).fetchone()

            # 🔥 Se produto não existir OU estiver inativo
            if not produto or produto["ativo"] == 0:
                incompleto = True
                continue

            preco = produto["preco"]
            promocao = produto["promocao"] or 0

            preco_com_desconto = preco - (preco * promocao / 100)
            subtotal = preco_com_desconto * item["quantidade"]
            total_original += subtotal

        desconto_combo = c["desconto"] or 0
        preco_final = total_original - (total_original * desconto_combo / 100)

        lista.append({
            "id": c["id"],
            "nome": c["nome"],
            "preco_final": round(preco_final, 2),
            "descricao": c["descricao"],
            "desconto": desconto_combo,
            "incompleto": incompleto,  # 🔥 novo campo
            "ativo": c["ativo"],
        })

    return jsonify(lista)


@combos_bp.route('/remover_combo/<int:id>', methods=['DELETE'])
def remover_combo(id):

    db = conectar_bd()

    combo = db.execute(
        "SELECT ativo FROM combos WHERE id = ?",
        (id,)
    ).fetchone()

    if not combo:
        return jsonify({"mensagem": "Combo não encontrado"}), 404

    novo_status = 0 if combo["ativo"] == 1 else 1

        # 🔒 Se estiver tentando REATIVAR
    if novo_status == 1:

        itens = db.execute("""
            SELECT p.ativo
            FROM combo_itens ci
            JOIN produtos p ON p.id = ci.produto_id
            WHERE ci.combo_id = ?
        """, (id,)).fetchall()

        for item in itens:
            if item["ativo"] == 0:
                return jsonify({
                    "mensagem": "Não é possível reativar. Existem produtos inativos."
                }), 400

    db.execute(
        "UPDATE combos SET ativo = ? WHERE id = ?",
        (novo_status, id)
    )

    combo_nome = db.execute(
        "SELECT nome FROM combos WHERE id = ?",
        (id,)
    ).fetchone()

    acao = "Desativou" if novo_status == 0 else "Ativou"

    registrar_log(
        session.get("nome_completo", "Sistema"),
        f"{acao} combo: {combo_nome['nome']}",
        db
    )

    db.commit()

    return jsonify({
        "mensagem": "Status atualizado",
        "ativo": novo_status
    })

@combos_bp.route('/remover_combo_definitivo/<int:id>', methods=['DELETE'])
def remover_combo_definitivo(id):
    db = conectar_bd()

    # Primeiro remove os itens do combo
    db.execute(
        "DELETE FROM combo_itens WHERE combo_id = ?",
        (id,)
    )

    combo = db.execute(
        "SELECT nome FROM combos WHERE id = ?",
        (id,)
    ).fetchone()

    # Depois remove o combo
    db.execute(
        "DELETE FROM combos WHERE id = ?",
        (id,)
    )

    registrar_log(
        session.get("nome_completo", "Sistema"),
        f"Removeu combo definitivamente: {combo['nome']}",
        db
    )

    db.commit()

    return jsonify({"mensagem": "Combo removido definitivamente"})

@combos_bp.route('/combo_detalhes/<int:combo_id>')
def combo_detalhes(combo_id):

    db = conectar_bd()

    combo = db.execute(
        "SELECT * FROM combos WHERE id = ?",
        (combo_id,)
    ).fetchone()

    itens = db.execute("""
        SELECT p.nome, ci.quantidade
        FROM combo_itens ci
        JOIN produtos p ON p.id = ci.produto_id
        WHERE ci.combo_id = ?
    """, (combo_id,)).fetchall()

    lista_itens = [
        {"nome": i["nome"], "quantidade": i["quantidade"]}
        for i in itens
    ]

    return jsonify({
        "nome": combo["nome"],
        "descricao": combo["descricao"],
        "itens": lista_itens
    })


@combos_bp.route('/salvar_combo', methods=['POST'])
def salvar_combo():

    dados = request.json
    db = conectar_bd()

    nome = dados['nome']
    desconto = float(dados['desconto'])
    preco_final = float(dados['preco_final'])
    itens = dados['itens']

    # 🔎 Montar descrição dos itens
    descricao_lista = []

    for item in itens:
        descricao_lista.append(f"{item['quantidade']}x {item['nome']}")

    descricao = " | ".join(descricao_lista)

    # 📝 Inserir combo
    cursor = db.execute("""
        INSERT INTO combos (nome, descricao, desconto, preco_final)
        VALUES (?, ?, ?, ?)
    """, (nome, descricao, desconto, preco_final))

    combo_id = cursor.lastrowid

    # 📦 Inserir itens do combo
    for item in itens:
        db.execute("""
            INSERT INTO combo_itens (combo_id, produto_id, quantidade)
            VALUES (?, ?, ?)
        """, (combo_id, item['id'], item['quantidade']))

    # 🔎 Descobrir preço original antes do desconto
    preco_original = (
        preco_final / (1 - desconto / 100)
        if desconto > 0
        else preco_final
    )

    preco_original_formatado = f"R$ {preco_original:.2f}"
    preco_final_formatado = f"R$ {preco_final:.2f}"

    # 📜 Registrar log completo
    registrar_log(
        session.get("nome_completo", "Sistema"),
        f"Criou combo: {nome} ({descricao}) "
        f"(De {preco_original_formatado} para {preco_final_formatado})",
        db
    )

    db.commit()

    return jsonify({"status": "sucesso"})

@combos_bp.route('/verificar_produto_em_combos/<int:id>')
def verificar_produto_em_combos(id):

    db = conectar_bd()

    combos = db.execute("""
        SELECT c.nome
        FROM combos c
        JOIN combo_itens ci ON ci.combo_id = c.id
        WHERE ci.produto_id = ?
    """, (id,)).fetchall()

    return jsonify([c["nome"] for c in combos])

@combos_bp.route('/alterar_desconto_combo', methods=['POST'])
def alterar_desconto_combo():

    dados = request.json
    combo_id = dados.get("id")
    novo_desconto = float(dados.get("desconto", 0))

    if novo_desconto < 0 or novo_desconto > 100:
        return jsonify({"mensagem": "Desconto inválido"}), 400

    db = conectar_bd()

    combo = db.execute(
        "SELECT nome, desconto, preco_final FROM combos WHERE id = ?",
        (combo_id,)
    ).fetchone()

    if not combo:
        return jsonify({"mensagem": "Combo não encontrado"}), 404

    nome = combo["nome"]
    desconto_antigo = combo["desconto"] or 0
    preco_atual = combo["preco_final"]

    # 🔎 Descobrir preço base real
    if desconto_antigo > 0:
        preco_original = preco_atual / (1 - desconto_antigo / 100)
    else:
        preco_original = preco_atual

    # 🎯 Calcular novo preço
    novo_preco = preco_original - (preco_original * novo_desconto / 100)

    # 🔥 Atualizar banco
    db.execute("""
        UPDATE combos
        SET desconto = ?, preco_final = ?
        WHERE id = ?
    """, (novo_desconto, novo_preco, combo_id))

    # 🎨 Formatação bonita
    preco_original_formatado = f"R$ {preco_original:.2f}"
    novo_preco_formatado = f"R$ {novo_preco:.2f}"

    if novo_desconto == 0:
        mensagem_log = (
            f"Removeu desconto do combo {nome} "
            f"(Voltou para {preco_original_formatado})"
        )
    else:
        mensagem_log = (
            f"Alterou desconto do combo {nome} "
            f"de {int(desconto_antigo)}% para {int(novo_desconto)}% "
            f"(De {preco_original_formatado} para {novo_preco_formatado})"
        )

    registrar_log(
        session.get("nome_completo", "Sistema"),
        mensagem_log,
        db
    )

    db.commit()

    return jsonify({"status": "sucesso"})