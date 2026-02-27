// ========= IMPRIMIR APENAS UMA NOTA =========
function imprimirNota(botao) {

    const notaSelecionada = botao.closest('.nota-impressao');
    abrirJanelaImpressao(notaSelecionada.outerHTML);
}

// ========= IMPRIMIR TODAS =========
function imprimirTodas() {

    const notas = document.getElementById('historico-notas').innerHTML;

    if (!notas.trim()) {
        return Swal.fire("Aviso", "Nenhuma nota para imprimir.", "info");
    }

    abrirJanelaImpressao(notas);
}


function abrirJanelaImpressao(conteudo){
    const janela = window.open('', '', 'width=900,height=900');

    janela.document.open();
    janela.document.write(`
        <html>
        <head>
            <title>Impressão</title>
                <style>
                   body{
                        background:#f2f2f2;
                        padding:30px;
                        display:flex;
                        flex-direction:column;
                        align-items:center;
                        font-family:monospace;
                    }

                    .nota-impressao{
                        background:#fff;
                        width:320px;
                        padding:20px;
                        border:2px dashed #999;
                        margin-bottom:30px;
                        box-shadow:0 0 8px rgba(0,0,0,0.1);
                    }

                    .nota-impressao b{
                        display:block;
                        text-align:center;
                        margin-bottom:10px;
                    }

                    .d-print-none{
                        display:none!important;
                    }

                    @media print{
                        body{
                            background:#fff;
                            box-shadow:none;
                        }
                    }
                </style>
        </head>
        <body>
            ${conteudo}
        </body>
        </html>
    `);
    janela.document.close();

    // 🔥 ESPERA A JANELA CARREGAR
    janela.onload = function(){
        janela.focus();
        janela.print();
        janela.close();
    };
}