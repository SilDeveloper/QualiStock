# 📊 QualiStock – Sistema Inteligente de Gestão de Estoque

O **QualiStock** é um sistema web completo de gestão de estoque desenvolvido com Flask e foco em experiência do usuário, controle operacional e rastreabilidade de ações.

O projeto inclui **auditoria de sistema**, geração de relatórios em PDF e controle dinâmico de estados entre produtos e combos.

---

## 🚀 Funcionalidades

### 📦 Gestão de Produtos
- Cadastro, edição e desativação de produtos
- Aplicação de desconto relâmpago (%)
- Controle de estoque em tempo real
- Reativação com estoque inicial configurável

### 🎁 Sistema de Combos Inteligente
- Criação de combos com múltiplos produtos
- Desconto aplicado sobre o total do combo
- Verificação automática de integridade
- Identificação automática de combos incompletos
- Atualização dinâmica conforme estado dos produtos

### 🧾 Frente de Caixa
- Venda de produtos e combos
- Validação automática de estoque
- Atualização em tempo real
- Histórico de cupons

### 📜 Sistema de Logs (Auditoria)
- Registro automático de:
  - Cadastro de produto
  - Desativação / Reativação
  - Aplicação de descontos
  - Criação e remoção de combos
  - Alterações de estado (incompleto / completo)
  - Limpeza de logs
- Exibição organizada por data (formato brasileiro)
- Exportação completa para PDF
- Relatório profissional com:
  - Paginação
  - Rodapé institucional
  - Layout estruturado

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Python + Flask
- **Frontend:** HTML5, CSS3, JavaScript (ES6)
- **Framework CSS:** Bootstrap 5
- **Banco de Dados:** SQLite3
- **Alertas e UX:** SweetAlert2
- **Geração de PDF:** ReportLab
- **Controle de Versão:** Git

---

## 🧠 Conceitos Aplicados

- Separação clara entre lógica de negócio e interface
- Controle de estados derivados (combos incompletos)
- Registro de auditoria profissional
- Conversão de datas ISO → formato brasileiro
- Geração dinâmica de documentos em memória (sem arquivos temporários)
- Arquitetura modular com Blueprints Flask

---

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

Projeto desenvolvido para fins acadêmicos e portfólio profissional.