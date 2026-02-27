
/* ===== PRODUTOS ===== */

function toggleIn(id){
    const ctrl=document.getElementById(`ctrl-${id}`);
    if(ctrl) ctrl.classList.toggle("d-none");
}

function alt(id, valor) {
    const input = document.getElementById(`in-${id}`);
    let atual = parseInt(input.value);

    if (isNaN(atual)) atual = 0;

    atual += valor;

    if (atual < 0) atual = 0;

    input.value = atual;
}

async function cadastrarProduto(){
    const nome=document.getElementById("novo-nome").value.trim();
    let precoInput=document.getElementById("novo-preco").value.trim();
    const qtd=document.getElementById("nova-qtd").value;

    if(!nome||!precoInput||!qtd)
        return Swal.fire("Erro","Preencha todos os campos.","error");

    precoInput=precoInput.replace(",",".");
    const preco=parseFloat(precoInput);

    if(isNaN(preco)||preco<=0)
        return Swal.fire("Valor inválido","Digite um preço válido.","warning");

    const res=await fetch('/cadastrar_produto',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({nome,preco,qtd:parseInt(qtd)})
    });

    if(res.ok){
        await atualizarSistemaProdutos();
        document.getElementById("novo-nome").value="";
        document.getElementById("novo-preco").value="";
        document.getElementById("nova-qtd").value="";
        Swal.fire("Sucesso","Produto cadastrado!","success");
    }
}

async function carregarProdutosTabela() {

    const resProdutos = await fetch('/listar_produtos');
    const produtos = await resProdutos.json();

    const resCombos = await fetch('/listar_combos');
    const combos = await resCombos.json();

    const tbody = document.getElementById("tabela-produtos");
    if (!tbody) return;

    if (produtos.length === 0 && combos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-muted text-center">
                    Nenhum item cadastrado.
                </td>
            </tr>
        `;
        return;
    }

    let html = "";

    // ================= PRODUTOS =================
    produtos.forEach(p => {

        const precoOriginal = p.preco;
        const temDesconto = p.promocao > 0;
        const precoFinal = temDesconto
            ? precoOriginal - (precoOriginal * p.promocao / 100)
            : precoOriginal;

        html += `
            <tr>
                <td class="align-middle text-center">${p.nome}</td>

                    <td class="align-middle text-center">
                        ${
                            temDesconto
                            ? `
                                <div class="d-flex flex-column align-items-center">
                                    <span class="text-muted small text-decoration-line-through">
                                        R$ ${precoOriginal.toFixed(2)}
                                    </span>
                                    <span class="text-success fw-semibold">
                                        R$ ${precoFinal.toFixed(2)}
                                    </span>
                                </div>
                            `
                            : `
                                <span>
                                    R$ ${precoOriginal.toFixed(2)}
                                </span>
                            `
                        }
                    </td>

                    <td class="align-middle text-center">${p.qtd}</td>

                    <td class="align-middle text-center">
                        ${
                            temDesconto
                            ? `<span class="badge bg-danger">🔥 ${p.promocao}%</span>`
                            : "—"
                        }
                    </td>

                    <td class="align-middle text-center">
                        <button class="btn btn-sm btn-danger"
                            onclick="removerProduto(${p.id})">
                            Remover
                        </button>
                    </td>
            </tr>
        `;
    });

    // ================= SEPARADOR =================
    if (combos.length > 0 && produtos.length > 0) {
        html += `
            <tr>
                <td colspan="5" class="text-center fw-bold fs-5 border-top pt-3">
                    🎁 Combos Cadastrados
                    <br>
                </td>
            </tr>

            <tr class="table-light fw-bold">
                <td>Produto</td>
                <td>Preço</td>
                <td>Qtd</td>
                <td>Promoção</td>
                <td class="text-center">Ações</td>
            </tr>
        `;
    }

    // ================= COMBOS =================
    combos.forEach(c => {

        let statusBadge = "";


        if (!c.ativo) {
            statusBadge += '<span class="badge bg-secondary ms-2">Inativo</span>';
        }

        if (c.incompleto) {
            statusBadge += '<span class="badge bg-warning text-dark ms-2">Incompleto</span>';
        }

        html += `
            <tr>
                <td class="align-middle text-center">
                    🎁 ${c.nome}
                    ${statusBadge}
                </td>

                <td class="align-middle text-center">
                    R$ ${c.preco_final.toFixed(2)}
                </td>

                <td class="align-middle text-center">—</td>

                <td class="align-middle text-center">Combo</td>

                <td class="align-middle text-center">
                    <div class="d-flex justify-content-center gap-2">

                        <button class="btn btn-sm ${c.ativo ? 'btn-danger' : 'btn-success'}"
                            style="min-width:100px;"
                            onclick="toggleCombo(${c.id})">
                            ${c.ativo ? 'Desativar' : 'Ativar'}
                        </button>

                        <button class="btn btn-sm btn-danger px-2"
                            onclick="removerComboDefinitivo(${c.id})"
                            title="Remover permanentemente">
                            ✖
                        </button>

                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

async function carregarProdutosInativos() {

    const res = await fetch('/listar_produtos_inativos');
    const produtos = await res.json();

    const area = document.getElementById("area-produtos-inativos");
    const tbody = document.getElementById("tabela-produtos-inativos");

    if (!area || !tbody) return;

    area.classList.remove("d-none");

    if (produtos.length === 0) {

       tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-muted text-center py-3">
                    Nenhum produto inativo.
                </td>
            </tr>
        `;

        return;
    }

    area.classList.remove("d-none");

   tbody.innerHTML = produtos.map(p => `
        <tr>
            <td class="align-middle text-center">${p.nome}</td>

            <td class="align-middle text-center">
                R$ ${p.preco.toFixed(2)}
            </td>

            <td class="align-middle text-center">
                <input type="number"
                    min="0"
                    value="0"
                    id="qtd-reativar-${p.id}"
                    class="form-control form-control-sm mx-auto"
                    style="width:80px;">
            </td>

            <td class="align-middle text-center">
                <button class="btn btn-sm btn-success"
                    style="min-width:100px;"
                    onclick="reativarProduto(${p.id})">
                    Reativar
                </button>
            </td>
        </tr>
    `).join('');
}

async function reativarProduto(id) {

    const input = document.getElementById(`qtd-reativar-${id}`);
    const quantidade = parseInt(input?.value);

    if (isNaN(quantidade) || quantidade < 0) {
        return Swal.fire("Erro", "Digite uma quantidade válida.", "error");
    }

    const confirmar = await Swal.fire({
        title: "Reativar produto?",
        text: `Quantidade inicial: ${quantidade}`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sim, reativar",
        cancelButtonText: "Cancelar"
    });

    if (!confirmar.isConfirmed) return;

    const res = await fetch(`/reativar_produto/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantidade })
    });

    if (!res.ok) {
        return Swal.fire("Erro", "Não foi possível reativar.", "error");
    }

    Swal.fire("Sucesso", "Produto reativado!", "success");

    await atualizarSistemaProdutos();
}

