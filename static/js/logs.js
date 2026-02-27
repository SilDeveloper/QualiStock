async function limparLogs() {

    const confirmar = await Swal.fire({
        title: "Limpar todos os logs?",
        text: "Essa ação não pode ser desfeita.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, limpar"
    });

    if (!confirmar.isConfirmed) return;

    const res = await fetch('/limpar_logs', {
        method: 'DELETE'
    });

    if (!res.ok) {
        return Swal.fire("Erro", "Não foi possível limpar.", "error");
    }

    await carregarLogs();

    Swal.fire("Sucesso", "Logs limpos com sucesso!", "success");
}

function gerarPdfLogs() {
    window.open('/gerar_pdf_logs', '_blank');
}