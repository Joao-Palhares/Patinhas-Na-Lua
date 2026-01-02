export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto py-16 px-4">
            <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>
            <div className="prose bg-white p-8 rounded-xl shadow border border-gray-100">
                <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-PT')}</p>

                <h3>1. Recolha de Dados</h3>
                <p>A Patinhas na Lua recolhe os seguintes dados para prestação de serviços:</p>
                <ul>
                    <li>Dados do utilizador: Nome, Email, Contacto Telefónico, Morada e NIF.</li>
                    <li>Dados do animal: Nome, Espécie, Raça, Histórico de saúde e comportamental.</li>
                </ul>

                <h3>2. Finalidade</h3>
                <p>Os dados são utilizados exclusivamente para:</p>
                <ul>
                    <li>Agendamento e realização de serviços de estética animal.</li>
                    <li>Emissão de faturas.</li>
                    <li>Comunicação de lembretes e alterações de agenda.</li>
                </ul>

                <h3>3. Partilha de Dados</h3>
                <p>Não partilhamos os seus dados com terceiros, exceto quando exigido por lei (Autoridade Tributária).</p>

                <h3>4. Seus Direitos</h3>
                <p>Pode solicitar a alteração ou eliminação dos seus dados a qualquer momento contactando-nos.</p>
            </div>
        </div>
    );
}
