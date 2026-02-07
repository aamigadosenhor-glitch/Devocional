Devocional 365 (site estático)

O que é
Um devocional diário que troca automaticamente, sem conta e sem envio de dados.
A mensagem do dia é escolhida pelo dia do ano, por exemplo 2 de fevereiro corresponde ao dia 33.

Botões
Compartilhar: abre o compartilhamento do aparelho, ou copia o texto.
Atualizar: limpa cache e recarrega, útil quando você altera textos e quer forçar a versão nova.

Arquivos principais
index.html
styles.css
app.js
data/devocionais.json
data/musicas.json, opcional
sw.js
manifest.json

Como editar os textos
Abra data/devocionais.json e altere title, reading, message, prayer, practice.

Música do dia no Spotify
Abra data/musicas.json
1) Troque enabled para true
2) Preencha tracks com 365 itens, um por dia
Aceita link do Spotify ou spotify:track:ID
Observação: o player do Spotify pode exigir login para tocar a faixa inteira.