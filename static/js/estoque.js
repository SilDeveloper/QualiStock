let itensReposicao = [];

/* ===== ESTOQUE ===== */

async function repor() {

    const itens = [];

    document.querySelectorAll(".check-p:checked").forEach(check => {

        const id = check.value;
        const input = document.getElementById(`in-${id}`);
        if (!input) return;

        const quantidade = parseInt(input.value);

        if (quantidade > 0) {
            itens.push({
                id: id,
                quantidade: quantidade
            });
        }
    });

    if (!itens.length) {
        return Swal.fire(
            "Nada para repor",
            "Informe uma quantidade maior que 0.",
            "info"
        );
    }

    const res = await fetch('/repor_lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itens)
    });

    const data = await res.json();

    if (!res.ok) {
        return Swal.fire("Erro", data.mensagem || "Erro na reposição", "error");
    }

    await atualizarSistemaProdutos();

    if (data.mensagem_ia) {
        mostrarIA(data.mensagem_ia, "alert-info", "alert-danger");
    }

    Swal.fire("Sucesso", "Estoque atualizado!", "success");
}

async function carregarEstoqueTabela() {

    const res = await fetch('/listar_produtos');
    const produtos = await res.json();

    const tbody = document.getElementById("tabela-estoque");
    if (!tbody) return;

    if (produtos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="2" class="text-muted text-center">
                    Nenhum produto cadastrado.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = produtos.map(p => {

        let classe = "fw-bold text-end";

        if (p.qtd <= 0) {
            classe += " text-danger";
        } else if (p.qtd <= 3) {
            classe += " text-warning";
        }

        return `
            <tr>
                <td>${p.nome}</td>
                <td id="qtd-${p.id}" class="${classe}">
                    ${p.qtd}
                </td>
            </tr>
        `;
    }).join('');
}

async function carregarProdutosReposicao() {

    const res = await fetch('/listar_produtos');
    const produtos = await res.json();

    const select = document.getElementById("select-reposicao");
    if (!select) return;

    select.innerHTML = `
        <option selected disabled>Escolher produto...</option>
    `;

    produtos.forEach(p => {
        select.innerHTML += `
            <option value="${p.id}">
                ${p.nome}
            </option>
        `;
    });
}

function adicionarItemReposicao() {

    const select = document.getElementById("select-reposicao");
    const qtdInput = document.getElementById("qtd-reposicao");

    const id = select.value;
    const nome = select.options[select.selectedIndex]?.text;
    const quantidade = parseInt(qtdInput.value);

    if (!id || !quantidade || quantidade <= 0) {
        return Swal.fire("Aviso", "Selecione produto e quantidade válida.", "info");
    }

    const existente = itensReposicao.find(i => i.id == id);

    if (existente) {
        existente.quantidade += quantidade;
    } else {
        itensReposicao.push({ id, nome, quantidade });
    }

    atualizarListaReposicao();

    qtdInput.value = "";
}

function atualizarListaReposicao() {

    const div = document.getElementById("lista-reposicao");

    if (!itensReposicao.length) {
        div.innerHTML = "Nenhum item selecionado.";
        return;
    }

    div.innerHTML = itensReposicao.map((item, index) => `
        <div class="d-flex justify-content-between align-items-center mb-1">
            <span>${item.nome} +${item.quantidade}</span>
            <button class="btn btn-sm btn-danger"
                    onclick="removerItemReposicao(${index})">
                ✖
            </button>
        </div>
    `).join('');
}

function removerItemReposicao(index) {
    itensReposicao.splice(index, 1);
    atualizarListaReposicao();
}

async function confirmarReposicao() {

    if (!itensReposicao.length) {
        return Swal.fire("Aviso", "Nenhum item para repor.", "info");
    }

    const res = await fetch('/repor_lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itensReposicao)
    });

    const data = await res.json();

    if (!res.ok) {
        return Swal.fire("Erro", data.mensagem || "Erro na reposição", "error");
    }

    await atualizarSistemaProdutos();

    itensReposicao = [];
    atualizarListaReposicao();

    Swal.fire("Sucesso", "Estoque atualizado!", "success");
}