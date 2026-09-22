# 🎯 hootka — Quiz Game Show Offline & Web

> **"Seu quiz. Sua turma. Sua competição."**

O **hootka** é uma plataforma de game show educativa interativa no estilo *Kahoot offline*, desenvolvida com design **Neo-Brutalism**.

Funciona tanto como **Aplicativo Desktop** (100% offline em Electron + SQLite) quanto como **Web App** (hospedável diretamente na Vercel ou qualquer CDN).

---

## ⚡ Diferenciais do hootka

- **Sem necessidade de celulares dos alunos:** O professor projeta as perguntas na TV/projetor e os grupos respondem levantando cards físicos (**A, B, C, D**).
- **Sem necessidade de internet:** Funciona 100% local com persistência no navegador (localStorage) e no Desktop (SQLite Wasm).
- **Gamificação real:**
  - Bônus proporcional de velocidade
  - Bônus de sequência (*Streak*)
  - Bônus de recuperação para grupos que ficaram para trás
  - Questões Especiais (+50%) e Questões de Virada (pontuação dobrada)
- **Animações físicas no Ranking:** Os cards se movem fisicamente pela tela quando as posições mudam com avisos dinâmicos de ultrapassagem (`🔥 ULTRAPASSAGEM!`).
- **Pódio e Efeitos Sonoros:** Chuva de confetes, sintetizador de áudio Web Audio API (sem dependência de mp3 externos) e revelação do 5º ao 1º lugar.

---

## 🚀 Como Hospedar na Vercel

1. Suba este repositório no seu GitHub.
2. Acesse [vercel.com](https://vercel.com) e clique em **Add New Project**.
3. Selecione o repositório **hootka**.
4. A Vercel detectará automaticamente as configurações através do arquivo `vercel.json`:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Clique em **Deploy**! Em menos de 1 minuto seu hootka estará no ar com link público.

---

## 💻 Desenvolvimento e Execução Local

### Instalar dependências:
```bash
npm install
```

### Executar em Modo Web (Vite):
```bash
npm run dev:vite
```
Acesse `http://localhost:5173`.

### Executar em Modo Desktop (Electron):
```bash
npm run dev
```

### Compilar para Produção Web:
```bash
npm run build
```

### Gerar Instalador Executável Windows (.exe):
```bash
npm run dist
```

---

## 🎨 Design System Neo-Brutalist

- **Cores principais:**
  - Amarelo Ouro: `#FFD600`
  - Azul Elétrico: `#1A1AFF`
  - Laranja-Vermelho: `#FF3B00`
  - Verde Esmeralda: `#00C851`
  - Fundo: `#F5F0E8`
  - Texto e Bordas: `#0A0A0A`
- **Bordas & Sombras:** Bordas grossas de `3px`/`4px` e sombras sólidas com deslocamento rígido de `6px 6px 0 #0A0A0A`.
- **Tipografia:** *Space Grotesk* (pesos 700, 800, 900) e *Inter*.

---

## 📄 Licença

MIT License. Desenvolvido para transformar as salas de aula!
