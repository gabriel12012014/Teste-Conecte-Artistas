document.addEventListener('DOMContentLoaded', () => {
    // Validação inicial para garantir que os dados foram carregados
    if (typeof producoes === 'undefined' || !Array.isArray(producoes)) {
        console.error("ERRO: A variável 'producoes' não foi encontrada ou não é um array. Verifique se o arquivo 'dados.js' foi carregado corretamente antes do 'script.js' no seu HTML.");
        return; // Interrompe a execução se os dados não estiverem disponíveis
    }

    const containerPrincipal = document.getElementById('container-principal');
    const containerLinhas = document.getElementById('container-linhas');
    
    const nodesNaTela = new Set();
    const atorParaProducoes = new Map();

    function preProcessarDados() {
        producoes.forEach(producao => {
            producao.elenco.forEach(ator => {
                if (!atorParaProducoes.has(ator)) {
                    atorParaProducoes.set(ator, []);
                }
                atorParaProducoes.get(ator).push(producao.titulo);
            });
        });
    }

    function criarNode(nome, tipo, pos, noPai = null) {
        if (nodesNaTela.has(nome)) {
            const nodeExistente = document.querySelector(`[data-nome="${nome}"]`);
            if (nodeExistente && noPai) criarLinha(noPai, nodeExistente, true);
            return;
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
            criarLinha(noPai, box);
        }
        return box;
    }

    function handleNodeClick(e) {
        // O evento pode ser real ou sintético, então pegamos o alvo corretamente
        const boxClicado = e.currentTarget || e.target;
        if (!boxClicado.dataset.nome) return; // Sai se não for um nó válido

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
        } else { // tipo === 'ator'
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

    function iniciarTela() {
        preProcessarDados();
        const producaoInicial = producoes[Math.floor(Math.random() * producoes.length)];
        const pos = {
            x: containerPrincipal.clientWidth / 2 - 100,
            y: containerPrincipal.clientHeight / 2 - 50
        };
        criarNode(producaoInicial.titulo, 'producao', pos);
    }
    
    let elementoAtivo = null, offsetX = 0, offsetY = 0, isDragging = false, startX, startY;

    function criarLinha(boxA, boxB, extra = false) {
        const idA = boxA.id, idB = boxB.id;
        if (document.querySelector(`[data-de="${idA}"][data-para="${idB}"], [data-de="${idB}"][data-para="${idA}"]`)) return;
        const linha = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        linha.setAttribute('data-de', idA); linha.setAttribute('data-para', idB);
        linha.setAttribute('stroke', extra ? '#aaa' : '#333');
        linha.setAttribute('stroke-width', extra ? '1' : '2');
        if (extra) linha.setAttribute('stroke-dasharray', '5,5');
        containerLinhas.appendChild(linha);
        atualizarLinha(linha);
    }
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
        
        // --- LÓGICA DE CLIQUE CORRIGIDA ---
        // Se não moveu o suficiente, considera um clique e chama a função diretamente.
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
        // Esta função continua a mesma e é responsável pela física
        const todosOsBoxes = Array.from(document.querySelectorAll('.box-nome'));
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < todosOsBoxes.length; j++) {
                for (let k = j + 1; k < todosOsBoxes.length; k++) {
                    const boxA = todosOsBoxes[j], boxB = todosOsBoxes[k];
                    const rectA = boxA.getBoundingClientRect(), rectB = boxB.getBoundingClientRect();
                    if (rectA.left < rectB.right && rectA.right > rectB.left && rectA.top < rectB.bottom && rectA.bottom > rectB.top) {
                        const overlapX = Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left);
                        const overlapY = Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top);
                        let moverAX = 0, moverAY = 0, moverBX = 0, moverBY = 0;
                        if (overlapX < overlapY) {
                            const move = overlapX / 2;
                            if (rectA.left < rectB.left) { moverAX = -move; moverBX = move; } else { moverAX = move; moverBX = -move; }
                        } else {
                            const move = overlapY / 2;
                            if (rectA.top < rectB.top) { moverAY = -move; moverBY = move; } else { moverAY = move; moverBY = -move; }
                        }
                        if (boxA === elementoAtivo) { moverBX += moverAX; moverAX = 0; moverAY = 0; } 
                        else if (boxB === elementoAtivo) { moverAX += moverBX; moverBX = 0; moverBY = 0; }
                        boxA.style.left = `${Math.max(0, Math.min(boxA.offsetLeft + moverAX, containerPrincipal.clientWidth - boxA.offsetWidth))}px`;
                        boxA.style.top = `${Math.max(0, Math.min(boxA.offsetTop + moverAY, containerPrincipal.clientHeight - boxA.offsetHeight))}px`;
                        boxB.style.left = `${Math.max(0, Math.min(boxB.offsetLeft + moverBX, containerPrincipal.clientWidth - boxB.offsetWidth))}px`;
                        boxB.style.top = `${Math.max(0, Math.min(boxB.offsetTop + moverBY, containerPrincipal.clientHeight - boxB.offsetHeight))}px`;
                        atualizarLinhasParaBox(boxA);
                        atualizarLinhasParaBox(boxB);
                    }
                }
            }
        }
    }
    
    // Inicia a aplicação
    iniciarTela();
});