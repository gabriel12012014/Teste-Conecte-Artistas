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
    const statArtistas = document.getElementById('stat-artistas');
    const statFilmes = document.getElementById('stat-filmes');
    const statSeries = document.getElementById('stat-series');
    const statNovelas = document.getElementById('stat-novelas');
    
    // --- VARIÁVEIS DE ESTADO DO JOGO ---
    const nodesNaTela = new Set();
    const atorParaProducoes = new Map();
    const todosOsNomes = { atores: new Set(), producoes: new Map() };
    let todosOsNomesArray = [];
    let atorObjetivo1 = null;
    let atorObjetivo2 = null;
    let finalPath = [];

    // --- VARIÁVEIS PARA ZOOM E PAN ---
    let scale = 1;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startPanX = 0;
    let startPanY = 0;
    let initialPinchDistance = null;

    function applyTransform() {
        viewport.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    }

    function resetZoom() {
        scale = 1;
        panX = 0;
        panY = 0;
        applyTransform();
    }
    
    resetZoomButton.addEventListener('click', resetZoom);

    // --- LÓGICA DE ZOOM (SCROLL DO RATO) ---
    document.body.addEventListener('wheel', (e) => {
        if (e.target.closest('#game-ui-container') || e.target.closest('.popup-content')) return;
        e.preventDefault();
        
        const zoomIntensity = 0.1;
        const delta = e.deltaY > 0 ? -1 : 1;
        const newScale = Math.max(0.3, Math.min(2, scale + delta * zoomIntensity));
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        panX = mouseX - (mouseX - panX) * (newScale / scale);
        panY = mouseY - (mouseY - panY) * (newScale / scale);
        
        scale = newScale;
        applyTransform();
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
        if (e.target.closest('#game-ui-container') || e.target.closest('.popup-content')) return;
        
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
        if (e.target.closest('#game-ui-container') || e.target.closest('.popup-content')) return;
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

        victoryPopup.classList.remove('hidden');
        document.getElementById('input-wrapper').classList.add('hidden');
        showResultButton.classList.remove('hidden');
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
            nosPais.forEach(noPai => {
                criarLinha(novoNo, noPai);
            });
            resolverTodasAsColisoes();
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
    guessInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const primeiraSugestao = suggestionsContainer.querySelector('.suggestion-item');
            if (primeiraSugestao) {
                e.preventDefault();
                guessInput.value = primeiraSugestao.dataset.nome;
                suggestionsContainer.innerHTML = '';
            } else {
                handleGuess();
            }
        }
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#game-ui-container')) {
            suggestionsContainer.innerHTML = '';
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && document.activeElement !== guessInput) {
            guessInput.focus();
        }
    });

    function criarNode(nome, tipo, pos, noPai = null) {
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
        let pos1, pos2;
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            pos1 = { 
                x: window.innerWidth / 2 - 50,
                y: window.innerHeight * 0.1
            };
            pos2 = { 
                x: window.innerWidth / 2 - 50,
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
        const no1 = criarNode(atorObjetivo1, 'ator', pos1);
        const no2 = criarNode(atorObjetivo2, 'ator', pos2);
        if (no1) no1.classList.add('box-ator-objetivo');
        if (no2) no2.classList.add('box-ator-objetivo');
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
        if (textoInput.length < 2) return;
        const sugestoesFiltradas = todosOsNomesArray.filter(item => item.nome.toLowerCase().startsWith(textoInput)).slice(0, 10);
        sugestoesFiltradas.forEach(item => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `${item.nome} <small>${item.tipo}</small>`;
            div.dataset.nome = item.nome;
            div.addEventListener('click', () => {
                guessInput.value = item.nome;
                suggestionsContainer.innerHTML = '';
                guessInput.focus();
            });
            suggestionsContainer.appendChild(div);
        });
    }

    function handleNodeClick(e) {
        const boxClicado = e.currentTarget || e.target;
        if (!boxClicado.dataset.nome) return;
        const nome = boxClicado.dataset.nome;
        const tipo = boxClicado.dataset.tipo;
        let opcoesDeExpansao = [];
        if (tipo === 'producao') {
            const producao = producoes.find(p => p.titulo === nome);
            opcoesDeExpansao = producao.elenco.filter(ator => !nodesNaTela.has(ator));
            if (opcoesDeExpansao.length > 0) {
                const proximoAtor = opcoesDeExpansao[0];
                const pos = calcularPosicaoFilho(boxClicado);
                criarNode(proximoAtor, 'ator', pos, boxClicado);
            } else {
                feedbackSemExpansao(boxClicado);
            }
        } else {
            const producoesDoAtor = atorParaProducoes.get(nome);
            opcoesDeExpansao = producoesDoAtor.filter(titulo => !nodesNaTela.has(titulo));
            if (opcoesDeExpansao.length > 0) {
                const proximaProducao = opcoesDeExpansao[0];
                const pos = calcularPosicaoFilho(boxClicado);
                criarNode(proximaProducao, 'producao', pos, boxClicado);
            } else {
                feedbackSemExpansao(boxClicado);
            }
        }
    }

    function feedbackSemExpansao(box) {
        box.classList.add('shake');
        setTimeout(() => box.classList.remove('shake'), 500);
    }

    function calcularPosicaoFilho(noPai) {
        const isMobile = window.innerWidth <= 768;
        let angulo;
        if (isMobile) {
            if (noPai.offsetTop < window.innerHeight / 2) {
                angulo = Math.random() * Math.PI;
            } else {
                angulo = Math.PI + Math.random() * Math.PI;
            }
        } else {
            angulo = Math.random() * 2 * Math.PI;
        }
        const distanciaBase = isMobile ? 80 : 150;
        const distancia = distanciaBase + Math.random() * 40;
        let x = noPai.offsetLeft + Math.cos(angulo) * distancia;
        let y = noPai.offsetTop + Math.sin(angulo) * distancia;
        x = Math.max(20, Math.min(x, window.innerWidth - 150));
        const alturaEstimadaNo = 60;
        const limiteInferior = window.innerHeight - gameUiContainer.offsetHeight - alturaEstimadaNo;
        y = Math.max(20, Math.min(y, limiteInferior));
        return { x, y };
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
            let nX = clientX - offsetX;
            let nY = clientY - offsetY;
            
            const limiteInferior = window.innerHeight - gameUiContainer.offsetHeight - elementoAtivo.offsetHeight;
            
            nX = Math.max(0, Math.min(nX, window.innerWidth - elementoAtivo.offsetWidth));
            nY = Math.max(0, Math.min(nY, limiteInferior));

            elementoAtivo.style.left = `${nX}px`;
            elementoAtivo.style.top = `${nY}px`;
            atualizarLinhasParaBox(elementoAtivo);
            resolverTodasAsColisoes();
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
                    if (rectA.left < rectB.right && rectA.right > rectB.left && rectA.top < rectB.bottom && rectA.bottom > rectB.top) {
                        const overlapX = Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left);
                        const overlapY = Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top);
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
                        boxA.style.left = `${Math.max(0, Math.min(boxA.offsetLeft + moverAX, window.innerWidth - boxA.offsetWidth))}px`;
                        boxA.style.top = `${Math.max(0, Math.min(boxA.offsetTop + moverAY, window.innerHeight - boxA.offsetHeight))}px`;
                        boxB.style.left = `${Math.max(0, Math.min(boxB.offsetLeft + moverBX, window.innerWidth - boxB.offsetWidth))}px`;
                        boxB.style.top = `${Math.max(0, Math.min(boxB.offsetTop + moverBY, window.innerHeight - boxB.offsetHeight))}px`;
                        atualizarLinhasParaBox(boxA);
                        atualizarLinhasParaBox(boxB);
                    }
                }
            }
        }
    }
    
    iniciarTela();
});