// dados.js

const producoes = [
    {
        "titulo": "Avenida Brasil",
        "ano": 2012,
        "tipo": "Novela",
        "link": "https://globoplay.globo.com/busca/?q=Avenida%20Brasil",
        "elenco": [
            "Adriana Esteves",
            "Débora Falabella",
            "Murilo Benício",
            "Cauã Reymond",
            "Marcello Novaes",
            "Vera Holtz"
        ],
        "imagem": "https://s2.glbimg.com/vlvGgr9-VxdNIISMpj1IYcZDzFU=/690x958/s2.glbimg.com/e2LWo257bB9n8qsh-noDP4ShVVo=/0x0:720x1000/690x0/i.s3.glbimg.com/v1/AUTH_e84042ef78cb4708aeebdf1c68c6cbd6/internal_photos/bs/2016/Z/g/itMdmLTQqW04xVMfYc0A/avenida-brasil.jpg"
    },
    {
        "titulo": "O Auto da Compadecida",
        "ano": 2000,
        "tipo": "Filme",
        "link": "https://globoplay.globo.com/busca/?q=O%20Auto%20da%20Compadecida",
        "elenco": [
            "Matheus Nachtergaele",
            "Selton Mello",
            "Fernanda Montenegro",
            "Lima Duarte"
        ],
        "imagem": "https://s2-gshow.glbimg.com/5pZc5id2_e_ONVClrGN-mzVD51E=/0x0:1348x2000/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_755cbb8e98bc4df6b024f1581a117b52/internal_photos/bs/2023/0/e/CKY7UyT4GnQRCsD2uOsQ/cartazauto.jpg"
    },
    {
        "titulo": "A Grande Família",
        "ano": 2001,
        "tipo": "Série",
        "link": "https://globoplay.globo.com/busca/?q=A%20Grande%20Fam%C3%ADlia",
        "elenco": [
            "Marco Nanini",
            "Marieta Severo",
            "Lúcio Mauro Filho",
            "Pedro Cardoso",
            "Guta Stresser"
        ],
        "imagem": "https://s2-gshow.glbimg.com/6NZvht6hmhW1OYuwoFpUy6-DTzc=/0x0:4465x6131/600x0/smart/filters:gifv():strip_icc()/i.s3.glbimg.com/v1/AUTH_755cbb8e98bc4df6b024f1581a117b52/internal_photos/bs/2023/K/Y/CBK7qYQYqxwwA7my3S8A/cartaz-final-alta-redi2.jpg"
    },
    {
        "titulo": "Tropa de Elite 2: O Inimigo Agora é Outro",
        "ano": 2010,
        "tipo": "Filme",
        "link": "https://globoplay.globo.com/busca/?q=Tropa%20de%20Elite%202%3A%20O%20Inimigo%20Agora%20%C3%A9%20Outro",
        "elenco": [
            "Wagner Moura",
            "Irandhir Santos",
            "André Ramiro",
            "Milhem Cortaz",
            "Seu Jorge"
        ],
        "imagem": ""
    },
    {
        "titulo": "Central do Brasil",
        "ano": 1998,
        "tipo": "Filme",
        "link": "https://globoplay.globo.com/busca/?q=Central%20do%20Brasil",
        "elenco": [
            "Fernanda Montenegro",
            "Marília Pêra",
            "Vinícius de Oliveira",
            "Soia Lira",
            "Wagner Moura"
        ],
        "imagem": "https://s2-globo-play.glbimg.com/BPHVtMGxYag10npXE2NgdPM0gw0=/362x536/https://s2-globo-play.glbimg.com/BrwjauIIM4zp7c4YMTwF3_jH95U=/https://s2.glbimg.com/5ndvgpN-i3hCEzDhOsW6Dzg6ufM=/i.s3.glbimg.com/v1/AUTH_c3c606ff68e7478091d1ca496f9c5625/internal_photos/bs/2020/9/t/BvPoZESh2rNUcV8lu4XA/2020-1249-central-do-brasil-poster.jpg"
    },
    {
        "titulo": "Cidade de Deus",
        "ano": 2002,
        "tipo": "Filme",
        "link": "https://globoplay.globo.com/busca/?q=Cidade%20de%20Deus",
        "elenco": [
            "Alexandre Rodrigues",
            "Leandro Firmino",
            "Phellipe Haagensen",
            "Douglas Silva",
            "Alice Braga",
            "Seu Jorge",
            "Matheus Nachtergaele"
        ],
        "imagem": "https://s2-gshow.glbimg.com/lJUqMlbeLUyATzlt1bd28GVwO7Y=/0x0:1122x1653/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_755cbb8e98bc4df6b024f1581a117b52/internal_photos/bs/2023/R/z/V67pKdSOmjsBKmodJEcA/cidade-de-deus.jpg"
    },
    {
        "titulo": "A Favorita",
        "ano": 2008,
        "tipo": "Novela",
        "link": "https://globoplay.globo.com/busca/?q=A%20Favorita",
        "elenco": [
            "Patrícia Pillar",
            "Cláudia Raia",
            "Mariana Ximenes",
            "Murilo Benício",
            "Cauã Reymond",
            "Lília Cabral"
        ],
        "imagem": "https://s2-memoriaglobo.glbimg.com/hyRaNL6dlWR7dUyNQ6-x1ah9vFk=/0x0:650x500/924x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_ee6202d7f3f346a7a5d7affb807d8893/internal_photos/bs/2022/F/u/Gbs7U7QWGgSsJ6WU20pA/logo-a-favorita.jpg"
    },
    {
        "titulo": "O Cravo e a Rosa",
        "ano": 2000,
        "tipo": "Novela",
        "link": "https://globoplay.globo.com/busca/?q=O%20Cravo%20e%20a%20Rosa",
        "elenco": [
            "Adriana Esteves",
            "Eduardo Moscovis",
            "Leandra Leal",
            "Murilo Rosa",
            "Eva Todor"
        ],
        "imagem": "https://s2-gshow.glbimg.com/I-YDxIBPakLGK4thoocmhaRFTGE=/0x0:1501x2048/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_e84042ef78cb4708aeebdf1c68c6cbd6/internal_photos/bs/2019/R/Y/TTzqVCQnAAie1HBuPivw/adriana-esteves-eduardo-moscovis-posam-como-catarina-e-petruchio-de-o-cravo-e-a-rosa-acervo-globo.jpg"
    },
    {
        "titulo": "Lisbela e o Prisioneiro",
        "ano": 2003,
        "tipo": "Filme",
        "link": "https://globoplay.globo.com/busca/?q=Lisbela%20e%20o%20Prisioneiro",
        "elenco": [
            "Selton Mello",
            "Débora Falabella",
            "Marco Nanini",
            "Wagner Moura"
        ],
        "imagem": "https://s2-gshow.glbimg.com/QkSpeUHSQoJA9-3eG3K_Zg6_prQ=/0x0:1800x2631/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_755cbb8e98bc4df6b024f1581a117b52/internal_photos/bs/2023/K/q/KEQ3GrQ9y1zLJtc57PmQ/lisbela-e-o-prisioneiro-cartaz-alta.jpg"
    },
    {
        "titulo": "Tropa de Elite",
        "ano": 2007,
        "tipo": "Filme",
        "link": "https://globoplay.globo.com/busca/?q=Tropa%20de%20Elite",
        "elenco": [
            "Wagner Moura",
            "André Ramiro",
            "Caio Junqueira",
            "Milhem Cortaz",
            "Fernanda Machado"
        ],
        "imagem": "https://media.filmelier.com/images/filmes/cartaz/H1Dn7dYhe_2400x1600bb%20(1).jpg"
    },
    {
        "titulo": "Mulheres Apaixonadas",
        "ano": 2003,
        "tipo": "Novela",
        "link": "https://globoplay.globo.com/busca/?q=Mulheres%20Apaixonadas",
        "elenco": [
            "Christiane Torloni",
            "José Mayer",
            "Tony Ramos",
            "Helena Ranaldi",
            "Vera Holtz",
            "Marcello Novaes"
        ],
        "imagem": "https://s2-memoriaglobo.glbimg.com/oQjVSdTDs3rPmX9-yBZ6kigoI5c=/1080x1920/smart/filters:max_age(3600)/https://i.s3.glbimg.com/v1/AUTH_ee6202d7f3f346a7a5d7affb807d8893/internal_photos/bs/2022/4/J/J1C6ctRoOndHL5ZKS3Bg/1310-mulheres.jpg"
    },
    {
        "titulo": "Carandiru",
        "ano": 2003,
        "tipo": "Filme",
        "link": "https://globoplay.globo.com/busca/?q=Carandiru",
        "elenco": [
            "Luiz Carlos Vasconcelos",
            "Milton Gonçalves",
            "Lázaro Ramos",
            "Rodrigo Santoro",
            "Wagner Moura",
            "Milhem Cortaz"
        ],
        "imagem": "https://s2-gshow.glbimg.com/woi_YEipRtk39h5n8hqtZx9fPII=/0x0:1197x1764/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_755cbb8e98bc4df6b024f1581a117b52/internal_photos/bs/2023/G/5/f68ZgKTDGTmAERnv1tXg/carandiru.jpg"
    },
    {
        "titulo": "Senhora do Destino",
        "ano": 2004,
        "tipo": "Novela",
        "link": "https://globoplay.globo.com/busca/?q=Senhora%20do%20Destino",
        "elenco": [
            "Susana Vieira",
            "Renata Sorrah",
            "José Wilker",
            "Carolina Dieckmann",
            "Eduardo Moscovis",
            "Letícia Spiller"
        ],
        "imagem": "https://s2-globo-play.glbimg.com/5-D3ZNfaQg55b_REPTCP_tlr-QQ=/362x536/https://s2-globo-play.glbimg.com/-KbxqXOy42VIUYE3-RJ0PJ2-voc=/https://s2.glbimg.com/mT7m8gFeLnmT_G8XWC2u_wrlS7E=/i.s3.glbimg.com/v1/AUTH_c3c606ff68e7478091d1ca496f9c5625/internal_photos/bs/2022/z/5/NEhxHQT6uAzVbT7yBM5Q/2022-3012-senhora-do-destino-poster.jpg"
    },
    {
        "titulo": "O Clone",
        "ano": 2001,
        "tipo": "Novela",
        "link": "https://globoplay.globo.com/busca/?q=O%20Clone",
        "elenco": [
            "Murilo Benício",
            "Giovanna Antonelli",
            "Juca de Oliveira",
            "Vera Fischer",
            "Dalton Vigh",
            "Letícia Sabatella"
        ],
        "imagem": "https://upload.wikimedia.org/wikipedia/pt/4/48/O_clone_logo.jpg"
    },
    {
        "titulo": "Chocolate com Pimenta",
        "ano": 2003,
        "tipo": "Novela",
        "link": "https://globoplay.globo.com/busca/?q=Chocolate%20com%20Pimenta",
        "elenco": [
            "Mariana Ximenes",
            "Murilo Benício",
            "Priscila Fantin",
            "Elizabeth Savalla",
            "Ary Fontoura",
            "Marcello Novaes"
        ],
        "imagem": "https://upload.wikimedia.org/wikipedia/pt/b/b1/P%C3%B4ster_Chocolate_com_Pimenta_TV_Globo.jpg"
    },
    {
        "titulo": "Laços de Família",
        "ano": 2000,
        "tipo": "Novela",
        "link": "https://globoplay.globo.com/busca/?q=La%C3%A7os%20de%20Fam%C3%ADlia",
        "elenco": [
            "Vera Fischer",
            "Carolina Dieckmann",
            "Reynaldo Gianecchini",
            "José Mayer",
            "Tony Ramos",
            "Marieta Severo"
        ],
        "imagem": "https://upload.wikimedia.org/wikipedia/pt/9/9d/Logotipo_de_La%C3%A7os_de_Fam%C3%ADlia.png"
    },
    {
        "titulo": "Pantanal",
        "ano": 2022,
        "tipo": "Novela",
        "link": "https://globoplay.globo.com/busca/?q=Pantanal",
        "elenco": [
            "Alanis Guillen",
            "Jesuíta Barbosa",
            "Marcos Palmeira",
            "Dira Paes",
            "Murilo Benício",
            "Isabel Teixeira"
        ],
        "imagem": "https://br.web.img3.acsta.net/pictures/22/08/10/00/20/5744663.jpg"
    },
    {
        "titulo": "Amor de Mãe",
        "ano": 2019,
        "tipo": "Novela",
        "link": "https://globoplay.globo.com/busca/?q=Amor%20de%20M%C3%A3e",
        "elenco": [
            "Regina Casé",
            "Adriana Esteves",
            "Taís Araújo",
            "Murilo Benício",
            "Vladimir Brichta",
            "Ísis Valverde"
        ],
        "imagem": "https://s3.glbimg.com/v1/AUTH_e84042ef78cb4708aeebdf1c68c6cbd6/audiopub-episodes/bs/2020/C/Q/0vTP6QQz28Sv3gZUELZw/amor-de-m-e-01-epis-dio-especial-apresenta-amor-de.jpg"
    },
    {
        "titulo": "Aruanas",
        "ano": 2019,
        "tipo": "Série",
        "link": "https://globoplay.globo.com/busca/?q=Aruanas",
        "elenco": [
            "Débora Falabella",
            "Taís Araújo",
            "Leandra Leal",
            "Thainá Duarte",
            "Lázaro Ramos",
            "Luiz Carlos Vasconcelos"
        ],
        "imagem": "https://br.web.img2.acsta.net/pictures/20/05/11/17/29/3311478.jpg"
    }
];
