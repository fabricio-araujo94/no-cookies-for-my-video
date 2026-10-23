# No Cookies for My Video

Uma aplicação web Single-Page (SPA) minimalista, leve e sem dependências pesadas para assistir vídeos do YouTube livre de distrações, anúncios e rastreamento de cookies.

## Funcionalidades

- **Player sem Cookies:** Utiliza o domínio oficial de privacidade do YouTube (`youtube-nocookie.com`).
- **Retomada de Ponto (Resume):** Salva automaticamente o tempo assistido e retoma de onde você parou.
- **Lista de Reprodução Local:** Adicione, organize e exclua vídeos. Os dados são salvos no `localStorage` do seu navegador.
- **Backup Local (Importar/Exportar):** Exporte sua lista e progresso para um arquivo `.json` e importe de volta quando quiser.
- **Design Minimalista:** Interface Dark Mode, responsiva e focada apenas no conteúdo.
- **Zero Rastreamento:** Sem frameworks pesados, sem analytics, sem cookies de terceiros. Apenas você e o vídeo.

## Como Usar

1. Clone ou baixe este repositório.
2. Encontre algum meio de iniciar um servidor no diretório raiz.
3. Cole um link do YouTube na barra superior e clique em "Add Video".
4. Clique nos vídeos da lista lateral para assistir. O progresso é salvo automaticamente a cada 5 segundos.

Se você tentar usar o site abrindo o arquivo `index.html` no seu navegador, não vai funcionar. A API do YouTube só funciona através do protocolo `http` ou `https`. Você pode criar um servidor local facilmente com Python ou Node. De toda forma, você pode conferí-lo nesse [link](https://no-cookies-for-my-video.vercel.app/).

## Estrutura do Projeto

- `index.html`: Estrutura base da aplicação.
- `style.css`: Estilos minimalistas em Dark Mode.
- `app.js`: Lógica principal (Vanilla JS ES6+), gerenciamento de estado e integração com a API do YouTube.

## Detalhes Técnicos

- **Vanilla JS (ES6+):** Nenhuma biblioteca externa (como React ou Vue) foi utilizada para garantir máxima performance e leveza.
- **API IFrame do YouTube:** Utilizada para controlar o player e monitorar o tempo de reprodução em tempo real.
- **noembed API:** Utilizada para buscar os títulos dos vídeos sem a necessidade de chaves de API do YouTube.
- **Persistência:** Todos os dados (IDs, títulos, tempo assistido) são armazenados localmente via `localStorage`.