async function carregarProdutosSelect() {

    const select = document.getElementById("select-produto");
    if (!select) return;

    // Limpa o select
    select.innerHTML = `
        <option value="" selected disabled>
            Selecionar Produto ou Combo...
        </option>
    `;

    // ================= PRODUTOS =================
    const resProdutos = await fetch('/listar_produtos');
    const produtos = await resProdutos.json();

    produtos.forEach(p => {

        const precoOriginal = p.preco;
        const promocao = p.promocao || 0;

        const precoFinal = promocao > 0
            ? precoOriginal - (precoOriginal * promocao / 100)
            : precoOriginal;

        select.innerHTML += `
            <option value="${p.id}"
                data-tipo="produto"
                data-id="${p.id}"
                data-nome="${p.nome}"
                data-qtd="${p.qtd}"
                data-preco="${precoFinal}">
                🛒 ${p.nome} (R$ ${precoFinal.toFixed(2)})
            </option>
        `;
    });

    // ================= COMBOS =================
    const resCombos = await fetch('/listar_combos');
    const combos = await resCombos.json();

    combos.forEach(c => {

        let statusLabel = "";
        let disabledAttr = "";

        if (!c.ativo) {
            statusLabel = " (Inativo)";
            disabledAttr = "disabled";
        } else if (c.incompleto) {
            statusLabel = " (Incompleto)";
            disabledAttr = "disabled";
        }

        select.innerHTML += `
            <option value="${c.id}"
                data-tipo="combo"
                data-id="${c.id}"
                data-nome="${c.nome}"
                data-preco="${c.preco_final}"
                data-descricao="${c.descricao || ''}"
                data-desconto="${c.desconto || 0}"
                ${disabledAttr}>
                🎁 ${c.nome}${statusLabel}
            </option>
        `;
    });
}

