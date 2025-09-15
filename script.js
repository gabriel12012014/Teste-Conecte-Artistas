document.addEventListener('DOMContentLoaded', () => {
    // Validação inicial
    if (typeof producoes === 'undefined' || !Array.isArray(producoes)) {
        console.error("ERRO: 'producoes' não encontrada. Verifique se 'dados.js' foi carregado.");
        return;
    }

    const containerPrincipal = document.getElementById('container-principal');
    const containerLinhas = document.getElementById('container-linhas');
    const guessInput = document.getElementById('guess-input');
    const guessButton = document.getElementById('guess-button');
    const suggestionsContainer = document.getElementById('suggestions-container');
    const victoryPopup = document.getElementById('victory-popup');
    const restartButton = document.getElementById('restart-button');
    
    const nodesNaTela = new Set();
    const atorParaProducoes = new Map();
    const todosOsNomes = { atores: new Set(), producoes: new Map() };
    let todosOsNomesArray = [];
    let atorObjetivo1 = null;
    let atorObjetivo2 = null;

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
        const fila = [[atorObjetivo1, [atorObjetivo1]]]; // A fila agora guarda [nó, caminho]
        visitados.add(atorObjetivo1);

        while (fila.length > 0) {
            const [noAtual, caminho] = fila.shift();

            if (noAtual === atorObjetivo2) {
                // Caminho encontrado!
                destacarCaminhoVitoria(caminho);
                victoryPopup.classList.remove('hidden');
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

    function destacarCaminhoVitoria(caminho) {
        for (let i = 0; i < caminho.length - 1; i++) {
            const noA_nome = caminho[i];
            const noB_nome = caminho[i+1];

            const noA_id = document.querySelector(`[data-nome="${noA_nome}"]`).id;
            const noB_id = document.querySelector(`[data-nome="${noB_nome}"]`).id;

            // Procura a linha que conecta os dois nós, em qualquer direção
            const linha = document.querySelector(
                `[data-de="${noA_id}"][data-para="${noB_id}"], 
                 [data-de="${noB_id}"][data-para="${noA_id}"]`
            );

            if (linha) {
                linha.classList.add('winning-path');
            }
        }
    }

    function handleGuess() {
        const textoInput = guessInput.value.trim();
        const textoInputLower = textoInput.toLowerCase();
        if (!textoInput) return;

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
            nosPais = producao.elenco
                .filter(ator => nodesNaTela.has(ator))
                .map(nome => document.querySelector(`[data-nome="${nome}"]`));
        } else {
            const producoesDoAtor = atorParaProducoes.get(nomeCorreto) || [];
            nosPais = producoesDoAtor
                .filter(titulo => nodesNaTela.has(titulo))
                .map(nome => document.querySelector(`[data-nome="${nome}"]`));
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
        guessInput.classList.add('shake');
        setTimeout(() => {
            guessInput.classList.remove('shake');
            guessInput.placeholder = placeholderOriginal;
        }, 2000);
    }

    guessButton.addEventListener('click', handleGuess);
    restartButton.addEventListener('click', () => { location.reload(); });
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
        if (!e.target.closest('#ui-container')) {
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
        const posEsquerda = { x: containerPrincipal.clientWidth * 0.2, y: containerPrincipal.clientHeight / 2 - 25 };
        const posDireita = { x: containerPrincipal.clientWidth * 0.8 - 100, y: containerPrincipal.clientHeight / 2 - 25 };
        const no1 = criarNode(atorObjetivo1, 'ator', posEsquerda);
        const no2 = criarNode(atorObjetivo2, 'ator', posDireita);
        if (no1) no1.classList.add('box-ator-objetivo');
        if (no2) no2.classList.add('box-ator-objetivo');
    }

    function criarLinha(boxA, boxB, extra = false) {
        if (!boxA || !boxB || boxA.id === boxB.id) return;
        const idA = boxA.id, idB = boxB.id;
        if (document.querySelector(`[data-de="${idA}"][data-para="${idB}"], [data-de="${idB}"][data-para="${idA}"]`)) return;
        const linha = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        linha.setAttribute('data-de', idA); linha.setAttribute('data-para', idB);
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
        const angulo = Math.random() * 2 * Math.PI;
        const distancia = 150 + Math.random() * 50;
        let x = noPai.offsetLeft + Math.cos(angulo) * distancia;
        let y = noPai.offsetTop + Math.sin(angulo) * distancia;
        x = Math.max(20, Math.min(x, containerPrincipal.clientWidth - 150));
        y = Math.max(20, Math.min(y, containerPrincipal.clientHeight - 80));
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
            linha.setAttribute('x1', c1.x); linha.setAttribute('y1', c1.y);
            linha.setAttribute('x2', c2.x); linha.setAttribute('y2', c2.y);
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
        startX = clientX; startY = clientY;
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
            let nX = clientX - offsetX, nY = clientY - offsetY;
            nX = Math.max(0, Math.min(nX, containerPrincipal.clientWidth - elementoAtivo.offsetWidth));
            nY = Math.max(0, Math.min(nY, containerPrincipal.clientHeight - elementoAtivo.offsetHeight));
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
                        boxA.style.left = `${Math.max(0, Math.min(boxA.offsetLeft + moverAX, containerPrincipal.clientWidth - boxA.offsetWidth))}px`;
                        boxA.style.top = `${Math.max(0, Math.min(boxA.offsetTop + moverAY, containerPrincipal.clientHeight - boxA.offsetHeight))}px`;
                        boxB.style.left = `${Math.max(0, Math.min(boxB.offsetLeft + moverBX, containerPrincipal.clientWidth - boxB.offsetWidth))}px`;
                        boxB.style.top = `${Math.max(0, Math.min(boxB.offsetTop + moverBY, containerPrincipal.clientHeight - boxA.offsetHeight))}px`;
                        atualizarLinhasParaBox(boxA);
                        atualizarLinhasParaBox(boxB);
                    }
                }
            }
        }
    }
    iniciarTela();
});