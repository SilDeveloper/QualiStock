from database import conectar_bd

def analisar_estoque_ia():

    db = conectar_bd()
    produtos = db.execute('SELECT * FROM produtos').fetchall()

    alertas = []

    for p in produtos:
        if p['qtd'] <= 0:
            alertas.append(f"🚨 RUPTURA: {p['nome']}")
        elif p['qtd'] <= 3:
            alertas.append(f"⚠️ BAIXO: {p['nome']}")

    return " | ".join(alertas) if alertas else "✅ Estoque em níveis excelentes."