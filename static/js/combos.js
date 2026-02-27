/* ===== COMBOS ===== */

// ================= CARREGAR SELECT DE PRODUTOS NO FORM DE COMBO =================
async function carregarProdutosCombo() {

    const res = await fetch('/listar_produtos');
    const produtos = await res.json();

    const select = document.getElementById("combo-produto");
    if (!select) return;

    select.innerHTML = `
        <option selected disabled>Escolher produto...</option>
    `;

    produtos.forEach(p => {

        const precoOriginal = p.preco;
        const promocao = p.promocao || 0;

        const precoFinal = promocao > 0
            ? precoOriginal - (precoOriginal * promocao / 100)
            : precoOriginal;

        select.innerHTML += `
            <option value="${p.id}"
                data-nome="${p.nome}"
                data-preco="${precoFinal}">
                ${p.nome} (R$ ${precoFinal.toFixed(2)})
            </option>
        `;
    });
}

// ================= ADICIONAR ITEM AO COMBO =================
function adicionarItemCombo() {

    const select = document.getElementById("combo-produto");
    const qtd = parseInt(document.getElementById("combo-qtd").value);

    if (!select.value || qtd <= 0) {
        return Swal.fire("Aviso", "Selecione um produto e quantidade válida.", "info");
    }

    const opt = select.options[select.selectedIndex];

    const id = parseInt(opt.value);
    const nome = opt.dataset.nome;
    const preco = parseFloat(opt.dataset.preco);

    const existente = comboItens.find(i => i.id === id);

    if (existente) {
        existente.quantidade += qtd;
    } else {
        comboItens.push({ id, nome, preco, quantidade: qtd });
    }

    atualizarListaCombo();
}

// ================= ATUALIZAR LISTA VISUAL =================
function atualizarListaCombo() {

    const lista = document.getElementById("lista-itens-combo");
    const desconto = parseFloat(document.getElementById("combo-desconto").value) || 0;

    if (!comboItens.length) {

        lista.innerHTML = `
            <small class="text-muted">
                Nenhum item adicionado ainda.
            </small>
        `;

        document.getElementById("combo-total-original").innerText = "R$ 0,00";
        document.getElementById("combo-total-final").innerText = "R$ 0,00";
        return;
    }

    let totalOriginal = 0;

    lista.innerHTML = comboItens.map((item, index) => {

        const subtotal = item.preco * item.quantidade;
        totalOriginal += subtotal;

        return `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span>${item.nome} x ${item.quantidade}</span>
                <button class="btn btn-sm btn-danger"
                    onclick="removerItemCombo(${index})">
                    X
                </button>
            </div>
        `;
    }).join("");

    const totalFinal = totalOriginal - (totalOriginal * desconto / 100);

    document.getElementById("combo-total-original").innerText =
        `R$ ${totalOriginal.toFixed(2)}`;

    document.getElementById("combo-total-final").innerText =
        `R$ ${totalFinal.toFixed(2)}`;
}

function removerItemCombo(index) {
    comboItens.splice(index, 1);
    atualizarListaCombo();
}

// ================= SALVAR COMBO =================
async function salvarCombo() {

    const nome = document.getElementById("combo-nome").value.trim();
    let desconto = parseFloat(document.getElementById("combo-desconto").value) || 0;

    if (!nome)
        return Swal.fire("Aviso", "Informe o nome do combo.", "info");

    if (!comboItens.length)
        return Swal.fire("Aviso", "Adicione pelo menos um item.", "info");

    let totalOriginal = 0;

    comboItens.forEach(item => {
        totalOriginal += item.preco * item.quantidade;
    });

    const precoFinal = totalOriginal - (totalOriginal * desconto / 100);

    const res = await fetch('/salvar_combo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nome,
            desconto,
            preco_final: precoFinal,
            itens: comboItens
        })
    });

    if (!res.ok)
        return Swal.fire("Erro", "Erro ao salvar combo.", "error");

    await carregarProdutosTabela();
    await carregarProdutosSelect();
    await carregarProdutosCombo();

    comboItens = [];
    document.getElementById("combo-nome").value = "";
    document.getElementById("combo-desconto").value = 0;
    document.getElementById("combo-qtd").value = 1;
    atualizarListaCombo();

    Swal.fire("Sucesso", "Combo salvo com sucesso!", "success");
}

// ================= ATIVAR / DESATIVAR =================
async function toggleCombo(id) {

    const confirmar = await Swal.fire({
        title: "Alterar status do combo?",
        icon: "question",
        showCancelButton: true
    });

    if (!confirmar.isConfirmed) return;

    const res = await fetch(`/toggle_combo/${id}`, { method: "PUT" });

    if (!res.ok)
        return Swal.fire("Erro", "Não foi possível alterar.", "error");

    await carregarProdutosTabela();
    await carregarProdutosSelect();

    Swal.fire("Sucesso", "Status atualizado!", "success");
}

// ================= REMOVER DEFINITIVO =================
async function removerComboDefinitivo(id) {

    const confirmar = await Swal.fire({
        title: "Remover combo permanentemente?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545"
    });

    if (!confirmar.isConfirmed) return;

    const res = await fetch(`/remover_combo_definitivo/${id}`, {
        method: "DELETE"
    });

    if (!res.ok)
        return Swal.fire("Erro", "Não foi possível remover.", "error");

    await carregarProdutosTabela();
    await carregarProdutosSelect();

    Swal.fire("Removido!", "Combo excluído definitivamente.", "success");
}

// ================= ATUALIZA DESCONTO EM TEMPO REAL =================
document.addEventListener("DOMContentLoaded", function () {

    const inputDesconto = document.getElementById("combo-desconto");

    if (inputDesconto) {
        inputDesconto.addEventListener("input", function () {
            atualizarListaCombo();
        });
    }

});