from flask import Blueprint, render_template, redirect, session, jsonify, send_file
from database import conectar_bd, registrar_log
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.platypus import TableStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from datetime import datetime
import os
from io import BytesIO


dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard')
def dashboard():

    if 'usuario_id' not in session:
        return redirect('/login')

    db = conectar_bd()

    produtos = db.execute("SELECT * FROM produtos").fetchall()
    combos = db.execute("SELECT * FROM combos").fetchall()

    return render_template(
        "dashboard.html",
        produtos=produtos,
        combos=combos
    )

from datetime import datetime

@dashboard_bp.route('/listar_logs')
def listar_logs():

    db = conectar_bd()

    logs = db.execute("""
        SELECT * FROM logs
        ORDER BY id DESC
        LIMIT 50
    """).fetchall()

    lista_formatada = []

    for l in logs:

        data_formatada = None

        if l["data_hora"]:
            dt = datetime.strptime(l["data_hora"], "%Y-%m-%d %H:%M:%S")
            data_formatada = dt.strftime("%d/%m/%Y %H:%M:%S")

        lista_formatada.append({
            "id": l["id"],
            "usuario": l["usuario"],
            "acao": l["acao"],
            "data_hora": data_formatada
        })

    return jsonify(lista_formatada)

@dashboard_bp.route('/limpar_logs', methods=['DELETE'])
def limpar_logs():

    db = conectar_bd()

    usuario = session.get("nome_completo", "Sistema")

    # Registrar a limpeza ANTES de apagar
    registrar_log(
        usuario,
        "Limpou todos os logs do sistema",
        db
    )

    # Apagar todos exceto o último (o da limpeza)
    db.execute("""
        DELETE FROM logs
        WHERE id NOT IN (
            SELECT id FROM logs
            ORDER BY id DESC
            LIMIT 1
        )
    """)

    db.commit()

    return jsonify({"status": "sucesso"})

@dashboard_bp.route('/gerar_pdf_logs')
def gerar_pdf_logs():

    db = conectar_bd()

    logs = db.execute("""
        SELECT usuario, acao, data_hora
        FROM logs
        ORDER BY id DESC
    """).fetchall()

    buffer = BytesIO()

    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elementos = []

    estilos = getSampleStyleSheet()

    titulo = Paragraph("QualiStock – Relatório de Logs", estilos["Heading1"])
    elementos.append(titulo)
    elementos.append(Spacer(1, 0.5 * cm))

    data_geracao = Paragraph(
        f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}",
        estilos["Normal"]
    )
    elementos.append(data_geracao)
    elementos.append(Spacer(1, 0.5 * cm))

    dados_tabela = [["Usuário", "Ação", "Data/Hora"]]

    for log in logs:
        dados_tabela.append([
            Paragraph(log["usuario"], estilos["Normal"]),
            Paragraph(log["acao"], estilos["Normal"]),
            Paragraph(log["data_hora"] or "-", estilos["Normal"])
        ])

    tabela = Table(dados_tabela, colWidths=[3.5*cm, 9.5*cm, 3*cm])

    tabela.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('WORDWRAP', (0, 0), (-1, -1), 'CJK'),
    ]))

    elementos.append(tabela)

    # 🔥 Função de rodapé + número da página
    def adicionar_rodape(canvas, doc):
        canvas.saveState()
        largura, altura = A4

        canvas.setFont("Helvetica", 9)

        # Rodapé institucional
        canvas.drawString(
            2 * cm,
            1.5 * cm,
            "Documento gerado automaticamente pelo sistema QualiStock"
        )

        # Número da página
        pagina = canvas.getPageNumber()
        canvas.drawRightString(
            largura - 2 * cm,
            1.5 * cm,
            f"Página {pagina}"
        )

        canvas.restoreState()

    doc.build(elementos, onFirstPage=adicionar_rodape, onLaterPages=adicionar_rodape)

    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="logs_qualistock.pdf",
        mimetype='application/pdf'
    )