export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto py-16 px-4">
            <h1 className="text-3xl font-bold mb-8">Termos e Condições</h1>
            <div className="prose bg-white p-8 rounded-xl shadow border border-gray-100">
                <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-PT')}</p>

                <h3>1. Serviços</h3>
                <p>A Patinhas na Lua presta serviços de estética animal (banhos, tosquias, spa) no salão e ao domicílio.</p>

                <h3>2. Agendamentos</h3>
                <p>Os agendamentos podem ser feitos online ou presencialmente. O cancelamento deve ser feito com pelo menos 24 horas de antecedência.</p>

                <h3>3. Saúde do Animal</h3>
                <p>O dono é responsável por informar sobre quaisquer condições de saúde, alergias ou comportamentos agressivos do animal.</p>

                <h3>4. Vacinação</h3>
                <p>É obrigatória a apresentação do boletim de vacinas atualizado, incluindo a vacina da raiva e tosse do canil (recomendada).</p>

                <h3>5. Pagamentos</h3>
                <p>O pagamento é realizado no final do serviço. Aceitamos numerário, MBWay e Transferência Bancária.</p>
            </div>
        </div>
    );
}
