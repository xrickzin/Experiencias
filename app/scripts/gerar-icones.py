"""Gera o ícone, o ícone adaptativo do Android (com o monocromático) e a abertura a partir da arte
original (E9 da Fase 0). Uso, a partir de app/:  python -I scripts/gerar-icones.py

Precisa do Pillow no Python da máquina; não é dependência do app.
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

PASTA = Path(__file__).resolve().parent.parent / 'assets' / 'images'
VINHO = (0x67, 0x0C, 0x19)  # o fundo medido da arte
arte = Image.open(PASTA / 'icone-laco-original.png').convert('RGB')

# A arte ocupa x 288–1728, y 204–1408 da imagem de 2000x2000.
DESENHO = (288, 204, 1728, 1408)
# Ícone: casa, casal e laço com pouca margem (o desenho grande, a casa inteira; recorte "B" aberto).
CENTRO_DO_ICONE, LADO_DO_ICONE = (985, 800), 1440


def regiao(cx, cy, lado):
    """Um quadrado da arte centrado em (cx, cy); o que passa da imagem vira fundo vinho."""
    tela = Image.new('RGB', (lado, lado), VINHO)
    tela.paste(arte, (lado // 2 - cx, lado // 2 - cy))
    return tela


def desenho_suave(largura):
    """O desenho inteiro, com a borda do recorte esfumada: o fundo da arte varia um pouco em volta."""
    d = arte.crop(DESENHO)
    d = d.resize((largura, round(d.height * largura / d.width)), Image.LANCZOS)
    margem = max(8, largura // 40)
    mascara = Image.new('L', d.size, 0)
    ImageDraw.Draw(mascara).rectangle((margem, margem, d.width - margem, d.height - margem), fill=255)
    return d, mascara.filter(ImageFilter.GaussianBlur(margem / 2))


# --- Ícone geral (1024): o enquadramento do ícone, de borda a borda -----------------------------
regiao(*CENTRO_DO_ICONE, LADO_DO_ICONE).resize((1024, 1024), Image.LANCZOS).save(PASTA / 'icon.png')

# --- Adaptativo do Android -----------------------------------------------------------------------
# O aparelho mostra só os 2/3 do centro da camada (72 de 108 dp): a camada é a arte estendida em
# volta, para o miolo visível ser exatamente o enquadramento do ícone.
regiao(*CENTRO_DO_ICONE, LADO_DO_ICONE * 3 // 2).resize((1024, 1024), Image.LANCZOS).save(PASTA / 'android-icon-foreground.png')
Image.new('RGB', (1024, 1024), VINHO).save(PASTA / 'android-icon-background.png')

# Monocromático (ícone temático do Android 13+): silhueta autoral do laço com a casa, branca sobre
# transparente, dentro da zona segura (o círculo de 66 dp no centro da camada).
S, L = 4, 1024 * 4
mono = Image.new('L', (L, L), 0)
d = ImageDraw.Draw(mono)
ZONA = 0.46  # fração da camada ocupada pela silhueta (o aparelho mostra o miolo de 2/3)


def pt(x, y):
    return (L * (1 - ZONA) / 2 + x / 1000 * L * ZONA, L * (1 - ZONA) / 2 + y / 1000 * L * ZONA)


def tracar(pontos, largura, cor):
    """Traço grosso e liso: círculos carimbados ao longo do caminho (o `line` do Pillow risca nas curvas)."""
    r = largura / 2
    for (x0, y0), (x1, y1) in zip(pontos, pontos[1:]):
        passos = max(1, int(math.hypot(x1 - x0, y1 - y0) / (S * 2)))
        for k in range(passos + 1):
            x, y = x0 + (x1 - x0) * k / passos, y0 + (y1 - y0) * k / passos
            d.ellipse((x - r, y - r, x + r, y + r), fill=cor)


# Espessuras pensadas para a silhueta ocupando 62% da camada; acompanham a escala.
ESPESSURA = S * ZONA / 0.62
traco = int(46 * ESPESSURA)
tracar([pt(70, 330), pt(500, 40), pt(930, 330)], traco, 255)  # telhado
for x in (150, 850):
    tracar([pt(x, 290), pt(x, 700)], traco, 255)  # paredes, até o laço
for cx in (452, 548):
    for cy in (190, 286):
        a, b = pt(cx - 40, cy - 40), pt(cx + 40, cy + 40)
        d.rounded_rectangle((*a, *b), radius=int(10 * S), fill=255)  # janela 2x2
fita = int(78 * ESPESSURA)
t = [2 * math.pi * i / 720 for i in range(721)]
pts = [pt(500 + 470 * math.sin(a), 760 + 230 * math.sin(a) * math.cos(a)) for a in t]  # o infinito
tracar(pts, fita + int(44 * ESPESSURA), 0)  # respiro: a fita passa por cima das paredes
tracar(pts, fita, 255)
mono = mono.resize((1024, 1024), Image.LANCZOS)
branco = Image.new('RGBA', (1024, 1024), (255, 255, 255, 0))
branco.putalpha(mono)
branco.save(PASTA / 'android-icon-monochrome.png')

# --- Abertura: o desenho inteiro sobre o vinho ---------------------------------------------------
# No Android 12+ a imagem da abertura é recortada num círculo: o desenho fica com folga no centro.
abertura = Image.new('RGB', (1024, 1024), VINHO)
desenho, mascara = desenho_suave(round(1024 * 0.60))
abertura.paste(desenho, ((1024 - desenho.width) // 2, (1024 - desenho.height) // 2), mascara)
abertura.save(PASTA / 'splash-icon.png')
print('ok')
