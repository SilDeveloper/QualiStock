// ==============================
// HISTÓRICO DE NOTAS
// ==============================

// Array global (continua no script.js)
if (typeof notasGeradas === "undefined") {
    var notasGeradas = [];
}

if (typeof totalVendas === "undefined") {
    var totalVendas = 0;
}

// ADICIONAR NOTA AO HISTÓRICO
function adicionarNotaAoHistorico(itens) {

    totalVendas++;

    const hist = document.getElementById('historico-notas');

    if (notasGeradas.length >= 10) {
        hist.removeChild(hist.lastChild);
        notasGeradas.pop();
    }

    const novaNota = document.createElement('div');
    novaNota.className = "card p-4 border-dashed mb-2 nota-impressao";

    const operador =
        document.getElementById('sessao-nome')?.innerText || "Operador";

    let totalVenda = 0;

    const itensHTML = itens.map(i => {

        const precoUnitario = Number(i.preco);
        const subtotal = precoUnitario * i.quantidade;

        totalVenda += subtotal;

        return `
            <div class="d-flex justify-content-between">
                <span>
                    ${i.tipo === "combo" ? "🎁 " : "🛒 "}
                    ${i.nome}
                </span>
                <span>
                    ${i.quantidade} x R$ ${precoUnitario.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}
                </span>
            </div>
        `;
    }).join('');

    novaNota.innerHTML = `
        <div class="text-center mb-2">
            <b>*** STACKSTOCK PDV ***</b><br>
            <small>Op: ${operador}</small>
        </div>

        <div class="border-top border-bottom py-2">
            ${itensHTML}
        </div>

        <div class="d-flex justify-content-between fw-bold mt-3">
            <span>TOTAL:</span>
            <span>
                R$ ${totalVenda.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}
            </span>
        </div>

        <div class="text-center mt-2 small">
            ${new Date().toLocaleString()}
        </div>

        <button class="btn btn-sm btn-outline-dark w-100 mt-2 d-print-none"
            onclick="imprimirNota(this)">
            🖨️ Imprimir
        </button>
    `;

    hist.insertBefore(novaNota, hist.firstChild);
    notasGeradas.unshift(novaNota);

    salvarNotasNoStorage(novaNota.outerHTML);

    atualizarMeta();
}


// ==============================
// SALVAR NO LOCALSTORAGE
// ==============================
function salvarNotasNoStorage(htmlNota) {

    let notasSalvas = JSON.parse(localStorage.getItem("notas")) || [];

    notasSalvas.unshift(htmlNota);

    if (notasSalvas.length > 10) {
        notasSalvas.pop();
    }

    localStorage.setItem("notas", JSON.stringify(notasSalvas));
}


// ==============================
// RESTAURAR NOTAS
// ==============================
function restaurarNotas() {

    const notasSalvas = JSON.parse(localStorage.getItem("notas")) || [];
    const hist = document.getElementById("historico-notas");

    notasSalvas.forEach(html => {
        const div = document.createElement("div");
        div.innerHTML = html;
        const nota = div.firstChild;
        hist.appendChild(nota);
        notasGeradas.push(nota);
    });

    totalVendas = notasSalvas.length;
    atualizarMeta();
}

// ==============================
// LIMPAR HISTÓRICO
// ==============================
function limparHistorico() {

    Swal.fire({
        title: "Limpar todas as notas?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, limpar"
    }).then(result => {

        if (!result.isConfirmed) return;

        // 🔥 ZERA STORAGE
        localStorage.removeItem("notas");
        localStorage.setItem("logVendas", JSON.stringify([]));

        // 🔥 ZERA DOM
        const hist = document.getElementById("historico-notas");
        if (hist) hist.innerHTML = "";

        // 🔥 ZERA VARIÁVEIS
        notasGeradas = [];
        totalVendas = 0;

        atualizarMeta();
        atualizarTabelaLog();

        Swal.fire("Histórico limpo!", "", "success");
    });
}

// ==============================
// META
// ==============================
function atualizarMeta() {

    const contador = document.getElementById('contador-notas');
    if (contador) contador.innerText = totalVendas;

    const badge = document.getElementById('progresso-meta');

    if (badge) {

        // 🔥 RESET TOTAL antes de qualquer coisa
        badge.className = "badge bg-warning text-dark d-none";
        badge.innerText = "🚀 Rumo à Meta!";

        if (totalVendas >= 10) {
            badge.className = "badge bg-success text-white";
            badge.innerText = "🏆 META ALCANÇADA!";
        }

        else if (totalVendas >= 7) {
            badge.classList.remove("d-none");
        }

        // 🔥 Se for menor que 7, ele já está escondido por padrão
    }

    const metaAtual = document.getElementById("meta-atual");
    const barra = document.getElementById("barra-meta");
    const texto = document.getElementById("meta-texto");

    if (metaAtual && barra && texto) {

        metaAtual.innerText = totalVendas;

        const porcentagem = Math.min((totalVendas / 10) * 100, 100);
        barra.style.width = porcentagem + "%";

        texto.innerText = `${Math.round(porcentagem)}% da meta atingida`;
    }
}