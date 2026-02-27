/* ===== VENDAS ===== */

var notasGeradas = [];
var totalVendas = 0;

// ================= FINALIZAR VENDA =================
async function finalizarVenda() {

    if (!carrinho.length) {
        return Swal.fire("Aviso", "Carrinho vazio.", "info");
    }

    const res = await fetch('/finalizar_venda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carrinho)
    });

    const data = await res.json();

    if (!res.ok) {
        return Swal.fire("Erro", data.mensagem || "Erro na venda", "error");
    }

    await carregarProdutosSelect();
    await carregarEstoqueTabela();

    adicionarNotaAoHistorico([...carrinho]);
    registrarLogVenda(carrinho, "Pago");

    if (data.mensagem_ia) {
        mostrarIA(data.mensagem_ia, "alert-info", "alert-danger");
    }

    carrinho = [];
    atualizarVisualCarrinho();

    const infoBox = document.getElementById("info-combo");
    const descricaoBox = document.getElementById("descricao-combo");

    if (infoBox) infoBox.classList.add("d-none");
    if (descricaoBox) descricaoBox.innerHTML = "";

    const select = document.getElementById("select-produto");
    if (select) select.selectedIndex = 0;

    Swal.fire("Sucesso", "Venda Processada!", "success");
}


// ================= LOG =================
function registrarLogVenda(itens, status = "Pago", motivo = null) {

    let valorTotal = 0;

    itens.forEach(i => {
        valorTotal += i.quantidade * i.preco;
    });

    const operador =
        document.getElementById("sessao-nome")?.innerText || "Operador";

    const temCombo = itens.some(i => i.tipo === "combo");

    const venda = {
        data: new Date().toLocaleString(),
        valor: valorTotal.toFixed(2),
        status,
        operador,
        motivo,
        tipo: temCombo ? "combo" : "produto"
    };

    // 🔥 LÊ do storage
    let logVendas = JSON.parse(localStorage.getItem("logVendas")) || [];

    // 🔥 ADICIONA no início
    logVendas.unshift(venda);

    // 🔥 SALVA de volta
    localStorage.setItem("logVendas", JSON.stringify(logVendas));

    atualizarTabelaLog();
}


function atualizarTabelaLog() {

    const logVendas = JSON.parse(localStorage.getItem("logVendas")) || [];

    const tbody = document.getElementById("log-vendas");
    const btnLimpar = document.getElementById("btn-limpar-log");

    if (!tbody) return;

    if (logVendas.length === 0) {

        if (btnLimpar) btnLimpar.classList.add("d-none");

        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-muted text-center">
                    Nenhuma venda registrada ainda.
                </td>
            </tr>
        `;

        atualizarResumoVendas();
        return;
    }

    if (btnLimpar) btnLimpar.classList.remove("d-none");

    tbody.innerHTML = logVendas.map(v => `
        <tr>
            <td>${v.data}</td>

            <td class="d-flex align-items-center gap-2">
                <span>R$ ${v.valor}</span>
                ${v.tipo === "combo" ? '🎁' : ''}
            </td>

            <td>${v.operador}</td>

            <td class="d-flex align-items-center gap-2">

                <span class="badge ${v.status === "Pago" ? "bg-success" : "bg-danger"}">
                    ${v.status}
                </span>

                ${
                    v.status === "Cancelado"
                        ? `<i class="bi bi-info-circle text-warning fs-5"
                             style="cursor:pointer"
                             title="Ver motivo"
                             onclick="verMotivo('${v.motivo || ""}')">
                           </i>`
                        : ""
                }

            </td>
        </tr>
    `).join('');

    atualizarResumoVendas();
}

function atualizarResumoVendas() {

    const realizadasEl = document.getElementById("total-realizadas");
    const canceladasEl = document.getElementById("total-canceladas");

    if (!realizadasEl || !canceladasEl) return;

    const logVendas = JSON.parse(localStorage.getItem("logVendas")) || [];

    const realizadas = logVendas.filter(v => v.status === "Pago").length;
    const canceladas = logVendas.filter(v => v.status === "Cancelado").length;

    realizadasEl.innerText = realizadas;
    canceladasEl.innerText = canceladas;
}

function limparLogVendas() {

    Swal.fire({
        title: "Limpar histórico de vendas?",
        icon: "warning",
        showCancelButton: true
    }).then(result => {

        if (!result.isConfirmed) return;

        logVendas = [];
        localStorage.removeItem("logVendas");

        atualizarTabelaLog();

        Swal.fire("Histórico limpo!", "", "success");
    });
}


function verMotivo(motivo) {

    Swal.fire({
        title: "Motivo do Cancelamento",
        text: motivo || "Não informado",
        icon: "info"
    });
}