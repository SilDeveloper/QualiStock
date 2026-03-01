# 📦 QualiStock
### Sistema Inteligente de Gestão de Estoque

---

## 📖 Sobre o Projeto

O **QualiStock** é um sistema web de gestão de estoque desenvolvido como projeto acadêmico com foco em **Engenharia de Software, arquitetura modular e experiência do usuário (UX/IHC)**.

O sistema simula um ambiente real de controle comercial, permitindo gerenciamento de produtos, combos, vendas e auditoria administrativa por meio de logs detalhados e geração de relatórios em PDF.

---

## 🚀 Funcionalidades

### 📦 Gestão de Produtos
- Cadastro de produtos  
- Ativação e desativação sem exclusão física  
- Aplicação de descontos percentuais  
- Controle automático de estoque  
- Registro de ações no log do sistema  

### 🎁 Gestão de Combos
- Criação de combos personalizados  
- Cálculo automático de preço com desconto  
- Identificação automática de combos incompletos  
- Ativação/desativação inteligente  
- Registro de ações administrativas  

### 🛒 Controle de Vendas
- Baixa automática de estoque  
- Validação de disponibilidade  
- Integração com análise de estoque  

### 📜 Logs do Sistema
- Registro detalhado de ações administrativas  
- Data e hora no padrão brasileiro  
- Exportação de relatório completo em PDF  
- Registro de:
  - Criação  
  - Desativação  
  - Reativação  
  - Aplicação de desconto  
  - Reposição  
  - Limpeza de registros  

---

## 🧠 Diferenciais Técnicos

- Arquitetura modular com Flask Blueprints  
- Separação clara entre backend, frontend e banco de dados  
- Sistema de auditoria interna  
- Persistência com SQLite  
- Controle lógico de dados (soft delete com campo `ativo`)  
- Organização voltada para escalabilidade  

---

## 🛠 Tecnologias Utilizadas

### Backend
- Python  
- Flask  
- SQLite  

### Frontend
- HTML5  
- CSS3  
- Bootstrap 5  
- JavaScript (ES6)  

### Bibliotecas
- SweetAlert2  
- ReportLab  

---

## 📂 Estrutura do Projeto

```text
QualiStock/
│
├── app.py
├── database.py
├── ia.py
│
├── routes/
│   ├── auth.py
│   ├── dashboard.py
│   ├── produtos.py
│   ├── combos.py
│   ├── vendas.py
│   └── estoque.py
│
├── static/
│   ├── css/
│   └── js/
│
├── templates/
│   ├── dashboard.html
│   └── partials/
│
└── sistema.db

```

## ⚙️ Como Executar Localmente

1. Instale as dependências:
pip install flask reportlab

2. Execute o servidor:
python app.py

3. Acesse:
http://127.0.0.1:5000

---

## 📌 Status do Projeto

✔ Sistema funcional  
✔ Controle completo de auditoria  
✔ Geração de relatórios  
✔ Estrutura modular organizada  

## 🎞️ Apresentação do Projeto

![Capa da apresentação](./capa.png)

🔗 [Visualizar apresentação completa](https://www.canva.com/design/DAHCqd5eyhM/6gPM-yym4JoFTX8RgGyuNg/edit?utm_content=DAHCqd5eyhM&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

Projeto desenvolvido para fins acadêmicos e portfólio profissional.
