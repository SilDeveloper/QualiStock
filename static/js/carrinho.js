/* ==============================
   CARRINHO
============================== */
let comboItens = [];
let carrinho = [];

function adicionarAoCarrinho() {

    const sel = document.getElementById('select-produto');
    const valor = sel.value;
    const qtd = parseInt(document.getElementById('venda-qtd').value);

    if (!valor || qtd <= 0) return;

    const opt = sel.options[sel.selectedIndex];
    const tipo = opt.dataset.tipo;
    const nome = opt.dataset.nome;
    const preco = parseFloat(opt.dataset.preco);

    let id;

    if (tipo === "produto") {

    id = parseInt(valor);
    const estoque = parseInt(opt.dataset.qtd);

    const jaExiste = carrinho.find(i => i.id === id && i.tipo === "produto");
    const total = (jaExiste ? jaExiste.quantidade : 0) + qtd;

    if (total > estoque) {
        return Swal.fire("Erro", "Quantidade acima do disponível!", "error");
    }

    if (jaExiste) {
        jaExiste.quantidade = total;
    } else {
        carrinho.push({
            id,
            tipo: "produto",
            nome,
            quantidade: qtd,
            preco
        });
    }
}

    // 🔥 Se for combo
    if (tipo === "combo") {

        id = parseInt(valor)

        const jaExiste = carrinho.find(i => i.id === id && i.tipo === "combo");
        const total = (jaExiste ? jaExiste.quantidade : 0) + qtd;

        if (jaExiste) {
            jaExiste.quantidade = total;
        } else {
            const descricao = opt.dataset.descricao || "";

            carrinho.push({
                id,
                tipo: "combo",
                nome,
                quantidade: qtd,
                preco,
                descricao
            });
        }
    }

    atualizarVisualCarrinho();
}


function atualizarVisualCarrinho() {

    const area = document.getElementById('area-carrinho');
    area.classList.toggle('d-none', carrinho.length === 0);

    let totalGeral = 0;

    document.getElementById('lista-carrinho').innerHTML =
        carrinho.map((item, i) => {

            const subtotal = item.quantidade * item.preco;
            totalGeral += subtotal;

            return `
            <li class="list-group-item bg-transparent border-0 px-0">

                <div class="p-3 rounded bg-white shadow-sm border-start border-4 
                    ${item.tipo === "combo" ? "border-success" : "border-primary"}">

                    <div class="d-flex justify-content-between align-items-center">

                        <div>
                            <strong>${item.nome}</strong>
                            <span class="badge ms-2 
                                ${item.tipo === "combo" ? "bg-success" : "bg-primary"}">
                                ${item.tipo === "combo" ? "Combo" : "Produto"}
                            </span>
                            <br>
                            <small class="text-muted">
                                ${item.quantidade} x R$ ${item.preco.toFixed(2)}
                            </small>
                        </div>

                        <div class="text-end">
                            <div class="text-muted small">Subtotal</div>
                            <strong class="fs-6">
                                R$ ${subtotal.toFixed(2)}
                            </strong>
                            <br>
                            <button class="btn btn-sm text-danger p-0 mt-1"
                                onclick="carrinho.splice(${i},1); atualizarVisualCarrinho();">
                                Remover
                            </button>
                        </div>

                    </div>

                    ${item.tipo === "combo" && item.descricao ? `
                        <div class="mt-2 small text-muted">
                            ${item.descricao}
                        </div>
                    ` : ""}

                </div>

            </li>
            `;

        }).join('');

    atualizarTotalCarrinho(totalGeral);
}

function atualizarTotalCarrinho(total) {

    const totalElemento = document.getElementById("total-carrinho");

    if (!totalElemento) return;

    if (total === 0) {
        totalElemento.classList.add("d-none");
        return;
    }

    totalElemento.classList.remove("d-none");

    totalElemento.innerHTML = `
        <div class="text-muted small">Total da Venda</div>
        <div class="fs-4">R$ ${total.toFixed(2)}</div>
    `;
}

function cancelarVenda() {

    if (!carrinho.length) {
        return Swal.fire("Aviso", "Nenhum item no carrinho.", "info");
    }

    Swal.fire({
        title: "Cancelar venda?",
        input: "text",
        inputLabel: "Informe o motivo do cancelamento",
        inputPlaceholder: "Ex: Cliente desistiu",
        showCancelButton: true,
        confirmButtonText: "Confirmar",
        confirmButtonColor: "#dc3545"
    }).then(result => {

        if (!result.isConfirmed) return;

        const motivo = result.value || "Não informado";

        registrarLogVenda(carrinho, "Cancelado", motivo);

        carrinho = [];
        atualizarVisualCarrinho();

        Swal.fire("Cancelado", "Venda cancelada com sucesso.", "info");
    });
}

function atualizarContadorVendas() {

    const realizadas = logVendas.filter(v => v.status === "Finalizado").length;
    const canceladas = logVendas.filter(v => v.status === "Cancelado").length;

    document.getElementById("contador-realizadas").innerText = realizadas;
    document.getElementById("contador-canceladas").innerText = canceladas;
}