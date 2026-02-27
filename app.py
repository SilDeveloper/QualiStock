from flask import Flask
from database import conectar_bd, init_db
from werkzeug.security import generate_password_hash, check_password_hash
import os
from routes.auth import auth_bp
from ia import analisar_estoque_ia
from routes.dashboard import dashboard_bp
from routes.produtos import produtos_bp
from routes.combos import combos_bp
from routes.vendas import vendas_bp
from routes.estoque import estoque_bp
from routes.perfil import perfil_bp

app = Flask(__name__)
app.secret_key = os.urandom(24)
init_db() # Inicialização do Banco de Dados

# Modularização
app.register_blueprint(auth_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(produtos_bp)
app.register_blueprint(combos_bp)
app.register_blueprint(vendas_bp)
app.register_blueprint(estoque_bp)
app.register_blueprint(perfil_bp)

if __name__ == '__main__':
    app.run(debug=True)