async function removerProduto(id){

    // 🔎 1️⃣ Verificar se o produto participa de combos
    const resCheck = await fetch(`/verificar_produto_em_combos/${id}`);
    const combosAfetados = await resCheck.json();

    let mensagem = "Essa ação não pode ser desfeita.";

    if (combosAfetados.length > 0) {

        mensagem = `
            Este produto faz parte dos seguintes combos:
            <br><br>
            ${combosAfetados.join("<br>")}
            <br><br>
            Ao remover, esses combos poderão ficar indisponíveis.
            <br><br>
            Deseja continuar?
        `;
    }

    // ⚠️ 2️⃣ Confirmação inteligente
    const confirmar = await Swal.fire({
        title:"Remover produto?",
        html: mensagem,
        icon:"warning",
        showCancelButton:true,
        confirmButtonText:"Sim, remover",
        cancelButtonText:"Cancelar"
    });

    if(!confirmar.isConfirmed) return;

    // 🗑️ 3️⃣ Remover produto
    const res = await fetch(`/remover_produto/${id}`, { method:'DELETE' });
    const data = await res.json();

    if (res.ok) {

        await carregarProdutosTabela();
        await carregarProdutosSelect();
        await carregarProdutosCombo();
        await carregarProdutosInativos();

        if (data.combos_afetados && data.combos_afetados.length > 0) {

            Swal.fire({
                icon: "info",
                title: "Combos afetados",
                html: `
                    Os seguintes combos podem ficar indisponíveis:
                    <br><br>
                    ${data.combos_afetados.join("<br>")}
                `
            });
        } else {
            Swal.fire("Removido!", "Produto excluído com sucesso.", "success");
        }
    }
}

async function carregarProdutosDesconto() {

    const res = await fetch('/listar_produtos');
    const produtos = await res.json();

    const select = document.getElementById("select-desconto");
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
                data-preco="${precoOriginal}">
                ${p.nome} - R$ ${precoFinal.toFixed(2)}
            </option>
        `;
    });
    atualizarPreviewDescontoRelampago();
}

async function aplicarDescontoRelampago() {

    const select = document.getElementById("select-desconto");
    const descontoInput = document.getElementById("input-desconto");

    const id = select.value;
    let desconto = parseFloat(descontoInput.value);

    if (!id || isNaN(desconto)) {
        return Swal.fire("Aviso", "Selecione produto e desconto.", "info");
    }

    if (desconto < 0 || desconto > 100) {
        return Swal.fire("Erro", "Desconto deve estar entre 0% e 100%.", "error");
    }

    const res = await fetch('/aplicar_desconto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, desconto })
    });

    const data = await res.json();

    if (!res.ok) {
        return Swal.fire("Erro", data.mensagem || "Erro ao aplicar desconto.", "error");
    }

    Swal.fire("Sucesso", "Desconto aplicado!", "success");

    // 🔥 Atualiza tudo visualmente
    await atualizarSistemaProdutos();
    await carregarProdutosDesconto();

    // Atualiza preview após aplicar desconto
    setTimeout(() => {
        const event = new Event("change");
        document.getElementById("select-desconto")?.dispatchEvent(event);
    }, 100);

    await sincronizarPrecosCombo();
}

async function atualizarSistemaProdutos(){

    if (typeof carregarProdutosTabela === "function")
        await carregarProdutosTabela();

    if (typeof carregarProdutosSelect === "function")
        await carregarProdutosSelect();

    if (typeof carregarProdutosCombo === "function")
        await carregarProdutosCombo();

    if (typeof carregarEstoqueTabela === "function")
        await carregarEstoqueTabela();

    if (typeof carregarProdutosReposicao === "function")
    await carregarProdutosReposicao();
    
    if (typeof carregarProdutosInativos === "function")
        await carregarProdutosInativos();

    if (typeof carregarProdutosDesconto === "function") {
        carregarProdutosDesconto();
    }
}

// ================= PREVIEW DESCONTO RELÂMPAGO =================

function atualizarPreviewDescontoRelampago() {

    const select = document.getElementById("select-desconto");
    const input = document.getElementById("input-desconto");

    if (!select || !input) return;

    const opt = select.options[select.selectedIndex];

    if (!opt || !opt.dataset.preco) {
        document.getElementById("desconto-preco-original").innerText = "R$ 0,00";
        document.getElementById("desconto-preco-final").innerText = "R$ 0,00";
        return;
    }

    const precoOriginal = parseFloat(opt.dataset.preco);
    const desconto = parseFloat(input.value) || 0;

    const precoFinal = precoOriginal - (precoOriginal * desconto / 100);

    document.getElementById("desconto-preco-original").innerText =
        `R$ ${precoOriginal.toFixed(2)}`;

    document.getElementById("desconto-preco-final").innerText =
        `R$ ${precoFinal.toFixed(2)}`;
}

document.addEventListener("change", function(e) {
    if (e.target && e.target.id === "select-desconto") {
        atualizarPreviewDescontoRelampago();
    }
});

document.addEventListener("input", function(e) {
    if (e.target && e.target.id === "input-desconto") {
        atualizarPreviewDescontoRelampago();
    }
});