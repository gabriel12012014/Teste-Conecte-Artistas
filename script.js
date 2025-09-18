document.addEventListener('DOMContentLoaded', () => {
    // Validação inicial
    if (typeof producoes === 'undefined' || !Array.isArray(producoes)) {
        console.error("ERRO: 'producoes' não encontrada. Verifique se 'dados.js' foi carregado.");
        return;
    }

    // --- ELEMENTOS DO DOM ---
    const containerPrincipal = document.getElementById('container-principal');
    const containerLinhas = document.getElementById('container-linhas');
    const guessInput = document.getElementById('guess-input');
    const guessButton = document.getElementById('guess-button');
    const suggestionsContainer = document.getElementById('suggestions-container');
    const victoryPopup = document.getElementById('victory-popup');
    const restartButton = document.getElementById('restart-button');
    const gameUiContainer = document.getElementById('game-ui-container');
    const closePopupButton = document.getElementById('close-popup-button');
    const showResultButton = document.getElementById('show-result-button');
    const pathLengthElement = document.getElementById('path-length');
    const pathDisplayElement = document.getElementById('path-display');
    const shareButton = document.getElementById('share-button');
    const viewport = document.getElementById('viewport');
    const resetZoomButton = document.getElementById('reset-zoom-button');
    const liveArtistas = document.getElementById('live-artistas');
    const liveFilmes = document.getElementById('live-filmes');
    const liveSeries = document.getElementById('live-series');
    const liveNovelas = document.getElementById('live-novelas');
    const pageSubtitle = document.getElementById('page-subtitle');
    const artistInfoPanel = document.getElementById('artist-info-panel');
    const artistInfoName = document.getElementById('artist-info-name');
    const artistInfoList = document.getElementById('artist-info-list');
    const artistInfoEmpty = document.getElementById('artist-info-empty');
    const closeArtistInfoButton = document.getElementById('close-artist-info');
    const artistInfoMeta = document.getElementById('artist-info-meta');
    const watchLinksSection = document.getElementById('watch-links');
    const watchCarousel = document.getElementById('watch-carousel');
    const watchCarouselTrack = document.getElementById('watch-carousel-track');
    const watchCarouselDots = document.getElementById('watch-carousel-dots');
    const carouselControls = document.querySelector('.carousel-controls');
    const carouselPrev = document.getElementById('carousel-prev');
    const carouselNext = document.getElementById('carousel-next');
    const statArtistas = document.getElementById('stat-artistas');
    const statFilmes = document.getElementById('stat-filmes');
    const statSeries = document.getElementById('stat-series');
    const statNovelas = document.getElementById('stat-novelas');
    // Tutorial
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    const tutorialStartButton = document.getElementById('tutorial-start-button');
    const tutorialCloseButton = document.getElementById('tutorial-close');
    const tutorialDontShow = document.getElementById('tutorial-dont-show');
    const helpButton = document.getElementById('help-button');

    // --- VARIÁVEIS DE ESTADO DO JOGO ---
    const nodesNaTela = new Set();
    const atorParaProducoes = new Map();
    const todosOsNomes = { atores: new Set(), producoes: new Map() };
    let todosOsNomesArray = [];
    let atorObjetivo1 = null;
    let atorObjetivo2 = null;
    let finalPath = [];
    let selectedBox = null; // caixa atualmente selecionada
    let highlightedSuggestionIndex = -1; // navegação por setas nas sugestões

    // Configuração de distâncias para posicionamento relativo
    const POS_CONFIG = {
        // Distâncias preferidas para conexão (mais espaçado)
        minLinkDistanceDesktop: 160,
        minLinkDistanceMobile: 110,
        maxLinkDistanceDesktop: 240,
        maxLinkDistanceMobile: 160,
        ringStepDesktop: 40,
        ringStepMobile: 28,
        // Ângulos (em graus) que vamos testar a partir da direção preferida
        angleOffsetsDeg: [0, 12, -12, 24, -24, 36, -36, 48, -48],
        // Distância mínima entre caixas
        minBoxGap: 12
    };

    // --- VARIÁVEIS PARA ZOOM E PAN ---
    let scale = 1;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startPanX = 0;
    let startPanY = 0;
    let initialPinchDistance = null;

    // Mantém uma variável CSS com a altura da UI inferior (input + chips)
    function setGameUiHeightVar() {
        try {
            const h = gameUiContainer ? gameUiContainer.offsetHeight : 0;
            if (h > 0) {
                document.documentElement.style.setProperty('--game-ui-height', `${h}px`);
            }
        } catch (_) { /* noop */ }
    }

    function applyTransform() {
        // Ordem: translate depois scale. As fórmulas de pan/zoom assumem esta ordem.
        viewport.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    }

    function resetZoom() {
        scale = 1;
        panX = 0;
        panY = 0;
        applyTransform();
    }
    
    resetZoomButton.addEventListener('click', () => {
        resetZoom();
        // limpa âncora de zoom
        zoomAnchorX = null; zoomAnchorY = null;
    });

    // --- Tutorial (primeiro acesso) ---
    const TUTORIAL_KEY = 'tutorial_optout_v1'; // marca "não mostrar novamente" (novo namespace)
    function isOptedOut() {
        try { return localStorage.getItem(TUTORIAL_KEY) === '1'; } catch (_) { return false; }
    }
    function openTutorial() {
        if (!tutorialOverlay) return;
        tutorialOverlay.classList.remove('hidden');
    }
    function showTutorialIfFirstTime() {
        if (!isOptedOut()) {
            openTutorial();
        }
    }
    function hideTutorial(setOptOut = false) {
        if (!tutorialOverlay) return;
        tutorialOverlay.classList.add('hidden');
        if (setOptOut) {
            try { localStorage.setItem(TUTORIAL_KEY, '1'); } catch (_) { /* ignore */ }
        }
    }
    if (tutorialStartButton) tutorialStartButton.addEventListener('click', () => hideTutorial(!!(tutorialDontShow && tutorialDontShow.checked)));
    if (tutorialCloseButton) tutorialCloseButton.addEventListener('click', () => hideTutorial(!!(tutorialDontShow && tutorialDontShow.checked)));
    if (helpButton) helpButton.addEventListener('click', () => openTutorial());
    if (tutorialOverlay) {
        tutorialOverlay.addEventListener('click', (e) => {
            if (e.target === tutorialOverlay) hideTutorial(false);
        });
        document.addEventListener('keydown', (e) => {
            if (!tutorialOverlay.classList.contains('hidden') && e.key === 'Escape') hideTutorial(false);
        });
    }

    // --- LÓGICA DE ZOOM (SCROLL DO RATO) ---
    const isTutorialOpen = () => !!(tutorialOverlay && !tutorialOverlay.classList.contains('hidden'));
    let zoomAnchorX = null, zoomAnchorY = null, zoomAnchorTimer = null;
    document.body.addEventListener('wheel', (e) => {
        if (isTutorialOpen() || e.target.closest('#game-ui-container') || e.target.closest('.popup-content') || e.target.closest('.tutorial-content')) return;
        e.preventDefault();
        
        const zoomIntensity = 0.1;
        const delta = e.deltaY > 0 ? -1 : 1;
        const newScale = Math.max(0.3, Math.min(2, scale + delta * zoomIntensity));
        // fixa o ponto âncora no início do gesto e mantém até encerrar
        if (zoomAnchorX === null || zoomAnchorY === null) {
            zoomAnchorX = e.clientX;
            zoomAnchorY = e.clientY;
        }

        panX = zoomAnchorX - (zoomAnchorX - panX) * (newScale / scale);
        panY = zoomAnchorY - (zoomAnchorY - panY) * (newScale / scale);
        
        scale = newScale;
        applyTransform();
        // reseta âncora ao terminar o gesto (inatividade)
        if (zoomAnchorTimer) clearTimeout(zoomAnchorTimer);
        zoomAnchorTimer = setTimeout(() => { zoomAnchorX = null; zoomAnchorY = null; }, 250);
    }, { passive: false });

    // --- LÓGICA DE PAN (ARRASTAR O FUNDO) ---
    document.body.addEventListener('mousedown', (e) => {
        if (e.target.closest('.box-nome') || e.target.closest('#game-ui-container') || e.target.closest('.popup-content')) return;
        isPanning = true;
        startPanX = e.clientX - panX;
        startPanY = e.clientY - panY;
        document.body.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        panX = e.clientX - startPanX;
        panY = e.clientY - startPanY;
        applyTransform();
    });

    document.addEventListener('mouseup', () => {
        isPanning = false;
        document.body.style.cursor = 'default';
    });

    // --- LÓGICA DE ZOOM E PAN PARA MOBILE ---
    document.body.addEventListener('touchstart', (e) => {
        if (isTutorialOpen() || e.target.closest('#game-ui-container') || e.target.closest('.popup-content') || e.target.closest('.tutorial-content')) return;
        
        if (e.touches.length === 1 && !e.target.closest('.box-nome')) {
            isPanning = true;
            startPanX = e.touches[0].clientX - panX;
            startPanY = e.touches[0].clientY - panY;
        } else if (e.touches.length === 2) {
            isPanning = false;
            initialPinchDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    }, { passive: false });

    document.body.addEventListener('touchmove', (e) => {
        if (isTutorialOpen() || e.target.closest('#game-ui-container') || e.target.closest('.popup-content') || e.target.closest('.tutorial-content')) return;
        e.preventDefault();

        if (isPanning && e.touches.length === 1) {
            panX = e.touches[0].clientX - startPanX;
            panY = e.touches[0].clientY - startPanY;
            applyTransform();
        } else if (e.touches.length === 2 && initialPinchDistance) {
            const currentPinchDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const pinchRatio = currentPinchDistance / initialPinchDistance;
            const newScale = Math.max(0.3, Math.min(2, scale * pinchRatio));
            const midPointX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midPointY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            
            panX = midPointX - (midPointX - panX) * (newScale / scale);
            panY = midPointY - (midPointY - panY) * (newScale / scale);
            
            scale = newScale;
            initialPinchDistance = currentPinchDistance;
            applyTransform();
        }
    }, { passive: false });

    document.body.addEventListener('touchend', () => {
        isPanning = false;
        initialPinchDistance = null;
    });

    function preProcessarDados() {
        const atoresSet = new Set();
        producoes.forEach(producao => {
            const nomeProducaoLower = producao.titulo.toLowerCase();
            todosOsNomes.producoes.set(nomeProducaoLower, producao);
            producao.elenco.forEach(ator => {
                atoresSet.add(ator);
                if (!atorParaProducoes.has(ator)) {
                    atorParaProducoes.set(ator, []);
                }
                atorParaProducoes.get(ator).push(producao.titulo);
            });
        });
        Array.from(atoresSet).forEach(ator => todosOsNomes.atores.add(ator.toLowerCase()));
        
        todosOsNomesArray = [
            ...Array.from(todosOsNomes.producoes.values()).map(p => ({ nome: p.titulo, tipo: 'Produção' })),
            ...Array.from(atoresSet).map(a => ({ nome: a, tipo: 'Artista' }))
        ];
    }

    // Ajusta o tamanho da fonte dos nós conforme a quantidade na tela
    function atualizarTamanhoFonteNos() {
        const boxes = Array.from(document.querySelectorAll('.box-nome'));
        const count = boxes.length;
        const isMobile = window.innerWidth <= 768;
        const base = isMobile ? 12 : 14;
        let size = base;
        // Começa a reduzir mais cedo para evitar poluição visual
        if (count > 12 && count <= 20) size = base - 1;
        else if (count > 20 && count <= 30) size = base - 2;
        else if (count > 30 && count <= 45) size = base - 3;
        else if (count > 45 && count <= 60) size = base - 4;
        else if (count > 60) size = base - 5;
        if (size < 10) size = 10;
        boxes.forEach(box => {
            const extra = box.classList.contains('box-ator-objetivo') ? 1 : 0;
            box.style.fontSize = `${size + extra}px`;
        });
    }

    function atualizarEstatisticasAoVivo() {
        if (!liveArtistas || !liveFilmes || !liveSeries || !liveNovelas) return;
        const contagem = { artistas: 0, filmes: 0, series: 0, novelas: 0 };
        nodesNaTela.forEach(nome => {
            const nomeLower = nome.toLowerCase();
            if (todosOsNomes.atores.has(nomeLower)) {
                contagem.artistas++;
            } else if (todosOsNomes.producoes.has(nomeLower)) {
                const tipo = todosOsNomes.producoes.get(nomeLower).tipo;
                if (tipo === 'Filme') contagem.filmes++;
                else if (tipo === 'Série') contagem.series++;
                else if (tipo === 'Novela') contagem.novelas++;
            }
        });
        liveArtistas.textContent = contagem.artistas;
        liveFilmes.textContent = contagem.filmes;
        liveSeries.textContent = contagem.series;
        liveNovelas.textContent = contagem.novelas;
        // Pode mudar a altura (quebra de linha dos chips)
        requestAnimationFrame(setGameUiHeightVar);
    }

    function getHeaderHeight() {
        const val = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
        return isNaN(val) ? 72 : val;
    }

    function verificarVitoria() {
        if (!atorObjetivo1 || !atorObjetivo2) return;
        const adjacencias = new Map();
        document.querySelectorAll('.box-nome').forEach(box => {
            adjacencias.set(box.dataset.nome, []);
        });
        document.querySelectorAll('#container-linhas line').forEach(linha => {
            const deNome = document.getElementById(linha.dataset.de).dataset.nome;
            const paraNome = document.getElementById(linha.dataset.para).dataset.nome;
            adjacencias.get(deNome).push(paraNome);
            adjacencias.get(paraNome).push(deNome);
        });
        const visitados = new Set();
        const fila = [[atorObjetivo1, [atorObjetivo1]]];
        visitados.add(atorObjetivo1);
        while (fila.length > 0) {
            const [noAtual, caminho] = fila.shift();
            if (noAtual === atorObjetivo2) {
                destacarCaminhoVitoria(caminho);
                fimDeJogo(caminho);
                return;
            }
            const vizinhos = adjacencias.get(noAtual) || [];
            for (const vizinho of vizinhos) {
                if (!visitados.has(vizinho)) {
                    visitados.add(vizinho);
                    const novoCaminho = [...caminho, vizinho];
                    fila.push([vizinho, novoCaminho]);
                }
            }
        }
    }

    function fimDeJogo(caminho) {
        finalPath = caminho;
        const numLinks = caminho.length - 1;

        let contagem = { artistas: 0, filmes: 0, series: 0, novelas: 0 };
        caminho.forEach(nome => {
            const nomeLower = nome.toLowerCase();
            if (todosOsNomes.atores.has(nomeLower)) {
                contagem.artistas++;
            } else if (todosOsNomes.producoes.has(nomeLower)) {
                const tipo = todosOsNomes.producoes.get(nomeLower).tipo;
                if (tipo === 'Filme') contagem.filmes++;
                else if (tipo === 'Série') contagem.series++;
                else if (tipo === 'Novela') contagem.novelas++;
            }
        });

        pathLengthElement.textContent = numLinks;
        statArtistas.textContent = contagem.artistas;
        statFilmes.textContent = contagem.filmes;
        statSeries.textContent = contagem.series;
        statNovelas.textContent = contagem.novelas;
        displayWinningPath(caminho);
        atualizarLinksParaProducoes();

        victoryPopup.classList.remove('hidden');
        document.getElementById('input-wrapper').classList.add('hidden');
        showResultButton.classList.remove('hidden');
        setTimeout(setGameUiHeightVar, 0);
    }

    function displayWinningPath(caminho) {
        pathDisplayElement.innerHTML = '';
        caminho.forEach((nome, index) => {
            const stepSpan = document.createElement('span');
            stepSpan.className = 'path-step';
            stepSpan.textContent = nome;
            if (index === 0 || index === caminho.length - 1) {
                stepSpan.classList.add('path-objective');
            }
            pathDisplayElement.appendChild(stepSpan);
            if (index < caminho.length - 1) {
                const separatorSpan = document.createElement('span');
                separatorSpan.className = 'path-separator';
                separatorSpan.textContent = ' → ';
                pathDisplayElement.appendChild(separatorSpan);
            }
        });
    }

    function destacarCaminhoVitoria(caminho) {
        for (let i = 0; i < caminho.length - 1; i++) {
            const noA_nome = caminho[i];
            const noB_nome = caminho[i+1];
            const noA_id = document.querySelector(`[data-nome="${noA_nome}"]`).id;
            const noB_id = document.querySelector(`[data-nome="${noB_nome}"]`).id;
            const linha = document.querySelector(`[data-de="${noA_id}"][data-para="${noB_id}"], [data-de="${noB_id}"][data-para="${noA_id}"]`);
            if (linha) {
                linha.classList.add('winning-path');
            }
        }
    }

    function handleGuess() {
        const textoInput = guessInput.value.trim();
        if (!textoInput) return;
        guessInput.blur();
        const textoInputLower = textoInput.toLowerCase();
        guessInput.value = '';
        suggestionsContainer.innerHTML = '';
        const eAtor = todosOsNomes.atores.has(textoInputLower);
        const eProducao = todosOsNomes.producoes.has(textoInputLower);
        if (!eAtor && !eProducao) {
            feedbackInputInvalido();
            return;
        }
        const nomeCorreto = textoInput;
        if (nodesNaTela.has(nomeCorreto)) {
            const nodeExistente = document.querySelector(`[data-nome="${nomeCorreto}"]`);
            nodeExistente.classList.add('shake');
            setTimeout(() => nodeExistente.classList.remove('shake'), 500);
            return;
        }
        let nosPais = [];
        if (eProducao) {
            const producao = todosOsNomes.producoes.get(textoInputLower);
            nosPais = producao.elenco.filter(ator => nodesNaTela.has(ator)).map(nome => document.querySelector(`[data-nome="${nome}"]`));
        } else {
            const producoesDoAtor = atorParaProducoes.get(nomeCorreto) || [];
            nosPais = producoesDoAtor.filter(titulo => nodesNaTela.has(titulo)).map(nome => document.querySelector(`[data-nome="${nome}"]`));
        }
        if (nosPais.length > 0) {
            const pos = calcularPosicaoFilho(nosPais[0]);
            const tipo = eProducao ? 'producao' : 'ator';
        const novoNo = criarNode(nomeCorreto, tipo, pos, null);
        // Reposiciona preferindo a frente; só cai para trás se necessário
        posicionarNovoNoPreferencial(novoNo, nosPais[0]);
        nosPais.forEach(noPai => {
            criarLinha(novoNo, noPai);
        });
        resolverTodasAsColisoes();
        atualizarTamanhoFonteNos();
    } else {
        feedbackInputInvalido("Válido, mas não conecta com ninguém!");
    }
}

    function feedbackInputInvalido(mensagem = "Nome inválido!") {
        const placeholderOriginal = guessInput.placeholder;
        guessInput.value = '';
        guessInput.placeholder = mensagem;
        document.getElementById('input-wrapper').classList.add('shake');
        setTimeout(() => {
            document.getElementById('input-wrapper').classList.remove('shake');
            guessInput.placeholder = placeholderOriginal;
        }, 2000);
    }

    guessButton.addEventListener('click', handleGuess);
    restartButton.addEventListener('click', () => { location.reload(); });
    closePopupButton.addEventListener('click', () => {
        victoryPopup.classList.add('hidden');
    });
    showResultButton.addEventListener('click', () => {
        victoryPopup.classList.remove('hidden');
    });
    closeArtistInfoButton.addEventListener('click', () => {
        artistInfoPanel.classList.add('hidden');
        if (selectedBox) selectedBox.classList.remove('selected');
        selectedBox = null;
    });
    shareButton.addEventListener('click', () => {
        const numLinks = finalPath.length - 1;
        const shareText = `Conecte os Artistas! Consegui ligar ${atorObjetivo1} e ${atorObjetivo2} em ${numLinks} conexões!`;
        if (navigator.share) {
            navigator.share({
                title: 'Conecte os Artistas',
                text: shareText,
                url: window.location.href
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Resultado copiado para a área de transferência!');
            });
        }
    });
    guessInput.addEventListener('input', mostrarSugestoes);
    guessInput.addEventListener('focus', () => {
        artistInfoPanel.classList.add('hidden');
        if (selectedBox) selectedBox.classList.remove('selected');
        selectedBox = null;
    });
    if (carouselPrev && carouselNext) {
        carouselPrev.addEventListener('click', slideAnterior);
        carouselNext.addEventListener('click', proximoSlide);
    }
    window.addEventListener('resize', atualizarCarousel);
    guessInput.addEventListener('keydown', (e) => {
        const itens = Array.from(suggestionsContainer.querySelectorAll('.suggestion-item'));
        if (e.key === 'ArrowDown' && itens.length > 0) {
            e.preventDefault();
            highlightedSuggestionIndex = (highlightedSuggestionIndex + 1) % itens.length;
            itens.forEach(el => el.classList.remove('active'));
            itens[highlightedSuggestionIndex].classList.add('active');
            itens[highlightedSuggestionIndex].scrollIntoView({ block: 'nearest' });
            guessInput.value = itens[highlightedSuggestionIndex].dataset.nome;
        } else if (e.key === 'ArrowUp' && itens.length > 0) {
            e.preventDefault();
            highlightedSuggestionIndex = (highlightedSuggestionIndex - 1 + itens.length) % itens.length;
            itens.forEach(el => el.classList.remove('active'));
            itens[highlightedSuggestionIndex].classList.add('active');
            itens[highlightedSuggestionIndex].scrollIntoView({ block: 'nearest' });
            guessInput.value = itens[highlightedSuggestionIndex].dataset.nome;
        } else if (e.key === 'Enter') {
            const ativa = highlightedSuggestionIndex >= 0 ? itens[highlightedSuggestionIndex] : itens[0];
            if (ativa) {
                e.preventDefault();
                guessInput.value = ativa.dataset.nome;
                suggestionsContainer.innerHTML = '';
            } else {
                handleGuess();
            }
        } else if (e.key === 'Escape') {
            suggestionsContainer.innerHTML = '';
            highlightedSuggestionIndex = -1;
        }
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#game-ui-container')) {
            suggestionsContainer.innerHTML = '';
        }
        const insidePanel = e.target.closest('#artist-info-panel');
        const clickedNode = e.target.closest('.box-nome');
        // Em qualquer viewport, clique fora do painel e de um nó limpa seleção e esconde o painel (no mobile já fazia)
        if (!insidePanel && !clickedNode) {
            if (!artistInfoPanel.classList.contains('hidden')) {
                artistInfoPanel.classList.add('hidden');
            }
            if (selectedBox) {
                selectedBox.classList.remove('selected');
                selectedBox = null;
            }
        }
    });

    // Sinalizador visual de clique (onda/ripple)
    function showClickIndicator(x, y) {
        const dot = document.createElement('span');
        dot.className = 'click-indicator';
        dot.style.left = x + 'px';
        dot.style.top = y + 'px';
        document.body.appendChild(dot);
        dot.addEventListener('animationend', () => dot.remove(), { once: true });
    }
    // Indicador para arraste
    let dragIndicator = null;
    let dragPointerId = null;
    function showDragIndicator(x, y, pointerId) {
        removeDragIndicator();
        dragIndicator = document.createElement('span');
        dragIndicator.className = 'drag-indicator';
        dragIndicator.style.left = x + 'px';
        dragIndicator.style.top = y + 'px';
        document.body.appendChild(dragIndicator);
        dragPointerId = pointerId;
    }
    function moveDragIndicator(x, y) {
        if (!dragIndicator) return;
        dragIndicator.style.left = x + 'px';
        dragIndicator.style.top = y + 'px';
    }
    function removeDragIndicator() {
        if (dragIndicator) {
            dragIndicator.remove();
            dragIndicator = null;
            dragPointerId = null;
        }
    }
    // Usa pointer* para cobrir mouse e toque sem duplicar eventos
    document.addEventListener('pointerdown', (e) => {
        // ignora botões não primários do mouse
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (e.target.closest('.box-nome')) {
            // Em arrastes: bolinha fixa até soltar
            showDragIndicator(e.clientX, e.clientY, e.pointerId);
        } else {
            showClickIndicator(e.clientX, e.clientY);
        }
    });
    document.addEventListener('pointermove', (e) => {
        if (dragIndicator && e.pointerId === dragPointerId) {
            moveDragIndicator(e.clientX, e.clientY);
        }
    });
    document.addEventListener('pointerup', (e) => {
        if (dragIndicator && e.pointerId === dragPointerId) {
            removeDragIndicator();
        }
    });
    document.addEventListener('pointercancel', (e) => {
        if (dragIndicator && e.pointerId === dragPointerId) {
            removeDragIndicator();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (isTutorialOpen()) return;
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && document.activeElement !== guessInput) {
            guessInput.focus();
        }
    });

    function criarNode(nome, tipo, pos, noPai = null, bloqueado = false) {
        if (nodesNaTela.has(nome)) {
            const nodeExistente = document.querySelector(`[data-nome="${nome}"]`);
            if (nodeExistente && noPai) criarLinha(nodeExistente, noPai, true);
            return nodeExistente;
        }
        nodesNaTela.add(nome);
        const box = document.createElement('div');
        box.className = 'box-nome';
        box.classList.add(tipo === 'producao' ? 'box-producao' : 'box-ator');
        box.id = `box-${Date.now()}${Math.random()}`;
        box.dataset.nome = nome;
        box.dataset.tipo = tipo;
        box.dataset.locked = bloqueado ? 'true' : 'false';
        const producaoInfo = producoes.find(p => p.titulo === nome);
        if (producaoInfo) {
            box.innerHTML = `<strong>${nome}</strong><br><small>${producaoInfo.tipo} (${producaoInfo.ano})</small>`;
        } else {
            box.textContent = nome;
        }
        containerPrincipal.appendChild(box);
        box.style.left = `${pos.x}px`;
        box.style.top = `${pos.y}px`;
        adicionarEventosDeArraste(box);
        if (noPai) {
            criarLinha(box, noPai);
        }
        atualizarAreaTrabalho();
        atualizarEstatisticasAoVivo();
        return box;
    }

    function iniciarTela() {
        preProcessarDados();
        const todosOsAtores = [...new Set(producoes.flatMap(p => p.elenco))];
        let ator1Index = Math.floor(Math.random() * todosOsAtores.length);
        let ator2Index;
        do {
            ator2Index = Math.floor(Math.random() * todosOsAtores.length);
        } while (ator1Index === ator2Index);
        atorObjetivo1 = todosOsAtores[ator1Index];
        atorObjetivo2 = todosOsAtores[ator2Index];
        if (pageSubtitle) {
            // Monta o subtítulo destacando os nomes dos artistas
            pageSubtitle.innerHTML = '';
            const artist1 = document.createElement('span');
            artist1.className = 'artist-name';
            artist1.textContent = atorObjetivo1;
            const artist2 = document.createElement('span');
            artist2.className = 'artist-name';
            artist2.textContent = atorObjetivo2;
            pageSubtitle.append('Conecte ', artist1, ' com ', artist2);
        }
        let pos1, pos2;
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            const safeTop = getHeaderHeight() + 60; // abaixo do título/linha/botão
            pos1 = { 
                x: window.innerWidth / 2,
                y: safeTop
            };
            pos2 = { 
                x: window.innerWidth / 2,
                y: window.innerHeight * 0.75 
            };
        } else {
            pos1 = { 
                x: window.innerWidth * 0.2, 
                y: window.innerHeight / 2 - 25 
            };
            pos2 = { 
                x: window.innerWidth * 0.8 - 100, 
                y: window.innerHeight / 2 - 25 
            };
        }
        const no1 = criarNode(atorObjetivo1, 'ator', pos1, null, true);
        const no2 = criarNode(atorObjetivo2, 'ator', pos2, null, true);
        if (isMobile) {
            if (no1) {
                no1.style.left = `${window.innerWidth / 2 - no1.offsetWidth / 2}px`;
            }
            if (no2) {
                no2.style.left = `${window.innerWidth / 2 - no2.offsetWidth / 2}px`;
            }
            atualizarAreaTrabalho();
        }
        if (no1) no1.classList.add('box-ator-objetivo');
        if (no2) no2.classList.add('box-ator-objetivo');
        atualizarEstatisticasAoVivo();
        atualizarTamanhoFonteNos();
    }

    function criarLinha(boxA, boxB, extra = false) {
        if (!boxA || !boxB || boxA.id === boxB.id) return;
        const idA = boxA.id, idB = boxB.id;
        if (document.querySelector(`[data-de="${idA}"][data-para="${idB}"], [data-de="${idB}"][data-para="${idA}"]`)) return;
        const linha = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        linha.setAttribute('data-de', idA);
        linha.setAttribute('data-para', idB);
        linha.setAttribute('stroke', extra ? '#aaa' : '#333');
        linha.setAttribute('stroke-width', extra ? '1' : '2');
        if (extra) linha.setAttribute('stroke-dasharray', '5,5');
        containerLinhas.appendChild(linha);
        atualizarLinha(linha);
        verificarVitoria();
    }

    function mostrarSugestoes() {
        const textoInput = guessInput.value.trim().toLowerCase();
        suggestionsContainer.innerHTML = '';
        highlightedSuggestionIndex = -1;
        if (textoInput.length < 2) return;
        const sugestoesFiltradas = todosOsNomesArray
            .filter(item => item.nome.toLowerCase().startsWith(textoInput))
            .slice(0, 10);
        sugestoesFiltradas.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `${item.nome} <small>${item.tipo}</small>`;
            div.dataset.nome = item.nome;
            div.addEventListener('click', () => {
                guessInput.value = item.nome;
                suggestionsContainer.innerHTML = '';
                guessInput.focus();
            });
            div.addEventListener('mouseenter', () => {
                highlightedSuggestionIndex = idx;
                suggestionsContainer.querySelectorAll('.suggestion-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
            });
            suggestionsContainer.appendChild(div);
        });
    }

    function handleNodeClick(e) {
        const boxClicado = (elementoAtivo && elementoAtivo.dataset && elementoAtivo.dataset.nome)
            ? elementoAtivo
            : (e.target && e.target.closest ? e.target.closest('.box-nome') : null);
        if (!boxClicado || !boxClicado.dataset.nome) return;
        // marca seleção visual
        if (selectedBox && selectedBox !== boxClicado) {
            selectedBox.classList.remove('selected');
        }
        selectedBox = boxClicado;
        selectedBox.classList.add('selected');
        const tipo = boxClicado.dataset.tipo;
        if (tipo === 'ator') {
            mostrarInfoArtista(boxClicado.dataset.nome);
        } else if (tipo === 'producao') {
            mostrarInfoProducao(boxClicado.dataset.nome);
        }
    }

    function obterDetalhesDoAtor(nome) {
        const producoesDoAtor = atorParaProducoes.get(nome) || [];
        const detalhes = producoesDoAtor
            .filter(titulo => nodesNaTela.has(titulo))
            .map(titulo => {
                const producao = todosOsNomes.producoes.get(titulo.toLowerCase());
                if (!producao) return null;
                return { titulo: producao.titulo, tipo: producao.tipo, ano: producao.ano };
            })
            .filter(Boolean);
        detalhes.sort((a, b) => {
            if (a.ano !== b.ano) {
                return a.ano - b.ano;
            }
            return a.titulo.localeCompare(b.titulo);
        });
        return detalhes;
    }

    function mostrarInfoArtista(nome) {
        artistInfoName.textContent = nome;
        artistInfoList.innerHTML = '';
        const detalhes = obterDetalhesDoAtor(nome);
        artistInfoMeta.textContent = 'Artista';
        if (detalhes.length === 0) {
            artistInfoEmpty.textContent = 'Nenhuma participação descoberta nesta partida ainda.';
            artistInfoEmpty.classList.remove('hidden');
        } else {
            artistInfoEmpty.classList.add('hidden');
            detalhes.forEach(info => {
                const item = document.createElement('li');
                const titulo = document.createElement('strong');
                titulo.textContent = info.titulo;
                const resumo = document.createElement('span');
                resumo.textContent = `${info.tipo} - ${info.ano}`;
                item.appendChild(titulo);
                item.appendChild(resumo);
                artistInfoList.appendChild(item);
            });
        }
        artistInfoPanel.classList.remove('hidden');
    }

    function mostrarInfoProducao(nome) {
        const producao = todosOsNomes.producoes.get(nome.toLowerCase());
        if (!producao) return;
        artistInfoName.textContent = producao.titulo;
        artistInfoList.innerHTML = '';
        artistInfoMeta.textContent = `${producao.tipo} • ${producao.ano}`;
        const artistasDescobertos = producao.elenco.filter(ator => nodesNaTela.has(ator));
        if (artistasDescobertos.length === 0) {
            artistInfoEmpty.textContent = 'Nenhum artista desta produção foi descoberto nesta partida ainda.';
            artistInfoEmpty.classList.remove('hidden');
        } else {
            artistInfoEmpty.classList.add('hidden');
            artistasDescobertos.sort((a, b) => a.localeCompare(b)).forEach(ator => {
                const item = document.createElement('li');
                item.textContent = ator;
                artistInfoList.appendChild(item);
            });
        }
        artistInfoPanel.classList.remove('hidden');
    }

    let carouselIndex = 0;

    function atualizarLinksParaProducoes() {
        watchCarouselTrack.innerHTML = '';
        watchCarouselDots.innerHTML = '';
        const producoesDescobertas = Array.from(nodesNaTela)
            .filter(nome => todosOsNomes.producoes.has(nome.toLowerCase()))
            .map(nome => todosOsNomes.producoes.get(nome.toLowerCase()))
            .filter(producao => producao && producao.link);
        if (producoesDescobertas.length === 0) {
            watchLinksSection.classList.add('hidden');
            return;
        }
        producoesDescobertas.sort((a, b) => a.titulo.localeCompare(b.titulo));
        producoesDescobertas.forEach((producao, index) => {
            const card = document.createElement('div');
            card.className = 'watch-card';
            const img = document.createElement('img');
            img.src = producao.imagem || 'https://via.placeholder.com/800x1200?text=Sem+imagem';
            img.alt = producao.titulo;
            const titulo = document.createElement('h4');
            titulo.textContent = producao.titulo;
            const hint = document.createElement('span');
            hint.className = 'watch-tap-hint';
            hint.textContent = 'Toque/Clique para assistir';
            card.appendChild(img);
            card.appendChild(titulo);
            card.appendChild(hint);
            card.addEventListener('click', () => {
                window.open(producao.link, '_blank', 'noopener');
            });
            watchCarouselTrack.appendChild(card);

            const dot = document.createElement('span');
            dot.className = 'watch-dot';
            dot.dataset.index = index;
            dot.addEventListener('click', () => irParaSlide(index));
            watchCarouselDots.appendChild(dot);
        });
        watchLinksSection.classList.remove('hidden');
        carouselControls.classList.toggle('hidden', producoesDescobertas.length <= 1);
        carouselIndex = 0;
        atualizarCarousel();
    }

    function atualizarCarousel() {
        const total = watchCarouselTrack.children.length;
        if (total === 0) return;
        const offset = -carouselIndex * watchCarousel.offsetWidth;
        watchCarouselTrack.style.transform = `translateX(${offset}px)`;
        Array.from(watchCarouselDots.children).forEach((dot, idx) => {
            dot.classList.toggle('active', idx === carouselIndex);
        });
    }

    function irParaSlide(index) {
        const total = watchCarouselTrack.children.length;
        if (total === 0) return;
        carouselIndex = (index + total) % total;
        atualizarCarousel();
    }

    function proximoSlide() {
        irParaSlide(carouselIndex + 1);
    }

    function slideAnterior() {
        irParaSlide(carouselIndex - 1);
    }

    // Suporte a swipe no carrossel (mobile)
    (function enableCarouselSwipe() {
        if (!watchCarousel) return;
        let startX = 0, startY = 0, deltaX = 0, deltaY = 0, touching = false, swiping = false;
        const threshold = 40; // px mínimos para trocar
        const lockAngle = 12; // graus ~ prioridade horizontal
        function onStart(x, y) { startX = x; startY = y; deltaX = 0; deltaY = 0; touching = true; swiping = false; }
        function onMove(x, y, e) {
            if (!touching) return;
            deltaX = x - startX; deltaY = y - startY;
            if (!swiping) {
                // Decide direção: se horizontal bem maior que vertical, ativamos swipe e previnimos scroll
                if (Math.abs(deltaX) > Math.tan(lockAngle * Math.PI/180) * Math.abs(deltaY)) {
                    swiping = true;
                }
            }
            if (swiping && e && e.cancelable) e.preventDefault();
        }
        function onEnd() {
            if (!touching) return;
            touching = false;
            if (swiping && Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX < 0) proximoSlide(); else slideAnterior();
            }
        }
        watchCarousel.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return; 
            const t = e.touches[0];
            onStart(t.clientX, t.clientY);
        }, { passive: true });
        watchCarousel.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;
            const t = e.touches[0];
            onMove(t.clientX, t.clientY, e);
        }, { passive: false });
        watchCarousel.addEventListener('touchend', onEnd, { passive: true });
        watchCarousel.addEventListener('touchcancel', () => { touching = false; swiping = false; }, { passive: true });
    })();

    function calcularPosicaoFilho(noPai) {
        const isMobile = window.innerWidth <= 768;
        // Usa coordenadas na tela para decidir esquerda/direita, respeitando pan/zoom
        const rect = noPai.getBoundingClientRect();
        const parentCenterX = rect.left + rect.width / 2;
        const parentCenterY = rect.top + rect.height / 2;

        // Se o pai está na metade esquerda da tela, posiciona o filho à direita; senão, à esquerda
        const biasParaDireita = parentCenterX < window.innerWidth / 2;

        // Base do ângulo horizontal e variação para evitar sobreposição
        const spread = Math.PI / 6; // ±30°
        let anguloBase = biasParaDireita ? 0 : Math.PI; // 0° (direita) ou 180° (esquerda)
        let jitter = (Math.random() - 0.5) * spread;

        // Tendência vertical para evitar acumular muito acima/abaixo
        const viésVertical = (parentCenterY < window.innerHeight / 2 ? 1 : -1) * (spread / 2);
        const angulo = anguloBase + jitter + viésVertical;

        const distanciaBase = isMobile ? POS_CONFIG.minLinkDistanceMobile : POS_CONFIG.minLinkDistanceDesktop;
        const randomExtra = isMobile ? Math.random() * 30 : Math.random() * 60;
        const maxDist = isMobile ? POS_CONFIG.maxLinkDistanceMobile : POS_CONFIG.maxLinkDistanceDesktop;
        let distancia = distanciaBase + randomExtra;
        distancia = Math.min(distancia, maxDist);
        const x = noPai.offsetLeft + Math.cos(angulo) * distancia;
        const y = noPai.offsetTop + Math.sin(angulo) * distancia;
        return { x, y };
    }

    // Procura posição livre, preferindo a "frente" do nó pai; só usa o lado de trás se necessário
    function posicionarNovoNoPreferencial(novoNo, noPai) {
        if (!novoNo || !noPai) return;
        const isMobile = window.innerWidth <= 768;
        const gap = POS_CONFIG.minBoxGap || 0;
        const anglesDeg = POS_CONFIG.angleOffsetsDeg || [0];
        const minDist = isMobile ? POS_CONFIG.minLinkDistanceMobile : POS_CONFIG.minLinkDistanceDesktop;
        const maxDist = isMobile ? POS_CONFIG.maxLinkDistanceMobile : POS_CONFIG.maxLinkDistanceDesktop;
        const step = isMobile ? POS_CONFIG.ringStepMobile : POS_CONFIG.ringStepDesktop;

        // Centro do pai em coordenadas do container
        const parentCx = noPai.offsetLeft + noPai.offsetWidth / 2;
        const parentCy = noPai.offsetTop + noPai.offsetHeight / 2;

        // Direção preferida (frente)
        const rect = noPai.getBoundingClientRect();
        const biasParaDireita = rect.left + rect.width / 2 < window.innerWidth / 2;
        const baseAngles = [biasParaDireita ? 0 : Math.PI, biasParaDireita ? Math.PI : 0]; // frente, depois atrás

        // Retângulos existentes (em coords do container)
        const existentes = Array.from(document.querySelectorAll('.box-nome'))
            .filter(box => box !== novoNo)
            .map(box => ({
                left: box.offsetLeft,
                top: box.offsetTop,
                right: box.offsetLeft + box.offsetWidth,
                bottom: box.offsetTop + box.offsetHeight
            }));

        function livre(cLeft, cTop, w, h) {
            const left = cLeft - gap / 2, top = cTop - gap / 2;
            const right = cLeft + w + gap / 2, bottom = cTop + h + gap / 2;
            for (const r of existentes) {
                if (left < r.right && right > r.left && top < r.bottom && bottom > r.top) {
                    return false;
                }
            }
            return true;
        }

        // Tenta frente primeiro, depois atrás
        const w = novoNo.offsetWidth;
        const h = novoNo.offsetHeight;
        for (const base of baseAngles) {
            for (let dist = minDist; dist <= maxDist; dist += step) {
                // Testa ângulos simétricos em torno da direção base
                for (const offDeg of anglesDeg) {
                    const ang = base + (offDeg * Math.PI / 180);
                    const cx = parentCx + Math.cos(ang) * dist;
                    const cy = parentCy + Math.sin(ang) * dist;
                    const left = Math.round(cx - w / 2);
                    const top = Math.round(cy - h / 2);
                    if (livre(left, top, w, h)) {
                        novoNo.style.left = `${left}px`;
                        novoNo.style.top = `${top}px`;
                        return; // posicionou
                    }
                }
            }
        }
        // Se tudo falhar, mantém posição atual; colisões serão resolvidas depois
    }

    let elementoAtivo = null, offsetX = 0, offsetY = 0, isDragging = false, startX, startY;

    function atualizarLinhasParaBox(box) {
        containerLinhas.querySelectorAll(`[data-de="${box.id}"], [data-para="${box.id}"]`).forEach(atualizarLinha);
    }

    function atualizarLinha(linha) {
        const boxDe = document.getElementById(linha.getAttribute('data-de')), boxPara = document.getElementById(linha.getAttribute('data-para'));
        if (boxDe && boxPara) {
            const c1 = getCentro(boxDe), c2 = getCentro(boxPara);
            linha.setAttribute('x1', c1.x);
            linha.setAttribute('y1', c1.y);
            linha.setAttribute('x2', c2.x);
            linha.setAttribute('y2', c2.y);
        }
    }

    function getCentro(el) { return { x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2 }; }

    function adicionarEventosDeArraste(el) {
        el.addEventListener('mousedown', iniciarArraste);
        el.addEventListener('touchstart', iniciarArraste, { passive: false });
    }

    function iniciarArraste(e) {
        elementoAtivo = e.currentTarget;
        isDragging = false;
        // marca como selecionado ao começar a interagir
        if (selectedBox && selectedBox !== elementoAtivo) {
            selectedBox.classList.remove('selected');
        }
        selectedBox = elementoAtivo;
        selectedBox.classList.add('selected');
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        startX = clientX;
        startY = clientY;
        offsetX = clientX - elementoAtivo.offsetLeft;
        offsetY = clientY - elementoAtivo.offsetTop;
        document.addEventListener('mousemove', arrastar);
        document.addEventListener('touchmove', arrastar, { passive: false });
        document.addEventListener('mouseup', pararArraste);
        document.addEventListener('touchend', pararArraste);
    }

    function arrastar(e) {
        if (!elementoAtivo) return;
        if (elementoAtivo.dataset.locked === 'true') {
            e.preventDefault();
            return;
        }
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        if (!isDragging) {
            const dx = clientX - startX, dy = clientY - startY;
            if (Math.hypot(dx, dy) > 5) {
                isDragging = true;
                elementoAtivo.classList.add('arrastando');
            }
        }
        if (isDragging) {
            e.preventDefault();
            const nX = clientX - offsetX;
            const nY = clientY - offsetY;

            elementoAtivo.style.left = `${nX}px`;
            elementoAtivo.style.top = `${nY}px`;
            atualizarLinhasParaBox(elementoAtivo);
            resolverTodasAsColisoes();
            atualizarAreaTrabalho();
        }
    }

    function pararArraste(e) {
        if (!elementoAtivo) return;
        if (!isDragging) {
            handleNodeClick(e);
        }
        elementoAtivo.classList.remove('arrastando');
        elementoAtivo = null;
        document.removeEventListener('mousemove', arrastar);
        document.removeEventListener('touchmove', arrastar);
        document.removeEventListener('mouseup', pararArraste);
        document.removeEventListener('touchend', pararArraste);
    }

    function resolverTodasAsColisoes() {
        const todosOsBoxes = Array.from(document.querySelectorAll('.box-nome'));
        const iteracoes = 5;
        for (let i = 0; i < iteracoes; i++) {
            for (let j = 0; j < todosOsBoxes.length; j++) {
                for (let k = j + 1; k < todosOsBoxes.length; k++) {
                    const boxA = todosOsBoxes[j];
                    const boxB = todosOsBoxes[k];
                    const rectA = boxA.getBoundingClientRect();
                    const rectB = boxB.getBoundingClientRect();
                    const lockedA = boxA.dataset.locked === 'true';
                    const lockedB = boxB.dataset.locked === 'true';
                    const gap = POS_CONFIG.minBoxGap || 0;
                    // Inflamos os retângulos pela metade do gap para considerar "muito perto" como colisão
                    const aL = rectA.left - gap / 2, aR = rectA.right + gap / 2, aT = rectA.top - gap / 2, aB = rectA.bottom + gap / 2;
                    const bL = rectB.left - gap / 2, bR = rectB.right + gap / 2, bT = rectB.top - gap / 2, bB = rectB.bottom + gap / 2;
                    if (aL < bR && aR > bL && aT < bB && aB > bT) {
                        const overlapX = Math.min(aR, bR) - Math.max(aL, bL);
                        const overlapY = Math.min(aB, bB) - Math.max(aT, bT);
                        const centroA_X = rectA.left + rectA.width / 2;
                        const centroB_X = rectB.left + rectB.width / 2;
                        const centroA_Y = rectA.top + rectA.height / 2;
                        const centroB_Y = rectB.top + rectB.height / 2;
                        let moverAX = 0, moverAY = 0, moverBX = 0, moverBY = 0;
                        if (overlapX < overlapY) {
                            const moveX = overlapX / 2;
                            if (centroA_X < centroB_X) {
                                moverAX = -moveX;
                                moverBX = moveX;
                            } else {
                                moverAX = moveX;
                                moverBX = -moveX;
                            }
                        } else {
                            const moveY = overlapY / 2;
                            if (centroA_Y < centroB_Y) {
                                moverAY = -moveY;
                                moverBY = moveY;
                            } else {
                                moverAY = moveY;
                                moverBY = -moveY;
                            }
                        }
                        if (boxA === elementoAtivo) {
                            moverBX *= 2;
                            moverBY *= 2;
                            moverAX = 0;
                            moverAY = 0;
                        } else if (boxB === elementoAtivo) {
                            moverAX *= 2;
                            moverAY *= 2;
                            moverBX = 0;
                            moverBY = 0;
                        }
                        if (!lockedA) {
                            boxA.style.left = `${boxA.offsetLeft + moverAX}px`;
                            boxA.style.top = `${boxA.offsetTop + moverAY}px`;
                            atualizarLinhasParaBox(boxA);
                        }
                        if (!lockedB) {
                            boxB.style.left = `${boxB.offsetLeft + moverBX}px`;
                            boxB.style.top = `${boxB.offsetTop + moverBY}px`;
                            atualizarLinhasParaBox(boxB);
                        }
                    }
                }
            }
        }
        atualizarAreaTrabalho();
    }

    function atualizarAreaTrabalho() {
        const boxes = Array.from(document.querySelectorAll('.box-nome'));
        if (boxes.length === 0) return;
        const margem = 200;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = window.innerWidth;
        let maxY = window.innerHeight;
        boxes.forEach(box => {
            const left = box.offsetLeft;
            const top = box.offsetTop;
            minX = Math.min(minX, left);
            minY = Math.min(minY, top);
            maxX = Math.max(maxX, left + box.offsetWidth + margem);
            maxY = Math.max(maxY, top + box.offsetHeight + margem);
        });

        let shiftX = 0;
        let shiftY = 0;
        const isMobile = window.innerWidth <= 768;
        const limiteMinimoX = 50;
        const limiteMinimoY = isMobile ? getHeaderHeight() + 60 : 50; // evita sobrepor o título no mobile
        if (minX < limiteMinimoX) shiftX = limiteMinimoX - minX;
        if (minY < limiteMinimoY) shiftY = limiteMinimoY - minY;
        if (shiftX !== 0 || shiftY !== 0) {
            boxes.forEach(box => {
                box.style.left = `${box.offsetLeft + shiftX}px`;
                box.style.top = `${box.offsetTop + shiftY}px`;
            });
            document.querySelectorAll('#container-linhas line').forEach(atualizarLinha);
            maxX += shiftX;
            maxY += shiftY;
        }

        containerPrincipal.style.width = `${maxX}px`;
        containerPrincipal.style.height = `${maxY}px`;
        containerLinhas.style.width = `${maxX}px`;
        containerLinhas.style.height = `${maxY}px`;
        containerLinhas.setAttribute('width', maxX);
        containerLinhas.setAttribute('height', maxY);
    }
    
    iniciarTela();
    showTutorialIfFirstTime();

    // Ajusta spacing do painel informativo em relação à UI inferior
    setGameUiHeightVar();
    window.addEventListener('resize', setGameUiHeightVar);
    // Em alguns dispositivos móveis, o resize pode ocorrer após fontes/carregamentos
    window.addEventListener('load', setGameUiHeightVar);
    if (window.ResizeObserver && gameUiContainer) {
        const ro = new ResizeObserver(() => setGameUiHeightVar());
        ro.observe(gameUiContainer);
    }

    // Recalcula tamanhos ao vivo quando a janela muda
    window.addEventListener('resize', atualizarTamanhoFonteNos);
});
