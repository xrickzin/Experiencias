# 035 — Tamanho da foto guardada

**Status:** Aceita (escolha do usuário, 2026-10-16). Ajusta o [033](./033-gallery-access-save-share-quality.md).

## Contexto
Com a foto em resolução inteira (033), cabiam cerca de 300 fotos de câmera no 1 GB do plano gratuito do Supabase ([ADR 034](./034-photo-thumbnails.md)). O usuário quer chegar perto de milhares sem trocar de plano.

## Decisão
- A foto guardada é **reduzida no aparelho a 2560 px no lado maior**, em JPEG qualidade 0,85 (`expo-image-manipulator`, o mesmo das miniaturas). Fotos menores que isso não são ampliadas.
- 2560 px é mais que o dobro da largura da tela do celular: a foto continua nítida e permite zoom de cerca de 2×. Para impressão grande ou zoom forte, perde detalhe em relação ao original.
- Se a redução falhar, vai a foto como o seletor entregou (qualidade 0,85, resolução inteira).

## Consequências
- Medido no aparelho do usuário: uma foto de câmera ficou com cerca de 160 KB e a miniatura com cerca de 70 KB.
- **Capacidade estimada no 1 GB gratuito: de 1.000 a 4.000 fotos**, conforme o tipo de foto (fotos de câmera com muitos detalhes ficam maiores que a medida acima).
- "Salvar no celular" e "Compartilhar" entregam essa versão reduzida.
