# 🧪 Guia Completo de Testes - Patinhas na Lua
**Destinado a:** Testador (Não-Técnico)
**Objetivo:** Validar todas as funcionalidades da aplicação "Patinhas na Lua".

---

## 🔐 1. Credenciais de Teste
Utilize estritamente estas contas para realizar os testes. Não crie novas contas a menos que seja solicitado na secção "Extras".

| Tipo de Conta | Email | Palavra-Passe |
| :--- | :--- | :--- |
| **Utilizador Normal** | `joao.rodrigues.palhares@gmail.com` | `Antigr@vitynormaluser` |
| **Administrador** | `ultimatefirept@gmail.com` | `Antigr@vityadminuser` |

---

## 🌍 2. Área Pública (Sem Login)
*Abra o site numa janela "Anónima" ou certifique-se que não tem sessão iniciada.*

### 2.1. Navegação Inicial
1.  Aceda à página inicial (`/`).
2.  **Verificar:**
    *   O design carrega corretamente (imagens, cores).
    *   O botão "Marcar Agora" ou "Entrar" está visível.
3.  **Links de Rodapé:**
    *   Clique em "Termos e Condições" (`/terms`). Verifique se o texto aparece.
    *   Clique em "Política de Privacidade" (`/privacy`). Verifique se o texto aparece.

---

## 👤 3. Testes de Utilizador Normal
*Faça Login com a conta de **Utilizador Normal**.*

### 3.1. Dashboard Principal (`/dashboard`)
1.  **Verificar:** Vê cartões com "Próximas Marcações", "Os Meus Pets" e "Saldo/Pontos".
2.  **Painel Lateral (Desktop) / Menu (Mobile):** Teste se consegue abrir/fechar o menu.

### 3.2. Gerir Perfil (`/dashboard/profile`)
1.  Navegue até **Perfil**.
2.  Altere o **Nome** e **Telemóvel**.
3.  Clique em **"Guardar Alterações"**.
4.  **Verificar:** Recarregue a página e veja se os dados novos se mantiveram.

### 3.3. Gerir Pets (`/dashboard/pets`)
1.  Navegue até **Meus Pets**.
2.  **Criar Pet:**
    *   Clique em **"Adicionar Pet"**.
    *   Preencha: *Nome* (ex: "Bobby Teste"), *Raça*, *Data Nascimento*.
    *   Clique em **Salvar**.
    *   **Verificar:** O "Bobby Teste" aparece na lista?
3.  **Editar Pet:**
    *   Clique no ícone de lápis/editar no "Bobby Teste".
    *   Mude o peso ou observações.
    *   Salve e confirme a alteração.
4.  **Apagar Pet:**
    *   (Deixe para o fim ou crie um segundo pet "Teste Apagar" apenas para isto).
    *   Clique em Apagar/Remover. Confirme se desapareceu.

### 3.4. Fazer uma Marcação (`/dashboard/book`)
1.  Clique em **"Nova Marcação"**.
2.  **Passo 1 (Pet):** Selecione o "Bobby Teste".
3.  **Passo 2 (Serviço):** Escolha um serviço (ex: "Banho Simples").
    *   *Nota: Se o preço for "Sob Consulta", é normal.*
4.  **Passo 3 (Data):** Escolha uma data futura no calendário.
    *   Selecione uma hora disponível.
5.  **Passo 4 (Resumo):** Confirme os dados e clique em **"Agendar"**.
6.  **Verificar:** Foi redirecionado para o Dashboard? A marcação aparece lá como "Pendente"?

### 3.5. Programa de Fidelidade (`/dashboard/rewards`)
1.  Navegue até **Prémios**.
2.  **Verificar:** Vê o cartão de fidelidade digital?
3.  Tente ver o "Código de Convite" (Referral).

### 3.6. Histórico e Cancelamento
1.  No Dashboard, procure a marcação que acabou de fazer.
2.  Clique em **"Cancelar"** (se disponível).
3.  **Verificar:** O estado mudou para "Cancelado" ou a marcação desapareceu da lista de "Próximas"?

---

## 🛡️ 4. Testes de Administrador
*Faça Logout da conta normal e Login com a conta de **Administrador**.*

### 4.1. Visão Geral (`/admin`)
1.  Ao entrar, deve ser redirecionado para a área Admin (Fundo escuro/tema diferente).
2.  **Verificar:** Vê os gráficos de faturação e contagem de clientes?

### 4.2. Gestão de Agenda (`/admin/appointments`)
1.  Aceda ao Calendário.
2.  **Verificar:** Vê a marcação feita (ou cancelada) pelo Utilizador Normal no passo 3.4?
3.  **Ação Manual:**
    *   Clique num horário vazio.
    *   Tente criar um agendamento manual para um cliente existente.
    *   Mude o estado de uma marcação (arrastar e largar ou clicar e editar: de "Pendente" para "Confirmado").

### 4.3. Clientes (`/admin/clients`)
1.  Procure o utilizador "Joao" (o utilizador normal).
2.  Clique no perfil dele.
3.  **Verificar:** Consegue ver o histórico de marcações dele?
4.  Tente adicionar uma **Nota Interna** ao cliente (ex: "Cliente teste").

### 4.4. Serviços e Preços (`/admin/services`)
1.  Crie um novo serviço "Serviço Teste Admin".
2.  Defina preço e duração.
3.  **Verificar:** Ele aparece na lista?
4.  Apague esse serviço de seguida para não sujar a loja.

### 4.5. Marketing Studio (`/admin/marketing`) - **NOVO!**
1.  Aceda a **"Estúdio Criativo"**.
2.  **Upload:** Carregue uma fotografia qualquer (de um cão/gato).
3.  **Preencher:** Escreva um Nome ("Fofinho") e Legenda.
4.  **Gerar:** Veja se a imagem aparece no centro do "Polaroid" com o logótipo em baixo.
5.  **Download:** Clique em "Baixar Imagem" e veja se o ficheiro é gravado no seu PC.

### 4.6. Configurações (`/admin/settings`)
1.  Aceda às configurações.
2.  Tente alterar o horário de abertura da loja.
3.  Salve. (Depois reverta se necessário).

---

## 🔄 5. Testes de Interação (Cruzados)
*Requer alternar entre contas.*

1.  **Admin:** Crie um Cupão/Desconto em `/admin/coupons` com o código `TESTE10`.
2.  **Admin:** Logout.
3.  **User Normal:** Tente fazer uma marcação e, se houver campo de cupão, insira `TESTE10`. (Validar se o desconto aplica).
4.  **Admin:** Confirme se a marcação entrou com o desconto.

---

## ⚠️ Relatório de Erros
Se encontrar algum erro:
1.  Tire um "Print Screen" (Captura de Ecrã).
2.  Anote qual o passo exato que falhou.
3.  Anote a mensagem de erro (se aparecer alguma a vermelho).

**Bom trabalho!** 🐾
