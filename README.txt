Devocional 365 (site estático)

O que é
Um devocional diário que troca automaticamente a cada 24 horas, sem conta e sem envio de dados.
A mensagem do dia é escolhida pelo dia do ano, por exemplo 2 de fevereiro corresponde ao dia 33.

Arquivos principais
index.html, página principal
styles.css, estilos
app.js, lógica do dia do ano
data/devocionais.json, os 365 devocionais
sw.js, modo offline
manifest.json, instalação como aplicativo

Como hospedar grátis no GitHub Pages
1) Crie um repositório público no GitHub
2) Envie todos os arquivos desta pasta para a raiz do repositório
3) Vá em Settings, Pages
4) Em Build and deployment, escolha Branch main e pasta root
5) Salve e abra o link gerado

Como editar os textos
Abra data/devocionais.json e altere os campos title, reading, message, prayer, practice.