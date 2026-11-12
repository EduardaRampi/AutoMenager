const API_BASE_URL =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : 'https://automenager-production.up.railway.app/api';

const API = `${API_BASE_URL}/dashboard`;

const moeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});


// =====================================
// CARREGAR INDICADORES
// =====================================

async function carregarResumo() {
    try {
        const response = await fetch(`${API}/resumo`);

        if (!response.ok) {
            throw new Error('Erro ao buscar indicadores.');
        }

        const dados = await response.json();

        document.getElementById('faturamento').textContent =
            moeda.format(Number(dados.faturamento));

        document.getElementById('veiculos').textContent =
            dados.veiculos_disponiveis;

        document.getElementById('clientes').textContent =
            dados.total_clientes;

        document.getElementById('vendas').textContent =
            dados.total_vendas;

    } catch (error) {
        console.error(error);
    }
}


// =====================================
// GRÁFICO DE FATURAMENTO
// =====================================

async function carregarFaturamento() {
    try {
        const response = await fetch(
            `${API}/faturamento-mensal`
        );

        if (!response.ok) {
            throw new Error('Erro ao buscar faturamento.');
        }

        const dados = await response.json();

        const meses = dados.map(item => {
            const [ano, mes] = item.mes.split('-');

            const data = new Date(
                Number(ano),
                Number(mes) - 1
            );

            return data.toLocaleDateString('pt-BR', {
                month: 'short',
                year: '2-digit'
            });
        });

        const valores = dados.map(item =>
            Number(item.faturamento)
        );

        const ctx = document
            .getElementById('graficoFaturamento');

        new Chart(ctx, {
            type: 'line',

            data: {
                labels: meses,

                datasets: [{
                    label: 'Faturamento',
                    data: valores,

                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',

                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,

                    pointRadius: 5,
                    pointBackgroundColor: '#2563eb'
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: true,

                plugins: {
                    tooltip: {
                        callbacks: {
                            label: context =>
                                moeda.format(context.raw)
                        }
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true,

                        ticks: {
                            callback: valor =>
                                moeda.format(valor)
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error(error);
    }
}


// =====================================
// GRÁFICO DE VENDAS POR FILIAL
// =====================================

async function carregarFiliais() {
    try {
        const response = await fetch(
            `${API}/vendas-por-filial`
        );

        if (!response.ok) {
            throw new Error('Erro ao buscar filiais.');
        }

        const dados = await response.json();

        const filiais = dados.map(item => item.filial);

        const vendas = dados.map(item =>
            Number(item.total_vendas)
        );

        const ctx = document
            .getElementById('graficoFiliais');

        new Chart(ctx, {
            type: 'bar',

            data: {
                labels: filiais,

                datasets: [{
                    label: 'Vendas realizadas',
                    data: vendas,

                    backgroundColor: [
                        '#2563eb',
                        '#0f766e',
                        '#8b5cf6'
                    ],

                    borderRadius: 6
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: true,

                plugins: {
                    legend: {
                        display: false
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error(error);
    }
}


// =====================================
// INICIALIZAR DASHBOARD
// =====================================

async function inicializarDashboard() {
    await Promise.all([
        carregarResumo(),
        carregarFaturamento(),
        carregarFiliais()
    ]);
}

inicializarDashboard();
