/* ===== DASHBOARD ===== */

function mostrarIA(mensagem, classeAdd, classeRemove) {

    const alerta = document.getElementById('alerta-ia');

    alerta.classList.remove('d-none', classeRemove);
    alerta.classList.add(classeAdd);

    document.getElementById('msg-ia').innerText = mensagem;
}


function scrollPara(secao) {

    localStorage.setItem("abaAtiva", secao);

    const sections = {
        dashboard: document.getElementById("dashboard-section"),
        estoque: document.getElementById("estoque-section"),
        promocoes: document.getElementById("promocoes-section"),
        logs: document.getElementById("logs-section"),
        logistica: document.getElementById("logistica-section"),
        suporte: document.getElementById("suporte-section")
    };

    Object.values(sections).forEach(sec => {
        if (sec) sec.style.display = "none";
    });

    if (sections[secao]) {
        sections[secao].style.display = "block";
    }

   if (secao === "estoque") {

        if (typeof carregarEstoqueTabela === "function")
            carregarEstoqueTabela();

        if (typeof carregarReposicao === "function")
            carregarReposicao();
    }

    if (secao === "promocoes" && typeof carregarProdutosTabela === "function") {
        carregarProdutosTabela();
    }

    if (secao === "logs" && typeof carregarLogs === "function") {
        carregarLogs();
    }
}

document.addEventListener("DOMContentLoaded", async function () {

    if (typeof atualizarSistemaProdutos === "function") {
        await atualizarSistemaProdutos();
    }

    if (typeof atualizarTabelaLog === "function") {
        atualizarTabelaLog();
    }

    if (typeof carregarProdutosReposicao === "function") {
        await carregarProdutosReposicao();
    }

    const select = document.getElementById("select-produto");

    if (select) {
        select.addEventListener("change", function () {

            const opt = select.options[select.selectedIndex];
            const infoBox = document.getElementById("info-combo");
            const descricaoBox = document.getElementById("descricao-combo");

            if (!infoBox || !descricaoBox) return;

            if (opt.dataset.tipo === "combo") {

                descricaoBox.innerText = opt.dataset.descricao || "";
                infoBox.classList.remove("d-none");

            } else {

                infoBox.classList.add("d-none");
                descricaoBox.innerText = "";
            }
        });
    }
});

// ===== PERFIL =====

document.addEventListener("DOMContentLoaded", function () {

    const formPerfil = document.getElementById("form-perfil");

    if (formPerfil) {
        formPerfil.addEventListener("submit", async function (e) {
            e.preventDefault();

            const res = await fetch("/atualizar_perfil", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: document.getElementById("perfil-nome").value,
                    matricula: document.getElementById("perfil-matricula").value,
                    cargo: document.getElementById("perfil-cargo").value
                })
            });

            const data = await res.json();

            if (res.ok) {
                Swal.fire("Sucesso", "Perfil atualizado!", "success")
                    .then(() => location.reload());
            } else {
                Swal.fire("Erro", data.mensagem || "Erro ao atualizar.", "error");
            }
        });
    }

});

async function carregarLogs() {

    const res = await fetch("/listar_logs");
    const logs = await res.json();

    const tbody = document.getElementById("tabela-logs");
    const badge = document.getElementById("total-logs");

    if (!tbody || !badge) return;

    badge.innerText = `${logs.length} Registros`;

    if (logs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-muted text-center">
                    Nenhum registro encontrado.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = logs.map(log => `
        <tr>
            <td>${log.data_hora}</td>
            <td>${log.usuario}</td>
            <td>${log.acao}</td>
        </tr>
    `).join("");
}