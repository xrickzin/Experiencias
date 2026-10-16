# 032 — Quando a foto foi tirada: leitura automática e correção manual

**Status:** Aceita (pedido do usuário, 2026-10-16). Complementa o [030](./030-photo-caption-and-observation-moment.md).

## Contexto
Ao entrar, cada foto vai para o dia e o período em que foi tirada, lidos do EXIF que a câmera ou a galeria entrega ao app. Sem essa informação, vale o momento do envio. O usuário viu uma foto antiga (de 2022) aparecer em "Hoje" e pediu para corrigir a data à mão: por exemplo, uma foto recebida pelo WhatsApp no dia X, mas tirada no dia Y.

**Diagnóstico no aparelho do usuário** (Android com o seletor de fotos do sistema, ligado ao Google Fotos): toda imagem escolhida da galeria chega ao app **sem data**. O EXIF vem só com largura, altura, orientação e luz, até em fotos de câmera. Também não chega o identificador da imagem na galeria. O resultado é o mesmo sem compressão e com o seletor "antigo", porque o Android redireciona os dois para o mesmo seletor. O app não tem como recuperar a data original por esse caminho.

## Decisão
- **Na foto aberta** aparece quando ela foi tirada ("Tirada em: Hoje · Tarde"), com **"Alterar quando foi tirada"**. A escolha é a mesma da observação do momento: Hoje, Ontem ou Outro dia (digitado), mais o período, nunca no futuro. A tela mostra onde a foto vai aparecer.
- **Os dois podem corrigir**, como a legenda. A foto continua de quem a enviou.
- **A leitura automática continua:** quando a imagem traz a data, ela é usada; quando não traz, vale o momento do envio até alguém corrigir.

## Quando a data automática funciona

| Origem | Data automática? |
|---|---|
| Câmera pelo próprio app ("Tirar foto") | Sim: o momento em que foi tirada |
| Galeria no Android com o seletor do sistema (caso do usuário) | Não pelo seletor; **no APK, com acesso às fotos, sim, pela galeria** ([033](./033-gallery-access-save-share-quality.md)); no Expo Go, vale o envio |
| Galeria no iPhone | Em geral sim, quando a foto original tem a data |
| Imagens recebidas pelo WhatsApp, prints, imagens baixadas | Não: em geral não têm a data original (o WhatsApp remove; prints e downloads não têm) |

## Consequências
- Nenhuma mudança no banco: `registros.capturada_em` já é editável pelos dois desde o 030 (entre 1990 e o dia seguinte).
- Data escolhida que não é a atual é guardada no meio do período (3h, 9h, 15h ou 21h em Brasília), como na observação.
- A escolha de dia e período virou um componente único, usado pela observação e pela foto.
- **Alternativa adiada, depois adotada no [033](./033-gallery-access-save-share-quality.md):** ler a data pela galeria do aparelho exige acesso a todas as fotos (que o Google Play restringe a apps de galeria). Como o app não vai para o Google Play, o usuário aceitou esse acesso.
