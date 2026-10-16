# 034 — Miniaturas das fotos

**Status:** Aceita (pedido do usuário, 2026-10-16). Complementa o [033](./033-gallery-access-save-share-quality.md).

## Contexto
As listas (a grade de Momentos, Nossa História, o cartão do Início, a capa da memória e os favoritos) baixavam a foto inteira só para mostrá-la pequena. Além disso, a URL assinada muda a cada hora, e o cache de imagens era guardado pela URL; então a mesma foto era baixada de novo. Isso pesa no tráfego do Supabase, na memória do aparelho e no tempo de carregamento. O usuário perguntou se as fotos poderiam ficar "muito comprimidas" até serem vistas. Como a compressão de JPEG não se desfaz, a forma equivalente é guardar uma miniatura ao lado da foto.

## Decisão
- **Miniatura ao lado da foto**, no mesmo bucket e na mesma pasta: `{arquivo}.mini.jpg`, com lado maior de até 1080 px, JPEG qualidade 0,7 (cerca de 100 a 200 KB numa foto de câmera). Ela é gerada no aparelho, na hora do envio (`expo-image-manipulator`).
- **As listas e capas usam a miniatura**; a foto inteira só é baixada ao **abrir a foto** (e para salvar ou compartilhar).
- **Fotos de antes das miniaturas** continuam aparecendo pela foto inteira. Não há conversão das antigas.
- **A miniatura é um extra:** se não for gerada ou não subir, a foto entra do mesmo jeito.
- **Cache pelo arquivo, não pela URL** (`cacheKey`): o aparelho não baixa de novo uma foto que já mostrou só porque a URL assinada mudou.
- Excluir uma foto ou uma experiência apaga também as miniaturas.
- **Tela cheia:** tocar na foto aberta a mostra na tela inteira, com pinça (até 4×), arrastar e dois toques (2×), feitos com os gestos do próprio React Native. Usa a mesma foto guardada, sem novo download.

## Consequências
- Nenhuma mudança no banco nem nas regras do Storage (elas valem por pasta).
- Cada foto ocupa um pouco mais no armazenamento (a miniatura soma cerca de 5 % a 10 % numa foto de câmera); em troca, o tráfego das listas cai muito.

## Estimativa de capacidade no plano gratuito (2026-10-16)
Plano gratuito do Supabase: **1 GB** de arquivos e **5 GB** de tráfego por mês (mais 5 GB em cache). **O projeto é pausado depois de 1 semana sem uso** e precisa ser reativado no painel. Para evitar a pausa, uma rotina do GitHub Actions (`.github/workflows/manter-supabase-ativo.yml`) consulta o banco a cada 3 dias; ela precisa dos segredos `SUPABASE_URL` e `SUPABASE_ANON_KEY` no repositório e para se o repositório ficar 60 dias sem commits. Pro: a partir de US$ 25 por mês, com 100 GB.

| Tipo de foto (estimativa) | Por foto, com miniatura | Fotos em 1 GB |
|---|---|---|
| Câmera do celular (cerca de 12 MP, qualidade 0,85) | cerca de 3 MB | cerca de 300 |
| Metade câmera, metade recebidas pelo WhatsApp | cerca de 1,7 MB | cerca de 600 |
| Só recebidas pelo WhatsApp ou prints | cerca de 0,3 MB | cerca de 3.000 |

Os valores são estimados e variam com o celular e a cena. **Atualizado pelo [035](./035-photo-size.md):** com a foto reduzida a 2560 px, a estimativa passa a 1.000 a 4.000 fotos. O limite que pesa é o armazenamento; o tráfego, com miniaturas e cache, dificilmente chega ao limite para um casal.
