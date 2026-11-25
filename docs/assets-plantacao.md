# Assets da Plantação das Metas

A plantação (tela **Metas**) já funciona sem nenhuma imagem: tudo é desenhado em código.
Quando um arquivo abaixo existir em `public/`, ele **substitui** o desenho automaticamente (sem mudar código).

## Formato geral
- **WEBP**, fundo **transparente** (exceto o céu), cores no estilo do BRIO (preto, âmbar, natureza escura).
- Mesma perspectiva lateral, luz vindo da direita/alto, sombra suave no pé da planta.
- A base da planta encosta no **rodapé** da imagem e fica **centralizada** na horizontal (o app alinha pela base).

## Plantas: `public/metas/plantas/{area}/{fase}.webp`
`{area}`: `padrao` (obrigatório como reserva), e opcionalmente uma espécie por área: `espiritual`, `financeira`, `fisica`, `carreira`, `pessoal`.
`{fase}`: `0` a `5`. Tamanho: **600 × 800 px** (retrato 3:4).

| Arquivo | Fase | Progresso da meta | O que mostrar |
|---|---|---|---|
| `0.webp` | Semente | 0–4% | Semente na terra recém-mexida |
| `1.webp` | Broto | 5–24% | Broto com 2 folhinhas |
| `2.webp` | Muda | 25–49% | Muda com 4–5 folhas |
| `3.webp` | Planta | 50–74% | Planta cheia, caule firme |
| `4.webp` | Em flor | 75–99% | Planta florida (flor na cor da área) |
| `5.webp` | Árvore com frutos | 100% | Árvore pequena e frondosa com frutos |

**Murcha** (prazo vencido sem concluir): `murcha-0.webp` … `murcha-5.webp` na mesma pasta, mesma pose, folhas secas e caídas.
Cores sugeridas por área (flor/fruto): espiritual `#ffb21e`, financeira `#f5f5f7`, física `#30d158`, carreira `#f5f5f7`, pessoal `#ff9f0a`.

## Cenário: `public/metas/campo/`
| Arquivo | Tamanho | Fundo | Uso |
|---|---|---|---|
| `ceu.webp` | 1920 × 840 | opaco | Céu/horizonte ao fundo (noite → amanhecer combina com o app) |
| `solo.webp` | 1920 × 200 | transparente no topo | Faixa de terra na base da cena |
| `grama-1.webp` | 1920 × 400 | transparente | Grama rala (vigor 5–24%) |
| `grama-2.webp` | 1920 × 400 | transparente | Grama média (25–49%) |
| `grama-3.webp` | 1920 × 400 | transparente | Grama alta (50–74%) |
| `grama-4.webp` | 1920 × 400 | transparente | Grama densa com florzinhas (75–100%) |

O vigor da grama vem dos últimos 30 dias: 60% horas de estudo (30 h = cheio) + 40% dias com missão cumprida.
