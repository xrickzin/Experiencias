# 033 — Acesso às fotos, salvar e compartilhar, qualidade das fotos

**Status:** Aceita (pedido do usuário, 2026-10-16). Complementa o [032](./032-photo-capture-date.md).

## Contexto
- O seletor de fotos do Android entrega as imagens sem a data em que foram tiradas ([ADR 032](./032-photo-capture-date.md)). O usuário não pretende publicar o app no Google Play, só distribuir o APK a amigos, e aceitou pedir **acesso a todas as fotos** para recuperar essa data.
- O usuário pediu para **compartilhar e salvar** as fotos fora do Laço, e para melhorar a **qualidade** das fotos enviadas sem pesar demais.

## Decisão
**Data pela galeria do Android**
- Ao escolher fotos da galeria, o app pede acesso às fotos do aparelho (só fotos, sem localização).
- O seletor continua sendo o do sistema. O arquivo que ele entrega tem o número da imagem na galeria (ex.: `1000331477.jpg`); com o acesso, o app procura essa imagem e usa a **data de criação registrada na galeria**.
- Sem acesso, ou sem encontrar a imagem (por exemplo, uma foto só na nuvem), vale o envio, e dá para corrigir na foto aberta (032).
- **Limite:** a galeria registra quando o arquivo chegou ao aparelho. Para fotos tiradas no celular, é o momento da foto; para imagens recebidas pelo WhatsApp ou baixadas, é o dia em que chegaram. Nesses casos, a correção manual continua sendo o caminho.
- Foi descartado o seletor próprio: dá o mesmo resultado com muito mais código e uma interface pior que a do sistema.

**Salvar no celular e compartilhar**
- Na foto aberta, dois botões lado a lado: **"Salvar no celular"** grava a foto na galeria; **"Compartilhar"** abre a tela de compartilhar do aparelho.
- São duas ações porque a tela de compartilhar do Android não oferece "salvar na galeria" (conferido no aparelho do usuário).
- Os dois podem salvar e compartilhar qualquer foto do Laço. Depois de salva ou enviada, a foto fica sob as regras do aparelho ou de quem a recebeu, não mais do Laço.
- A foto salva é a versão guardada no Laço (ver a qualidade abaixo), não o arquivo original do aparelho de quem a enviou.

**Qualidade**
- O envio passou de qualidade 0,7 para **0,85**, em resolução inteira. Em JPEG, 0,85 é visualmente muito próximo do original e ocupa bem menos que 1,0 (que costuma ter o dobro do tamanho).
- **Custo:** cada foto fica, em média, de 30 % a 50 % maior que antes (estimativa; varia com a foto). O plano gratuito do Supabase tem um limite de armazenamento e de tráfego; com muitas fotos, vale acompanhar o uso no painel.

## Consequências
- Dependências novas: `expo-media-library` (data pela galeria e salvar) e `expo-sharing` (compartilhar). O `expo-file-system` já vinha com o Expo.
- O `app.json` declara a permissão de fotos em português, só para imagens e sem localização.
- **O Expo Go não permite o acesso a todas as fotos no Android** (o próprio Expo Go avisa na tela). Nele, a data pela galeria fica desligada e vale o caminho da 032. Essa parte só funciona e só pode ser validada **no APK**. Salvar e compartilhar funcionam no Expo Go.
- A biblioteca da galeria é carregada só quando usada e protegida contra falha: se faltar, o app não quebra; só fica sem a data da galeria.
