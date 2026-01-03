export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto py-20 px-4 prose prose-blue">
            <h1>Termos e Condições</h1>
            <p className="lead">Última atualização: {new Date().toLocaleDateString('pt-PT')}</p>

            <h2>1. Aceitação dos Termos</h2>
            <p>Ao utilizar os serviços da "Patinhas na Lua", concorda com estes termos e condições.</p>

            <h2>2. Agendamentos</h2>
            <p>Os agendamentos estão sujeitos a confirmação. O cliente deve comparecer no horário marcado. Tolerância de 15 minutos.</p>

            <h2>3. Cancelamentos</h2>
            <p>Cancelamentos devem ser feitos com 24 horas de antecedência.</p>

            <h2>4. Serviços ao Domicílio</h2>
            <p>A carrinha necessita de um local de estacionamento seguro e legal. Taxas de deslocação aplicam-se conforme a zona.</p>

            <h2>5. Saúde do Animal</h2>
            <p>O dono deve informar sobre quaisquer condições de saúde, alergias ou comportamentos agressivos.</p>

            <h2>6. Pagamentos</h2>
            <p>O pagamento é feito no final do serviço. Aceitamos numerário, MBWay e Transferência.</p>

            {/* Add more legal text as needed */}
        </div>
    );
}
