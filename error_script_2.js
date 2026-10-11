
// Função utilitária global para sanitização de texto em inserções HTML
function escapeHTML(str) {
    if (!str && str !== 0) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
const escapeHtml = escapeHTML;

// Previne piscamento de tema claro ao carregar a página (FOUC)
let modoClaroAtivo = false;
const STORAGE_TEMA_KEY = "we_are_strangers_modo_tema";
try {
  if (localStorage.getItem(STORAGE_TEMA_KEY) === "claro") {
    document.documentElement.setAttribute("data-theme", "claro");
    document.body.classList.add("modo-claro");
    modoClaroAtivo = true;
  }
} catch(e) {}

const pericias = [
{categoria:"Perícias Militares",nome:"Luta",atributos:["HPR","PRX"],aux:["Dança","Reflexo"],divisor:2},
{categoria:"Perícias Militares",nome:"Pontaria",atributos:["PRX"],aux:[],divisor:1},
{categoria:"Perícias Militares",nome:"Reflexo",atributos:["PRX"],aux:["Atletismo","Acrobacia","Dança"],divisor:2},
{categoria:"Perícias Militares",nome:"Rijeza",atributos:["HPR"],aux:["Vigor"],divisor:3},
{categoria:"Perícias Militares",nome:"Cirurgia",atributos:["QI","PRX"],aux:["Medicina"],divisor:2},
{categoria:"Perícias Militares",nome:"Furtividade",atributos:["PRX","QI"],aux:["Tática","Localizar"],divisor:2},
{categoria:"Perícias Militares",nome:"Tática",atributos:["QI"],aux:[],divisor:1},

{categoria:"Perícias Interpessoais",nome:"Empatia",atributos:["PSI"],aux:["Acalanto"],divisor:2},
{categoria:"Perícias Interpessoais",nome:"Diplomacia",atributos:["PSI","QI"],aux:["Persuasão"],divisor:2},
{categoria:"Perícias Interpessoais",nome:"Persuasão",atributos:["PSI","QI"],aux:["Diplomacia"],divisor:2},
{categoria:"Perícias Interpessoais",nome:"Intimidação",atributos:["PSI","HPR"],aux:["Persuasão"],divisor:2},
{categoria:"Perícias Interpessoais",nome:"Acalanto",atributos:["PSI"],aux:["Empatia"],divisor:2},
{categoria:"Perícias Interpessoais",nome:"Fé",atributos:["PSI"],aux:["História"],divisor:2},
{categoria:"Perícias Interpessoais",nome:"Adestramento",atributos:["PSI","QI"],aux:["Empatia","Acalanto"],divisor:2},

{categoria:"Perícias Mentais",nome:"Determinação",atributos:["PSI"],aux:["Fé"],divisor:2},
{categoria:"Perícias Mentais",nome:"Medicina",atributos:["QI"],aux:["Mnemônica"],divisor:2},
{categoria:"Perícias Mentais",nome:"Instinto",atributos:["PSI","QI","PRX"],aux:["Tática"],divisor:2},
{categoria:"Perícias Mentais",nome:"Localizar",atributos:["QI"],aux:[],divisor:1},
{categoria:"Perícias Mentais",nome:"Mnemônica",atributos:["QI"],aux:[],divisor:1},
{categoria:"Perícias Mentais",nome:"História",atributos:["QI"],aux:["Mnemônica"],divisor:2},
{categoria:"Perícias Mentais",nome:"Naturalismo",atributos:["QI"],aux:[],divisor:1},

{categoria:"Perícias Convenientes",nome:"Atletismo",atributos:["HPR"],aux:["Vigor","Acrobacia"],divisor:2},
{categoria:"Perícias Convenientes",nome:"Vigor",atributos:["HPR"],aux:["Atletismo","Dança"],divisor:3},
{categoria:"Perícias Convenientes",nome:"Arremesso",atributos:["PRX","HPR"],aux:["Pontaria"],divisor:2},
{categoria:"Perícias Convenientes",nome:"Engenharia",atributos:["QI"],aux:["Desenho"],divisor:2},
{categoria:"Perícias Convenientes",nome:"Alquimia",atributos:["QI"],aux:["Mnemônica"],divisor:2},
{categoria:"Perícias Convenientes",nome:"Acrobacia",atributos:["PRX"],aux:["Atletismo","Vigor","Reflexo"],divisor:2},
{categoria:"Perícias Convenientes",nome:"Fôlego",atributos:["HPR"],aux:["Vigor"],divisor:2},
{categoria:"Perícias Convenientes",nome:"Dança",atributos:["PRX"],aux:["Mnemônica","Acrobacia","Vigor"],divisor:2},
{categoria:"Perícias Convenientes",nome:"Culinária",atributos:["QI"],aux:["Mnemônica","Alquimia"],divisor:2},
{categoria:"Perícias Convenientes",nome:"Musicismo",atributos:["PSI","QI","PRX"],aux:["Mnemônica"],divisor:2},
{categoria:"Perícias Convenientes",nome:"Equitação",atributos:["QI","PSI"],aux:["Vigor","Adestramento"],divisor:2},
{categoria:"Perícias Convenientes",nome:"Desenho",atributos:["QI"],aux:["Engenharia"],divisor:2},
{categoria:"Perícias Convenientes",nome:"Pedagogia",atributos:["PSI","QI"],aux:["Mnemônica"],divisor:2},
{categoria:"Perícias Convenientes",nome:"Marinharia",atributos:["QI"],aux:[],divisor:1}
];

const pontosPuros = {};
const pontosBonus = {};
const personalizadas = [];

// ID único desta ficha (gerado uma vez, usado como chave de storage).
// Enquanto a ficha não for salva pela primeira vez, fichaId é null.
let fichaId = null;
let statusTimeout = null;
let avatarAtual = "";

const OPCOES_CLASSE = ["Lutador","Atirador","Eteromante","Alquimista","Ladino"];

function idSeguro(nome){
return nome.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]/g,"_");
}

function valorAtributo(nome){
return Math.max(0,parseInt(document.getElementById("attr_"+nome)?.value)||0);
}

function pontosPurosDe(nome){
return Math.max(0,parseInt(pontosPuros[nome])||0);
}

// Interpreta o texto de Pontos Bônus, que pode conter:
// - um número (inclusive negativo), ex.: "3", "-2"
// - um ajuste na quantidade de D6, ex.: "+1D6", "-1D6"
// - os dois combinados, ex.: "-2 +1D6"
function interpretarBonus(nome){
const texto=String(pontosBonus[nome]??"").toUpperCase();
let dados=0;
const regexDado=/([+-]?)\s*(\d*)\s*D6/g;
let m;
while((m=regexDado.exec(texto))!==null){
const sinal=m[1]==="-"?-1:1;
const numero=m[2]?parseInt(m[2],10):1;
dados+=sinal*numero;
}
const semDados=texto.replace(regexDado,' ');
let pontos=0;
const regexPontos=/[+-]?\d+/g;
let m2;
while((m2=regexPontos.exec(semDados))!==null){
pontos+=parseInt(m2[0],10)||0;
}
return {pontos,dados};
}

function pontosBonusDe(nome){
return interpretarBonus(nome).pontos;
}

function dadosBonusDe(nome){
return interpretarBonus(nome).dados;
}

function definirPontosPuros(nome,valor){
pontosPuros[nome]=Math.max(0,parseInt(valor)||0);
atualizarPainel();
}

function definirPontosBonus(nome,valor){
pontosBonus[nome]=(valor??"").trim();
atualizarPainel();
}

function obterAtributoPrincipal(pericia){
    if (pericia.atributos.length === 1) return pericia.atributos[0];

    const id = "base_" + idSeguro(pericia.nome);
    const select = document.getElementById(id);

    // O valor atual do seletor é SEMPRE o Atributo Principal.
    return select && select.value ? select.value : pericia.atributos[0];
}
function obterAtributosAuxiliares(pericia){
if(pericia.atributos.length<=1)return [];
const principal=obterAtributoPrincipal(pericia);
return pericia.atributos.filter(attr=>attr!==principal);
}

// Pontos Relacionados vêm SOMENTE dos Pontos Puros das Perícias Relacionadas.
// (Nunca de seus Pontos Bônus nem de seus Pontos Totais — para não gerar efeito bola de neve.)
function calcularRelacionados(pericia){
if(!pericia.aux?.length)return 0;
let soma=0;
pericia.aux.forEach(nome=>soma+=pontosPurosDe(nome));
return Math.floor(soma/pericia.divisor);
}

function calcularTotal(pericia){
return pontosPurosDe(pericia.nome)+pontosBonusDe(pericia.nome)+calcularRelacionados(pericia);
}

function criarCard(pericia){
const card=document.createElement("div");
card.className="pericia-card";
const id=idSeguro(pericia.nome);

const header=document.createElement("div");
header.className="pericia-header";

const titulo=document.createElement("div");
titulo.className="pericia-title";
titulo.textContent=pericia.nome;

const base=document.createElement("div");
base.className="pericia-base";
base.append("Atributo Principal: ");

if(pericia.atributos.length>1){
const select=document.createElement("select");
select.id="base_"+id;
pericia.atributos.forEach(attr=>{
const option=document.createElement("option");
option.value=attr; option.textContent=attr;
select.appendChild(option);
});
select.addEventListener("change",function(){ atualizarPainel(); });
select.addEventListener("input",function(){ atualizarPainel(); });
base.appendChild(select);
}else{
const span=document.createElement("strong");
span.textContent=pericia.atributos[0];
base.appendChild(span);
}
header.append(titulo,base);

const corpo=document.createElement("div");
corpo.className="pericia-corpo";

const grupoPuros=document.createElement("div");
grupoPuros.className="input-group";
const labelPuros=document.createElement("label");
labelPuros.textContent="Pontos Puros";
const inputPuros=document.createElement("input");
inputPuros.type="number"; inputPuros.min="0"; inputPuros.value=pontosPuros[pericia.nome]||0;
inputPuros.id="pp_"+id;
inputPuros.addEventListener("change",function(){ definirPontosPuros(pericia.nome,this.value); });
grupoPuros.append(labelPuros,inputPuros);

const grupoBonus=document.createElement("div");
grupoBonus.className="input-group";
const labelBonus=document.createElement("label");
labelBonus.textContent="Pontos Bônus";
const inputBonus=document.createElement("input");
inputBonus.type="text"; inputBonus.placeholder="0 ou +1D6"; inputBonus.maxLength=16;
inputBonus.title="Aceita números negativos e ajustes de dados, ex: -2 ou +1D6";
inputBonus.value=pontosBonus[pericia.nome]||"0";
inputBonus.id="pb_"+id;
inputBonus.addEventListener("change",function(){ definirPontosBonus(pericia.nome,this.value); });
grupoBonus.append(labelBonus,inputBonus);

const caixaRelacionados=document.createElement("div");
caixaRelacionados.className="resultado-box";
caixaRelacionados.innerHTML='<span class="rotulo">Relacionados</span><span id="rel_'+id+'">0</span>';

const caixaTotal=document.createElement("div");
caixaTotal.className="resultado-box total";
caixaTotal.innerHTML='<span class="rotulo">Total</span><span id="tot_'+id+'">0</span>';

corpo.append(grupoPuros,grupoBonus,caixaRelacionados,caixaTotal);

const formula=document.createElement("div");
formula.className="formula";
formula.id="formula_"+id;

const botao=document.createElement("button");
botao.className="btn-rolar";
botao.textContent="Rolar Dados";
botao.onclick=()=>rolar(pericia.nome);

const dados=document.createElement("details");
dados.id="d_"+id;
dados.className="dados-resultado";

card.append(header,corpo,formula,botao,dados);
return card;
}

function criarPainel(){
/* Os cards já vêm no HTML para funcionarem também em visualizadores
   Android que demoram ou restringem a execução de JavaScript. */
pericias.forEach(pericia=>{
    if(pontosPuros[pericia.nome]===undefined)pontosPuros[pericia.nome]=0;
    if(pontosBonus[pericia.nome]===undefined)pontosBonus[pericia.nome]=0;
});
atualizarPainel();
}

function montarFormula(pericia){
    const principal = obterAtributoPrincipal(pericia);
    const atributosAux = pericia.atributos.filter(attr => attr !== principal);

    // Principal = quantidade de D6.
    // Relacionado restante = Atributo Auxiliar, simplesmente somado.
    let texto = `${principal} × D6`;

    if (atributosAux.length > 0) {
        texto += " + " + atributosAux.join(" + ");
    }

    // Bônus proveniente das Perícias Auxiliares.
    if (pericia.aux && pericia.aux.length > 0) {
        texto += ` + ⌊(${pericia.aux.join(" + ")}) ÷ ${pericia.divisor}⌋`;
    }

    return texto;
}

function atualizarPainel(){
    const listaCompleta = pericias.concat(personalizadas);
    listaCompleta.forEach(pericia => {
        const id = idSeguro(pericia.nome);
        const relacionados = calcularRelacionados(pericia);
        const total = calcularTotal(pericia);
        const modDados = dadosBonusDe(pericia.nome);
        const relEl = document.getElementById("rel_" + id);
        const totEl = document.getElementById("tot_" + id);
        const formula = document.getElementById("formula_" + id);

        if (relEl) relEl.textContent = relacionados;
        if (totEl) totEl.textContent = total;

        if (formula) {
            const sufixoDados = modDados !== 0
                ? ` (Bônus: ${modDados > 0 ? "+" : "−"}${Math.abs(modDados)}D6)`
                : "";
            formula.textContent =
                montarFormula(pericia) +
                sufixoDados +
                ` → Pontos Totais: ${total}`;
        }
    });

    const badgePericiasEl = document.getElementById("tab-badge-pericias-qtd");
    if(badgePericiasEl) {
        badgePericiasEl.textContent = listaCompleta.length;
    }

    if(typeof renderizarPericiasTaticas === 'function') {
        renderizarPericiasTaticas();
    }
}

function instalarListenersAtributos(){
    // Liga diretamente cada seletor ao recálculo da fórmula.
    document.querySelectorAll('select[id^="base_"]').forEach(select => {
        select.addEventListener("change", function(){
            atualizarPainel();
        });
        select.addEventListener("input", function(){
            atualizarPainel();
        });
    });
}

function atualizarOpcoesClasse(){
    const sel1 = document.getElementById("ficha_classe1");
    const sel2 = document.getElementById("ficha_classe2");
    if(!sel1 || !sel2) return;

    // Uma classe escolhida na Primeira não pode ser escolhida na Segunda (e vice-versa).
    if(sel1.value && sel1.value === sel2.value){
        sel2.value = "";
    }

    Array.from(sel2.options).forEach(opt=>{
        opt.disabled = !!opt.value && opt.value === sel1.value;
    });
    Array.from(sel1.options).forEach(opt=>{
        opt.disabled = !!opt.value && opt.value === sel2.value;
    });
}

function aplicarAvatar(){
    const img = document.getElementById("ficha_avatar_img");
    const placeholder = document.getElementById("avatar_placeholder");
    const remover = document.getElementById("avatar_remover");
    if(avatarAtual){
        img.src = avatarAtual;
        img.style.display = "block";
        placeholder.style.display = "none";
        remover.style.display = "flex";
    }else{
        img.removeAttribute("src");
        img.style.display = "none";
        placeholder.style.display = "block";
        remover.style.display = "none";
    }
}

function otimizarImagemAvatar(fonte, maxW = 320, maxH = 420, qualidade = 0.82){
    return new Promise((resolve) => {
        if(!fonte) return resolve("");

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = function(){
            try{
                let w = img.naturalWidth || img.width;
                let h = img.naturalHeight || img.height;
                if(!w || !h){
                    return resolve(typeof fonte === "string" ? fonte : "");
                }

                // Mantém proporção e limita resolução máxima
                const escala = Math.min(maxW / w, maxH / h, 1);
                const larguraFinal = Math.max(1, Math.round(w * escala));
                const alturaFinal = Math.max(1, Math.round(h * escala));

                const canvas = document.createElement("canvas");
                canvas.width = larguraFinal;
                canvas.height = alturaFinal;
                const ctx = canvas.getContext("2d");
                if(!ctx){
                    return resolve(typeof fonte === "string" ? fonte : "");
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(img, 0, 0, larguraFinal, alturaFinal);

                // Tenta WebP para máxima compressão
                let resultado = "";
                try {
                    resultado = canvas.toDataURL("image/webp", qualidade);
                } catch(e){}

                // Fallback para JPEG se WebP não for suportado ou não retornar formato esperado
                if(!resultado || !resultado.startsWith("data:image/webp")){
                    resultado = canvas.toDataURL("image/jpeg", qualidade);
                }

                resolve(resultado);
            }catch(err){
                console.warn("Falha ao otimizar imagem no canvas:", err);
                resolve(typeof fonte === "string" ? fonte : "");
            }
        };

        img.onerror = function(){
            resolve(typeof fonte === "string" ? fonte : "");
        };

        if(typeof fonte === "string"){
            img.src = fonte;
        } else if(fonte instanceof Blob){
            const reader = new FileReader();
            reader.onload = function(e){
                img.src = e.target.result;
            };
            reader.onerror = function(){
                resolve("");
            };
            reader.readAsDataURL(fonte);
        } else {
            resolve("");
        }
    });
}

async function carregarAvatar(event){
    const arquivo = event.target.files[0];
    if(!arquivo) return;

    const tiposValidos = ["image/png","image/jpeg","image/jpg","image/gif","image/webp"];
    if(!tiposValidos.includes(arquivo.type) && !arquivo.type.startsWith("image/")){
        mostrarStatus("✗ Envie uma imagem válida (PNG, JPEG, WebP ou GIF).", "erro");
        event.target.value = "";
        return;
    }

    try {
        mostrarStatus("Otimizando imagem do retrato...", "");
        const imagemOtimizada = await otimizarImagemAvatar(arquivo, 320, 420, 0.82);
        if(!imagemOtimizada){
            throw new Error("Falha na conversão da imagem.");
        }
        avatarAtual = imagemOtimizada;
        aplicarAvatar();
        marcarAlteracaoFeita();
        mostrarStatus("✓ Retrato carregado e otimizado com sucesso.", "ok");
    } catch(err) {
        console.error("Erro ao carregar retrato:", err);
        mostrarStatus("✗ Não foi possível carregar a imagem.", "erro");
    } finally {
        event.target.value = "";
    }
}

function removerAvatar(){
    avatarAtual = "";
    aplicarAvatar();
    marcarAlteracaoFeita();
}

// ============================================================================
// Sistema de 3 Divisões de Nomenclatura (Identidade, Nome Social, Codinome + Título)
// ============================================================================
function alternarCampoNomeSocial(ativo, registrarAlteracao = true) {
    const bloco = document.getElementById("bloco_nome_social");
    const chk = document.getElementById("ficha_tem_nome_social");
    if (chk) chk.checked = !!ativo;
    if (bloco) {
        bloco.style.display = ativo ? "flex" : "none";
    }
    atualizarNomesPersonagem(registrarAlteracao);
}

function alternarCampoCodinome(ativo, registrarAlteracao = true) {
    atualizarNomesPersonagem(registrarAlteracao);
}

function trocarIdentidadeComCodinome() {}

function obterNomeExibicaoPersonagem() {
    const identEl = document.getElementById("ficha_identidade");
    const nomeEl = document.getElementById("ficha_nome");
    const socialEl = document.getElementById("ficha_nome_social");
    const tituloEl = document.getElementById("ficha_titulo");
    const chkSocial = document.getElementById("ficha_tem_nome_social");

    const identidade = (identEl?.value || nomeEl?.value || "").trim() || "Novo Personagem";
    const temSocial = !!chkSocial?.checked;
    const nomeSocial = temSocial ? (socialEl?.value || "").trim() : "";
    const titulo = (tituloEl?.value || "").trim();

    // Prioridade de chamada no jogo: Nome Social (se habilitado) ou Identidade
    let nomePrincipal = (temSocial && nomeSocial) ? nomeSocial : identidade;
    let nomeComposto = nomePrincipal;
    if (titulo) {
        nomeComposto = nomePrincipal + ", " + titulo;
    }

    return {
        principal: nomePrincipal,
        completo: nomeComposto,
        identidade: identidade,
        temNomeSocial: temSocial,
        nomeSocial: nomeSocial,
        temCodinome: false,
        codinome: "",
        trocarPorCodinome: false,
        titulo: titulo
    };
}

function atualizarNomesPersonagem(registrarAlteracao = true) {
    if (typeof atualizarTravaSenhaSegredoUI === "function") {
        atualizarTravaSenhaSegredoUI();
    }
    const info = obterNomeExibicaoPersonagem();
    
    // Sincroniza o input 'ficha_nome' para manter compatibilidade com todos os subsistemas
    const fichaNomeEl = document.getElementById("ficha_nome");
    if (fichaNomeEl) {
        fichaNomeEl.value = info.completo;
    }

    // Atualiza o visor de apresentação
    const previewDestaque = document.getElementById("ficha_preview_nome_destaque");
    const previewDetalhes = document.getElementById("ficha_preview_detalhes_sub");
    if (previewDestaque) {
        previewDestaque.textContent = info.completo;
    }
    if (previewDetalhes) {
        let partes = [];
        if (info.temNomeSocial && info.nomeSocial && info.identidade && info.identidade !== info.nomeSocial) {
            partes.push(`Identidade: ${info.identidade}`);
        }
        previewDetalhes.textContent = partes.length > 0 ? `(${partes.join(" • ")})` : "";
    }

    if (typeof sincronizarModoTatico === "function") {
        sincronizarModoTatico();
    }
    if (typeof renderizarPainelCampanha === "function") {
        renderizarPainelCampanha();
    }
    if (typeof agendarSincronizacaoCampanha === "function") {
        agendarSincronizacaoCampanha();
    }
    if (registrarAlteracao && typeof marcarAlteracaoFeita === "function") {
        marcarAlteracaoFeita();
    }
}

let corPrincipalAtual = "#c9b183";
let contornoLetrasAtivo = false;
let contornoLetrasCor = "#ffffff";

function propagarSincronizacaoTema(tipo, valor) {
    try {
        if (tipo === 'cor') {
            localStorage.setItem("we_are_strangers_tema_cor", valor);
        } else if (tipo === 'contorno_ativo') {
            localStorage.setItem("we_are_strangers_tema_contorno_ativo", String(!!valor));
        } else if (tipo === 'contorno_cor') {
            localStorage.setItem("we_are_strangers_tema_contorno_cor", valor);
        }
        if (window.BroadcastChannel) {
            const bc = new BroadcastChannel("we_are_strangers_theme_sync");
            bc.postMessage({ tipo, valor });
            bc.close();
        }
    } catch(e) {}
}

function definirCorPrincipal(valor, registrarAlteracao = true, sincronizar = true){
    if (valor) {
        corPrincipalAtual = valor;
        document.documentElement.style.setProperty('--accent', valor);
        const inputCor = document.getElementById("ficha_cor");
        if (inputCor && inputCor.value.toLowerCase() !== valor.toLowerCase()) {
            inputCor.value = valor;
        }
        if (sincronizar) {
            propagarSincronizacaoTema('cor', valor);
        }
    }
    if (registrarAlteracao) {
        marcarAlteracaoFeita();
    }
    if (typeof verificarGatilhoAntiContraste === "function") {
        verificarGatilhoAntiContraste();
    }
    if (typeof verificarGatilhoReve === "function") {
        verificarGatilhoReve(valor);
    }
}

function alternarContornoLetras(ativo, registrarAlteracao = true, sincronizar = true){
    contornoLetrasAtivo = !!ativo;
    const chk = document.getElementById("ficha_contorno_ativo");
    if(chk) chk.checked = contornoLetrasAtivo;

    const caixa = document.getElementById("caixa_contorno_cor");
    if(caixa){
        if(contornoLetrasAtivo){
            caixa.classList.remove("desativada");
        } else {
            caixa.classList.add("desativada");
        }
    }

    if(contornoLetrasAtivo){
        document.documentElement.classList.add("tem-contorno-letras");
    } else {
        document.documentElement.classList.remove("tem-contorno-letras");
    }

    if (sincronizar) {
        propagarSincronizacaoTema('contorno_ativo', contornoLetrasAtivo);
    }

    if(registrarAlteracao){
        marcarAlteracaoFeita();
    }
    if (typeof verificarGatilhoAntiContraste === "function") {
        verificarGatilhoAntiContraste();
    }
}

function definirCorContorno(valor, registrarAlteracao = true, sincronizar = true){
    if(valor){
        contornoLetrasCor = valor;
        document.documentElement.style.setProperty('--tema-contorno-cor', valor);
        const inputCor = document.getElementById("ficha_contorno_cor");
        if(inputCor && inputCor.value.toLowerCase() !== valor.toLowerCase()) inputCor.value = valor;
        if (sincronizar) {
            propagarSincronizacaoTema('contorno_cor', valor);
        }
    }
    if(!contornoLetrasAtivo){
        alternarContornoLetras(true, registrarAlteracao, sincronizar);
    } else if(registrarAlteracao){
        marcarAlteracaoFeita();
    }
}

function clicarCaixaContornoCor(){
    if(!contornoLetrasAtivo){
        alternarContornoLetras(true);
    }
    const inputCor = document.getElementById("ficha_contorno_cor");
    if(inputCor) inputCor.click();
}

// Ouvintes de sincronização bidirecional em tempo real com Modo Planta
try {
    window.addEventListener("storage", (e) => {
        if (e.key === "we_are_strangers_tema_cor" && e.newValue) {
            definirCorPrincipal(e.newValue, false, false);
        } else if (e.key === "we_are_strangers_tema_contorno_ativo") {
            alternarContornoLetras(e.newValue === "true", false, false);
        } else if (e.key === "we_are_strangers_tema_contorno_cor" && e.newValue) {
            definirCorContorno(e.newValue, false, false);
        }
    });

    if (window.BroadcastChannel) {
        const canalTemaFicha = new BroadcastChannel("we_are_strangers_theme_sync");
        canalTemaFicha.onmessage = (e) => {
            if (!e.data) return;
            if (e.data.tipo === 'cor' && e.data.valor) {
                definirCorPrincipal(e.data.valor, false, false);
            } else if (e.data.tipo === 'contorno_ativo') {
                alternarContornoLetras(!!e.data.valor, false, false);
            } else if (e.data.tipo === 'contorno_cor' && e.data.valor) {
                definirCorContorno(e.data.valor, false, false);
            }
        };
    }
} catch(e) {}

// ============================================================================
// Sistema de Efeitos Sonoros Procedurais Viscerais (Web Audio API Nativa)
// Síntese de impacto físico de dados, batimentos cardíacos, tensão de corda e sinos
// ============================================================================
let audioCtx = null;
let somAtivado = true;
let reverbBuffer = null;

try {
    const salvo = localStorage.getItem("we_are_strangers_som");
    if (salvo !== null) {
        somAtivado = salvo === "true";
    }
} catch (e) {
    somAtivado = true;
}

function obterAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
            gerarReverbBuffer(audioCtx);
        }
    }
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    return audioCtx;
}

function gerarReverbBuffer(ctx) {
    if (reverbBuffer || !ctx) return;
    try {
        const rate = ctx.sampleRate;
        const dur = 1.8;
        const length = Math.floor(rate * dur);
        const buffer = ctx.createBuffer(2, length, rate);
        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                const decaimento = Math.exp(-i / (rate * 0.42));
                data[i] = (Math.random() * 2 - 1) * decaimento;
            }
        }
        reverbBuffer = buffer;
    } catch (e) {}
}

function alternarSom() {
    somAtivado = !somAtivado;
    try {
        localStorage.setItem("we_are_strangers_som", String(somAtivado));
    } catch (e) {}
    atualizarBotoesSom();
    if (somAtivado) {
        tocarEfeitoSonoro({ nome: "NORMAL", tipo: "normal" }, 5, 2);
    }
}

function atualizarBotoesSom() {
    const botoes = document.querySelectorAll(".btn-toggle-som");
    botoes.forEach(btn => {
        const icone = btn.querySelector(".icone-som");
        const texto = btn.querySelector(".texto-som");
        if (somAtivado) {
            btn.classList.remove("som-mutado");
            btn.title = "Efeitos Sonoros: Ativados (clique para silenciar)";
            if (icone) icone.textContent = "🔔";
            if (texto) texto.textContent = "Som: Ativado";
        } else {
            btn.classList.add("som-mutado");
            btn.title = "Efeitos Sonoros: Silenciados (clique para ativar)";
            if (icone) icone.textContent = "🔕";
            if (texto) texto.textContent = "Som: Mudo";
        }
    });
}

function criarCadeiaSaida(ctx, nivelReverb = 0.22) {
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-14, ctx.currentTime);
    compressor.knee.setValueAtTime(6, ctx.currentTime);
    compressor.ratio.setValueAtTime(4.5, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.18, ctx.currentTime);
    compressor.connect(ctx.destination);

    const busEntrada = ctx.createGain();
    busEntrada.gain.setValueAtTime(1.0, ctx.currentTime);
    busEntrada.connect(compressor);

    if (reverbBuffer && nivelReverb > 0) {
        try {
            const convolver = ctx.createConvolver();
            convolver.buffer = reverbBuffer;
            const revGain = ctx.createGain();
            revGain.gain.setValueAtTime(nivelReverb, ctx.currentTime);
            busEntrada.connect(convolver);
            convolver.connect(revGain);
            revGain.connect(compressor);
        } catch (e) {}
    }

    return busEntrada;
}

function tocarDadosMadeira(ctx, destino, agora, qtdImpactos = 3, peso = 1) {
    const tempos = [0, 0.05, 0.11, 0.18];
    const total = Math.min(Math.max(qtdImpactos, 2), 4);

    for (let i = 0; i < total; i++) {
        const t = agora + (tempos[i] || i * 0.055);
        const ehUltimo = i === total - 1;

        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        const baseF = (180 + Math.random() * 80) * (peso > 1.2 ? 0.8 : 1);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(baseF, t);
        osc.frequency.exponentialRampToValueAtTime(38, t + 0.07);

        filter.type = "bandpass";
        filter.frequency.setValueAtTime(baseF * 2.2, t);
        filter.Q.setValueAtTime(3.5, t);

        const vol = (ehUltimo ? 0.48 : 0.26) * peso;
        oscGain.gain.setValueAtTime(0.001, t);
        oscGain.gain.linearRampToValueAtTime(vol, t + 0.003);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(destino);

        osc.start(t);
        osc.stop(t + 0.09);

        // Micro estalo de contato (transiente tátil de osso/madeira)
        try {
            const len = Math.floor(ctx.sampleRate * 0.015);
            const buf = ctx.createBuffer(1, len, ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let k = 0; k < len; k++) {
                d[k] = (Math.random() * 2 - 1) * Math.exp(-k / (ctx.sampleRate * 0.003));
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buf;
            const nGain = ctx.createGain();
            nGain.gain.setValueAtTime((ehUltimo ? 0.28 : 0.16) * peso, t);
            noise.connect(nGain);
            nGain.connect(destino);
            noise.start(t);
            noise.stop(t + 0.02);
        } catch (e) {}
    }
}

function tocarBatimentoCardiaco(ctx, destino, tempo, intensidade = 0.8, ritmoDuplo = false) {
    const pulsos = [
        { atraso: 0, freq: 58, freqFim: 36, vol: intensidade, dur: 0.13 },
        { atraso: 0.135, freq: 70, freqFim: 40, vol: intensidade * 0.78, dur: 0.11 }
    ];
    if (ritmoDuplo) {
        pulsos.push(
            { atraso: 0.36, freq: 64, freqFim: 38, vol: intensidade * 0.95, dur: 0.13 },
            { atraso: 0.495, freq: 76, freqFim: 42, vol: intensidade * 0.74, dur: 0.11 }
        );
    }

    pulsos.forEach(p => {
        const t = tempo + p.atraso;
        const oscSub = ctx.createOscillator();
        const oscTri = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        oscSub.type = "sine";
        oscSub.frequency.setValueAtTime(p.freq, t);
        oscSub.frequency.exponentialRampToValueAtTime(p.freqFim, t + p.dur);

        oscTri.type = "triangle";
        oscTri.frequency.setValueAtTime(p.freq * 1.5, t);
        oscTri.frequency.exponentialRampToValueAtTime(p.freqFim * 1.1, t + p.dur);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(120, t);
        filter.frequency.exponentialRampToValueAtTime(45, t + p.dur);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(p.vol, t + 0.016);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + p.dur + 0.03);

        oscSub.connect(filter);
        oscTri.connect(filter);
        filter.connect(gain);
        gain.connect(destino);

        oscSub.start(t);
        oscTri.start(t);
        oscSub.stop(t + p.dur + 0.04);
        oscTri.stop(t + p.dur + 0.04);
    });
}

function tocarSubImpacto(ctx, destino, tempo, freqIni = 85, freqFim = 28, dur = 0.55, vol = 0.65) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freqIni, tempo);
    osc.frequency.exponentialRampToValueAtTime(freqFim, tempo + dur);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(140, tempo);
    filter.frequency.exponentialRampToValueAtTime(36, tempo + dur);

    gain.gain.setValueAtTime(0.001, tempo);
    gain.gain.linearRampToValueAtTime(vol, tempo + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, tempo + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destino);

    osc.start(tempo);
    osc.stop(tempo + dur + 0.02);
}

function tocarDroneTensao(ctx, destino, tempo, dur = 1.3, freq = 65) {
    [freq, freq * 1.5].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(f, tempo);
        osc.detune.setValueAtTime(idx === 0 ? -4 : 4, tempo);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(180, tempo);
        filter.frequency.exponentialRampToValueAtTime(70, tempo + dur);

        const v = idx === 0 ? 0.28 : 0.16;
        gain.gain.setValueAtTime(0.001, tempo);
        gain.gain.linearRampToValueAtTime(v, tempo + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, tempo + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destino);

        osc.start(tempo);
        osc.stop(tempo + dur + 0.05);
    });
}

function tocarSinoAncestral(ctx, destino, tempo, dur = 2.5) {
    const parciais = [
        { f: 261.63, vol: 0.35, d: dur },
        { f: 392.00, vol: 0.24, d: dur * 0.8 },
        { f: 523.25, vol: 0.18, d: dur * 0.65 },
        { f: 784.00, vol: 0.10, d: dur * 0.45 }
    ];
    parciais.forEach(p => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(p.f, tempo);
        gain.gain.setValueAtTime(0.001, tempo);
        gain.gain.linearRampToValueAtTime(p.vol, tempo + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, tempo + p.d);

        osc.connect(gain);
        gain.connect(destino);
        osc.start(tempo);
        osc.stop(tempo + p.d + 0.05);
    });
}

function tocarCadafalsoEForca(ctx, destino, agora) {
    // 1. O estalo violento do alçapão de carvalho se abrindo
    try {
        const len = Math.floor(ctx.sampleRate * 0.22);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let k = 0; k < len; k++) {
            d[k] = (Math.random() * 2 - 1) * Math.sin(k * 0.09) * Math.exp(-k / (ctx.sampleRate * 0.04));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const nFilter = ctx.createBiquadFilter();
        nFilter.type = "bandpass";
        nFilter.frequency.setValueAtTime(680, agora);
        nFilter.frequency.exponentialRampToValueAtTime(140, agora + 0.2);
        nFilter.Q.setValueAtTime(5, agora);

        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.001, agora);
        nGain.gain.linearRampToValueAtTime(0.65, agora + 0.01);
        nGain.gain.exponentialRampToValueAtTime(0.001, agora + 0.21);

        noise.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(destino);
        noise.start(agora);
        noise.stop(agora + 0.22);
    } catch (e) {}

    // 2. O rangido áspero de corda de cânhamo tensionando bruscamente
    const ropeStart = agora + 0.04;
    const oscCorda = ctx.createOscillator();
    const cordaGain = ctx.createGain();
    const cordaFilter = ctx.createBiquadFilter();

    oscCorda.type = "sawtooth";
    oscCorda.frequency.setValueAtTime(320, ropeStart);
    oscCorda.frequency.exponentialRampToValueAtTime(160, ropeStart + 0.28);

    cordaFilter.type = "bandpass";
    cordaFilter.frequency.setValueAtTime(450, ropeStart);
    cordaFilter.frequency.exponentialRampToValueAtTime(220, ropeStart + 0.28);
    cordaFilter.Q.setValueAtTime(8, ropeStart);

    cordaGain.gain.setValueAtTime(0.001, ropeStart);
    cordaGain.gain.linearRampToValueAtTime(0.5, ropeStart + 0.04);
    cordaGain.gain.exponentialRampToValueAtTime(0.001, ropeStart + 0.3);

    oscCorda.connect(cordaFilter);
    cordaFilter.connect(cordaGain);
    cordaGain.connect(destino);

    oscCorda.start(ropeStart);
    oscCorda.stop(ropeStart + 0.31);

    // 3. O baque sub-grave aterrador da forca (choque no peito)
    tocarSubImpacto(ctx, destino, agora + 0.08, 95, 26, 0.65, 0.85);

    // 4. Batimento cardíaco súbito e sufocado (o choque do jogador)
    tocarBatimentoCardiaco(ctx, destino, agora + 0.25, 0.7, false);
}

function tocarSinoGoticoAmaldicoado(ctx, destino, agora) {
    // 1. Sino fúnebre colossal gótico (parciais metálicos inharmônicos e sombrios)
    const fundamental = 110; // A2 fúnebre
    const parciais = [
        { mult: 0.55, ganho: 0.42, dur: 2.8 },
        { mult: 1.00, ganho: 0.58, dur: 3.2 },
        { mult: 1.33, ganho: 0.38, dur: 2.6 },
        { mult: 1.98, ganho: 0.32, dur: 2.2 },
        { mult: 2.49, ganho: 0.24, dur: 1.7 },
        { mult: 3.52, ganho: 0.18, dur: 1.3 },
        { mult: 4.64, ganho: 0.12, dur: 0.9 }
    ];

    parciais.forEach(p => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(fundamental * p.mult, agora);
        osc.detune.setValueAtTime((Math.random() - 0.5) * 8, agora);

        gain.gain.setValueAtTime(0.001, agora);
        gain.gain.linearRampToValueAtTime(p.ganho, agora + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + p.dur);

        osc.connect(gain);
        gain.connect(destino);

        osc.start(agora);
        osc.stop(agora + p.dur + 0.05);
    });

    // 2. Sopro espectral e sussurro sobrenatural invertido
    try {
        const len = Math.floor(ctx.sampleRate * 0.65);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let k = 0; k < len; k++) {
            d[k] = (Math.random() * 2 - 1);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const nFilter = ctx.createBiquadFilter();
        nFilter.type = "bandpass";
        nFilter.frequency.setValueAtTime(1400, agora);
        nFilter.frequency.exponentialRampToValueAtTime(320, agora + 0.6);
        nFilter.Q.setValueAtTime(6, agora);

        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.001, agora);
        nGain.gain.linearRampToValueAtTime(0.35, agora + 0.15);
        nGain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.62);

        noise.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(destino);
        noise.start(agora);
        noise.stop(agora + 0.65);
    } catch (e) {}

    // 3. Sub-grave profundo de arrepio gótico
    tocarSubImpacto(ctx, destino, agora + 0.05, 75, 24, 0.8, 0.7);
}

function tocarEfeitoSonoro(faixa, resultado, qtdDados = 2) {
    if (!somAtivado) return;
    const ctx = obterAudioContext();
    if (!ctx) return;

    const nomeFaixa = (faixa && faixa.nome ? faixa.nome : "").toUpperCase();
    const agora = ctx.currentTime;

    if (nomeFaixa === "DESASTRE!" || (faixa && faixa.tipo === "desastre")) {
        const destino = criarCadeiaSaida(ctx, 0.35);
        tocarCadafalsoEForca(ctx, destino, agora);
        return;
    }

    if (nomeFaixa === "AMALDIÇOADO" || (faixa && faixa.tipo === "amaldicoado")) {
        const destino = criarCadeiaSaida(ctx, 0.45);
        tocarSinoGoticoAmaldicoado(ctx, destino, agora);
        return;
    }

    // Para as demais faixas, começamos com a rolagem tátil e física dos dados
    const destinoDados = criarCadeiaSaida(ctx, 0.18);
    const pesoDados = nomeFaixa === "ABSURDO" || nomeFaixa === "SOBREHUMANO" ? 1.3 : 1.0;
    tocarDadosMadeira(ctx, destinoDados, agora, qtdDados, pesoDados);

    // E adicionamos a assinatura psicológica de cada faixa de dificuldade:
    if (nomeFaixa === "FÁCIL") {
        // Alívio e calma mundana: um tom morno e harmônico relaxante
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(220, agora + 0.12);
        gain.gain.setValueAtTime(0.001, agora + 0.12);
        gain.gain.linearRampToValueAtTime(0.2, agora + 0.16);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.45);
        osc.connect(gain);
        gain.connect(destinoDados);
        osc.start(agora + 0.12);
        osc.stop(agora + 0.5);
    } else if (nomeFaixa === "NORMAL") {
        // Equilíbrio neutro e firme (os dados de carvalho falam por si)
    } else if (nomeFaixa === "DIFÍCIL") {
        // Tensão sutil: zumbido sombrio no ar que eleva a guarda dos jogadores
        tocarDroneTensao(ctx, destinoDados, agora + 0.12, 1.1, 65);
    } else if (nomeFaixa === "DESAFIADOR") {
        // Tensão alta: o coração dispara! Batimento cardíaco no peito (LUB-DUB)
        tocarBatimentoCardiaco(ctx, destinoDados, agora + 0.18, 0.85, false);
    } else if (nomeFaixa === "ABSURDO") {
        // Adrenalina pura: batimento cardíaco duplo acelerado + sub-drop de choque
        tocarBatimentoCardiaco(ctx, destinoDados, agora + 0.16, 0.95, true);
        tocarSubImpacto(ctx, destinoDados, agora + 0.18, 90, 30, 0.55, 0.7);
    } else if (nomeFaixa === "POSSÍVEL?" || nomeFaixa === "SOBREHUMANO") {
        // Feito sobre-humano: carrilhão ancestral ressonante
        tocarSinoAncestral(ctx, destinoDados, agora + 0.14, 2.4);
    }
}

function tocarSom(tipo) {
    if (!somAtivado) return;
    const ctx = obterAudioContext();
    if (!ctx) return;
    const agora = ctx.currentTime;
    const destino = criarCadeiaSaida(ctx, 0.3);

    if (tipo === "vitoria" || tipo === "conquista") {
        tocarSinoAncestral(ctx, destino, agora, 2.0);
    } else if (tipo === "clique") {
        tocarDadosMadeira(ctx, destino, agora, 1, 0.8);
    } else {
        tocarEfeitoSonoro({ nome: "NORMAL", tipo: "normal" }, 5, 2);
    }
}

/* ============================================================
   SÍNTESE SONORA DE STATUS (GANHO E PERDA DE BUFFS, DEBUFFS & VITAIS)
   ============================================================ */

function reproduzirSomCliqueSuave() {
    if (typeof somAtivado !== "undefined" && !somAtivado) return;
    const ctx = obterAudioContext();
    if (!ctx) return;
    const agora = ctx.currentTime;
    const destino = criarCadeiaSaida(ctx, 0.08);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, agora);
    osc.frequency.exponentialRampToValueAtTime(160, agora + 0.035);
    gain.gain.setValueAtTime(0.001, agora);
    gain.gain.linearRampToValueAtTime(0.12, agora + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.035);
    osc.connect(gain);
    gain.connect(destino);
    osc.start(agora);
    osc.stop(agora + 0.04);
}

// ============================================================
// SISTEMA DE ÁUDIO PROCEDURAL DE RECURSOS VITAIS (4 TIERS CADA)
// VIDA, MENTAL, ESTAMINA E AURA
// ============================================================

// ------------------------------------------------------------
// 1. VIDA (Cura Orgânica / Dano Corporal)
// ------------------------------------------------------------
function tocarSomReceberPontosVida(ctx, destino, agora, mag = 10) {
    if (mag <= 5) {
        // TIER 1 (+1 a +5): Micro-pulso harmônico suave e reconfortante (A3 + C#4 + E4)
        const notas = [
            { f: 220.00, ganho: 0.18, dur: 0.35, atraso: 0.00 },
            { f: 277.18, ganho: 0.16, dur: 0.40, atraso: 0.04 },
            { f: 329.63, ganho: 0.14, dur: 0.45, atraso: 0.08 }
        ];
        notas.forEach(n => {
            const t = agora + n.atraso;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = "sine";
            osc.frequency.setValueAtTime(n.f, t);
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(600, t);
            filter.frequency.exponentialRampToValueAtTime(280, t + n.dur);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(n.ganho, t + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(destino);
            osc.start(t);
            osc.stop(t + n.dur + 0.03);
        });
        return;
    }
    
    if (mag <= 15) {
        // TIER 2 (+6 a +15): Acorde Maior Dourado caloroso e aberto (C3 / G3 / C4 / E4) com sopro suave de alívio
        const notas = [
            { f: 130.81, tipo: "triangle", ganho: 0.24, dur: 0.65, atraso: 0.00 },
            { f: 196.00, tipo: "sine",     ganho: 0.22, dur: 0.60, atraso: 0.03 },
            { f: 261.63, tipo: "sine",     ganho: 0.20, dur: 0.55, atraso: 0.06 },
            { f: 329.63, tipo: "sine",     ganho: 0.18, dur: 0.50, atraso: 0.09 }
        ];
        notas.forEach(n => {
            const t = agora + n.atraso;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = n.tipo;
            osc.frequency.setValueAtTime(n.f, t);
            osc.detune.setValueAtTime((Math.random() * 4) - 2, t);
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(450, t);
            filter.frequency.exponentialRampToValueAtTime(1200, t + 0.10);
            filter.frequency.exponentialRampToValueAtTime(350, t + n.dur);
            filter.Q.setValueAtTime(1.2, t);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(n.ganho, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(destino);
            osc.start(t);
            osc.stop(t + n.dur + 0.04);
        });
        try {
            const len = Math.floor(ctx.sampleRate * 0.35);
            const buf = ctx.createBuffer(1, len, ctx.sampleRate);
            const d = buf.getChannelData(0);
            let lastOut = 0.0;
            for (let k = 0; k < len; k++) {
                const white = Math.random() * 2 - 1;
                lastOut = (lastOut + (0.02 * white)) / 1.02;
                d[k] = lastOut * 2.8 * Math.exp(-k / (ctx.sampleRate * 0.14));
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buf;
            const nFilter = ctx.createBiquadFilter();
            nFilter.type = "bandpass";
            nFilter.frequency.setValueAtTime(650, agora);
            nFilter.frequency.exponentialRampToValueAtTime(1600, agora + 0.2);
            nFilter.Q.setValueAtTime(2.0, agora);
            const nGain = ctx.createGain();
            nGain.gain.setValueAtTime(0.0001, agora);
            nGain.gain.linearRampToValueAtTime(0.12, agora + 0.04);
            nGain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.32);
            noise.connect(nFilter);
            nFilter.connect(nGain);
            nGain.connect(destino);
            noise.start(agora);
            noise.stop(agora + 0.35);
        } catch(e) {}
        return;
    }

    if (mag <= 30) {
        // TIER 3 (+16 a +30): Cascata maior luminosa ampla + pulso vital no peito
        const notas = [
            { f: 130.81, tipo: "triangle", ganho: 0.28, dur: 0.90, atraso: 0.00 },
            { f: 196.00, tipo: "sine",     ganho: 0.26, dur: 0.85, atraso: 0.03 },
            { f: 261.63, tipo: "sine",     ganho: 0.24, dur: 0.80, atraso: 0.06 },
            { f: 329.63, tipo: "sine",     ganho: 0.22, dur: 0.75, atraso: 0.09 },
            { f: 392.00, tipo: "sine",     ganho: 0.18, dur: 0.70, atraso: 0.13 }
        ];
        notas.forEach(n => {
            const t = agora + n.atraso;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = n.tipo;
            osc.frequency.setValueAtTime(n.f, t);
            osc.detune.setValueAtTime((Math.random() * 4) - 2, t);
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(320, t);
            filter.frequency.exponentialRampToValueAtTime(1400, t + 0.12);
            filter.frequency.exponentialRampToValueAtTime(450, t + n.dur);
            filter.Q.setValueAtTime(1.2, t);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(n.ganho, t + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(destino);
            osc.start(t);
            osc.stop(t + n.dur + 0.05);
        });
        try {
            const oscSub = ctx.createOscillator();
            const gainSub = ctx.createGain();
            oscSub.type = "sine";
            oscSub.frequency.setValueAtTime(80, agora);
            oscSub.frequency.exponentialRampToValueAtTime(55, agora + 0.35);
            gainSub.gain.setValueAtTime(0.0001, agora);
            gainSub.gain.linearRampToValueAtTime(0.20, agora + 0.03);
            gainSub.gain.exponentialRampToValueAtTime(0.0001, agora + 0.38);
            oscSub.connect(gainSub);
            gainSub.connect(destino);
            oscSub.start(agora);
            oscSub.stop(agora + 0.40);
        } catch(e) {}
        return;
    }

    // TIER 4 (+31+ ou Restauração Plena): Restauração Nobre Plena com ressonância dourada
    const notas = [
        { f: 65.41,  tipo: "sine",     ganho: 0.30, dur: 1.30, atraso: 0.00 },
        { f: 130.81, tipo: "triangle", ganho: 0.28, dur: 1.20, atraso: 0.02 },
        { f: 196.00, tipo: "sine",     ganho: 0.26, dur: 1.15, atraso: 0.05 },
        { f: 261.63, tipo: "sine",     ganho: 0.24, dur: 1.10, atraso: 0.08 },
        { f: 329.63, tipo: "sine",     ganho: 0.22, dur: 1.05, atraso: 0.11 },
        { f: 392.00, tipo: "sine",     ganho: 0.18, dur: 1.00, atraso: 0.15 },
        { f: 523.25, tipo: "sine",     ganho: 0.14, dur: 0.95, atraso: 0.19 }
    ];
    notas.forEach(n => {
        const t = agora + n.atraso;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = n.tipo;
        osc.frequency.setValueAtTime(n.f, t);
        osc.detune.setValueAtTime((Math.random() * 4) - 2, t);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(300, t);
        filter.frequency.exponentialRampToValueAtTime(1600, t + 0.15);
        filter.frequency.exponentialRampToValueAtTime(400, t + n.dur);
        filter.Q.setValueAtTime(1.4, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(n.ganho, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destino);
        osc.start(t);
        osc.stop(t + n.dur + 0.06);
    });
    try {
        const oscSub = ctx.createOscillator();
        const gainSub = ctx.createGain();
        oscSub.type = "sine";
        oscSub.frequency.setValueAtTime(90, agora);
        oscSub.frequency.exponentialRampToValueAtTime(45, agora + 0.50);
        gainSub.gain.setValueAtTime(0.0001, agora);
        gainSub.gain.linearRampToValueAtTime(0.25, agora + 0.04);
        gainSub.gain.exponentialRampToValueAtTime(0.0001, agora + 0.52);
        oscSub.connect(gainSub);
        gainSub.connect(destino);
        oscSub.start(agora);
        oscSub.stop(agora + 0.55);

        const oscChime = ctx.createOscillator();
        const gainChime = ctx.createGain();
        oscChime.type = "sine";
        oscChime.frequency.setValueAtTime(440, agora + 0.15);
        gainChime.gain.setValueAtTime(0.0001, agora + 0.15);
        gainChime.gain.linearRampToValueAtTime(0.12, agora + 0.18);
        gainChime.gain.exponentialRampToValueAtTime(0.0001, agora + 1.10);
        oscChime.connect(gainChime);
        gainChime.connect(destino);
        oscChime.start(agora + 0.15);
        oscChime.stop(agora + 1.15);
    } catch(e) {}
}

function tocarSomPerderPontosVida(ctx, destino, agora, mag = 10) {
    if (mag <= 5) {
        // TIER 1 (-1 a -5): Raspão seco, rápido e sutil
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(180, agora);
        osc.frequency.exponentialRampToValueAtTime(80, agora + 0.18);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(320, agora);
        filter.frequency.exponentialRampToValueAtTime(100, agora + 0.18);
        gain.gain.setValueAtTime(0.0001, agora);
        gain.gain.linearRampToValueAtTime(0.18, agora + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.20);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destino);
        osc.start(agora);
        osc.stop(agora + 0.22);
        return;
    }

    if (mag <= 15) {
        // TIER 2 (-6 a -15): Golpe moderado, baque contundente no corpo
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, agora);
        osc.frequency.exponentialRampToValueAtTime(45, agora + 0.35);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(400, agora);
        filter.frequency.exponentialRampToValueAtTime(90, agora + 0.35);
        filter.Q.setValueAtTime(2.0, agora);
        gain.gain.setValueAtTime(0.0001, agora);
        gain.gain.linearRampToValueAtTime(0.24, agora + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.38);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destino);
        osc.start(agora);
        osc.stop(agora + 0.40);
        tocarSubImpacto(ctx, destino, agora, 75, 30, 0.30, 0.22);
        return;
    }

    if (mag <= 30) {
        // TIER 3 (-16 a -30): Dano severo e pesado com tensão dissonante
        const frequencias = [
            { f: 146.83, ganho: 0.28, dur: 0.60 },
            { f: 207.65, ganho: 0.25, dur: 0.65 },
            { f: 311.13, ganho: 0.18, dur: 0.70 }
        ];
        frequencias.forEach(p => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(p.f, agora);
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(550, agora);
            filter.frequency.exponentialRampToValueAtTime(95, agora + p.dur);
            filter.Q.setValueAtTime(3.0, agora);
            gain.gain.setValueAtTime(0.0001, agora);
            gain.gain.linearRampToValueAtTime(p.ganho, agora + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, agora + p.dur);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(destino);
            osc.start(agora);
            osc.stop(agora + p.dur + 0.04);
        });
        tocarSubImpacto(ctx, destino, agora, 95, 25, 0.45, 0.45);
        return;
    }

    // TIER 4 (-31+): Dano catastrófico / golpe crítico devastador
    const frequencias = [
        { f: 98.00,  ganho: 0.32, dur: 0.85 },
        { f: 138.59, ganho: 0.30, dur: 0.90 },
        { f: 196.00, ganho: 0.26, dur: 0.95 },
        { f: 207.65, ganho: 0.22, dur: 1.00 }
    ];
    frequencias.forEach(p => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(p.f, agora);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(700, agora);
        filter.frequency.exponentialRampToValueAtTime(80, agora + p.dur);
        filter.Q.setValueAtTime(4.0, agora);
        gain.gain.setValueAtTime(0.0001, agora);
        gain.gain.linearRampToValueAtTime(p.ganho, agora + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + p.dur);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destino);
        osc.start(agora);
        osc.stop(agora + p.dur + 0.05);
    });
    tocarSubImpacto(ctx, destino, agora, 120, 20, 0.60, 0.60);
    tocarBatimentoCardiaco(ctx, destino, agora + 0.15, 0.75, false);
}

// ------------------------------------------------------------
// 2. MENTAL (Clareza Psíquica / Dano Mental e Perturbação)
// ------------------------------------------------------------
function tocarSomReceberPontosMental(ctx, destino, agora, mag = 10) {
    // Timbre cristalino, lúcido e purificador (Taças Tibetanas / Crystal Resonance / Foco Puro)
    if (mag <= 5) {
        // TIER 1 (+1 a +5): Micro-ressonância cristalina de clareza
        const tons = [
            { f: 369.99, ganho: 0.16, dur: 0.38, atraso: 0.00 }, // F#4
            { f: 493.88, ganho: 0.14, dur: 0.42, atraso: 0.05 }  // B4
        ];
        tons.forEach(n => {
            const t = agora + n.atraso;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = "sine";
            osc.frequency.setValueAtTime(n.f, t);
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(n.f, t);
            filter.Q.setValueAtTime(5.0, t);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(n.ganho, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(destino);
            osc.start(t);
            osc.stop(t + n.dur + 0.04);
        });
        return;
    }

    if (mag <= 15) {
        // TIER 2 (+6 a +15): Tríade de Clareza Psíquica e Foco Lúcido
        const tons = [
            { f: 311.13, ganho: 0.20, dur: 0.60, atraso: 0.00 }, // D#4
            { f: 369.99, ganho: 0.18, dur: 0.65, atraso: 0.04 }, // F#4
            { f: 493.88, ganho: 0.16, dur: 0.70, atraso: 0.08 }, // B4
            { f: 622.25, ganho: 0.12, dur: 0.75, atraso: 0.12 }  // D#5
        ];
        tons.forEach(n => {
            const t = agora + n.atraso;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = "sine";
            osc.frequency.setValueAtTime(n.f, t);
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(n.f, t);
            filter.Q.setValueAtTime(6.0, t);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(n.ganho, t + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(destino);
            osc.start(t);
            osc.stop(t + n.dur + 0.05);
        });
        return;
    }

    if (mag <= 30) {
        // TIER 3 (+16 a +30): Cascata de Iluminação e Serenidade Psíquica com Sino de 528Hz
        const tons = [
            { f: 246.94, ganho: 0.22, dur: 0.90, atraso: 0.00 }, // B3
            { f: 369.99, ganho: 0.20, dur: 0.85, atraso: 0.04 }, // F#4
            { f: 493.88, ganho: 0.18, dur: 0.80, atraso: 0.08 }, // B4
            { f: 528.00, ganho: 0.17, dur: 0.95, atraso: 0.12 }, // 528 Hz (Harmonia de Cura)
            { f: 622.25, ganho: 0.14, dur: 0.75, atraso: 0.16 }, // D#5
            { f: 739.99, ganho: 0.10, dur: 0.70, atraso: 0.20 }  // F#5
        ];
        tons.forEach(n => {
            const t = agora + n.atraso;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = "sine";
            osc.frequency.setValueAtTime(n.f, t);
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(n.f, t);
            filter.Q.setValueAtTime(7.0, t);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(n.ganho, t + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(destino);
            osc.start(t);
            osc.stop(t + n.dur + 0.05);
        });
        return;
    }

    // TIER 4 (+31+): Mente Blindada / Serenidade Transcendental
    const tons = [
        { f: 164.81, ganho: 0.24, dur: 1.35, atraso: 0.00 }, // E3
        { f: 246.94, ganho: 0.22, dur: 1.30, atraso: 0.03 }, // B3
        { f: 369.99, ganho: 0.20, dur: 1.25, atraso: 0.06 }, // F#4
        { f: 493.88, ganho: 0.18, dur: 1.20, atraso: 0.09 }, // B4
        { f: 528.00, ganho: 0.20, dur: 1.40, atraso: 0.12 }, // 528 Hz
        { f: 622.25, ganho: 0.15, dur: 1.10, atraso: 0.15 }, // D#5
        { f: 987.77, ganho: 0.09, dur: 1.00, atraso: 0.20 }  // B5
    ];
    tons.forEach(n => {
        const t = agora + n.atraso;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = "sine";
        osc.frequency.setValueAtTime(n.f, t);
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(n.f, t);
        filter.Q.setValueAtTime(8.0, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(n.ganho, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destino);
        osc.start(t);
        osc.stop(t + n.dur + 0.06);
    });
}

function tocarSomPerderPontosMental(ctx, destino, agora, mag = 10) {
    // Desestabilização psíquica, chiado de estática cerebral e dissonância mental
    if (mag <= 5) {
        // TIER 1 (-1 a -5): Leve zumbido descendente de vertigem/estresse
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(480, agora);
        osc.frequency.exponentialRampToValueAtTime(260, agora + 0.24);
        gain.gain.setValueAtTime(0.0001, agora);
        gain.gain.linearRampToValueAtTime(0.15, agora + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.25);
        osc.connect(gain);
        gain.connect(destino);
        osc.start(agora);
        osc.stop(agora + 0.26);
        return;
    }

    if (mag <= 15) {
        // TIER 2 (-6 a -15): Desorientação psíquica (frequências em batimento de estresse)
        const f1 = 440, f2 = 466; // Batimento dissonante
        [f1, f2].forEach(f => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(f, agora);
            osc.frequency.exponentialRampToValueAtTime(f * 0.82, agora + 0.40);
            gain.gain.setValueAtTime(0.0001, agora);
            gain.gain.linearRampToValueAtTime(0.14, agora + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.42);
            osc.connect(gain);
            gain.connect(destino);
            osc.start(agora);
            osc.stop(agora + 0.44);
        });
        return;
    }

    if (mag <= 30) {
        // TIER 3 (-16 a -30): Golpe psíquico agudo / Quebra de foco modulada
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(580, agora);
        osc.frequency.exponentialRampToValueAtTime(210, agora + 0.65);

        lfo.type = "sine";
        lfo.frequency.setValueAtTime(24, agora); // Tremor mental rápido
        lfoGain.gain.setValueAtTime(45, agora);
        lfo.connect(osc.frequency);

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(520, agora);
        filter.Q.setValueAtTime(3.5, agora);

        gain.gain.setValueAtTime(0.0001, agora);
        gain.gain.linearRampToValueAtTime(0.22, agora + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.68);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destino);

        lfo.start(agora);
        osc.start(agora);
        lfo.stop(agora + 0.70);
        osc.stop(agora + 0.70);
        return;
    }

    // TIER 4 (-31+): Colapso psíquico devastador e ruído de estática cerebral
    const freqDissonantes = [660, 700, 930];
    freqDissonantes.forEach(f => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(f, agora);
        osc.frequency.exponentialRampToValueAtTime(140, agora + 0.95);
        gain.gain.setValueAtTime(0.0001, agora);
        gain.gain.linearRampToValueAtTime(0.18, agora + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.98);
        osc.connect(gain);
        gain.connect(destino);
        osc.start(agora);
        osc.stop(agora + 1.00);
    });
}

// ------------------------------------------------------------
// 3. ESTAMINA (Fôlego e Vigor Físico / Fadiga e Esgotamento)
// ------------------------------------------------------------
function tocarSomReceberPontosEstamina(ctx, destino, agora, mag = 10) {
    // Inalação profunda de ar revigorante, impulsão muscular elástica e agilidade física
    if (mag <= 5) {
        // TIER 1 (+1 a +5): Sopro rápido de fôlego leve
        try {
            const len = Math.floor(ctx.sampleRate * 0.26);
            const buf = ctx.createBuffer(1, len, ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let k = 0; k < len; k++) {
                d[k] = (Math.random() * 2 - 1) * Math.exp(-k / (ctx.sampleRate * 0.08));
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buf;
            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(400, agora);
            filter.frequency.exponentialRampToValueAtTime(950, agora + 0.20);
            filter.Q.setValueAtTime(2.2, agora);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.0001, agora);
            gain.gain.linearRampToValueAtTime(0.18, agora + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.25);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(destino);
            noise.start(agora);
            noise.stop(agora + 0.27);
        } catch(e) {}
        return;
    }

    if (mag <= 15) {
        // TIER 2 (+6 a +15): Inspiração revigorante de fôlego + impulsão elástica
        const notas = [
            { f: 164.81, dur: 0.45, atraso: 0.00 }, // E3
            { f: 220.00, dur: 0.48, atraso: 0.05 }, // A3
            { f: 293.66, dur: 0.52, atraso: 0.10 }  // D4
        ];
        notas.forEach(n => {
            const t = agora + n.atraso;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(n.f, t);
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(600, t);
            filter.frequency.exponentialRampToValueAtTime(220, t + n.dur);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(0.20, t + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(destino);
            osc.start(t);
            osc.stop(t + n.dur + 0.03);
        });
        // Sopro de ar
        try {
            const len = Math.floor(ctx.sampleRate * 0.38);
            const buf = ctx.createBuffer(1, len, ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let k = 0; k < len; k++) {
                d[k] = (Math.random() * 2 - 1) * Math.exp(-k / (ctx.sampleRate * 0.12));
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buf;
            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(350, agora);
            filter.frequency.exponentialRampToValueAtTime(1400, agora + 0.30);
            filter.Q.setValueAtTime(2.0, agora);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.0001, agora);
            gain.gain.linearRampToValueAtTime(0.16, agora + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.36);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(destino);
            noise.start(agora);
            noise.stop(agora + 0.38);
        } catch(e) {}
        return;
    }

    if (mag <= 30) {
        // TIER 3 (+16 a +30): Grande fôlego e aceleração de adrenalina
        const notas = [
            { f: 146.83, dur: 0.70, atraso: 0.00 }, // D3
            { f: 220.00, dur: 0.75, atraso: 0.04 }, // A3
            { f: 293.66, dur: 0.80, atraso: 0.08 }, // D4
            { f: 369.99, dur: 0.85, atraso: 0.12 }  // F#4
        ];
        notas.forEach(n => {
            const t = agora + n.atraso;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(n.f, t);
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(800, t);
            filter.frequency.exponentialRampToValueAtTime(250, t + n.dur);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(0.24, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(destino);
            osc.start(t);
            osc.stop(t + n.dur + 0.04);
        });
        return;
    }

    // TIER 4 (+31+): Segunda Respiração / Vigor Heroico Pleno
    const notas = [
        { f: 110.00, dur: 1.10, atraso: 0.00 }, // A2
        { f: 146.83, dur: 1.15, atraso: 0.03 }, // D3
        { f: 220.00, dur: 1.20, atraso: 0.06 }, // A3
        { f: 293.66, dur: 1.25, atraso: 0.09 }, // D4
        { f: 440.00, dur: 1.30, atraso: 0.14 }  // A4
    ];
    notas.forEach(n => {
        const t = agora + n.atraso;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(n.f, t);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1200, t);
        filter.frequency.exponentialRampToValueAtTime(300, t + n.dur);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.26, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destino);
        osc.start(t);
        osc.stop(t + n.dur + 0.05);
    });
}

function tocarSomPerderPontosEstamina(ctx, destino, agora, mag = 10) {
    // Exalação ofegante de fadiga, atrito muscular e queda de pressão física
    if (mag <= 5) {
        // TIER 1 (-1 a -5): Micro-exalação abafada de cansaço
        try {
            const len = Math.floor(ctx.sampleRate * 0.22);
            const buf = ctx.createBuffer(1, len, ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let k = 0; k < len; k++) {
                d[k] = (Math.random() * 2 - 1) * Math.exp(-k / (ctx.sampleRate * 0.07));
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buf;
            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(260, agora);
            filter.frequency.exponentialRampToValueAtTime(80, agora + 0.18);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.0001, agora);
            gain.gain.linearRampToValueAtTime(0.18, agora + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.20);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(destino);
            noise.start(agora);
            noise.stop(agora + 0.22);
        } catch(e) {}
        return;
    }

    if (mag <= 15) {
        // TIER 2 (-6 a -15): Desgaste e perda de fôlego com baque de esforço
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(130, agora);
        osc.frequency.exponentialRampToValueAtTime(45, agora + 0.36);
        gain.gain.setValueAtTime(0.0001, agora);
        gain.gain.linearRampToValueAtTime(0.20, agora + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.38);
        osc.connect(gain);
        gain.connect(destino);
        osc.start(agora);
        osc.stop(agora + 0.40);
        return;
    }

    if (mag <= 30) {
        // TIER 3 (-16 a -30): Esgotamento severo / Exalação pesada sufocada
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(110, agora);
        osc.frequency.exponentialRampToValueAtTime(35, agora + 0.62);
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(280, agora);
        filter.frequency.exponentialRampToValueAtTime(70, agora + 0.62);
        gain.gain.setValueAtTime(0.0001, agora);
        gain.gain.linearRampToValueAtTime(0.24, agora + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.65);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destino);
        osc.start(agora);
        osc.stop(agora + 0.68);
        return;
    }

    // TIER 4 (-31+): Exaustão extrema e colapso respiratório
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(95, agora);
    osc.frequency.exponentialRampToValueAtTime(25, agora + 0.90);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, agora);
    filter.frequency.exponentialRampToValueAtTime(50, agora + 0.90);
    filter.Q.setValueAtTime(3.0, agora);
    gain.gain.setValueAtTime(0.0001, agora);
    gain.gain.linearRampToValueAtTime(0.28, agora + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.95);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destino);
    osc.start(agora);
    osc.stop(agora + 0.98);
}

// ------------------------------------------------------------
// 4. AURA (Energia Mística e Mana / Dissipação e Quebra Arcana)
// ------------------------------------------------------------
function tocarSomReceberPontosAura(ctx, destino, agora, mag = 10) {
    // Infusão cósmica arcana, cintilação mística modulada e harmônicos espirituais
    if (mag <= 5) {
        // TIER 1 (+1 a +5): Centelha mística arcana sutil
        const notas = [
            { f: 329.63, dur: 0.35, atraso: 0.00 }, // E4
            { f: 493.88, dur: 0.40, atraso: 0.04 }  // B4
        ];
        notas.forEach(n => {
            const t = agora + n.atraso;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(n.f, t);
            osc.frequency.exponentialRampToValueAtTime(n.f * 1.08, t + n.dur);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
            osc.connect(gain);
            gain.connect(destino);
            osc.start(t);
            osc.stop(t + n.dur + 0.03);
        });
        return;
    }

    if (mag <= 15) {
        // TIER 2 (+6 a +15): Pulso arcano envolvente em Mi Maior
        const notas = [
            { f: 164.81, dur: 0.60, atraso: 0.00 }, // E3
            { f: 246.94, dur: 0.65, atraso: 0.03 }, // B3
            { f: 329.63, dur: 0.70, atraso: 0.06 }, // E4
            { f: 415.30, dur: 0.75, atraso: 0.09 }  // G#4
        ];
        notas.forEach(n => {
            const t = agora + n.atraso;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = "sine";
            osc.frequency.setValueAtTime(n.f, t);
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(n.f * 1.5, t);
            filter.Q.setValueAtTime(3.0, t);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(0.20, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(destino);
            osc.start(t);
            osc.stop(t + n.dur + 0.04);
        });
        return;
    }

    if (mag <= 30) {
        // TIER 3 (+16 a +30): Infusão espiritual radiante com cintilação arcana
        const notas = [
            { f: 164.81, dur: 0.85, atraso: 0.00 }, // E3
            { f: 246.94, dur: 0.90, atraso: 0.03 }, // B3
            { f: 329.63, dur: 0.95, atraso: 0.06 }, // E4
            { f: 415.30, dur: 1.00, atraso: 0.09 }, // G#4
            { f: 493.88, dur: 1.05, atraso: 0.12 }, // B4
            { f: 659.25, dur: 1.10, atraso: 0.16 }  // E5
        ];
        notas.forEach(n => {
            const t = agora + n.atraso;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(n.f, t);
            osc.detune.setValueAtTime((Math.random() * 6) - 3, t);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
            osc.connect(gain);
            gain.connect(destino);
            osc.start(t);
            osc.stop(t + n.dur + 0.05);
        });
        return;
    }

    // TIER 4 (+31+): Ascensão Mística Suprema / Ressonância Cósmica Dimensional
    const notas = [
        { f: 82.41,  dur: 1.30, atraso: 0.00 }, // E2
        { f: 164.81, dur: 1.35, atraso: 0.03 }, // E3
        { f: 246.94, dur: 1.40, atraso: 0.06 }, // B3
        { f: 329.63, dur: 1.45, atraso: 0.09 }, // E4
        { f: 415.30, dur: 1.50, atraso: 0.12 }, // G#4
        { f: 493.88, dur: 1.55, atraso: 0.15 }, // B4
        { f: 659.25, dur: 1.60, atraso: 0.18 }, // E5
        { f: 830.61, dur: 1.65, atraso: 0.22 }  // G#5
    ];
    notas.forEach(n => {
        const t = agora + n.atraso;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(n.f, t);
        osc.detune.setValueAtTime((Math.random() * 8) - 4, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.20, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);
        osc.connect(gain);
        gain.connect(destino);
        osc.start(t);
        osc.stop(t + n.dur + 0.06);
    });
}

function tocarSomPerderPontosAura(ctx, destino, agora, mag = 10) {
    // Dreno e quebra de energia arcana, chiado estático de mana e dissipação de essência
    if (mag <= 5) {
        // TIER 1 (-1 a -5): Dissipação sutil de faísca arcana
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(650, agora);
        osc.frequency.exponentialRampToValueAtTime(180, agora + 0.22);
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(450, agora);
        filter.Q.setValueAtTime(4.0, agora);
        gain.gain.setValueAtTime(0.0001, agora);
        gain.gain.linearRampToValueAtTime(0.18, agora + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.24);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destino);
        osc.start(agora);
        osc.stop(agora + 0.25);
        return;
    }

    if (mag <= 15) {
        // TIER 2 (-6 a -15): Dreno arcano modulado
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(520, agora);
        osc.frequency.exponentialRampToValueAtTime(110, agora + 0.42);
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(750, agora);
        filter.frequency.exponentialRampToValueAtTime(150, agora + 0.42);
        gain.gain.setValueAtTime(0.0001, agora);
        gain.gain.linearRampToValueAtTime(0.22, agora + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.45);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destino);
        osc.start(agora);
        osc.stop(agora + 0.46);
        return;
    }

    if (mag <= 30) {
        // TIER 3 (-16 a -30): Rompimento de barreira arcana / Estalo elétrico
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(740, agora);
        osc1.frequency.exponentialRampToValueAtTime(90, agora + 0.68);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(370, agora);
        osc2.frequency.exponentialRampToValueAtTime(45, agora + 0.68);
        gain.gain.setValueAtTime(0.0001, agora);
        gain.gain.linearRampToValueAtTime(0.25, agora + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.70);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(destino);
        osc1.start(agora);
        osc2.start(agora);
        osc1.stop(agora + 0.72);
        osc2.stop(agora + 0.72);
        return;
    }

    // TIER 4 (-31+): Colapso espiritual / Vácuo total de Mana
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(980, agora);
    osc1.frequency.exponentialRampToValueAtTime(60, agora + 1.05);
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(490, agora);
    osc2.frequency.exponentialRampToValueAtTime(30, agora + 1.05);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1100, agora);
    filter.frequency.exponentialRampToValueAtTime(70, agora + 1.05);
    gain.gain.setValueAtTime(0.0001, agora);
    gain.gain.linearRampToValueAtTime(0.30, agora + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, agora + 1.08);
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(destino);
    osc1.start(agora);
    osc2.start(agora);
    osc1.stop(agora + 1.10);
    osc2.stop(agora + 1.10);
}

// ------------------------------------------------------------
// DISPACHADORES PRINCIPAIS DE GANHO E PERDA
// ------------------------------------------------------------
function tocarSomReceberPontos(ctx, destino, agora, chave = "vida", valorDelta = 10) {
    const ch = String(chave || "").toLowerCase();
    const mag = Math.max(1, Math.abs(Number(valorDelta) || 10));

    if (ch.includes("mental")) {
        tocarSomReceberPontosMental(ctx, destino, agora, mag);
    } else if (ch.includes("estamina") || ch.includes("folego")) {
        tocarSomReceberPontosEstamina(ctx, destino, agora, mag);
    } else if (ch.includes("aura")) {
        tocarSomReceberPontosAura(ctx, destino, agora, mag);
    } else {
        // Vida e padrão
        tocarSomReceberPontosVida(ctx, destino, agora, mag);
    }
}

function tocarSomPerderPontos(ctx, destino, agora, chave = "vida", valorDelta = -10) {
    const ch = String(chave || "").toLowerCase();
    const mag = Math.max(1, Math.abs(Number(valorDelta) || 10));

    if (ch.includes("mental")) {
        tocarSomPerderPontosMental(ctx, destino, agora, mag);
    } else if (ch.includes("estamina") || ch.includes("folego")) {
        tocarSomPerderPontosEstamina(ctx, destino, agora, mag);
    } else if (ch.includes("aura")) {
        tocarSomPerderPontosAura(ctx, destino, agora, mag);
    } else {
        // Vida e padrão
        tocarSomPerderPontosVida(ctx, destino, agora, mag);
    }
}

function tocarSomStatusBuffAtivar(ctx, destino, agora) {
    // Harmônicos graves e médios encorpados e nobres de foco/postura
    const notas = [
        { f: 110.00, atraso: 0.00, dur: 0.70, vol: 0.30 },  // A2
        { f: 164.81, atraso: 0.06, dur: 0.75, vol: 0.28 },  // E3
        { f: 220.00, atraso: 0.12, dur: 0.85, vol: 0.26 },  // A3
        { f: 277.18, atraso: 0.18, dur: 0.95, vol: 0.22 }   // C#4
    ];

    notas.forEach(n => {
        const t = agora + n.atraso;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(n.f, t);
        osc.detune.setValueAtTime(Math.random() * 4 - 2, t);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(480, t);
        filter.frequency.exponentialRampToValueAtTime(180, t + n.dur);
        filter.Q.setValueAtTime(2.0, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(n.vol, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destino);

        osc.start(t);
        osc.stop(t + n.dur + 0.05);
    });
}

function tocarSomStatusBuffDesativar(ctx, destino, agora) {
    // Desvanecimento etéreo suave e sóbrio de postura desativada
    const notas = [
        { f: 220.00, atraso: 0.00, dur: 0.35, vol: 0.20 }, // A3
        { f: 164.81, atraso: 0.06, dur: 0.40, vol: 0.18 }, // E3
        { f: 110.00, atraso: 0.12, dur: 0.50, vol: 0.15 }  // A2
    ];

    notas.forEach(n => {
        const t = agora + n.atraso;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "sine";
        osc.frequency.setValueAtTime(n.f, t);
        osc.frequency.exponentialRampToValueAtTime(n.f * 0.92, t + n.dur);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.exponentialRampToValueAtTime(120, t + n.dur);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(n.vol, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n.dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destino);

        osc.start(t);
        osc.stop(t + n.dur + 0.03);
    });
}

function tocarSomStatusDebuffAtivar(ctx, destino, agora, subtipo = "padrao") {
    // 1. Acorde tenso dissonante / sombrio (trítono opressivo e segunda menor)
    const frequencias = [
        { f: 146.83, ganho: 0.35, dur: 0.65 }, // D3
        { f: 207.65, ganho: 0.32, dur: 0.75 }, // G#3 (trítono)
        { f: 293.66, ganho: 0.28, dur: 0.70 }, // D4
        { f: 311.13, ganho: 0.22, dur: 0.80 }  // D#4 (segunda menor dissonante)
    ];

    frequencias.forEach(p => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(p.f, agora);
        osc.detune.setValueAtTime(Math.random() * 8 - 4, agora);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(650, agora);
        filter.frequency.exponentialRampToValueAtTime(110, agora + p.dur);
        filter.Q.setValueAtTime(4.0, agora);

        gain.gain.setValueAtTime(0.001, agora);
        gain.gain.linearRampToValueAtTime(p.ganho, agora + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, agora + p.dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destino);

        osc.start(agora);
        osc.stop(agora + p.dur + 0.05);
    });

    // 2. Sub-impacto visceral sombrio
    tocarSubImpacto(ctx, destino, agora, 95, 25, 0.45, 0.55);

    // 3. Efeito específico por condição
    if (subtipo === "sangrando") {
        // Pulso fluido e batimento cardíaco sufocado
        tocarBatimentoCardiaco(ctx, destino, agora + 0.12, 0.7, false);
    } else if (subtipo === "caido") {
        // Baque seco no chão
        tocarDadosMadeira(ctx, destino, agora + 0.05, 2, 1.3);
    } else if (subtipo === "exausto") {
        // Drone sufocante
        tocarDroneTensao(ctx, destino, agora + 0.05, 0.9, 52);
    }
}

function tocarSomStatusDebuffCurar(ctx, destino, agora) {
    // Alívio maduro: sustentação harmônica profunda e acolhedora
    tocarSomReceberPontos(ctx, destino, agora, "cura", 10);
}

function tocarSomStatus(tipoStatus, acao, subtipo = "", valorDelta = 0) {
    if (typeof somAtivado !== "undefined" && !somAtivado) return;
    const ctx = obterAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const agora = ctx.currentTime;
    const destino = criarCadeiaSaida(ctx, 0.28);

    const normalizado = String(tipoStatus || "").toLowerCase();
    const acaoNorm = String(acao || "").toLowerCase();
    const subNorm = String(subtipo || "").toLowerCase();

    // 1. Ganho de pontos ou recuperação vital (+1 a +5, +6 a +15, +16 a +30, +31+)
    if (normalizado.includes("restaurar_tudo") || normalizado.includes("recuperacao") || normalizado.includes("cura") || subNorm === "operacional" || (acaoNorm === "ganhar" && ["vida", "mental", "estamina", "aura", "folego", "combate"].includes(subNorm))) {
        const deltaEfetivo = valorDelta || (normalizado.includes("restaurar_tudo") ? 50 : 10);
        tocarSomReceberPontos(ctx, destino, agora, subNorm, deltaEfetivo);
        return;
    }

    // 2. Perda de pontos ou dano vital (-1 a -5, -6 a -15, -16 a -30, -31+)
    if (normalizado.includes("dano_vital") || (acaoNorm === "perder" && ["vida", "mental", "estamina", "aura"].includes(subNorm))) {
        const deltaEfetivo = valorDelta || -10;
        tocarSomPerderPontos(ctx, destino, agora, subNorm, deltaEfetivo);
        return;
    }

    // 3. Debuffs e Condições táticas
    const ehDebuff = normalizado.includes("debuff") || normalizado.includes("alerta") ||
                     ["caido", "sangrando", "exausto", "sobrecarga", "pesado", "inconsciente", "critico"].includes(subNorm);

    if (ehDebuff) {
        if (acaoNorm === "ganhar" || acaoNorm === "ativar") {
            tocarSomStatusDebuffAtivar(ctx, destino, agora, subNorm);
        } else {
            tocarSomStatusDebuffCurar(ctx, destino, agora);
        }
        return;
    }

    // 4. Padrão: Buff / Postura
    if (acaoNorm === "ganhar" || acaoNorm === "ativar") {
        tocarSomStatusBuffAtivar(ctx, destino, agora);
    } else {
        tocarSomStatusBuffDesativar(ctx, destino, agora);
    }
}

// ============================================================
// CONTROLE DE ESTAMINA (MODERADA <= 50% E CRÍTICA < 10%)
// EFEITOS DE MÚSICA NO PLAYER (VOLUME REDUZIDO E FORTE REVERBERAÇÃO)
// ============================================================
let estaminaAudioInterval = null;
let estaminaEstadoAtual = "normal"; // "normal" | "moderada" | "critica"

let playerWebAudioConectado = false;
let playerSourceNode = null;
let playerMasterGain = null;
let playerDryGain = null;
let playerWetGain = null;
let playerConvolver = null;
let playerFilter = null;
let reverbBufferMusica = null;

function gerarReverbBufferMusica(ctx) {
    if (reverbBufferMusica || !ctx) return reverbBufferMusica;
    try {
        const rate = ctx.sampleRate;
        const dur = 3.2; // Reverberação ampla, profunda e etérea
        const length = Math.floor(rate * dur);
        const buffer = ctx.createBuffer(2, length, rate);
        for (let ch = 0; ch < 2; ch++) {
            const data = buffer.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                const decaimento = Math.exp(-i / (rate * 0.70));
                data[i] = (Math.random() * 2 - 1) * decaimento;
            }
        }
        reverbBufferMusica = buffer;
    } catch (e) {}
    return reverbBufferMusica;
}

function configurarEfeitosWebAudioPlayer() {
    if (playerWebAudioConectado) return;
    const ctx = obterAudioContext();
    if (!ctx) return;
    if (typeof obterAudioPlayer !== "function") return;
    const player = obterAudioPlayer();
    if (!player) return;

    try {
        playerSourceNode = ctx.createMediaElementSource(player);

        playerMasterGain = ctx.createGain();
        const estadoInicial = (typeof efeitosEstaminaHabilitados !== "undefined" && !efeitosEstaminaHabilitados)
            ? "normal"
            : (typeof estaminaEstadoAtual !== "undefined" ? estaminaEstadoAtual : "normal");

        let volInit = 1.0;
        let dryInit = 1.0;
        let wetInit = 0.0;
        let freqInit = 20000;
        if (estadoInicial === "critica") {
            volInit = 0.20;
            dryInit = 0.20;
            wetInit = 0.90;
            freqInit = 1600;
        } else if (estadoInicial === "moderada") {
            volInit = 0.60;
            dryInit = 0.60;
            wetInit = 0.50;
            freqInit = 4500;
        }

        playerMasterGain.gain.setValueAtTime(volInit, ctx.currentTime);

        playerDryGain = ctx.createGain();
        playerDryGain.gain.setValueAtTime(dryInit, ctx.currentTime);

        const revBuf = gerarReverbBufferMusica(ctx) || (typeof reverbBuffer !== "undefined" ? reverbBuffer : null);
        playerConvolver = ctx.createConvolver();
        if (revBuf) {
            playerConvolver.buffer = revBuf;
        }

        playerWetGain = ctx.createGain();
        playerWetGain.gain.setValueAtTime(wetInit, ctx.currentTime);

        playerFilter = ctx.createBiquadFilter();
        playerFilter.type = "lowpass";
        playerFilter.frequency.setValueAtTime(freqInit, ctx.currentTime);

        // Topologia de áudio:
        // player -> playerSourceNode -> playerFilter
        playerSourceNode.connect(playerFilter);

        // Caminho Direto (Dry)
        playerFilter.connect(playerDryGain);
        playerDryGain.connect(playerMasterGain);

        // Caminho Reverberante (Wet)
        playerFilter.connect(playerConvolver);
        playerConvolver.connect(playerWetGain);
        playerWetGain.connect(playerMasterGain);

        // Saída de áudio final
        playerMasterGain.connect(ctx.destination);

        playerWebAudioConectado = true;
    } catch (e) {
        console.warn("Aviso ao conectar Web Audio ao player de música:", e);
    }
}

let musicaFadeFallbackTimer = null;

function atualizarEfeitosMusicaEstamina(estadoParam, duracao = 1.35) {
    configurarEfeitosWebAudioPlayer();
    const ctx = obterAudioContext();

    // Normalizar parâmetro recebido
    let estado = "normal";
    if (typeof efeitosEstaminaHabilitados !== "undefined" && !efeitosEstaminaHabilitados) {
        estado = "normal";
    } else if (estadoParam === true || estadoParam === "critica") {
        estado = "critica";
    } else if (estadoParam === "moderada") {
        estado = "moderada";
    } else if (estadoParam === false || estadoParam === "normal") {
        estado = "normal";
    } else if (typeof estaminaEstadoAtual !== "undefined") {
        estado = estaminaEstadoAtual;
    }

    // Configurações de destino para cada estado:
    // Critica: Redução suave para ~20%, reverberação profunda e agudos atenuados (desmaio / vista turva)
    // Moderada: Redução suave para ~60%, reverberação intermediária envolvente e agudos levemente amortecidos
    // Normal: Retorno suave para 100% de volume, caminho limpo e agudos totalmente cristalinos
    let targetVol = 1.0;
    let targetDry = 1.0;
    let targetWet = 0.0;
    let targetFreq = 20000;

    if (estado === "critica") {
        targetVol = 0.20;
        targetDry = 0.20;
        targetWet = 0.90;
        targetFreq = 1600;
    } else if (estado === "moderada") {
        targetVol = 0.60;
        targetDry = 0.60;
        targetWet = 0.50;
        targetFreq = 4500;
    }

    if (playerWebAudioConectado && ctx && playerMasterGain && playerDryGain && playerWetGain && playerFilter) {
        try {
            const agora = ctx.currentTime;
            const tempoFim = agora + duracao;

            // Garantir que o convolver tem o buffer de reverberação carregado
            if (playerConvolver && !playerConvolver.buffer) {
                const revBuf = gerarReverbBufferMusica(ctx) || (typeof reverbBuffer !== "undefined" ? reverbBuffer : null);
                if (revBuf) playerConvolver.buffer = revBuf;
            }

            // Transição suave de Volume Master
            playerMasterGain.gain.cancelScheduledValues(agora);
            playerMasterGain.gain.setValueAtTime(playerMasterGain.gain.value, agora);
            playerMasterGain.gain.linearRampToValueAtTime(targetVol, tempoFim);

            // Transição suave de Dry (sinal direto)
            playerDryGain.gain.cancelScheduledValues(agora);
            playerDryGain.gain.setValueAtTime(playerDryGain.gain.value, agora);
            playerDryGain.gain.linearRampToValueAtTime(targetDry, tempoFim);

            // Transição suave de Reverb Wet (efeito reverberante de ambiência)
            playerWetGain.gain.cancelScheduledValues(agora);
            playerWetGain.gain.setValueAtTime(playerWetGain.gain.value, agora);
            playerWetGain.gain.linearRampToValueAtTime(targetWet, tempoFim);

            // Transição suave de Filtro Lowpass (sensação de distanciamento e abafamento dos sentidos)
            playerFilter.frequency.cancelScheduledValues(agora);
            playerFilter.frequency.setValueAtTime(Math.max(20, playerFilter.frequency.value), agora);
            playerFilter.frequency.exponentialRampToValueAtTime(targetFreq, tempoFim);
        } catch (err) {
            console.warn("Erro ao modular efeitos de áudio na estamina:", err);
        }
    }

    // Fallback de volume suave no elemento <audio> caso Web Audio não esteja acoplado
    if (typeof elementoAudioPlayer !== "undefined" && elementoAudioPlayer && !playerWebAudioConectado) {
        if (musicaFadeFallbackTimer) {
            cancelAnimationFrame(musicaFadeFallbackTimer);
            musicaFadeFallbackTimer = null;
        }
        const baseVol = (typeof musicaVolumeAtual === "number") ? musicaVolumeAtual : 0.7;
        const volumeFinal = baseVol * targetVol;
        const volumeInicial = elementoAudioPlayer.volume;
        const inicioAnim = performance.now();
        const duracaoMs = duracao * 1000;

        function animarVolumeFallback(momento) {
            const decorrido = momento - inicioAnim;
            const progresso = Math.min(1, Math.max(0, decorrido / duracaoMs));
            elementoAudioPlayer.volume = Math.max(0, Math.min(1, volumeInicial + (volumeFinal - volumeInicial) * progresso));
            if (progresso < 1) {
                musicaFadeFallbackTimer = requestAnimationFrame(animarVolumeFallback);
            } else {
                musicaFadeFallbackTimer = null;
            }
        }
        musicaFadeFallbackTimer = requestAnimationFrame(animarVolumeFallback);
    }
}

// ============================================================
// CONTROLE DE ATIVAÇÃO/DESATIVAÇÃO DOS EFEITOS DE ESTAMINA BAIXA
// ============================================================
let efeitosEstaminaHabilitados = true;
let primeiraAvaliacaoEstaminaConcluida = false;
try {
    const salvoEfeitos = localStorage.getItem("we_are_strangers_efeitos_estamina_ativos");
    if (salvoEfeitos !== null) {
        efeitosEstaminaHabilitados = (salvoEfeitos === "true");
    }
} catch (e) {}

let taquicardiaBusNode = null;

function obterTaquicardiaBus(ctx) {
    if (taquicardiaBusNode && taquicardiaBusNode.context === ctx) {
        return taquicardiaBusNode;
    }
    try {
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-14, ctx.currentTime);
        compressor.knee.setValueAtTime(6, ctx.currentTime);
        compressor.ratio.setValueAtTime(4.5, ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, ctx.currentTime);
        compressor.release.setValueAtTime(0.12, ctx.currentTime);
        compressor.connect(ctx.destination);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(260, ctx.currentTime);
        filter.connect(compressor);

        const busGain = ctx.createGain();
        busGain.gain.setValueAtTime(1.0, ctx.currentTime);
        busGain.connect(filter);

        taquicardiaBusNode = busGain;
        return taquicardiaBusNode;
    } catch (e) {
        return ctx.destination;
    }
}

function tocarTransicaoSonoraEstamina(tipo, nivel = "moderada") {
    if (!somAtivado) return;
    const ctx = obterAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
    }

    const agora = ctx.currentTime;
    const destino = obterTaquicardiaBus(ctx);

    if (tipo === "aparecer") {
        // Transição sutil sombria: queda de ar expirado e sub-grave de esgotamento
        // 1. Sopro/ar abafado que envolve os sentidos (névoa sonora)
        try {
            const len = Math.floor(ctx.sampleRate * 0.60);
            const buf = ctx.createBuffer(1, len, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < len; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.28));
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buf;
            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(340, agora);
            filter.frequency.exponentialRampToValueAtTime(105, agora + 0.55);
            filter.Q.setValueAtTime(2.4, agora);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.0001, agora);
            gain.gain.linearRampToValueAtTime(nivel === "critica" ? 0.22 : 0.14, agora + 0.10);
            gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.58);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(destino);
            noise.start(agora);
            noise.stop(agora + 0.60);
        } catch (e) {}

        // 2. Sub-drop suave descendente (peso corporal cedendo à fadiga)
        try {
            const osc = ctx.createOscillator();
            const gainOsc = ctx.createGain();
            const fIni = (nivel === "critica") ? 88 : 72;
            const fFim = (nivel === "critica") ? 30 : 36;

            osc.type = "sine";
            osc.frequency.setValueAtTime(fIni, agora);
            osc.frequency.exponentialRampToValueAtTime(fFim, agora + 0.65);

            gainOsc.gain.setValueAtTime(0.0001, agora);
            gainOsc.gain.linearRampToValueAtTime(nivel === "critica" ? 0.24 : 0.15, agora + 0.08);
            gainOsc.gain.exponentialRampToValueAtTime(0.0001, agora + 0.65);

            osc.connect(gainOsc);
            gainOsc.connect(destino);
            osc.start(agora);
            osc.stop(agora + 0.66);
        } catch (e) {}
    } else if (tipo === "sumir") {
        // Transição sutil de alívio e clareza: fôlego recuperado e harmônico de lucidez
        // 1. Sopro suave de alívio dissipando a opressão
        try {
            const len = Math.floor(ctx.sampleRate * 0.50);
            const buf = ctx.createBuffer(1, len, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < len; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.25));
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buf;
            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(170, agora);
            filter.frequency.exponentialRampToValueAtTime(520, agora + 0.45);
            filter.Q.setValueAtTime(1.8, agora);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.0001, agora);
            gain.gain.linearRampToValueAtTime(0.12, agora + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, agora + 0.48);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(destino);
            noise.start(agora);
            noise.stop(agora + 0.50);
        } catch (e) {}

        // 2. Acorde suave de restauração e equilíbrio (tons puros e calorosos)
        try {
            [261.63, 392.00].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gainChord = ctx.createGain();

                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, agora + 0.03);

                const vol = (idx === 0) ? 0.08 : 0.05;
                gainChord.gain.setValueAtTime(0.0001, agora + 0.03);
                gainChord.gain.linearRampToValueAtTime(vol, agora + 0.10);
                gainChord.gain.exponentialRampToValueAtTime(0.0001, agora + 0.55);

                osc.connect(gainChord);
                gainChord.connect(destino);
                osc.start(agora + 0.03);
                osc.stop(agora + 0.58);
            });
        } catch (e) {}
    }
}

function alternarEfeitosEstamina() {
    const estadoAntes = estaminaEstadoAtual;
    efeitosEstaminaHabilitados = !efeitosEstaminaHabilitados;
    try {
        localStorage.setItem("we_are_strangers_efeitos_estamina_ativos", String(efeitosEstaminaHabilitados));
    } catch (e) {}

    if (!efeitosEstaminaHabilitados) {
        if (estadoAntes === "critica" || estadoAntes === "moderada") {
            tocarTransicaoSonoraEstamina("sumir");
        }
        document.body.classList.remove("estamina-critica", "estamina-moderada");
        estaminaEstadoAtual = "normal";
        pararSomTaquicardia();
        atualizarEfeitosMusicaEstamina("normal");
        if (typeof mostrarStatus === "function") {
            mostrarStatus("🫀 Efeitos visuais e sonoros de estamina baixa DESATIVADOS.", "");
        }
    } else {
        if (typeof mostrarStatus === "function") {
            mostrarStatus("🫀 Efeitos visuais e sonoros de estamina baixa ATIVADOS.", "");
        }
        avaliarEstaminaCritica();
    }
    atualizarBotaoEfeitosEstaminaUI();
}

function atualizarBotaoEfeitosEstaminaUI() {
    const btn = document.getElementById("btn-toggle-efeitos-estamina");
    const icone = document.getElementById("icone_efeitos_estamina_btn");
    const legenda = document.getElementById("legenda_efeitos_estamina_btn");
    if (!btn) return;

    let estaCritica = (estaminaEstadoAtual === "critica");
    if (!estaCritica) {
        const atualEl = document.getElementById("recurso_estamina_atual");
        const maxEl = document.getElementById("recurso_estamina_max");
        const tempEl = document.getElementById("recurso_estamina_temp");
        if (atualEl && maxEl) {
            let max = parseInt(maxEl.value, 10) || 1;
            let atual = parseInt(atualEl.value, 10) || 0;
            let temp = tempEl ? (parseInt(tempEl.value, 10) || 0) : 0;
            if (max > 0 && ((atual + temp) / max) < 0.10) {
                estaCritica = true;
            }
        }
    }

    const estaEmAlerta = (estaCritica || estaminaEstadoAtual === "moderada");

    if (efeitosEstaminaHabilitados) {
        btn.classList.remove("desativado");
        btn.classList.add("ativo");
        if (icone) icone.textContent = estaEmAlerta ? "💓" : "🫀";
        if (legenda) legenda.textContent = "Efeitos ON";
        btn.setAttribute("title", estaCritica
            ? "⚠️ ESTAMINA CRÍTICA! Efeitos ativados (Clique para desativar)."
            : `Efeitos de estamina baixa: ATIVADOS ${estaEmAlerta ? "(em execução no momento)" : ""}. Clique para desativar.`);
        btn.setAttribute("aria-label", "Desativar efeitos visuais e sonoros de estamina baixa");
        if (estaEmAlerta) {
            btn.classList.add("em-alerta");
        } else {
            btn.classList.remove("em-alerta");
        }
    } else {
        btn.classList.remove("ativo", "em-alerta");
        btn.classList.add("desativado");
        if (icone) icone.textContent = "🩶";
        if (legenda) legenda.textContent = "Efeitos OFF";
        btn.setAttribute("title", estaCritica
            ? "⚠️ ESTAMINA CRÍTICA! Efeitos desativados no momento (Clique para ativar)."
            : "Efeitos de estamina baixa: DESATIVADOS. Clique para ativar.");
        btn.setAttribute("aria-label", "Ativar efeitos visuais e sonoros de estamina baixa");
    }

    if (estaCritica) {
        btn.classList.add("estamina-critica-ativa");
    } else {
        btn.classList.remove("estamina-critica-ativa");
    }
}

function avaliarEstaminaCritica() {
    if (!efeitosEstaminaHabilitados) {
        if (estaminaEstadoAtual !== "normal") {
            if (primeiraAvaliacaoEstaminaConcluida) {
                tocarTransicaoSonoraEstamina("sumir");
            }
            estaminaEstadoAtual = "normal";
            document.body.classList.remove("estamina-critica", "estamina-moderada");
            pararSomTaquicardia();
            atualizarEfeitosMusicaEstamina("normal");
        }
        atualizarBotaoEfeitosEstaminaUI();
        primeiraAvaliacaoEstaminaConcluida = true;
        return;
    }

    const atualEl = document.getElementById("recurso_estamina_atual");
    const maxEl = document.getElementById("recurso_estamina_max");
    const tempEl = document.getElementById("recurso_estamina_temp");

    if (!atualEl || !maxEl) {
        atualizarBotaoEfeitosEstaminaUI();
        primeiraAvaliacaoEstaminaConcluida = true;
        return;
    }

    let max = parseInt(maxEl.value, 10);
    if (isNaN(max) || max < 1) max = 1;

    let atual = parseInt(atualEl.value, 10);
    if (isNaN(atual) || atual < 0) atual = 0;

    let temp = tempEl ? parseInt(tempEl.value, 10) : 0;
    if (isNaN(temp) || temp < 0) temp = 0;

    const proporcao = (atual + temp) / max;
    let novoEstado = "normal";

    if (proporcao < 0.10) {
        novoEstado = "critica";
    } else if (proporcao <= 0.50) {
        novoEstado = "moderada";
    }

    if (novoEstado !== estaminaEstadoAtual) {
        const estadoAnterior = estaminaEstadoAtual;
        estaminaEstadoAtual = novoEstado;

        document.body.classList.remove("estamina-critica", "estamina-moderada");

        if (novoEstado === "critica") {
            document.body.classList.add("estamina-critica");
            iniciarSomTaquicardia("critica");
            atualizarEfeitosMusicaEstamina("critica");
            if (primeiraAvaliacaoEstaminaConcluida) {
                tocarTransicaoSonoraEstamina("aparecer", "critica");
            }
        } else if (novoEstado === "moderada") {
            document.body.classList.add("estamina-moderada");
            iniciarSomTaquicardia("moderada");
            atualizarEfeitosMusicaEstamina("moderada");
            if (primeiraAvaliacaoEstaminaConcluida) {
                if (estadoAnterior === "normal") {
                    tocarTransicaoSonoraEstamina("aparecer", "moderada");
                }
            }
        } else {
            pararSomTaquicardia();
            atualizarEfeitosMusicaEstamina("normal");
            if (primeiraAvaliacaoEstaminaConcluida && (estadoAnterior === "critica" || estadoAnterior === "moderada")) {
                tocarTransicaoSonoraEstamina("sumir");
            }
        }
    }
    primeiraAvaliacaoEstaminaConcluida = true;
    atualizarBotaoEfeitosEstaminaUI();
}

let taquicardiaProximaBatida = 0;

function tocarBatidaEstaminaSintetizada(ctx, destino, t, ehCritica) {
    const intensidade = ehCritica ? 0.90 : 0.65;

    // 1. Pulso S1 (Sístole - fechamento das valvas mitral e tricúspide)
    try {
        const oscS1 = ctx.createOscillator();
        const oscS1Tri = ctx.createOscillator();
        const gS1 = ctx.createGain();
        const fS1 = ctx.createBiquadFilter();
        const durS1 = 0.082;

        oscS1.type = "sine";
        oscS1.frequency.setValueAtTime(ehCritica ? 58 : 52, t);
        oscS1.frequency.exponentialRampToValueAtTime(32, t + durS1);

        oscS1Tri.type = "triangle";
        oscS1Tri.frequency.setValueAtTime(ehCritica ? 86 : 76, t);
        oscS1Tri.frequency.exponentialRampToValueAtTime(38, t + durS1);

        fS1.type = "lowpass";
        fS1.frequency.setValueAtTime(115, t);
        fS1.frequency.exponentialRampToValueAtTime(42, t + durS1);

        gS1.gain.setValueAtTime(0.0001, t);
        gS1.gain.linearRampToValueAtTime(intensidade, t + 0.011);
        gS1.gain.exponentialRampToValueAtTime(0.0001, t + durS1 + 0.015);

        oscS1.connect(fS1);
        oscS1Tri.connect(fS1);
        fS1.connect(gS1);
        gS1.connect(destino);

        oscS1.start(t);
        oscS1Tri.start(t);
        oscS1.stop(t + durS1 + 0.025);
        oscS1Tri.stop(t + durS1 + 0.025);
    } catch (e) {}

    // 2. Pulso S2 (Diástole - fechamento das valvas aórtica e pulmonar)
    try {
        const atrasoS2 = ehCritica ? 0.11 : 0.13;
        const t2 = t + atrasoS2;
        const durS2 = 0.072;

        const oscS2 = ctx.createOscillator();
        const oscS2Tri = ctx.createOscillator();
        const gS2 = ctx.createGain();
        const fS2 = ctx.createBiquadFilter();

        oscS2.type = "sine";
        oscS2.frequency.setValueAtTime(ehCritica ? 70 : 62, t2);
        oscS2.frequency.exponentialRampToValueAtTime(36, t2 + durS2);

        oscS2Tri.type = "triangle";
        oscS2Tri.frequency.setValueAtTime(ehCritica ? 104 : 92, t2);
        oscS2Tri.frequency.exponentialRampToValueAtTime(42, t2 + durS2);

        fS2.type = "lowpass";
        fS2.frequency.setValueAtTime(130, t2);
        fS2.frequency.exponentialRampToValueAtTime(48, t2 + durS2);

        gS2.gain.setValueAtTime(0.0001, t2);
        gS2.gain.linearRampToValueAtTime(intensidade * 0.72, t2 + 0.009);
        gS2.gain.exponentialRampToValueAtTime(0.0001, t2 + durS2 + 0.015);

        oscS2.connect(fS2);
        oscS2Tri.connect(fS2);
        fS2.connect(gS2);
        gS2.connect(destino);

        oscS2.start(t2);
        oscS2Tri.start(t2);
        oscS2.stop(t2 + durS2 + 0.02);
        oscS2Tri.stop(t2 + durS2 + 0.02);
    } catch (e) {}

    // 3. Sub-Impacto de Pressão no Peito (curto para não encavalar com o próximo batimento)
    try {
        const oscSub = ctx.createOscillator();
        const gSub = ctx.createGain();
        const durSub = ehCritica ? 0.20 : 0.16;

        oscSub.type = "sine";
        oscSub.frequency.setValueAtTime(ehCritica ? 74 : 60, t);
        oscSub.frequency.exponentialRampToValueAtTime(26, t + durSub);

        gSub.gain.setValueAtTime(0.0001, t);
        gSub.gain.linearRampToValueAtTime(intensidade * (ehCritica ? 0.38 : 0.22), t + 0.014);
        gSub.gain.exponentialRampToValueAtTime(0.0001, t + durSub);

        oscSub.connect(gSub);
        gSub.connect(destino);

        oscSub.start(t);
        oscSub.stop(t + durSub + 0.01);
    } catch (e) {}
}

function iniciarSomTaquicardia(nivel) {
    pararSomTaquicardia();
    if (!somAtivado) return;
    const ctx = obterAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
    }

    const destino = obterTaquicardiaBus(ctx);
    const ehCritica = (nivel === "critica");
    const intervalo = ehCritica ? 0.44 : 0.66; // ~136 BPM em crítica, ~90 BPM em moderada

    taquicardiaProximaBatida = ctx.currentTime + 0.02;

    function agendarProximasBatidas() {
        if (!somAtivado || (estaminaEstadoAtual !== "critica" && estaminaEstadoAtual !== "moderada")) {
            pararSomTaquicardia();
            return;
        }
        const agora = ctx.currentTime;
        const nivelAtual = estaminaEstadoAtual;
        const criticaAtual = (nivelAtual === "critica");
        const intervAtual = criticaAtual ? 0.44 : 0.66;

        if (taquicardiaProximaBatida < agora) {
            taquicardiaProximaBatida = agora + 0.01;
        }

        // Lookahead scheduler de 220ms para garantia de reprodução perfeita no relógio de áudio
        const janela = 0.22;
        while (taquicardiaProximaBatida < agora + janela) {
            tocarBatidaEstaminaSintetizada(ctx, destino, taquicardiaProximaBatida, criticaAtual);
            taquicardiaProximaBatida += intervAtual;
        }
    }

    agendarProximasBatidas();
    estaminaAudioInterval = setInterval(agendarProximasBatidas, 75);
}

function pararSomTaquicardia() {
    if (estaminaAudioInterval) {
        clearInterval(estaminaAudioInterval);
        estaminaAudioInterval = null;
    }
    taquicardiaProximaBatida = 0;
}

function executarBatidaTaquicardia(nivel = estaminaEstadoAtual) {
    if (!somAtivado) return;
    const ctx = obterAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
    }
    const destino = obterTaquicardiaBus(ctx);
    tocarBatidaEstaminaSintetizada(ctx, destino, ctx.currentTime + 0.01, nivel === "critica");
}

// Tabela de Dificuldades. Qualquer resultado abaixo de 2 conta como DESASTRE!
// (a gravidade fica a critério da interpretação dos jogadores à mesa).
const FAIXAS_DIFICULDADE=[
{max:1,nome:"DESASTRE!",tipo:"desastre"},
{max:3,nome:"FÁCIL",tipo:"normal"},
{max:6,nome:"NORMAL",tipo:"normal"},
{max:9,nome:"DIFÍCIL",tipo:"normal"},
{max:12,nome:"DESAFIADOR",tipo:"normal"},
{max:15,nome:"ABSURDO",tipo:"normal"},
{max:18,nome:"POSSÍVEL?",tipo:"normal"},
{max:34,nome:"SOBREHUMANO",tipo:"normal"},
{max:Infinity,nome:"AMALDIÇOADO",tipo:"amaldicoado"}
];

function obterDificuldade(resultado){
for(const faixa of FAIXAS_DIFICULDADE){
if(resultado<=faixa.max)return faixa;
}
return FAIXAS_DIFICULDADE[FAIXAS_DIFICULDADE.length-1];
}

function montarSeloDificuldade(resultado){
const faixa=obterDificuldade(resultado);
if(faixa.tipo==="normal"){
return `<span class="dificuldade-selo dificuldade-normal" title="${faixa.nome}">${faixa.nome}</span>`;
}
const classeEvento=faixa.tipo==="desastre"?"dificuldade-desastre":"dificuldade-amaldicoado";
return `<div class="dificuldade-evento ${classeEvento}" title="${faixa.nome}">${faixa.nome}</div>`;
}

function montarGalhosInvasores(tipo){
if(tipo!=="desastre"&&tipo!=="amaldicoado")return "";

const elementoDireito = tipo==="desastre" ? `
      <!-- A FORCA (Nó e Laço de Xilogravura em Alto Contraste para DESASTRE) -->
      <g class="forca-grupo">
        <!-- Corda principal descendo do galho -->
        <path class="corda-trilha" d="M344,14 L344,80" />
        <!-- Entalhes de textura da corda retorcida -->
        <line class="corda-hatch" x1="341" y1="24" x2="347" y2="28" />
        <line class="corda-hatch" x1="341" y1="36" x2="347" y2="40" />
        <line class="corda-hatch" x1="341" y1="48" x2="347" y2="52" />
        <line class="corda-hatch" x1="341" y1="60" x2="347" y2="64" />
        <line class="corda-hatch" x1="341" y1="72" x2="347" y2="76" />

        <!-- Barril do nó de forca (espirais características) -->
        <rect class="no-corpo" x="338" y="80" width="12" height="26" rx="2" />
        <line class="no-espiral" x1="338" y1="85" x2="350" y2="85" />
        <line class="no-espiral" x1="338" y1="90" x2="350" y2="90" />
        <line class="no-espiral" x1="338" y1="95" x2="350" y2="95" />
        <line class="no-espiral" x1="338" y1="100" x2="350" y2="100" />

        <!-- Ponta solta cortada da corda -->
        <path class="corda-ponta" d="M350,83 C357,80 361,86 359,92" />

        <!-- Laço aberto da forca em alto contraste sobrepondo a mensagem de DESASTRE -->
        <path class="laco-forca" d="M344,106 C322,126 318,168 344,188 C370,168 366,126 344,106 Z" />
        <circle class="no-anel" cx="344" cy="106" r="3" />
      </g>` : `
      <!-- A CRUZ GÓTICA EM ALTO CONTRASTE (Para AMALDIÇOADO) -->
      <g class="cruz-grupo">
        <!-- Halo ou aura de espinhos radiantes no centro da cruz -->
        <circle class="cruz-halo" cx="364" cy="85" r="22" fill="none" stroke-dasharray="2,3" />
        
        <!-- Corpo principal da Cruz Gótica chanfrada/talhada -->
        <path class="cruz-corpo" d="M 358,35 L 364,28 L 370,35 L 370,74 L 396,74 L 403,80 L 396,86 L 370,86 L 370,158 L 364,166 L 358,158 L 358,86 L 332,86 L 325,80 L 332,74 L 358,74 Z" />
        
        <!-- Entalhes de bisel central em relevo de xilogravura -->
        <line class="cruz-bisel" x1="364" y1="32" x2="364" y2="162" />
        <line class="cruz-bisel" x1="328" y1="80" x2="400" y2="80" />

        <!-- Raízes espinhosas retorcidas enroscando na cruz -->
        <path class="cruz-videira" d="M 350,165 C 356,150 372,145 372,130 C 372,118 358,112 358,98 C 358,88 374,82 374,68 C 374,55 362,50 364,36" fill="none" />
        <path class="raiz-espinho" d="M 372,130 C 382,126 388,132 386,138" fill="none" />
        <path class="raiz-espinho" d="M 358,98 C 348,94 344,102 346,108" fill="none" />
        <path class="raiz-espinho" d="M 374,68 C 384,65 388,72 385,78" fill="none" />
        <path class="cruz-videira" d="M 330,86 C 344,82 352,78 364,80 C 376,82 386,76 398,84" fill="none" />
        <path class="raiz-espinho" d="M 348,80 C 350,72 344,66 340,68" fill="none" />
        <path class="raiz-espinho" d="M 382,78 C 386,70 392,72 394,68" fill="none" />
      </g>`;

return `<div class="resultado-galhos-container" aria-hidden="true">
  <svg class="resultado-galhos-svg" viewBox="0 0 420 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <g class="raizes-woodcut-grupo">
      <!-- Galho retorcido superior esquerdo (estilo xilogravura orgânica) -->
      <path class="raiz-corpo" d="M-10,-10 L95,-10 C82,14 66,22 45,30 C60,38 75,42 92,38 C78,48 55,50 35,42 C22,55 8,72 -10,85 Z" />
      <path class="raiz-tendril" d="M45,30 C35,48 20,68 0,80" />
      <path class="raiz-espinho" d="M32,45 C38,48 44,48 50,46" />
      <path class="raiz-tendril" d="M92,38 C115,36 138,44 155,58 C145,55 130,52 118,54" />
      <path class="raiz-espinho" d="M125,45 C132,40 136,32 135,25" />

      <!-- Raízes retorcidas inferiores esquerdas subindo pelo canto -->
      <path class="raiz-corpo" d="M-10,210 L-10,130 C15,138 28,152 38,168 C55,152 75,142 98,138 C82,150 68,166 58,182 C72,185 88,184 105,178 C90,190 70,198 50,198 C35,208 15,212 -10,210 Z" />
      <path class="raiz-tendril" d="M38,168 C50,135 72,110 102,95" />
      <path class="raiz-espinho" d="M65,130 C75,124 82,115 85,105" />
      <path class="raiz-espinho" d="M82,112 C86,118 92,122 100,124" />
      <path class="raiz-tendril" d="M98,138 C120,136 142,144 158,156" />

      <!-- Raízes retorcidas inferiores direitas sob o elemento focal -->
      <path class="raiz-corpo" d="M430,210 L430,145 C405,152 390,165 378,180 C362,168 345,162 320,160 C338,172 350,186 358,202 L430,210 Z" />
      <path class="raiz-tendril" d="M378,180 C355,155 330,138 298,130" />
      <path class="raiz-espinho" d="M345,150 C340,142 334,136 325,134" />
      <path class="raiz-espinho" d="M320,140 C318,148 314,154 306,158" />

      <!-- Galho retorcido superior direito que emoldura o canto -->
      <path class="raiz-corpo" d="M430,-10 L330,-10 C342,12 356,24 372,32 C350,28 332,32 315,42 C330,44 345,42 360,38 C380,48 405,55 430,58 Z" />
      <path class="raiz-tendril" d="M315,42 C285,55 255,60 225,58" />
      <path class="raiz-espinho" d="M280,53 C274,45 272,36 274,28" />

      ${elementoDireito}
    </g>
  </svg>
</div>`;
}

function encontrarPericia(nome){
return pericias.find(p=>p.nome===nome)||personalizadas.find(p=>p.nome===nome)||null;
}

function rolar(nome){
const pericia=encontrarPericia(nome);
if(!pericia)return null;

const id=idSeguro(nome);
const principal=obterAtributoPrincipal(pericia);
const dadosBase=valorAtributo(principal);
const modDados=dadosBonusDe(pericia.nome);
const quantidadeDados=Math.max(0,dadosBase+modDados);
const atributosAux=obterAtributosAuxiliares(pericia);
const somaAtributos=atributosAux.reduce((total,attr)=>total+valorAtributo(attr),0);

const puros=pontosPurosDe(pericia.nome);
const bonusPts=pontosBonusDe(pericia.nome);
const relacionados=calcularRelacionados(pericia);
const totalPontos=puros+bonusPts+relacionados;

const dados=[];
let somaDados=0;
// Regra especial: quando a quantidade final de dados chega a 0 (seja porque o
// Atributo Principal é 0, seja porque o ajuste de Pontos Bônus zerou os dados),
// rola-se 2D6 e usa-se o MENOR valor entre os dois.
const atributoZerado=quantidadeDados===0;

if(atributoZerado){
for(let i=0;i<2;i++){
dados.push(Math.floor(Math.random()*6)+1);
}
somaDados=Math.min(...dados);
}else{
for(let i=0;i<quantidadeDados;i++){
const dado=Math.floor(Math.random()*6)+1;
dados.push(dado);
somaDados+=dado;
}
}

const resultadoFinal=somaDados+somaAtributos+totalPontos;

let linhaQtd=`${principal} (${dadosBase}D6)`;
if(modDados!==0){
linhaQtd+=` ${modDados>0?"+":"−"} ${Math.abs(modDados)}D6 (Bônus)`;
}
linhaQtd+=` = <strong class="dados-destaque">${quantidadeDados}D6</strong>`;
if(atributoZerado){
linhaQtd+=` <span class="dado-aviso-zerado">(0 dados: rola 2D6 e usa o menor)</span>`;
}

const linhaDados=atributoZerado
?`${dados.map(d=>`<span class="dado-chip">${d}</span>`).join(" e ")} → menor valor = <strong class="dados-destaque">${somaDados}</strong>`
:(dados.length?`${dados.map(d=>`<span class="dado-chip">${d}</span>`).join(" + ")} = <strong class="dados-destaque">${somaDados}</strong>`:"Nenhum dado");

const temAux=atributosAux.length>0;
const linhaAux=temAux
?`${atributosAux.map(a=>`${a} (${valorAtributo(a)})`).join(" + ")} = <strong class="dados-destaque">+${somaAtributos}</strong>`
:"";

const passoAux=3;
const passoPontos=temAux?4:3;
const passoFinal=temAux?5:4;

const bonusFormatado=(bonusPts>=0?"+":"")+bonusPts;
const totalPontosFormatado=(totalPontos>=0?"+":"")+totalPontos;
const faixa=obterDificuldade(resultadoFinal);
const seloDificuldade=montarSeloDificuldade(resultadoFinal);

// Dispara efeito sonoro visceral adaptado à faixa de teste, valor e quantidade de dados
tocarEfeitoSonoro(faixa, resultadoFinal, dados.length);

// Fecha e limpa qualquer painel de Detalhes da Rolagem anterior para manter o visual limpo
document.querySelectorAll('[id^="d_"], .dados-resultado').forEach(el => {
  if (el.id !== "d_" + id) {
    el.innerHTML = "";
    el.removeAttribute("open");
  }
});

// Registra rolagem no histórico das últimas 10 rolagens
const itemHistorico = {
  pericia: pericia.nome,
  horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  resultadoFinal,
  faixaNome: faixa.nome,
  faixaTipo: faixa.tipo,
  principal,
  dadosBase,
  modDados,
  quantidadeDados,
  atributoZerado,
  dados: [...dados],
  somaDados,
  atributosAux: [...atributosAux],
  somaAtributos,
  puros,
  bonusPts,
  relacionados,
  totalPontos
};
registrarRolagemHistorico(itemHistorico);
if (typeof transmitirRolagemParaCampanha === "function") {
  transmitirRolagemParaCampanha(itemHistorico);
}

const painel=document.getElementById("d_"+id);
if(painel){
painel.innerHTML=`
<summary>Detalhes da rolagem <span class="resultado-resumo ${faixa.tipo}">→ ${resultadoFinal}</span></summary>
<div class="dados-conteudo">
<div class="dados-etapa"><span class="dados-rotulo">1. Dados rolados (${principal})</span><div class="dados-lista">${linhaQtd}</div></div>
<div class="dados-etapa"><span class="dados-rotulo">2. Resultado dos D6</span><div class="dados-lista">${linhaDados}</div></div>
${temAux?`<div class="dados-etapa"><span class="dados-rotulo">${passoAux}. Atributo(s) Auxiliar(es)</span><div class="dados-lista">${linhaAux}</div></div>`:""}
<div class="dados-etapa">
<span class="dados-rotulo">${passoPontos}. Pontos de Perícia</span>
<div class="dados-pontos-grid">
  <div class="ponto-item"><span class="ponto-nome">Puros:</span> <span class="ponto-val">+${puros}</span></div>
  <div class="ponto-item"><span class="ponto-nome">Bônus:</span> <span class="ponto-val">${bonusFormatado}</span></div>
  <div class="ponto-item"><span class="ponto-nome">Relacionados:</span> <span class="ponto-val">+${relacionados}</span></div>
</div>
<div class="dados-soma-pontos">Soma dos Pontos = <strong class="dados-destaque">${totalPontosFormatado}</strong></div>
</div>
<div class="resultado-painel ${faixa.tipo}">
  ${montarGalhosInvasores(faixa.tipo)}
  <div class="resultado-painel-topo">
    <span class="resultado-painel-linha"></span>
    <span class="resultado-painel-titulo">${passoFinal}. RESULTADO DO TESTE</span>
    <span class="resultado-painel-linha"></span>
  </div>
  <div class="resultado-painel-valor">${resultadoFinal}</div>
  <div class="resultado-painel-selo">
    ${seloDificuldade}
  </div>
</div>
</div>`;
painel.open=true;
}

return {
  pericia,
  id,
  resultadoFinal,
  faixa,
  seloDificuldade,
  principal,
  dadosBase,
  modDados,
  quantidadeDados,
  atributoZerado,
  dados: [...dados],
  somaDados,
  atributosAux: [...atributosAux],
  somaAtributos,
  temAux,
  puros,
  bonusPts,
  relacionados,
  totalPontos,
  linhaQtd,
  linhaDados,
  linhaAux,
  passoAux,
  passoPontos,
  passoFinal,
  bonusFormatado,
  totalPontosFormatado,
  itemHistorico
};
}

function adicionarPericiaPersonalizada(){
const nome=document.getElementById("custom_nome").value.trim();
if(!nome){
    mostrarStatus("✗ Digite um nome para a Perícia personalizada.", "erro");
    document.getElementById("custom_nome").focus();
    return;
}

if(pericias.some(p=>p.nome.toLowerCase()===nome.toLowerCase())||
personalizadas.some(p=>p.nome.toLowerCase()===nome.toLowerCase())){
    mostrarStatus("✗ Já existe uma Perícia com o nome \"" + nome + "\".", "erro");
    return;
}

const atributo=document.getElementById("custom_atributo").value;
const pontosIniciais=Math.max(0,parseInt(document.getElementById("custom_pontos").value)||0);
const textoAux=document.getElementById("custom_auxiliares").value.trim();
const divisor=Math.max(2,parseInt(document.getElementById("custom_divisor").value)||2);
const aux=textoAux?textoAux.split("+").map(x=>x.trim()).filter(Boolean):[];

const nova={categoria:"Perícias Personalizadas",nome,atributos:[atributo],aux,divisor};
personalizadas.push(nova);
pontosPuros[nome]=pontosIniciais;
pontosBonus[nome]="0";

document.getElementById("lista-personalizadas").appendChild(criarCard(nova));
atualizarPainel();
marcarAlteracaoFeita();

document.getElementById("custom_nome").value="";
document.getElementById("custom_pontos").value="0";
document.getElementById("custom_auxiliares").value="";
document.getElementById("custom_divisor").value="2";
}

/* ============================================================
   SISTEMA DE AVISO E NOTIFICAÇÃO DE ALTERAÇÕES NÃO SALVAS
   E CONTROLE DE MODO DE SALVAMENTO (AUTOMÁTICO vs. MANUAL)
   - Automático (padrão): Salva continuamente de forma silenciosa.
     Botão Salvar Ficha e avisos pop-ups em 2s ficam indisponíveis.
   - Manual (opcional): Desativa o salvamento automático contínuo.
     Habilita o botão Salvar Ficha e os avisos de alterações pendentes.
   ============================================================ */
let temAlteracoesNaoSalvas = false;
let autoSaveDebounceTimeout = null;
let salvamentoManualAtivo = false; // Padrão: false (Modo Automático ativo por padrão)
const DEBOUNCE_SALVAMENTO_MS = 2000;

function atualizarUIModoSalvamento(){
    const btnSalvarPrincipal = document.getElementById("btn-salvar-ficha-principal");
    const avisoInline = document.getElementById("ficha-aviso-alteracoes-inline");
    const bannerFlutuante = document.getElementById("barra-alteracoes-flutuante");
    const btnModo = document.getElementById("btn-toggle-salvamento-manual");
    const txtModo = document.getElementById("txt-modo-salvamento");
    const iconeModo = document.getElementById("icone-modo-salvamento");

    if(salvamentoManualAtivo){
        if(btnSalvarPrincipal) btnSalvarPrincipal.style.display = "inline-flex";
        if(btnModo){
            btnModo.classList.add("manual-ativo");
            btnModo.title = "Modo de Salvamento MANUAL ativado. Clique para alternar para Automático.";
        }
        if(txtModo) txtModo.textContent = "Salvamento: Manual";
        if(iconeModo) iconeModo.textContent = "💾";
        atualizarUIAlteracoesPendentes();
    }else{
        if(btnSalvarPrincipal){
            btnSalvarPrincipal.style.display = "none";
            btnSalvarPrincipal.classList.remove("tem-alteracoes");
        }
        if(avisoInline) avisoInline.classList.remove("visivel");
        if(bannerFlutuante) bannerFlutuante.classList.remove("visivel");
        if(btnModo){
            btnModo.classList.remove("manual-ativo");
            btnModo.title = "Modo de Salvamento AUTOMÁTICO ativado (padrão). Clique para ativar Salvamento Manual.";
        }
        if(txtModo) txtModo.textContent = "Salvamento: Automático";
        if(iconeModo) iconeModo.textContent = "⚡";
    }
}

function alternarModoSalvamentoManual(forcarValor){
    if(typeof forcarValor === "boolean"){
        salvamentoManualAtivo = forcarValor;
    }else{
        salvamentoManualAtivo = !salvamentoManualAtivo;
    }
    atualizarUIModoSalvamento();

    if(!salvamentoManualAtivo){
        // Ao voltar para o modo automático, salva silenciosamente caso haja algo pendente
        if(temAlteracoesNaoSalvas){
            salvarFicha(true);
        }
        mostrarStatus("⚡ Salvamento Automático ativado (as alterações serão salvas continuamente sem pop-ups).", "ok");
    }else{
        mostrarStatus("💾 Salvamento Manual ativado (use o botão Salvar Ficha para gravar suas modificações).", "");
        if(temAlteracoesNaoSalvas){
            atualizarUIAlteracoesPendentes();
        }
    }
    // Salva a preferência de modo na própria ficha
    if(!salvamentoManualAtivo){
        salvarFicha(true);
    }
}

function agendarSalvamentoAutomaticoDebounced(){
    if(salvamentoManualAtivo){
        return; // No modo manual, não efetua salvamento automático
    }
    if (autoSaveDebounceTimeout) {
        clearTimeout(autoSaveDebounceTimeout);
    }
    autoSaveDebounceTimeout = setTimeout(() => {
        if (temAlteracoesNaoSalvas && !salvamentoManualAtivo) {
            salvarFicha(true);
        }
    }, DEBOUNCE_SALVAMENTO_MS);
}

function salvarFichaAutomatico(){
    if(!salvamentoManualAtivo){
        salvarFicha(true);
    }else{
        marcarAlteracaoFeita();
    }
}

function marcarAlteracaoFeita(){
    temAlteracoesNaoSalvas = true;
    if(salvamentoManualAtivo){
        atualizarUIAlteracoesPendentes();
    }else{
        agendarSalvamentoAutomaticoDebounced();
    }
}

function limparAlteracoesNaoSalvas(){
    temAlteracoesNaoSalvas = false;
    if (autoSaveDebounceTimeout) {
        clearTimeout(autoSaveDebounceTimeout);
        autoSaveDebounceTimeout = null;
    }
    atualizarUIAlteracoesPendentes();
}

function atualizarUIAlteracoesPendentes(){
    const bannerFlutuante = document.getElementById("barra-alteracoes-flutuante");
    const avisoInline = document.getElementById("ficha-aviso-alteracoes-inline");
    const btnSalvarPrincipal = document.getElementById("btn-salvar-ficha-principal");
    const txtBtnSalvar = document.getElementById("txt-btn-salvar-principal");

    if(!salvamentoManualAtivo){
        if(bannerFlutuante) bannerFlutuante.classList.remove("visivel");
        if(avisoInline) avisoInline.classList.remove("visivel");
        if(btnSalvarPrincipal){
            btnSalvarPrincipal.style.display = "none";
            btnSalvarPrincipal.classList.remove("tem-alteracoes");
        }
        return;
    }

    if(btnSalvarPrincipal){
        btnSalvarPrincipal.style.display = "inline-flex";
    }

    if(temAlteracoesNaoSalvas){
        if(bannerFlutuante) bannerFlutuante.classList.add("visivel");
        if(avisoInline) avisoInline.classList.add("visivel");
        if(btnSalvarPrincipal) btnSalvarPrincipal.classList.add("tem-alteracoes");
        if(txtBtnSalvar) txtBtnSalvar.textContent = "Salvar alterações";
    }else{
        if(bannerFlutuante) bannerFlutuante.classList.remove("visivel");
        if(avisoInline) avisoInline.classList.remove("visivel");
        if(btnSalvarPrincipal) btnSalvarPrincipal.classList.remove("tem-alteracoes");
        if(txtBtnSalvar) txtBtnSalvar.textContent = "Salvar Ficha";
    }
}

/* ============================================================
   SISTEMA DE SALVAMENTO DE FICHA
   Usa localStorage (armazenamento local do navegador) para
   persistir a ficha entre sessões. Cada ficha salva vira uma
   chave "ficha:<id>" e o índice de todas as fichas fica em
   "fichas:index". Como é local, os dados ficam presos a este
   navegador/dispositivo — por isso também é possível
   exportar/importar como arquivo .json, para backup manual ou
   para levar a ficha para outro dispositivo/navegador.
   ============================================================ */

const CHAVE_PREFIXO = "mestreDosTestes:";

function gerarId(){
    return "f" + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

function mostrarStatus(msg, tipo){
    const el = document.getElementById("status-msg");
    el.textContent = msg;
    el.className = "status-msg" + (tipo ? " " + tipo : "");
    if(statusTimeout) clearTimeout(statusTimeout);
    statusTimeout = setTimeout(()=>{ el.textContent=""; el.className="status-msg"; }, 4000);
}

/* ============================================================
   CONTROLE DE RECURSOS VITAIS (VIDA, MENTAL, ESTAMINA, AURA)
   ============================================================ */
const RECURSOS_CONFIG = [
    { chave: "vida", nome: "Vida", padraoAtual: 100, padraoMax: 100 },
    { chave: "mental", nome: "Mental", padraoAtual: 50, padraoMax: 50 },
    { chave: "estamina", nome: "Estamina", padraoAtual: 80, padraoMax: 80 },
    { chave: "aura", nome: "Aura", padraoAtual: 30, padraoMax: 30 }
];

function atualizarBarraRecurso(chave){
    const atualEl = document.getElementById("recurso_" + chave + "_atual");
    const maxEl = document.getElementById("recurso_" + chave + "_max");
    const tempEl = document.getElementById("recurso_" + chave + "_temp");
    const barraFill = document.getElementById("barra_" + chave + "_fill");
    const barraTempFill = document.getElementById("barra_" + chave + "_temp_fill");
    const slider = document.getElementById("slider_" + chave);
    const pctEl = document.getElementById("recurso_" + chave + "_pct");
    const wrapTemp = document.getElementById("wrap_recurso_" + chave + "_temp");

    if(!atualEl || !maxEl || !barraFill || !slider || !pctEl) return;

    let max = parseInt(maxEl.value, 10);
    if(isNaN(max) || max < 1){
        max = 1;
        maxEl.value = 1;
    }

    let atual = parseInt(atualEl.value, 10);
    if(isNaN(atual) || atual < 0){
        atual = 0;
        atualEl.value = 0;
    }

    let temp = tempEl ? parseInt(tempEl.value, 10) : 0;
    if(isNaN(temp) || temp < 0){
        temp = 0;
        if(tempEl) tempEl.value = 0;
    }

    slider.max = max;
    slider.value = Math.min(atual, max);

    // Barra base proporcional ao valor atual
    const proporcaoAtual = (atual / max) * 100;
    const larguraBarraBase = Math.min(100, Math.max(0, proporcaoAtual));
    barraFill.style.width = larguraBarraBase + "%";

    // Barra temporária somada (inicia onde a base termina e expande)
    if(barraTempFill){
        if(temp > 0){
            const proporcaoTemp = (temp / max) * 100;
            barraTempFill.style.left = larguraBarraBase + "%";
            // Limita o preenchimento visual para não estourar a borda do container
            const larguraTempVisivel = Math.min(100 - larguraBarraBase, proporcaoTemp);
            barraTempFill.style.width = Math.max(0, larguraTempVisivel) + "%";
            barraTempFill.style.display = "block";
        }else{
            barraTempFill.style.width = "0%";
            barraTempFill.style.display = "none";
        }
    }

    if(wrapTemp){
        if(temp > 0){
            wrapTemp.classList.add("tem-valor");
        }else{
            wrapTemp.classList.remove("tem-valor");
        }
    }

    // Exibição do percentual total (com indicação do bônus temporário)
    const pctTotal = Math.round(((atual + temp) / max) * 100);
    if(temp > 0){
        pctEl.textContent = `${pctTotal}% (+${temp})`;
    }else{
        pctEl.textContent = `${Math.round(proporcaoAtual)}%`;
    }

    if(typeof sincronizarModoTatico === 'function'){
        sincronizarModoTatico();
    }

    if(typeof avaliarMusicaAtual === 'function' && (chave === 'vida' || chave === 'mental')){
        avaliarMusicaAtual();
    }

    if(typeof avaliarEstaminaCritica === 'function' && (chave === 'estamina' || !chave)){
        avaliarEstaminaCritica();
    }

    if(typeof verificarGatilhoFarmadorAura === 'function' && (chave === 'aura' || !chave)){
        verificarGatilhoFarmadorAura();
    }

    if(typeof verificarGatilhoJackpot === 'function' && (chave === 'vida' || chave === 'mental' || chave === 'estamina' || !chave)){
        verificarGatilhoJackpot();
    }
}

function zerarRecursoTemporario(chave){
    const tempEl = document.getElementById("recurso_" + chave + "_temp");
    const taticoTempEl = document.getElementById("tatico_" + chave + "_temp");
    const valReal = tempEl ? parseInt(tempEl.value, 10) || 0 : 0;
    const valTatico = taticoTempEl ? parseInt(taticoTempEl.value, 10) || 0 : 0;
    if(valReal !== 0 || valTatico !== 0){
        if(tempEl) tempEl.value = 0;
        if(taticoTempEl) taticoTempEl.value = 0;
        atualizarBarraRecurso(chave);
        if(typeof sincronizarModoTatico === 'function') sincronizarModoTatico();
        marcarAlteracaoFeita();
        const cfg = RECURSOS_CONFIG.find(c => c.chave === chave);
        const nomeRecurso = cfg ? cfg.nome : chave;
        mostrarStatus(`✓ Pontos temporários de ${nomeRecurso} zerados.`, "ok");
    }
}

function zerarTodosRecursosTemporarios(){
    let alterou = false;
    RECURSOS_CONFIG.forEach(cfg => {
        const tempEl = document.getElementById("recurso_" + cfg.chave + "_temp");
        const taticoTempEl = document.getElementById("tatico_" + cfg.chave + "_temp");
        const valReal = tempEl ? parseInt(tempEl.value, 10) || 0 : 0;
        const valTatico = taticoTempEl ? parseInt(taticoTempEl.value, 10) || 0 : 0;
        if(valReal > 0 || valTatico > 0){
            if(tempEl) tempEl.value = 0;
            if(taticoTempEl) taticoTempEl.value = 0;
            atualizarBarraRecurso(cfg.chave);
            alterou = true;
        }
    });
    if(alterou){
        if(typeof sincronizarModoTatico === 'function') sincronizarModoTatico();
        marcarAlteracaoFeita();
        mostrarStatus("✓ Todos os pontos temporários foram zerados.", "ok");
    }else{
        mostrarStatus("Não há pontos temporários ativos para zerar.", "");
    }
}

function sliderRecursoAlterado(chave, valor){
    const atualEl = document.getElementById("recurso_" + chave + "_atual");
    if(atualEl){
        atualEl.value = valor;
        atualizarBarraRecurso(chave);
        marcarAlteracaoFeita();
    }
}

function ajustarRecurso(chave, delta){
    const atualEl = document.getElementById("recurso_" + chave + "_atual");
    const maxEl = document.getElementById("recurso_" + chave + "_max");
    if(!atualEl || !maxEl) return;

    const max = parseInt(maxEl.value, 10) || 1;
    let atual = parseInt(atualEl.value, 10) || 0;
    const novoValor = Math.max(0, atual + delta);
    if (novoValor !== atual && typeof tocarSomStatus === "function") {
        if (delta > 0) {
            tocarSomStatus("cura", "ganhar", chave, delta);
        } else if (delta < 0) {
            tocarSomStatus("dano_vital", "perder", chave, delta);
        }
    }
    atualEl.value = novoValor;
    atualizarBarraRecurso(chave);
    marcarAlteracaoFeita();
}

function aplicarAjusteDigitado(chave, inputOuValor){
    let inputEl = null;
    let texto = "";
    if(typeof inputOuValor === "string" || typeof inputOuValor === "number"){
        texto = String(inputOuValor);
    } else if(inputOuValor && inputOuValor.value !== undefined){
        inputEl = inputOuValor;
        texto = inputEl.value;
    } else {
        inputEl = document.getElementById("tatico_delta_" + chave) || document.getElementById("recurso_delta_" + chave);
        if(inputEl) texto = inputEl.value;
    }

    const boxEl = inputEl ? (inputEl.closest(".recurso-delta-box") || inputEl.closest(".tatico-delta-box") || document.getElementById("box_tatico_delta_" + chave) || document.getElementById("box_recurso_delta_" + chave)) : (document.getElementById("box_tatico_delta_" + chave) || document.getElementById("box_recurso_delta_" + chave));

    if(!texto || !texto.trim()){
        if(inputEl) inputEl.focus();
        return;
    }
    texto = texto.trim();

    if(texto.toLowerCase() === "max"){
        maximizarRecurso(chave);
        if(typeof sincronizarModoTatico === 'function') sincronizarModoTatico();
        if(inputEl) inputEl.value = "";
        return;
    }

    const textoLower = texto.toLowerCase();
    const ehDanoPalavra = textoLower.includes("dano") || textoLower.includes("perda") || textoLower.includes("gasto");

    // Extrai números e sinais de adição/subtração
    let expressao = texto.replace(/[^0-9+-]/g, "");
    if(!expressao){
        if(boxEl){
            boxEl.classList.remove("delta-invalido");
            void boxEl.offsetWidth;
            boxEl.classList.add("delta-invalido");
            setTimeout(() => { if(boxEl) boxEl.classList.remove("delta-invalido"); }, 400);
        }
        return;
    }

    // Se o usuário digitou ex: "dano 10" sem sinal negativo, interpreta como -10
    if(ehDanoPalavra && !expressao.startsWith("-") && !expressao.startsWith("+")){
        expressao = "-" + expressao;
    }

    let delta = 0;
    try {
        const partes = expressao.match(/[+-]?\d+/g);
        if(partes && partes.length > 0){
            delta = partes.reduce((acc, curr) => acc + parseInt(curr, 10), 0);
        }
    } catch(e){
        delta = parseInt(expressao, 10);
    }

    if(isNaN(delta) || delta === 0){
        if(inputEl) inputEl.value = "";
        return;
    }

    ajustarRecurso(chave, delta);

    if(boxEl){
        boxEl.classList.remove("delta-ganho", "delta-perda", "delta-invalido");
        void boxEl.offsetWidth;
        boxEl.classList.add(delta > 0 ? "delta-ganho" : "delta-perda");
        setTimeout(() => {
            if(boxEl) boxEl.classList.remove("delta-ganho", "delta-perda");
        }, 500);
    }

    if(inputEl){
        inputEl.value = "";
    }

    if(typeof mostrarStatus === "function"){
        const nomes = { vida: "Vida", mental: "Mental", estamina: "Estamina", aura: "Aura" };
        const nomeRecurso = nomes[chave] || chave;
        const sinal = delta > 0 ? `+${delta}` : `${delta}`;
        const atualEl = document.getElementById("recurso_" + chave + "_atual");
        const maxEl = document.getElementById("recurso_" + chave + "_max");
        const valorTexto = (atualEl && maxEl) ? ` (${atualEl.value}/${maxEl.value})` : "";
        mostrarStatus(`${nomeRecurso}: ajuste de ${sinal}${valorTexto} calculado e aplicado.`, delta > 0 ? "ok" : "");
    }
}

function maximizarRecurso(chave){
    const atualEl = document.getElementById("recurso_" + chave + "_atual");
    const maxEl = document.getElementById("recurso_" + chave + "_max");
    if(!atualEl || !maxEl) return;

    const max = parseInt(maxEl.value, 10) || 1;
    const atual = parseInt(atualEl.value, 10) || 0;
    const diferenca = max - atual;
    if (atual < max && typeof tocarSomStatus === "function") {
        tocarSomStatus("recuperacao", "ganhar", chave, diferenca > 0 ? diferenca : 35);
    }
    atualEl.value = max;
    atualizarBarraRecurso(chave);
    marcarAlteracaoFeita();
}

function restaurarTodosRecursos(){
    let recuperouAlgo = false;
    let totalDiferenca = 0;
    RECURSOS_CONFIG.forEach(cfg => {
        const atualEl = document.getElementById("recurso_" + cfg.chave + "_atual");
        const maxEl = document.getElementById("recurso_" + cfg.chave + "_max");
        if (atualEl && maxEl) {
            const max = parseInt(maxEl.value, 10) || 1;
            const atual = parseInt(atualEl.value, 10) || 0;
            if (atual < max) {
                recuperouAlgo = true;
                totalDiferenca += (max - atual);
            }
            atualEl.value = max;
            atualizarBarraRecurso(cfg.chave);
        }
    });
    if (typeof tocarSomStatus === "function") {
        tocarSomStatus("restaurar_tudo", "ganhar", "todos", Math.max(50, totalDiferenca));
    }
    marcarAlteracaoFeita();
    mostrarStatus("✓ Todos os recursos vitais foram restaurados ao máximo.", "ok");
}

function atualizarTodasBarrasRecursos(){
    RECURSOS_CONFIG.forEach(cfg => {
        atualizarBarraRecurso(cfg.chave);
    });
}

function coletarEstadoFicha(){
    const baseSelects = {};
    document.querySelectorAll('select[id^="base_"]').forEach(sel=>{
        baseSelects[sel.id] = sel.value;
    });

    const recursos = {};
    RECURSOS_CONFIG.forEach(cfg => {
        const atualEl = document.getElementById("recurso_" + cfg.chave + "_atual");
        const maxEl = document.getElementById("recurso_" + cfg.chave + "_max");
        const tempEl = document.getElementById("recurso_" + cfg.chave + "_temp");
        recursos[cfg.chave] = {
            atual: atualEl ? (parseInt(atualEl.value, 10) || 0) : cfg.padraoAtual,
            max: maxEl ? (parseInt(maxEl.value, 10) || 1) : cfg.padraoMax,
            temp: tempEl ? (parseInt(tempEl.value, 10) || 0) : 0
        };
    });

    const infoNomes = (typeof obterNomeExibicaoPersonagem === "function") ? obterNomeExibicaoPersonagem() : null;

    return {
        nome: infoNomes ? infoNomes.completo : (document.getElementById("ficha_nome")?.value.trim() || "Personagem sem nome"),
        identidade: infoNomes ? infoNomes.identidade : (document.getElementById("ficha_identidade")?.value.trim() || "Novo Personagem"),
        temNomeSocial: infoNomes ? infoNomes.temNomeSocial : !!(document.getElementById("ficha_tem_nome_social")?.checked),
        nomeSocial: infoNomes ? infoNomes.nomeSocial : (document.getElementById("ficha_nome_social")?.value.trim() || ""),
        temCodinome: infoNomes ? infoNomes.temCodinome : !!(document.getElementById("ficha_tem_codinome")?.checked),
        codinome: infoNomes ? infoNomes.codinome : (document.getElementById("ficha_codinome")?.value.trim() || ""),
        trocarPorCodinome: infoNomes ? infoNomes.trocarPorCodinome : !!(document.getElementById("ficha_trocar_por_codinome")?.checked),
        criadaNesteNavegador: (typeof fichaCriadaNesteNavegador !== "undefined") ? fichaCriadaNesteNavegador : true,
        idNavegadorCriador: (typeof obterIdNavegadorLocal === "function") ? (window._idNavegadorCriadorFicha || obterIdNavegadorLocal()) : "was_nav_padrao",
        senhaSegredo: (typeof fichaSenhaSegredo !== "undefined") ? fichaSenhaSegredo : "",
        titulo: infoNomes ? infoNomes.titulo : (document.getElementById("ficha_titulo")?.value.trim() || ""),
        nivel: document.getElementById("ficha_nivel").value,
        classe1: document.getElementById("ficha_classe1").value,
        classe2: document.getElementById("ficha_classe2").value,
        avatar: avatarAtual,
        cor: document.getElementById("ficha_cor").value,
        contornoAtivo: contornoLetrasAtivo,
        contornoCor: contornoLetrasCor,
        recursos,
        atributos: {
            HPR: valorAtributo("HPR"),
            PRX: valorAtributo("PRX"),
            PSI: valorAtributo("PSI"),
            QI: valorAtributo("QI")
        },
        pontosPuros: {...pontosPuros},
        pontosBonus: {...pontosBonus},
        baseSelects,
        personalizadas: personalizadas.map(p=>({...p})),
        inventario: {
            cargaMaxima: parseFloat(document.getElementById("inv_carga_maxima")?.value) || 20.0,
            compartimentos: (typeof inventarioCompartimentos !== "undefined") ? inventarioCompartimentos.map(c => ({...c})) : [],
            itens: inventarioItens.map(it => ({...it}))
        },
        conquistas: {
            campanha: (typeof conquistasCampanha !== "undefined") ? conquistasCampanha.map(c => ({...c})) : [],
            desbloqueadas: (typeof conquistasDesbloqueadas !== "undefined") ? (typeof ofuscarListaConquistasParaSalvar === "function" ? ofuscarListaConquistasParaSalvar(Array.from(conquistasDesbloqueadas)) : Array.from(conquistasDesbloqueadas)) : [],
            secretasDesbloqueadas: (typeof conquistasSecretasDesbloqueadas !== "undefined") ? conquistasSecretasDesbloqueadas : false
        },
        atalhosTeclado: (typeof atalhosTecladoConfig !== "undefined") ? { ...atalhosTecladoConfig } : null,
        tipografia: (typeof obterEstadoTipografiasParaSalvar === "function") ? obterEstadoTipografiasParaSalvar() : null,
        musicas: (typeof obterEstadoMusicasParaSalvar === "function") ? obterEstadoMusicasParaSalvar() : null,
        identidadeSecretaAtiva: (typeof identidadeSecretaAtiva !== "undefined") ? identidadeSecretaAtiva : false,
        identidadeSecretaDados: (typeof identidadeSecretaDados !== "undefined") ? JSON.parse(JSON.stringify(identidadeSecretaDados)) : null,
        identidadeRealDados: (typeof identidadeRealDados !== "undefined" && identidadeRealDados) ? JSON.parse(JSON.stringify(identidadeRealDados)) : null,
        identidadeSecretaCodigo: (typeof codigoIdentidadeSecreta !== "undefined") ? codigoIdentidadeSecreta : "",
        salvamentoManual: salvamentoManualAtivo,
        modoClaro: modoClaroAtivo,
        premioYudi: (typeof estadoPremioYudiGlobal !== "undefined" ? estadoPremioYudiGlobal : null),
        atualizadoEm: new Date().toISOString()
    };
}

function aplicarEstadoFicha(estado){
    salvamentoManualAtivo = !!estado.salvamentoManual;
    atualizarUIModoSalvamento();

    const idLocal = (typeof obterIdNavegadorLocal === "function") ? obterIdNavegadorLocal() : "";
    if (estado.importada || (estado.idNavegadorCriador && estado.idNavegadorCriador !== idLocal)) {
        fichaCriadaNesteNavegador = false;
        window._idNavegadorCriadorFicha = estado.idNavegadorCriador || "outro_navegador";
    } else if (estado.criadaNesteNavegador === false) {
        fichaCriadaNesteNavegador = false;
        window._idNavegadorCriadorFicha = estado.idNavegadorCriador || "outro_navegador";
    } else {
        fichaCriadaNesteNavegador = true;
        window._idNavegadorCriadorFicha = idLocal;
    }

    fichaSenhaSegredo = estado.senhaSegredo || "";
    if (!fichaCriadaNesteNavegador) {
        fichaDesbloqueadaSessao = false;
        identidadeSecretaAtiva = true; // Em outro navegador, a identidade secreta SEMPRE aparece no lugar
    } else {
        identidadeSecretaAtiva = !!estado.identidadeSecretaAtiva;
    }

    if (estado.identidadeSecretaDados) {
        identidadeSecretaDados = estado.identidadeSecretaDados;
    }
    if (estado.identidadeRealDados) {
        identidadeRealDados = estado.identidadeRealDados;
    }
    if (typeof estado.identidadeSecretaCodigo !== "undefined") {
        if (typeof salvarCodigoIdentidadeSecretaLocal === "function") {
            salvarCodigoIdentidadeSecretaLocal(estado.identidadeSecretaCodigo);
        } else {
            codigoIdentidadeSecreta = estado.identidadeSecretaCodigo || "";
        }
    }

    const identidadeSalva = estado.identidade || estado.nome || "Novo Personagem";
    const temSocialSalvo = !!estado.temNomeSocial;
    const nomeSocialSalvo = estado.nomeSocial || "";
    const temCodinomeSalvo = !!estado.temCodinome;
    const codinomeSalvo = estado.codinome || "";
    const trocarCodinomeSalvo = !!estado.trocarPorCodinome;
    const tituloSalvo = estado.titulo || "";

    const identEl = document.getElementById("ficha_identidade");
    if (identEl) identEl.value = identidadeSalva;

    const chkSocial = document.getElementById("ficha_tem_nome_social");
    if (chkSocial) chkSocial.checked = temSocialSalvo;

    const socialEl = document.getElementById("ficha_nome_social");
    if (socialEl) socialEl.value = nomeSocialSalvo;

    const chkCodi = document.getElementById("ficha_tem_codinome");
    if (chkCodi) chkCodi.checked = temCodinomeSalvo;

    const codiEl = document.getElementById("ficha_codinome");
    if (codiEl) codiEl.value = codinomeSalvo;

    const chkTrocar = document.getElementById("ficha_trocar_por_codinome");
    if (chkTrocar) chkTrocar.checked = trocarCodinomeSalvo;

    const tituloEl = document.getElementById("ficha_titulo");
    if (tituloEl) tituloEl.value = tituloSalvo;

    if (typeof alternarCampoNomeSocial === "function") alternarCampoNomeSocial(temSocialSalvo, false);
    if (typeof alternarCampoCodinome === "function") alternarCampoCodinome(temCodinomeSalvo, false);
    if (typeof atualizarNomesPersonagem === "function") atualizarNomesPersonagem(false);

    document.getElementById("ficha_nivel").value = estado.nivel || "";
    document.getElementById("ficha_classe1").value = estado.classe1 || "";
    document.getElementById("ficha_classe2").value = estado.classe2 || "";
    atualizarOpcoesClasse();

    if (estado.atalhosTeclado && typeof estado.atalhosTeclado === "object") {
        atalhosTecladoConfig = { ...ATALHOS_PADRAO, ...estado.atalhosTeclado };
        salvarConfigAtalhos();
        if (typeof renderizarBarraAtalhosCabecalho === "function") {
            renderizarBarraAtalhosCabecalho();
        }
    }

    avatarAtual = estado.avatar || "";
    aplicarAvatar();

    if (estado.premioYudi) {
        estadoPremioYudiGlobal = estado.premioYudi;
        if (typeof renderizarBadgePremioYudi === "function") {
            renderizarBadgePremioYudi();
        }
    }

    const corSalva = estado.cor || "#c9b183";
    document.getElementById("ficha_cor").value = corSalva;
    definirCorPrincipal(corSalva, false);

    const contornoSalvoAtivo = !!estado.contornoAtivo;
    const contornoSalvoCor = estado.contornoCor || "#ffffff";
    const contornoCorInput = document.getElementById("ficha_contorno_cor");
    if(contornoCorInput) contornoCorInput.value = contornoSalvoCor;
    document.documentElement.style.setProperty('--tema-contorno-cor', contornoSalvoCor);
    contornoLetrasCor = contornoSalvoCor;
    alternarContornoLetras(contornoSalvoAtivo, false);

    // Aplica tipografias salvas na ficha
    if (typeof aplicarTipografiasDoEstado === "function") {
        aplicarTipografiasDoEstado(estado);
    }

    // Aplica músicas salvas na ficha
    if (typeof aplicarMusicasDoEstado === "function") {
        aplicarMusicasDoEstado(estado);
    }

    // Aplica recursos vitais salvos (ou valores padrão)
    const recSalvos = estado.recursos || {};
    RECURSOS_CONFIG.forEach(cfg => {
        const dadosRec = recSalvos[cfg.chave];
        const atualEl = document.getElementById("recurso_" + cfg.chave + "_atual");
        const maxEl = document.getElementById("recurso_" + cfg.chave + "_max");
        const tempEl = document.getElementById("recurso_" + cfg.chave + "_temp");
        if(atualEl && maxEl){
            atualEl.value = (dadosRec && dadosRec.atual !== undefined) ? dadosRec.atual : cfg.padraoAtual;
            maxEl.value = (dadosRec && dadosRec.max !== undefined) ? dadosRec.max : cfg.padraoMax;
        }
        if(tempEl){
            tempEl.value = (dadosRec && dadosRec.temp !== undefined) ? dadosRec.temp : 0;
        }
    });
    atualizarTodasBarrasRecursos();

    document.getElementById("attr_HPR").value = estado.atributos?.HPR ?? 1;
    document.getElementById("attr_PRX").value = estado.atributos?.PRX ?? 1;
    document.getElementById("attr_PSI").value = estado.atributos?.PSI ?? 1;
    document.getElementById("attr_QI").value = estado.atributos?.QI ?? 1;

    // Compatibilidade com fichas salvas no formato antigo (um único "pontos").
    const purosSalvos = estado.pontosPuros || estado.pontos || {};
    const bonusSalvos = estado.pontosBonus || {};

    // Limpa perícias personalizadas atuais da tela
    personalizadas.length = 0;
    document.getElementById("lista-personalizadas").innerHTML = "";

    // Recria as personalizadas salvas
    (estado.personalizadas || []).forEach(p=>{
        personalizadas.push(p);
        pontosPuros[p.nome] = purosSalvos[p.nome] !== undefined ? purosSalvos[p.nome] : 0;
        pontosBonus[p.nome] = bonusSalvos[p.nome] !== undefined ? String(bonusSalvos[p.nome]) : "0";
        document.getElementById("lista-personalizadas").appendChild(criarCard(p));
    });

    // Aplica pontos das perícias fixas
    pericias.forEach(p=>{
        pontosPuros[p.nome] = purosSalvos[p.nome] !== undefined ? purosSalvos[p.nome] : 0;
        pontosBonus[p.nome] = bonusSalvos[p.nome] !== undefined ? String(bonusSalvos[p.nome]) : "0";
        const id = idSeguro(p.nome);
        const inputPuros = document.getElementById("pp_"+id);
        const inputBonus = document.getElementById("pb_"+id);
        if(inputPuros) inputPuros.value = pontosPuros[p.nome];
        if(inputBonus) inputBonus.value = pontosBonus[p.nome];
    });

    // Aplica pontos das personalizadas (já criadas acima, garante sync do input)
    personalizadas.forEach(p=>{
        const id = idSeguro(p.nome);
        const inputPuros = document.getElementById("pp_"+id);
        const inputBonus = document.getElementById("pb_"+id);
        if(inputPuros) inputPuros.value = pontosPuros[p.nome] || 0;
        if(inputBonus) inputBonus.value = pontosBonus[p.nome] || "0";
    });

    // Aplica seletores de atributo base
    if(estado.baseSelects){
        Object.entries(estado.baseSelects).forEach(([id,val])=>{
            const sel = document.getElementById(id);
            if(sel) sel.value = val;
        });
    }

    // Fecha e limpa resultados de rolagens antigas
    document.querySelectorAll('[id^="d_"]').forEach(el=>{ el.innerHTML=""; el.removeAttribute("open"); });

    // Restaura dados do Inventário, Carga e Compartimentos
    const invSalvo = estado.inventario || {};
    const cargaMaxInput = document.getElementById("inv_carga_maxima");
    if(cargaMaxInput){
        const valCarga = parseFloat(invSalvo.cargaMaxima);
        cargaMaxInput.value = (!isNaN(valCarga) && valCarga > 0) ? valCarga : 20.0;
    }
    if(Array.isArray(invSalvo.compartimentos)){
        inventarioCompartimentos = invSalvo.compartimentos.map(c => ({...c}));
    } else {
        inventarioCompartimentos = clonarCompartimentosPadrao();
    }
    inventarioItens = Array.isArray(invSalvo.itens) ? invSalvo.itens.map(it => ({...it})) : [];
    if(typeof cancelarEdicaoItem === "function") cancelarEdicaoItem();
    if(typeof atualizarCompartimentosUI === "function") atualizarCompartimentosUI();
    if(typeof atualizarInventarioUI === "function") atualizarInventarioUI();

    // Restaura conquistas
    const conqSalvas = estado.conquistas || {};
    if(typeof conquistasCampanha !== "undefined"){
        conquistasCampanha = Array.isArray(conqSalvas.campanha) ? conqSalvas.campanha.map(c => ({...c})) : [];
        const rawDesbloqueadas = Array.isArray(conqSalvas.desbloqueadas) ? conqSalvas.desbloqueadas : [];
        const idsDecodificados = (typeof desofuscarListaConquistasCarregadas === "function") ? desofuscarListaConquistasCarregadas(rawDesbloqueadas) : rawDesbloqueadas;
        conquistasDesbloqueadas = new Set(idsDecodificados);
        if (typeof salvarSegredosDesbloqueadosStorage === "function") {
            salvarSegredosDesbloqueadosStorage();
        }
        if (typeof atualizarTooltipLogoRodape === "function") {
            atualizarTooltipLogoRodape();
        }
        // A aba SECRETAS só é exibida mediante duplo-clique na logo do rodapé
        conquistasSecretasDesbloqueadas = false;
        const btnSecretas = document.getElementById("conq-btn-n1-secretas");
        if(btnSecretas) btnSecretas.style.display = "none";
        if(conqNivel1Ativo === "secretas") conqNivel1Ativo = "oficiais";
        if(typeof renderizarListaConquistas === "function") renderizarListaConquistas();
    }

    if(typeof estado.modoClaro === "boolean"){
        aplicarModoTema(estado.modoClaro ? "claro" : "escuro", true);
    }

    if (!fichaCriadaNesteNavegador) {
        identidadeSecretaAtiva = true;
        if (typeof aplicarDisfarceNaFicha === "function") {
            aplicarDisfarceNaFicha();
        }
    } else if (identidadeSecretaAtiva && typeof aplicarDisfarceNaFicha === "function") {
        aplicarDisfarceNaFicha();
    }

    if (typeof atualizarBannerDisfarceUI === "function") {
        atualizarBannerDisfarceUI();
    }

    if (typeof atualizarBloqueioAbasNavegadorUI === "function") {
        atualizarBloqueioAbasNavegadorUI();
    }

    atualizarPainel();
    limparAlteracoesNaoSalvas();
}

/* ============================================================
   CAMADA DE PERSISTÊNCIA ROBUSTA (localStorage + IndexedDB Fallback)
   Garante armazenamento de fichas e arquivos de áudio pesados sem
   estourar a quota do localStorage ou congelar a thread do navegador.
   ============================================================ */
const DB_NOME = "MestreDosTestesDB";
const DB_VERSAO = 2;
const DB_STORE = "fichas";
const DB_STORE_AUDIO = "musicas_audio";

function abrirDB(){
    return new Promise((resolve, reject) => {
        if(typeof window === "undefined" || !window.indexedDB){
            return reject(new Error("IndexedDB não disponível"));
        }
        try{
            const req = window.indexedDB.open(DB_NOME, DB_VERSAO);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if(!db.objectStoreNames.contains(DB_STORE)){
                    db.createObjectStore(DB_STORE, { keyPath: "id" });
                }
                if(!db.objectStoreNames.contains(DB_STORE_AUDIO)){
                    db.createObjectStore(DB_STORE_AUDIO, { keyPath: "slot" });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        }catch(e){
            reject(e);
        }
    });
}

async function salvarMusicaIDB(slot, nome, blobOuDataUrl, inicio = 0, fim = null){
    try{
        const db = await abrirDB();
        return new Promise((resolve) => {
            const tx = db.transaction(DB_STORE_AUDIO, "readwrite");
            const store = tx.objectStore(DB_STORE_AUDIO);
            store.put({ slot, nome, dados: blobOuDataUrl, inicio, fim, atualizadoEm: Date.now() });
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    }catch(e){
        return false;
    }
}

async function carregarTodasMusicasIDB(){
    try{
        const db = await abrirDB();
        return new Promise((resolve) => {
            const tx = db.transaction(DB_STORE_AUDIO, "readonly");
            const store = tx.objectStore(DB_STORE_AUDIO);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
        });
    }catch(e){
        return [];
    }
}

async function removerMusicaIDB(slot){
    try{
        const db = await abrirDB();
        return new Promise((resolve) => {
            const tx = db.transaction(DB_STORE_AUDIO, "readwrite");
            const store = tx.objectStore(DB_STORE_AUDIO);
            store.delete(slot);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    }catch(e){
        return false;
    }
}

async function limparTodasMusicasIDB(){
    try{
        const db = await abrirDB();
        return new Promise((resolve) => {
            const tx = db.transaction(DB_STORE_AUDIO, "readwrite");
            const store = tx.objectStore(DB_STORE_AUDIO);
            store.clear();
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    }catch(e){
        return false;
    }
}

async function salvarFichaIDB(id, estado){
    try{
        const db = await abrirDB();
        return new Promise((resolve) => {
            const tx = db.transaction(DB_STORE, "readwrite");
            const store = tx.objectStore(DB_STORE);
            store.put({ id, estado, atualizadoEm: estado.atualizadoEm });
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    }catch(e){
        return false;
    }
}

async function carregarFichaIDB(id){
    try{
        const db = await abrirDB();
        return new Promise((resolve) => {
            const tx = db.transaction(DB_STORE, "readonly");
            const store = tx.objectStore(DB_STORE);
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result ? req.result.estado : null);
            req.onerror = () => resolve(null);
        });
    }catch(e){
        return null;
    }
}

async function excluirFichaIDB(id){
    try{
        const db = await abrirDB();
        return new Promise((resolve) => {
            const tx = db.transaction(DB_STORE, "readwrite");
            const store = tx.objectStore(DB_STORE);
            store.delete(id);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    }catch(e){
        return false;
    }
}

function limparChavesOrfas(){
    try{
        const indice = carregarIndiceFichas();
        const idsValidos = new Set(indice.map(f=>f.id));
        if(fichaId) idsValidos.add(fichaId);

        const chavesParaRemover = [];
        for(let i = 0; i < localStorage.length; i++){
            const chave = localStorage.key(i);
            if(chave && chave.startsWith(CHAVE_PREFIXO+"ficha:") && !chave.endsWith(":index")){
                const id = chave.replace(CHAVE_PREFIXO+"ficha:", "");
                if(!idsValidos.has(id)){
                    chavesParaRemover.push(chave);
                }
            }
        }
        chavesParaRemover.forEach(ch => {
            try { localStorage.removeItem(ch); } catch(e){}
        });
    }catch(e){
        console.warn("Aviso ao limpar chaves órfãs:", e);
    }
}

/* ============================================================
   MECANISMO DE COMPRESSÃO LZ-STRING PARA LOCALSTORAGE
   Comprime o JSON das fichas em caracteres UTF-16 seguros,
   reduzindo o tamanho ocupado em até 70-85% e evitando
   estouro da cota de 5MB do navegador ao salvar imagens e
   estados complexos. Mantém total retrocompatibilidade.
   ============================================================ */
const LZStringStorage = (function(){
    const f = String.fromCharCode;
    const LZ = {
        compressToUTF16: function(input) {
            if (input == null) return "";
            return LZ._compress(input, 15, function(a) {
                return f(a + 32);
            }) + " ";
        },
        decompressFromUTF16: function(compressed) {
            if (compressed == null) return "";
            if (compressed === "") return null;
            return LZ._decompress(compressed.length, 16384, function(index) {
                return compressed.charCodeAt(index) - 32;
            });
        },
        _compress: function(uncompressed, bitsPerChar, getCharFromInt) {
            if (uncompressed == null) return "";
            let i, value,
                context_dictionary = {},
                context_dictionaryToCreate = {},
                context_c = "",
                context_wc = "",
                context_w = "",
                context_enlargeIn = 2,
                context_dictSize = 3,
                context_numBits = 2,
                context_data = [],
                context_data_val = 0,
                context_data_position = 0,
                ii;

            for (ii = 0; ii < uncompressed.length; ii += 1) {
                context_c = uncompressed.charAt(ii);
                if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
                    context_dictionary[context_c] = context_dictSize++;
                    context_dictionaryToCreate[context_c] = true;
                }

                context_wc = context_w + context_c;
                if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
                    context_w = context_wc;
                } else {
                    if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                        if (context_w.charCodeAt(0) < 256) {
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                            }
                            value = context_w.charCodeAt(0);
                            for (i = 0; i < 8; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        } else {
                            value = 1;
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1) | value;
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                                value = 0;
                            }
                            value = context_w.charCodeAt(0);
                            for (i = 0; i < 16; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        }
                        context_enlargeIn--;
                        if (context_enlargeIn == 0) {
                            context_enlargeIn = Math.pow(2, context_numBits);
                            context_numBits++;
                        }
                        delete context_dictionaryToCreate[context_w];
                    } else {
                        value = context_dictionary[context_w];
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    context_dictionary[context_wc] = context_dictSize++;
                    context_w = String(context_c);
                }
            }

            if (context_w !== "") {
                if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                    if (context_w.charCodeAt(0) < 256) {
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                        }
                        value = context_w.charCodeAt(0);
                        for (i = 0; i < 8; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    } else {
                        value = 1;
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1) | value;
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = 0;
                        }
                        value = context_w.charCodeAt(0);
                        for (i = 0; i < 16; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    delete context_dictionaryToCreate[context_w];
                } else {
                    value = context_dictionary[context_w];
                    for (i = 0; i < context_numBits; i++) {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position == bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(getCharFromInt(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0) {
                    context_enlargeIn = Math.pow(2, context_numBits);
                    context_numBits++;
                }
            }

            // Mark the end of the stream
            value = 2;
            for (i = 0; i < context_numBits; i++) {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                } else {
                    context_data_position++;
                }
                value = value >> 1;
            }

            // Flush the last char
            while (true) {
                context_data_val = (context_data_val << 1);
                if (context_data_position == bitsPerChar - 1) {
                    context_data.push(getCharFromInt(context_data_val));
                    break;
                } else context_data_position++;
            }
            return context_data.join('');
        },
        _decompress: function(length, resetValue, getNextValue) {
            let dictionary = [],
                next,
                enlargeIn = 4,
                dictSize = 4,
                numBits = 3,
                entry = "",
                result = [],
                i,
                w,
                bits, resb, maxpower, power,
                c,
                data = { val: getNextValue(0), position: resetValue, index: 1 };

            for (i = 0; i < 3; i += 1) {
                dictionary[i] = i;
            }

            bits = 0;
            maxpower = Math.pow(2, 2);
            power = 1;
            while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
            }

            switch (next = bits) {
                case 0:
                    bits = 0;
                    maxpower = Math.pow(2, 8);
                    power = 1;
                    while (power != maxpower) {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0) {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    c = f(bits);
                    break;
                case 1:
                    bits = 0;
                    maxpower = Math.pow(2, 16);
                    power = 1;
                    while (power != maxpower) {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0) {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    c = f(bits);
                    break;
                case 2:
                    return "";
            }
            dictionary[3] = c;
            w = c;
            result.push(c);
            while (true) {
                if (data.index > length) {
                    return "";
                }

                bits = 0;
                maxpower = Math.pow(2, numBits);
                power = 1;
                while (power != maxpower) {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position == 0) {
                        data.position = resetValue;
                        data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                }

                switch (c = bits) {
                    case 0:
                        bits = 0;
                        maxpower = Math.pow(2, 8);
                        power = 1;
                        while (power != maxpower) {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0) {
                                data.position = resetValue;
                                data.val = getNextValue(data.index++);
                            }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }

                        dictionary[dictSize++] = f(bits);
                        c = dictSize - 1;
                        enlargeIn--;
                        break;
                    case 1:
                        bits = 0;
                        maxpower = Math.pow(2, 16);
                        power = 1;
                        while (power != maxpower) {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0) {
                                data.position = resetValue;
                                data.val = getNextValue(data.index++);
                            }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }
                        dictionary[dictSize++] = f(bits);
                        c = dictSize - 1;
                        enlargeIn--;
                        break;
                    case 2:
                        return result.join('');
                }

                if (enlargeIn == 0) {
                    enlargeIn = Math.pow(2, numBits);
                    numBits++;
                }

                if (dictionary[c]) {
                    entry = dictionary[c];
                } else {
                    if (c === dictSize) {
                        entry = w + w.charAt(0);
                    } else {
                        return null;
                    }
                }
                result.push(entry);

                // Add w+entry[0] to the dictionary.
                dictionary[dictSize++] = w + entry.charAt(0);
                enlargeIn--;

                w = entry;

                if (enlargeIn == 0) {
                    enlargeIn = Math.pow(2, numBits);
                    numBits++;
                }
            }
        }
    };
    return LZ;
})();

const PREFIXO_COMPRESSAO_STORAGE = "LZC:v1:";

/* ============================================================
   MOTOR DE PROCESSAMENTO ASSÍNCRONO & SERIALIZAÇÃO NÃO-BLOQUEANTE
   Permite fatiar tarefas pesadas de serialização JSON e compressão
   em fatias de tempo de 6ms via requestAnimationFrame / setTimeout,
   garantindo fluidez a 60 FPS e zero congelamento na thread principal.
   ============================================================ */
function cederThreadPrincipal() {
    return new Promise(resolve => {
        if (typeof requestAnimationFrame !== "undefined") {
            requestAnimationFrame(() => resolve());
        } else {
            setTimeout(resolve, 0);
        }
    });
}

// Serializador JSON incremental/fatiado que gera a string sem travar a interface
async function serializarJSONAssincrono(obj, tamanhoLote = 30) {
    if (obj === null || obj === undefined) return JSON.stringify(obj);
    if (typeof obj !== "object") return JSON.stringify(obj);

    // Se for objeto simples sem grandes coleções, serializa direto
    if (Array.isArray(obj) && obj.length < 50) {
        return JSON.stringify(obj);
    }

    if (!Array.isArray(obj)) {
        // Serialização incremental das propriedades de primeiro nível
        const chaves = Object.keys(obj);
        const partes = [];
        let contador = 0;

        for (let i = 0; i < chaves.length; i++) {
            const k = chaves[i];
            const v = obj[k];
            const chaveJson = JSON.stringify(k);
            const valJson = JSON.stringify(v);
            partes.push(`${chaveJson}:${valJson}`);

            contador++;
            if (contador % tamanhoLote === 0) {
                await cederThreadPrincipal();
            }
        }
        return "{" + partes.join(",") + "}";
    } else {
        const partes = [];
        let contador = 0;
        for (let i = 0; i < obj.length; i++) {
            partes.push(JSON.stringify(obj[i]));
            contador++;
            if (contador % tamanhoLote === 0) {
                await cederThreadPrincipal();
            }
        }
        return "[" + partes.join(",") + "]";
    }
}

// Compressão assíncrona que processa o payload sem bloquear a UI
async function compactarDadosStorageAsync(dados) {
    if (dados === null || dados === undefined) return "";
    let textoJson = "";
    if (typeof dados === "string") {
        textoJson = dados;
    } else {
        textoJson = await serializarJSONAssincrono(dados);
    }

    try {
        await cederThreadPrincipal();
        const compactado = LZStringStorage.compressToUTF16(textoJson);
        if (compactado && compactado.length < textoJson.length) {
            return PREFIXO_COMPRESSAO_STORAGE + compactado;
        }
    } catch (e) {
        console.warn("Aviso ao compactar dados do localStorage de forma assíncrona:", e);
    }
    return textoJson;
}

function compactarDadosStorage(dados){
    if(dados === null || dados === undefined) return "";
    const textoJson = typeof dados === "string" ? dados : JSON.stringify(dados);
    try{
        const compactado = LZStringStorage.compressToUTF16(textoJson);
        if(compactado && compactado.length < textoJson.length){
            return PREFIXO_COMPRESSAO_STORAGE + compactado;
        }
    }catch(e){
        console.warn("Aviso ao compactar dados do localStorage:", e);
    }
    return textoJson;
}

function descompactarDadosStorage(bruto){
    if(!bruto || typeof bruto !== "string") return null;
    if(bruto.startsWith(PREFIXO_COMPRESSAO_STORAGE)){
        try{
            const descompactado = LZStringStorage.decompressFromUTF16(bruto.slice(PREFIXO_COMPRESSAO_STORAGE.length));
            if(descompactado){
                return JSON.parse(descompactado);
            }
        }catch(e){
            console.warn("Aviso ao descompactar dados do localStorage:", e);
        }
    }
    try{
        return JSON.parse(bruto);
    }catch(e){
        return null;
    }
}

async function otimizarArmazenamentoExistente(){
    limparChavesOrfas();
    try{
        const indice = carregarIndiceFichas();
        for(const item of indice){
            await cederThreadPrincipal();
            const chave = CHAVE_PREFIXO + "ficha:" + item.id;
            const bruto = localStorage.getItem(chave);
            if(bruto){
                const est = descompactarDadosStorage(bruto);
                if(est){
                    let mudou = false;
                    if(est.avatar && est.avatar.length > 50000){
                        try{
                            const avatarOtimizado = await otimizarImagemAvatar(est.avatar, 320, 420, 0.80);
                            if(avatarOtimizado && avatarOtimizado.length < est.avatar.length){
                                est.avatar = avatarOtimizado;
                                mudou = true;
                            }
                        }catch(eOtim){}
                    }
                    if(!bruto.startsWith(PREFIXO_COMPRESSAO_STORAGE) || mudou){
                        const novoCompactado = await compactarDadosStorageAsync(est);
                        try{
                            localStorage.setItem(chave, novoCompactado);
                            salvarFichaIDB(item.id, est).catch(()=>{});
                        }catch(eSalvar){}
                    }
                }
            }
        }
    }catch(e){
        console.warn("Aviso na otimização de segundo plano:", e);
    }
}

function carregarIndiceFichas(){
    try{
        const bruto = localStorage.getItem(CHAVE_PREFIXO+"fichas:index");
        if(!bruto) return [];
        return JSON.parse(bruto);
    }catch(e){
        return [];
    }
}

function salvarIndiceFichas(indice){
    localStorage.setItem(CHAVE_PREFIXO+"fichas:index", JSON.stringify(indice));
}

let salvamentoEmAndamento = false;
let proximoSalvamentoAgendado = null;

async function salvarFicha(silencioso = false){
    // Se já houver um salvamento ocorrendo, enfileira o mais recente e aguarda sem duplicar trabalho
    if(salvamentoEmAndamento){
        return new Promise((resolve) => {
            proximoSalvamentoAgendado = { silencioso, resolve };
        });
    }

    salvamentoEmAndamento = true;

    try{
        if(!fichaId) fichaId = gerarId();

        // Se o avatar na memória for pesado, otimiza antes de tentar persistir
        if(avatarAtual && avatarAtual.length > 60000){
            try{
                if(!silencioso) mostrarStatus("Compactando imagem do retrato...", "");
                avatarAtual = await otimizarImagemAvatar(avatarAtual, 320, 420, 0.80);
                aplicarAvatar();
            }catch(errOtim){
                console.warn("Aviso na compressão pré-salvamento:", errOtim);
            }
        }

        const estado = coletarEstadoFicha();
        let salvoComSucesso = false;

        // Cede a thread para a interface renderizar e responder a cliques/animações
        await cederThreadPrincipal();

        // Tentativa 1: salvar com compressão LZString e serialização não-bloqueante
        try{
            const payloadCompactado = await compactarDadosStorageAsync(estado);
            await cederThreadPrincipal();
            localStorage.setItem(CHAVE_PREFIXO+"ficha:"+fichaId, payloadCompactado);
            salvoComSucesso = true;
        }catch(errQuota){
            console.warn("Aviso de quota ao salvar no localStorage. Executando rotinas de alívio...", errQuota);

            // 1. Limpa chaves órfãs que possam estar ocupando espaço
            limparChavesOrfas();

            // 2. Comprime o avatar ainda mais agressivamente se estiver presente
            if(estado.avatar && estado.avatar.length > 25000){
                try{
                    estado.avatar = await otimizarImagemAvatar(estado.avatar, 240, 320, 0.70);
                    avatarAtual = estado.avatar;
                    aplicarAvatar();
                }catch(eComp){}
            }

            await cederThreadPrincipal();

            // 3. Tenta salvar novamente no localStorage comprimido de forma assíncrona
            try{
                const payloadCompactado2 = await compactarDadosStorageAsync(estado);
                localStorage.setItem(CHAVE_PREFIXO+"ficha:"+fichaId, payloadCompactado2);
                salvoComSucesso = true;
            }catch(errQuota2){
                console.warn("localStorage permaneceu cheio. Salvando no IndexedDB:", errQuota2);
                // 4. Salva ficha completa com imagem no IndexedDB (sem limite de 5MB)
                const salvoIDB = await salvarFichaIDB(fichaId, estado);
                if(salvoIDB){
                    // No localStorage, guarda uma versão leve comprimida para manter integridade da lista
                    const estadoLeve = {...estado, avatar: "", tipografia: null, musicas: null};
                    try{
                        const payloadLeve = await compactarDadosStorageAsync(estadoLeve);
                        localStorage.setItem(CHAVE_PREFIXO+"ficha:"+fichaId, payloadLeve);
                    }catch(eLeve){}
                    salvoComSucesso = true;
                }
            }
        }

        if(!salvoComSucesso){
            throw new Error("Espaço de armazenamento esgotado no navegador.");
        }

        // Backup de segurança assíncrono no IndexedDB (executado sem bloquear)
        salvarFichaIDB(fichaId, estado).catch(()=>{});

        const indice = carregarIndiceFichas();
        const existente = indice.find(f=>f.id===fichaId);
        if(existente){
            existente.nome = estado.nome;
            existente.atualizadoEm = estado.atualizadoEm;
        }else{
            indice.push({id: fichaId, nome: estado.nome, atualizadoEm: estado.atualizadoEm});
        }
        salvarIndiceFichas(indice);

        if(!silencioso){
            mostrarStatus("✓ Ficha \"" + estado.nome + "\" salva com sucesso.", "ok");
            if (typeof registrarSalvamentoManual === "function") {
                registrarSalvamentoManual();
            }
        }
        limparAlteracoesNaoSalvas();
        renderizarListaFichas();
    }catch(e){
        console.error("Erro ao salvar ficha:", e);
        if(!silencioso){
            if(e && (e.name === "QuotaExceededError" || e.code === 22 || (e.message && (e.message.includes("quota") || e.message.includes("espaço"))))){
                mostrarStatus("✗ Espaço local insuficiente. Exporte a ficha em .json ou exclua fichas antigas.", "erro");
            }else{
                mostrarStatus("✗ Não foi possível salvar a ficha. Tente novamente ou use Exportar .json.", "erro");
            }
        }
    } finally {
        salvamentoEmAndamento = false;
        // Se houve chamadas enfileiradas enquanto este salvamento processava, executa o próximo
        if(proximoSalvamentoAgendado){
            const proximo = proximoSalvamentoAgendado;
            proximoSalvamentoAgendado = null;
            salvarFicha(proximo.silencioso).then(proximo.resolve).catch(proximo.resolve);
        }
    }
}

function salvarComoNovaFicha(){
    // Força a criação de uma ficha nova, mesmo que já exista uma carregada.
    fichaId = null;
    salvarFicha();
}

function solicitarCarregarFicha(id, nome){
    if(fichaId === id && !temAlteracoesNaoSalvas){
        mostrarStatus("Esta ficha já está aberta.", "");
        return;
    }

    if(temAlteracoesNaoSalvas){
        abrirModalConfirmacao({
            titulo: "Deseja salvar a ficha antes de sair?",
            icone: "💾",
            tema: "tema-salvar",
            mensagem: `A ficha atual possui alterações não salvas que serão perdidas ao carregar outro personagem.<br><br>Deseja salvar as alterações da ficha atual antes de abrir <strong>"${escapeHTML(nome || "esta ficha")}"</strong>?`,
            rotuloExtra: "Salvar e Abrir",
            aoConfirmarExtra: async () => {
                await salvarFicha();
                await carregarFicha(id);
            },
            rotuloConfirmar: "Descartar e Abrir",
            aoConfirmar: async () => {
                await carregarFicha(id);
            }
        });
        return;
    }

    carregarFicha(id);
}

async function carregarFicha(id){
    try{
        let estado = null;
        const bruto = localStorage.getItem(CHAVE_PREFIXO+"ficha:"+id);
        if(bruto){
            estado = descompactarDadosStorage(bruto);
        }

        // Se a ficha no localStorage não tiver avatar, tipografia ou músicas, ou se não existir no localStorage, busca no IndexedDB
        if(!estado || !estado.avatar || !estado.tipografia || !estado.musicas){
            const estadoIDB = await carregarFichaIDB(id);
            if(estadoIDB){
                if(!estado){
                    estado = estadoIDB;
                } else {
                    if(!estado.avatar && estadoIDB.avatar){
                        estado.avatar = estadoIDB.avatar;
                    }
                    if(!estado.tipografia && estadoIDB.tipografia){
                        estado.tipografia = estadoIDB.tipografia;
                    }
                    if(!estado.musicas && estadoIDB.musicas){
                        estado.musicas = estadoIDB.musicas;
                    }
                }
            }
        }

        if(!estado){
            mostrarStatus("✗ Ficha não encontrada.", "erro");
            return;
        }
        fichaId = id;
        aplicarEstadoFicha(estado);
        mostrarStatus("✓ Ficha \"" + estado.nome + "\" carregada.", "ok");
    }catch(e){
        console.error("Erro ao carregar ficha:", e);
        mostrarStatus("✗ Não foi possível carregar a ficha.", "erro");
    }
}

function escapeHTML(str){
    if(!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function solicitarExcluirFicha(id, nome){
    const nomeFicha = nome || "Ficha sem nome";
    abrirModalConfirmacao({
        titulo: "Excluir Ficha",
        icone: "🗑",
        mensagem: `Tem certeza que deseja excluir permanentemente a ficha <strong>"${escapeHTML(nomeFicha)}"</strong>?<br><span style="display:block;margin-top:8px;font-size:0.9em;opacity:0.85;color:var(--ink-faint);">Esta ação removerá a ficha salva do seu navegador e não poderá ser desfeita.</span>`,
        rotuloConfirmar: "Sim, Excluir Ficha",
        aoConfirmar: async () => {
            await confirmarExcluirFicha(id, nomeFicha);
        }
    });
}

async function confirmarExcluirFicha(id, nome){
    try{
        localStorage.removeItem(CHAVE_PREFIXO+"ficha:"+id);
        await excluirFichaIDB(id);
        const indice = carregarIndiceFichas();
        const novoIndice = indice.filter(f=>f.id!==id);
        salvarIndiceFichas(novoIndice);

        if(fichaId === id){
            fichaId = null;
        }

        mostrarStatus("✓ Ficha \"" + nome + "\" excluída com sucesso.", "ok");
        renderizarListaFichas();
    }catch(e){
        console.error("Erro ao excluir ficha:", e);
        mostrarStatus("✗ Não foi possível excluir a ficha.", "erro");
    }
}

// Mantém compatibilidade com chamadas diretas
function excluirFicha(id, nome){
    solicitarExcluirFicha(id, nome);
}

function novaFicha(){
    if(temAlteracoesNaoSalvas){
        abrirModalConfirmacao({
            titulo: "Deseja salvar a ficha antes de sair?",
            icone: "💾",
            tema: "tema-salvar",
            mensagem: `Você realizou alterações na ficha atual que ainda <strong>não foram salvas</strong>.<br><br>Deseja salvar as alterações antes de iniciar uma Nova Ficha?`,
            rotuloExtra: "Salvar e Continuar",
            aoConfirmarExtra: async () => {
                await salvarFicha();
                resetarFichaParaPadrao();
            },
            rotuloConfirmar: "Descartar Alterações",
            aoConfirmar: () => {
                resetarFichaParaPadrao();
            }
        });
        return;
    }

    abrirModalConfirmacao({
        titulo: "Criar Nova Ficha",
        icone: "↺",
        mensagem: `Deseja limpar todos os campos para iniciar uma <strong>Nova Ficha</strong> do zero?<br><span style="display:block;margin-top:8px;font-size:0.9em;opacity:0.85;color:var(--ink-faint);">Esta ação deixará a ficha pronta para um novo personagem.</span>`,
        rotuloConfirmar: "Criar Nova Ficha",
        aoConfirmar: () => {
            resetarFichaParaPadrao();
        }
    });
}

function resetarFichaParaPadrao(){
    fichaId = null;
    const estadoPadrao = {
        nome: "Novo Personagem",
        identidade: "Novo Personagem",
        temNomeSocial: false,
        nomeSocial: "",
        temCodinome: false,
        codinome: "",
        trocarPorCodinome: false,
        titulo: "",
        nivel: "",
        classe1: "",
        classe2: "",
        avatar: "",
        cor: "#c9b183",
        contornoAtivo: false,
        contornoCor: "#ffffff",
        recursos: {
            vida: { atual: 100, max: 100, temp: 0 },
            mental: { atual: 50, max: 50, temp: 0 },
            estamina: { atual: 80, max: 80, temp: 0 },
            aura: { atual: 30, max: 30, temp: 0 }
        },
        atributos: { HPR: 1, PRX: 1, PSI: 1, QI: 1 },
        pontosPuros: {},
        pontosBonus: {},
        baseSelects: {},
        personalizadas: [],
        inventario: {
            cargaMaxima: 20.0,
            compartimentos: clonarCompartimentosPadrao(),
            itens: []
        },
        conquistas: {
            campanha: [],
            desbloqueadas: []
        }
    };
    aplicarEstadoFicha(estadoPadrao);
    limparAlteracoesNaoSalvas();
    renderizarListaFichas();
    mostrarStatus("✓ Ficha limpa. Pronto para criar um novo personagem.", "ok");
}

function formatarData(iso){
    try{
        const d = new Date(iso);
        return d.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'}) +
               " às " + d.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
    }catch(e){
        return "";
    }
}

/* ============================================================
   SELEÇÃO MÚLTIPLA E EXCLUSÃO EM LOTE DE FICHAS SALVAS
   ============================================================ */
let modoSelecaoFichas = false;
let fichasSelecionadasSet = new Set();

function alternarModoSelecaoFichas(){
    const indice = carregarIndiceFichas();
    if(!indice || indice.length === 0){
        mostrarStatus("Não há fichas salvas para selecionar.", "aviso");
        return;
    }
    modoSelecaoFichas = !modoSelecaoFichas;
    fichasSelecionadasSet.clear();
    renderizarListaFichas();
}

function cancelarModoSelecaoFichas(){
    modoSelecaoFichas = false;
    fichasSelecionadasSet.clear();
    renderizarListaFichas();
}

function toggleSelecaoFicha(id){
    if(fichasSelecionadasSet.has(id)){
        fichasSelecionadasSet.delete(id);
    } else {
        fichasSelecionadasSet.add(id);
    }
    atualizarControlesSelecaoFichas();
    const itens = document.querySelectorAll("#lista-fichas-salvas .ficha-salva-item");
    itens.forEach(item => {
        if(item.dataset.fichaId === id){
            const isSel = fichasSelecionadasSet.has(id);
            item.classList.toggle("selecionada", isSel);
            const chk = item.querySelector(".ficha-salva-checkbox");
            if(chk) chk.checked = isSel;
        }
    });
}

function selecionarTodasFichas(){
    const indice = carregarIndiceFichas();
    fichasSelecionadasSet.clear();
    indice.forEach(f => fichasSelecionadasSet.add(f.id));
    atualizarControlesSelecaoFichas();
    renderizarListaFichas();
}

function desmarcarTodasFichas(){
    fichasSelecionadasSet.clear();
    atualizarControlesSelecaoFichas();
    renderizarListaFichas();
}

function atualizarControlesSelecaoFichas(){
    const qtdNumEl = document.getElementById("qtd-fichas-selecionadas-num");
    const btnExcluir = document.getElementById("btn-excluir-selecionadas");
    const btnToggle = document.getElementById("btn-toggle-selecao-fichas");
    const txtToggle = document.getElementById("txt-toggle-selecao-fichas");
    const barraLote = document.getElementById("ficha-selecao-barra-lote");

    const qtd = fichasSelecionadasSet.size;
    if(qtdNumEl) qtdNumEl.textContent = qtd;
    if(btnExcluir) btnExcluir.disabled = (qtd === 0);

    if(barraLote && btnToggle){
        if(modoSelecaoFichas){
            barraLote.style.display = "flex";
            btnToggle.style.display = "none";
            btnToggle.classList.add("ativo-modo");
        } else {
            barraLote.style.display = "none";
            btnToggle.style.display = "inline-flex";
            btnToggle.classList.remove("ativo-modo");
            if(txtToggle) txtToggle.textContent = "Selecionar Múltiplas";
        }
    }
}

function solicitarExcluirFichasSelecionadas(){
    const qtd = fichasSelecionadasSet.size;
    if(qtd === 0) return;

    const indice = carregarIndiceFichas();
    const fichasParaExcluir = indice.filter(f => fichasSelecionadasSet.has(f.id));
    if(!fichasParaExcluir.length) return;

    const listaNomesHTML = fichasParaExcluir.map(f => `<li><strong>${escapeHTML(f.nome || "Ficha sem nome")}</strong> <span style="font-size:0.85em;color:var(--ink-faint);">(${formatarData(f.atualizadoEm)})</span></li>`).join("");

    abrirModalConfirmacao({
        titulo: "Excluir Fichas Selecionadas",
        icone: "🗑",
        mensagem: `Tem certeza que deseja excluir permanentemente as <strong>${qtd} ${qtd === 1 ? 'ficha selecionada' : 'fichas selecionadas'}</strong>?<br><div style="margin:10px 0;max-height:140px;overflow-y:auto;background:var(--bg-inset);padding:8px 12px;border:1px solid var(--line);border-radius:3px;text-align:left;"><ul style="margin:0;padding-left:18px;font-size:0.92em;display:flex;flex-direction:column;gap:4px;">${listaNomesHTML}</ul></div><span style="display:block;margin-top:8px;font-size:0.9em;opacity:0.85;color:var(--ink-faint);">Esta ação removerá as fichas salvas do navegador e não poderá ser desfeita.</span>`,
        rotuloConfirmar: `Sim, Excluir ${qtd} ${qtd === 1 ? 'Ficha' : 'Fichas'}`,
        aoConfirmar: async () => {
            await confirmarExclusaoMultiplasFichas(fichasParaExcluir);
        }
    });
}

async function confirmarExclusaoMultiplasFichas(fichasParaExcluir){
    try{
        for(const f of fichasParaExcluir){
            localStorage.removeItem(CHAVE_PREFIXO+"ficha:"+f.id);
            try{
                await excluirFichaIDB(f.id);
            }catch(errIdb){
                console.warn("Erro ao excluir ficha do IndexedDB:", f.id, errIdb);
            }
            if(fichaId === f.id){
                fichaId = null;
            }
        }

        const idsExcluidos = new Set(fichasParaExcluir.map(f => f.id));
        const indice = carregarIndiceFichas();
        const novoIndice = indice.filter(f => !idsExcluidos.has(f.id));
        salvarIndiceFichas(novoIndice);

        const totalExcluidas = fichasParaExcluir.length;
        fichasSelecionadasSet.clear();
        modoSelecaoFichas = false;

        mostrarStatus(`✓ ${totalExcluidas} ${totalExcluidas === 1 ? 'ficha excluída' : 'fichas excluídas'} com sucesso.`, "ok");
        renderizarListaFichas();
    }catch(e){
        console.error("Erro ao excluir múltiplas fichas:", e);
        mostrarStatus("✗ Ocorreu um erro ao excluir algumas fichas.", "erro");
    }
}

function renderizarListaFichas(){
    const container = document.getElementById("lista-fichas-salvas");
    const badge = document.getElementById("qtd-fichas-salvas");
    const btnToggle = document.getElementById("btn-toggle-selecao-fichas");
    const indice = carregarIndiceFichas();

    if(badge){
        badge.textContent = indice.length === 1 ? "1 salva" : indice.length + " salvas";
    }

    if(!indice.length){
        modoSelecaoFichas = false;
        fichasSelecionadasSet.clear();
        atualizarControlesSelecaoFichas();
        if(btnToggle) btnToggle.disabled = true;
        if(container) container.innerHTML = '<div class="vazio-aviso">Nenhuma ficha salva ainda. Use "Salvar Ficha" para arquivar o personagem atual.</div>';
        return;
    }

    if(btnToggle) btnToggle.disabled = false;
    atualizarControlesSelecaoFichas();

    indice.sort((a,b)=> new Date(b.atualizadoEm) - new Date(a.atualizadoEm));

    container.innerHTML = "";
    indice.forEach(f=>{
        const isAberta = (fichaId === f.id);
        const isSelecionada = fichasSelecionadasSet.has(f.id);
        const item = document.createElement("div");
        item.className = "ficha-salva-item" + (isAberta ? " ativa" : "") + (modoSelecaoFichas ? " modo-selecao" : "") + (isSelecionada ? " selecionada" : "");
        item.dataset.fichaId = f.id;

        if(modoSelecaoFichas){
            item.onclick = () => {
                toggleSelecaoFicha(f.id);
            };

            const checkWrap = document.createElement("div");
            checkWrap.className = "ficha-salva-checkbox-wrap";
            const chk = document.createElement("input");
            chk.type = "checkbox";
            chk.className = "ficha-salva-checkbox";
            chk.checked = isSelecionada;
            chk.onclick = (e) => {
                e.stopPropagation();
                toggleSelecaoFicha(f.id);
            };
            checkWrap.appendChild(chk);
            item.appendChild(checkWrap);
        }

        const info = document.createElement("div");
        info.className = "ficha-salva-info";

        const topoRow = document.createElement("div");
        topoRow.className = "ficha-salva-topo-row";

        const nomeEl = document.createElement("div");
        nomeEl.className = "ficha-salva-nome";
        nomeEl.textContent = f.nome;
        topoRow.appendChild(nomeEl);

        if(isAberta){
            const tag = document.createElement("span");
            tag.className = "tag-aberta";
            tag.textContent = "ativa";
            topoRow.appendChild(tag);
        }

        const dataEl = document.createElement("div");
        dataEl.className = "ficha-salva-data";
        dataEl.textContent = formatarData(f.atualizadoEm);
        info.append(topoRow, dataEl);
        item.appendChild(info);

        if(!modoSelecaoFichas){
            const btns = document.createElement("div");
            btns.className = "ficha-salva-btns";

            const btnAbrir = document.createElement("button");
            btnAbrir.type = "button";
            btnAbrir.className = "btn-mini";
            btnAbrir.textContent = "Abrir";
            btnAbrir.onclick = (e)=>{
                e.stopPropagation();
                solicitarCarregarFicha(f.id, f.nome);
            };

            const btnExcluir = document.createElement("button");
            btnExcluir.type = "button";
            btnExcluir.className = "btn-mini perigo";
            btnExcluir.textContent = "Excluir";
            btnExcluir.onclick = (e)=>{
                e.stopPropagation();
                solicitarExcluirFicha(f.id, f.nome);
            };

            btns.append(btnAbrir, btnExcluir);
            item.appendChild(btns);
        }

        container.appendChild(item);
    });
}

function exportarJSON(){
    const estado = coletarEstadoFicha();
    if (!estado.idNavegadorCriador) {
        estado.idNavegadorCriador = (typeof obterIdNavegadorLocal === "function") ? (window._idNavegadorCriadorFicha || obterIdNavegadorLocal()) : "was_nav_padrao";
    }
    const blob = new Blob([JSON.stringify(estado, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const nomeArquivo = (estado.nome || "ficha").replace(/[^a-zA-Z0-9À-ÿ_ -]/g,"").trim() || "ficha";
    a.href = url;
    a.download = nomeArquivo + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    mostrarStatus("✓ Arquivo exportado.", "ok");
}

function importarJSON(event){
    const arquivo = event.target.files[0];
    if(!arquivo) return;

    const processarImportacao = () => {
        const leitor = new FileReader();
        leitor.onload = async function(e){
            try{
                const estado = JSON.parse(e.target.result);
                estado.importada = true;
                estado.criadaNesteNavegador = false;
                fichaId = null; // importar sempre cria uma ficha "nova" (não salva ainda)
                if(estado.avatar && estado.avatar.length > 60000){
                    mostrarStatus("Otimizando retrato da ficha importada...", "");
                    try{
                        estado.avatar = await otimizarImagemAvatar(estado.avatar, 320, 420, 0.82);
                    }catch(errOtim){}
                }
                aplicarEstadoFicha(estado);
                marcarAlteracaoFeita();
                mostrarStatus("✓ Ficha \"" + (estado.nome||"") + "\" importada. Clique em Salvar para guardá-la.", "ok");
            }catch(err){
                console.error("Erro ao importar JSON:", err);
                mostrarStatus("✗ Arquivo inválido. Verifique se é um .json exportado por esta ficha.", "erro");
            }
            event.target.value = "";
        };
        leitor.onerror = function(){
            mostrarStatus("✗ Não foi possível ler o arquivo.", "erro");
            event.target.value = "";
        };
        leitor.readAsText(arquivo);
    };

    if(temAlteracoesNaoSalvas){
        abrirModalConfirmacao({
            titulo: "Deseja salvar a ficha antes de sair?",
            icone: "💾",
            tema: "tema-salvar",
            mensagem: `Você realizou alterações na ficha atual que ainda <strong>não foram salvas</strong>.<br><br>Deseja salvar a ficha atual antes de importar outro arquivo?`,
            rotuloExtra: "Salvar e Importar",
            aoConfirmarExtra: async () => {
                await salvarFicha();
                processarImportacao();
            },
            rotuloConfirmar: "Substituir sem Salvar",
            aoConfirmar: () => {
                processarImportacao();
            }
        });
        return;
    }

    processarImportacao();
}

function inicializarStorage(){
    const statusEl = document.getElementById("status-storage");
    try{
        atualizarUIModoSalvamento();
        renderizarListaFichas();
        statusEl.textContent = "Fichas salvas neste navegador — use Exportar para levar a ficha a outro dispositivo.";
        otimizarArmazenamentoExistente();
    }catch(e){
        console.error("Erro ao inicializar localStorage:", e);
        statusEl.textContent = "⚠ Este navegador não permite salvar fichas localmente. Use Exportar/Importar em .json.";
    }
}

function alternarTodasCategorias(abrir){
    const grupos = document.querySelectorAll('#painel-pericias .categoria-grupo');
    grupos.forEach(grupo => {
        if(abrir){
            grupo.setAttribute('open', '');
        } else {
            grupo.removeAttribute('open');
        }
    });
}

function inicializarAbasCategorias(){
    if(window.innerWidth <= 768){
        alternarTodasCategorias(false);
    }
}

let ultimaLarguraJanela = window.innerWidth;
window.addEventListener('resize', () => {
    const agoraEhMobile = window.innerWidth <= 768;
    const antesEraMobile = ultimaLarguraJanela <= 768;
    if(agoraEhMobile !== antesEraMobile){
        alternarTodasCategorias(!agoraEhMobile);
    }
    ultimaLarguraJanela = window.innerWidth;
});

/* ============================================================
   HISTÓRICO DAS ÚLTIMAS 10 ROLAGENS
   ============================================================ */
let historicoRolagens = [];
const MAX_HISTORICO_ROLAGENS = 10;
const STORAGE_HISTORICO_KEY = "we_are_strangers_historico_rolagens";

function inicializarHistoricoRolagens() {
    try {
        const salvo = localStorage.getItem(STORAGE_HISTORICO_KEY);
        if (salvo) {
            const parsed = JSON.parse(salvo);
            if (Array.isArray(parsed)) {
                historicoRolagens = parsed.slice(0, MAX_HISTORICO_ROLAGENS);
            }
        }
    } catch (e) {
        historicoRolagens = [];
    }
    atualizarBadgeHistorico();
}

function salvarHistoricoNoStorage() {
    try {
        localStorage.setItem(STORAGE_HISTORICO_KEY, JSON.stringify(historicoRolagens));
    } catch (e) {}
}

function registrarRolagemHistorico(item) {
    historicoRolagens.unshift(item);
    if (historicoRolagens.length > MAX_HISTORICO_ROLAGENS) {
        historicoRolagens.length = MAX_HISTORICO_ROLAGENS;
    }
    salvarHistoricoNoStorage();
    atualizarBadgeHistorico();

    const modal = document.getElementById("modal-historico");
    if (modal && modal.classList.contains("aberto")) {
        renderizarListaHistorico();
    }
}

function atualizarBadgeHistorico() {
    const badge = document.getElementById("historico-badge-qtd");
    if (badge) {
        badge.textContent = String(historicoRolagens.length);
    }
    const contador = document.getElementById("modal-historico-contador");
    if (contador) {
        contador.textContent = `${historicoRolagens.length} de ${MAX_HISTORICO_ROLAGENS} rolagens registradas`;
    }
}

function abrirModalHistorico() {
    renderizarListaHistorico();
    atualizarBadgeHistorico();
    const modal = document.getElementById("modal-historico");
    if (modal) {
        modal.style.display = "flex";
        void modal.offsetWidth;
        modal.classList.add("aberto");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }
}

function fecharModalHistorico() {
    const modal = document.getElementById("modal-historico");
    if (modal) {
        modal.classList.remove("aberto");
        modal.setAttribute("aria-hidden", "true");
        setTimeout(() => {
            if (!modal.classList.contains("aberto")) {
                modal.style.display = "none";
            }
        }, 220);
        document.body.style.overflow = "";
    }
}

function fecharModalHistoricoPorOverlay(event) {
    if (event.target === document.getElementById("modal-historico")) {
        fecharModalHistorico();
    }
}

function limparHistoricoRolagens() {
    if (historicoRolagens.length === 0) return;
    historicoRolagens = [];
    try {
        localStorage.removeItem(STORAGE_HISTORICO_KEY);
    } catch (e) {}
    atualizarBadgeHistorico();
    renderizarListaHistorico();
}

function renderizarListaHistorico() {
    const listaEl = document.getElementById("modal-historico-lista");
    if (!listaEl) return;

    if (historicoRolagens.length === 0) {
        listaEl.innerHTML = `
            <div class="historico-vazio">
                <span class="historico-vazio-icone">📜</span>
                <div style="color:var(--ink);font-weight:500;">Nenhuma rolagem registrada ainda.</div>
                <div style="font-size:13px;opacity:0.7;">Clique no botão "Rolar Dados" de qualquer perícia para que o teste seja gravado aqui.</div>
            </div>
        `;
        return;
    }

    let html = "";
    historicoRolagens.forEach((item, index) => {
        const tipoClass = item.faixaTipo === "desastre" ? "tipo-desastre" : (item.faixaTipo === "amaldicoado" ? "tipo-amaldicoado" : "");
        const badgeClass = item.faixaTipo === "desastre" ? "desastre" : (item.faixaTipo === "amaldicoado" ? "amaldicoado" : "normal");

        let dadosChipsHtml = "";
        if (item.atributoZerado) {
            dadosChipsHtml = `<span style="color:var(--accent-dim);font-size:11px;margin-right:2px;">2D6 (menor):</span> ` +
                item.dados.map(d => `<span class="historico-dado-chip">${d}</span>`).join(" e ") +
                ` → <strong style="color:var(--ink);">${item.somaDados}</strong>`;
        } else if (item.dados.length > 0) {
            dadosChipsHtml = `<span style="color:var(--accent-dim);font-size:11px;margin-right:2px;">${item.quantidadeDados}D6:</span> ` +
                item.dados.map(d => `<span class="historico-dado-chip">${d}</span>`).join(" + ") +
                ` = <strong style="color:var(--ink);">${item.somaDados}</strong>`;
        } else {
            dadosChipsHtml = `<span style="font-size:11px;color:var(--ink-faint);">0D6 (0)</span>`;
        }

        const auxHtml = (item.somaAtributos > 0)
            ? `<span>Aux: <strong style="color:var(--ink);">+${item.somaAtributos}</strong></span>`
            : "";

        const ptsFormatado = (item.totalPontos >= 0 ? "+" : "") + item.totalPontos;
        const ptsHtml = `<span>Pts: <strong style="color:var(--ink);">${ptsFormatado}</strong></span>`;

        html += `
            <div class="historico-card ${tipoClass}">
                <div class="historico-card-topo">
                    <div class="historico-card-pericia-bloco">
                        <span class="historico-pericia-indice">#${index + 1}</span>
                        <span class="historico-pericia-nome">${item.pericia}</span>
                        <span class="historico-horario">${item.horario}</span>
                    </div>
                    <div class="historico-card-resultado-bloco">
                        <span class="historico-resultado-num">${item.resultadoFinal}</span>
                        <span class="historico-resultado-badge ${badgeClass}">${item.faixaNome}</span>
                    </div>
                </div>
                <div class="historico-detalhes">
                    <div class="historico-item-dado-chips">
                        ${dadosChipsHtml}
                    </div>
                    ${auxHtml}
                    ${ptsHtml}
                    <div class="historico-calculo-formula">
                        (${item.somaDados} dados + ${item.somaAtributos} aux + ${item.totalPontos} pts = ${item.resultadoFinal})
                    </div>
                </div>
            </div>
        `;
    });

    listaEl.innerHTML = html;
}

// Fechar modais com tecla Escape
document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        const popupAtalho = document.getElementById("popup-atalho-rolagem");
        if (popupAtalho && popupAtalho.classList.contains("aberto")) {
            if (typeof fecharPopupRolagemAtalho === "function") {
                fecharPopupRolagemAtalho();
                return;
            }
        }
        const modalConf = document.getElementById("modal-confirmacao");
        if(modalConf && modalConf.style.display !== "none" && modalConf.classList.contains("aberto")){
            fecharModalConfirmacao();
            return;
        }
        fecharModalHistoricoPorEscape(e);
    }
});

function fecharModalHistoricoPorEscape(e) {
    const modal = document.getElementById("modal-historico");
    if (modal && modal.style.display !== "none") {
        fecharModalHistorico();
    }
}

/* ============================================================
   CONTROLE DO MODAL DE CONFIRMAÇÃO SEGURO (IN-IFRAME)
   ============================================================ */
let modalConfirmacaoCallback = null;
let modalConfirmacaoExtraCallback = null;

function abrirModalConfirmacao({
    titulo,
    icone = "⚠",
    mensagem,
    rotuloConfirmar = "Confirmar",
    aoConfirmar,
    rotuloExtra = null,
    aoConfirmarExtra = null,
    tema = null
}){
    const modal = document.getElementById("modal-confirmacao");
    if(!modal) return;

    const janelaEl = document.getElementById("modal-confirm-janela");
    const tituloEl = document.getElementById("modal-confirm-titulo");
    const msgEl = document.getElementById("modal-confirm-msg");
    const btnAcao = document.getElementById("btn-modal-confirm-acao");
    const btnExtra = document.getElementById("btn-modal-confirm-extra");

    if(janelaEl){
        janelaEl.classList.remove("tema-salvar");
        if(tema){
            janelaEl.classList.add(tema);
        }
    }

    if(tituloEl) {
        tituloEl.innerHTML = `<span class="modal-confirm-icone" id="modal-confirm-icone">${icone}</span> ${escapeHTML(titulo || "Confirmar")}`;
    }
    if(msgEl) {
        msgEl.innerHTML = mensagem || "Tem certeza?";
    }
    if(btnAcao) {
        btnAcao.textContent = rotuloConfirmar;
    }

    if(btnExtra){
        if(rotuloExtra && typeof aoConfirmarExtra === "function"){
            btnExtra.textContent = rotuloExtra;
            btnExtra.style.display = "inline-flex";
            modalConfirmacaoExtraCallback = aoConfirmarExtra;
        }else{
            btnExtra.style.display = "none";
            modalConfirmacaoExtraCallback = null;
        }
    }

    modalConfirmacaoCallback = aoConfirmar;
    modal.style.display = "flex";
    requestAnimationFrame(() => {
        modal.classList.add("aberto");
        modal.setAttribute("aria-hidden", "false");
    });
}

function fecharModalConfirmacao(){
    const modal = document.getElementById("modal-confirmacao");
    if(!modal) return;
    modal.classList.remove("aberto");
    modal.setAttribute("aria-hidden", "true");
    setTimeout(() => {
        if(!modal.classList.contains("aberto")){
            modal.style.display = "none";
        }
    }, 200);
    modalConfirmacaoCallback = null;
    modalConfirmacaoExtraCallback = null;
}

function fecharModalConfirmacaoPorOverlay(e){
    if(e.target === document.getElementById("modal-confirmacao")){
        fecharModalConfirmacao();
    }
}

function executarConfirmacao(){
    if(typeof modalConfirmacaoCallback === "function"){
        const cb = modalConfirmacaoCallback;
        modalConfirmacaoCallback = null;
        modalConfirmacaoExtraCallback = null;
        fecharModalConfirmacao();
        try {
            cb();
        } catch(err) {
            console.error("Erro ao executar confirmação:", err);
        }
    } else {
        fecharModalConfirmacao();
    }
}

function executarConfirmacaoExtra(){
    if(typeof modalConfirmacaoExtraCallback === "function"){
        const cb = modalConfirmacaoExtraCallback;
        modalConfirmacaoExtraCallback = null;
        modalConfirmacaoCallback = null;
        fecharModalConfirmacao();
        try {
            cb();
        } catch(err) {
            console.error("Erro ao executar confirmação extra:", err);
        }
    } else {
        fecharModalConfirmacao();
    }
}

/* ============================================================
   CONTROLE DE TEMA (MODO CLARO / ESCURO)
   ============================================================ */
function aplicarModoTema(modo, salvarStorage = true) {
    modoClaroAtivo = (modo === "claro");
    if (modoClaroAtivo) {
        document.documentElement.setAttribute("data-theme", "claro");
        document.body.classList.add("modo-claro");
    } else {
        document.documentElement.removeAttribute("data-theme");
        document.body.classList.remove("modo-claro");
    }

    const icone = document.getElementById("btn-tema-icone");
    const rotulo = document.getElementById("btn-tema-rotulo");
    const botao = document.getElementById("btn-tema-toggle");

    if (icone && rotulo && botao) {
        if (modoClaroAtivo) {
            icone.textContent = "🌙";
            rotulo.textContent = "Modo Escuro";
            botao.title = "Mudar para Modo Escuro";
            botao.setAttribute("aria-label", "Mudar para Modo Escuro");
        } else {
            icone.textContent = "☀️";
            rotulo.textContent = "Modo Claro";
            botao.title = "Mudar para Modo Claro";
            botao.setAttribute("aria-label", "Mudar para Modo Claro");
        }
    }

    if (salvarStorage) {
        try {
            localStorage.setItem(STORAGE_TEMA_KEY, modoClaroAtivo ? "claro" : "escuro");
        } catch (e) {}
    }

    if (typeof verificarGatilhoAntiContraste === "function") {
        verificarGatilhoAntiContraste();
    }
}

let _historicoAlternanciaTema = [];
function verificarGatilhoEpileptico() {
    if (window._bloqueioEpilepticoEmAndamento) return;
    const eSPECtadorDesbloqueado = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
        (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));
    if (!eSPECtadorDesbloqueado) {
        _historicoAlternanciaTema = [];
        return;
    }
    const agora = Date.now();
    _historicoAlternanciaTema.push(agora);
    // Mantém apenas alternâncias feitas nos últimos 5.5 segundos
    _historicoAlternanciaTema = _historicoAlternanciaTema.filter(t => agora - t <= 5500);
    if (_historicoAlternanciaTema.length >= 10) {
        if (typeof desbloquearConquistaSecreta === "function") {
            desbloquearConquistaSecreta("sec_epileptico");
        }
        _historicoAlternanciaTema = [];
    }
}

function alternarMenuCabecalho(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById("cabecalho-botoes-grupo");
    if (!menu) return;
    const aberto = menu.classList.contains("menu-aberto") || menu.style.display === "flex";
    if (aberto) {
        fecharMenuCabecalho();
    } else {
        abrirMenuCabecalho();
    }
}

function abrirMenuCabecalho() {
    const menu = document.getElementById("cabecalho-botoes-grupo");
    const btn = document.getElementById("btn-cabecalho-hamburguer");
    if (menu) {
        menu.classList.add("menu-aberto");
        menu.style.display = "flex";
    }
    if (btn) {
        btn.classList.add("ativo");
        btn.setAttribute("aria-expanded", "true");
    }
}

function fecharMenuCabecalho() {
    const menu = document.getElementById("cabecalho-botoes-grupo");
    const btn = document.getElementById("btn-cabecalho-hamburguer");
    if (menu) {
        menu.classList.remove("menu-aberto");
        menu.style.display = "none";
    }
    if (btn) {
        btn.classList.remove("ativo");
        btn.setAttribute("aria-expanded", "false");
    }
}

document.addEventListener("click", function(e) {
    const wrap = document.getElementById("cabecalho-controles-wrap");
    if (wrap && !wrap.contains(e.target)) {
        fecharMenuCabecalho();
    }
});

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        fecharMenuCabecalho();
    }
});

function alternarModoTema() {
    if (window._bloqueioEpilepticoEmAndamento) return;
    aplicarModoTema(modoClaroAtivo ? "escuro" : "claro", true);
    verificarGatilhoEpileptico();
}

function inicializarModoTema() {
    try {
        const salvo = localStorage.getItem(STORAGE_TEMA_KEY);
        if (salvo === "claro") {
            aplicarModoTema("claro", false);
            return;
        }
    } catch (e) {}
    aplicarModoTema("escuro", false);
}

function instalarListenersRastreamentoAlteracoes(){
    // Rastreia digitação e alteração em qualquer campo da ficha
    document.addEventListener("input", function(e){
        if(!e.target) return;
        if(e.target.id === "input-importar" || e.target.classList.contains("campo-busca-historico") || e.target.id === "inv-busca-input") return;
        if(e.target.closest(".ficha-topo, .container, #secao-recursos, #ficha-perfil-card, #painel-pericias, #lista-personalizadas, .form-custom-card, #secao-inventario")){
            marcarAlteracaoFeita();
        }
    });

    document.addEventListener("change", function(e){
        if(!e.target) return;
        if(e.target.id === "input-importar" || e.target.classList.contains("campo-busca-historico") || e.target.id === "inv-busca-input") return;
        if(e.target.closest(".ficha-topo, .container, #secao-recursos, #ficha-perfil-card, #painel-pericias, #lista-personalizadas, .form-custom-card, #secao-inventario")){
            marcarAlteracaoFeita();
        }
    });

    // Alerta nativo do navegador caso o usuário tente fechar ou recarregar com alterações pendentes
    window.addEventListener("beforeunload", function(e){
        if(temAlteracoesNaoSalvas){
            e.preventDefault();
            e.returnValue = "Deseja salvar a ficha antes de sair? Quaisquer alterações não salvas serão perdidas.";
            return e.returnValue;
        }
    });
}

/* ============================================================
   MÓDULO DE INVENTÁRIO & COMPARTIMENTOS (ESPAÇOS / SLOTS)
   ============================================================ */
let inventarioItens = [];
let inventarioCompartimentos = [];
let itemEmEdicaoId = null;
let filtroCategoriaInventarioAtivo = "todos";
let termoBuscaInventario = "";

const COMPARTIMENTOS_PADRAO = [
    { id: "comp_mao_dir", nome: "Mão Direita", icone: "✋", tipo: "mao", fatorMultiplicador: 1.0, maxSlots: 1, nativo: true, deletavel: true },
    { id: "comp_mao_esq", nome: "Mão Esquerda", icone: "🤚", tipo: "mao", fatorMultiplicador: 1.0, maxSlots: 1, nativo: true, deletavel: true },
    { id: "comp_bolsos", nome: "Bolsos & Cintura", icone: "👖", tipo: "bolso", fatorMultiplicador: 1.0, maxSlots: 2, nativo: true, deletavel: true },
    { id: "comp_mochila", nome: "Mochila Principal", icone: "🎒", tipo: "mochila", fatorMultiplicador: 2.0, maxSlots: 8, nativo: false, deletavel: true }
];

function clonarCompartimentosPadrao(){
    return COMPARTIMENTOS_PADRAO.map(c => ({...c}));
}

const TIPOS_ITEM_CONFIG = {
    arma_branca: { rotulo: "Arma Branca", icone: "⚔️", classe: "arma-branca" },
    arma_fogo: { rotulo: "Arma de Fogo", icone: "🔫", classe: "arma-fogo" },
    arco: { rotulo: "Arco", icone: "🏹", classe: "arco" },
    besta: { rotulo: "Besta", icone: "🎯", classe: "besta" },
    arma: { rotulo: "Arma", icone: "⚔️", classe: "arma-branca" },
    veste: { rotulo: "Veste", icone: "🛡️", classe: "veste" },
    equipamento: { rotulo: "Equipamento", icone: "🎒", classe: "equipamento" },
    consumivel: { rotulo: "Consumível", icone: "🧪", classe: "consumivel" },
    outro: { rotulo: "Outro", icone: "📦", classe: "outro" }
};

function gerarIdItem(){
    return "item_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
}

function gerarIdCompartimento(){
    return "comp_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
}

function obterCargaMaxima(){
    const el = document.getElementById("inv_carga_maxima");
    if(!el) return 20.0;
    const v = parseFloat(el.value);
    return (!isNaN(v) && v > 0) ? v : 20.0;
}

function calcularCargaTotal(){
    return inventarioItens.reduce((total, item) => {
        if(item.compartimentoId === "nenhum") return total; // Item solto no chão não pesa na carga do personagem
        const qtd = Math.max(1, parseInt(item.qtd, 10) || 1);
        const peso = Math.max(0, parseFloat(item.peso) || 0);
        return total + (qtd * peso);
    }, 0);
}

// Retorna o espaço unitário efetivo de um item dependendo do compartimento onde está guardado
function obterEspacoEfetivoItemNoCompartimento(item, compOuId){
    let comp = typeof compOuId === "object" ? compOuId : inventarioCompartimentos.find(c => c.id === compOuId);
    
    // Espaço base cadastrado no item
    let base = item.espaco !== undefined ? Math.max(0, parseFloat(item.espaco) || 0) : 1.0;
    
    if(!comp){
        return base;
    }
    
    const tipoComp = comp.tipo || (comp.id && comp.id.includes("mochila") ? "mochila" : (comp.id && comp.id.includes("mao") ? "mao" : (comp.id && comp.id.includes("bolso") ? "bolso" : "geral")));
    
    // Opção 2: Verifica se o item tem um valor customizado específico definido para a categoria deste compartimento
    if((tipoComp === "mao" || tipoComp === "bainha") && item.espacoMao !== undefined && item.espacoMao !== null && item.espacoMao !== ""){
        const customMao = parseFloat(item.espacoMao);
        if(!isNaN(customMao) && customMao >= 0){
            return customMao;
        }
    } else if(tipoComp === "mochila" && item.espacoMochila !== undefined && item.espacoMochila !== null && item.espacoMochila !== ""){
        const customMochila = parseFloat(item.espacoMochila);
        if(!isNaN(customMochila) && customMochila >= 0){
            return customMochila;
        }
    }
    
    // Opção 3: Modificador/fator do próprio compartimento (ex: mochila tem fator 2.0x, mão tem 1.0x)
    const fator = comp.fatorMultiplicador !== undefined ? Math.max(0.1, parseFloat(comp.fatorMultiplicador) || 1.0) : (tipoComp === "mochila" ? 2.0 : 1.0);
    
    return base * fator;
}

function calcularSlotsOcupados(compOrigemId){
    const comp = inventarioCompartimentos.find(c => c.id === compOrigemId);
    return inventarioItens.reduce((total, it) => {
        const compId = it.compartimentoId || "comp_geral";
        if(compOrigemId && compId !== compOrigemId) return total;
        if(!compOrigemId && compId === "nenhum") return total;
        const espacoUnitEfetivo = obterEspacoEfetivoItemNoCompartimento(it, comp || compId);
        const qtd = Math.max(1, parseInt(it.qtd, 10) || 1);
        return total + (espacoUnitEfetivo * qtd);
    }, 0);
}

function calcularTotalGeralSlotsMaximos(){
    return inventarioCompartimentos.reduce((tot, c) => tot + (Math.max(1, parseInt(c.maxSlots, 10) || 1)), 0);
}

// Verifica se um item está atualmente empunhado (ativo nas mãos) ou guardado
function itemEstaEmpunhado(item){
    if(!item) return false;
    if(typeof item.empunhado === "boolean") return item.empunhado;
    const comp = inventarioCompartimentos.find(c => c.id === item.compartimentoId);
    return (comp && comp.tipo === "mao") || (item.compartimentoId && item.compartimentoId.includes("mao"));
}

// Alterna instantaneamente entre EMPUNHADO e GUARDADO com realocação inteligente de compartimento
function alternarEmpunhaduraItem(id){
    const item = inventarioItens.find(it => it.id === id);
    if(!item) return;

    const atualmenteEmpunhado = itemEstaEmpunhado(item);

    if(atualmenteEmpunhado){
        // Alterna para GUARDADO
        item.empunhado = false;

        // Procura compartimento de guarda apropriado (restaura o último ou busca mochila/bolso/geral)
        let destinoComp = null;
        if(item.ultimoCompartimentoGuardado){
            const compSalvo = inventarioCompartimentos.find(c => c.id === item.ultimoCompartimentoGuardado);
            if(compSalvo && compSalvo.tipo !== "mao"){
                destinoComp = compSalvo;
            }
        }

        if(!destinoComp){
            // Procura Mochila, Bolsos ou qualquer compartimento que não seja mão
            destinoComp = inventarioCompartimentos.find(c => c.tipo === "mochila") 
                       || inventarioCompartimentos.find(c => c.tipo === "bolso")
                       || inventarioCompartimentos.find(c => c.tipo !== "mao")
                       || inventarioCompartimentos[0];
        }

        const destinoId = destinoComp ? destinoComp.id : "nenhum";
        const destinoNome = destinoComp ? `${destinoComp.icone || "📦"} ${destinoComp.nome}` : "Solto no Inventário";

        item.compartimentoId = destinoId;
        mostrarStatus(`✓ "${item.nome}" guardado(a) em ${destinoNome}.`, "ok");
    } else {
        // Alterna para EMPUNHADO
        // Salva onde estava guardado caso queira guardar de volta depois
        const compAtual = inventarioCompartimentos.find(c => c.id === item.compartimentoId);
        if(compAtual && compAtual.tipo !== "mao"){
            item.ultimoCompartimentoGuardado = item.compartimentoId;
        }

        // Procura uma mão disponível no inventário
        const maos = inventarioCompartimentos.filter(c => c.tipo === "mao");
        let maoDestino = null;

        if(maos.length > 0){
            // Tenta encontrar uma mão com espaço livre
            maoDestino = maos.find(m => calcularSlotsOcupados(m.id) < m.maxSlots) || maos[0];
        } else {
            // Se não houver compartimento de mão explicitamente criado, usa o primeiro existente
            maoDestino = inventarioCompartimentos[0];
        }

        item.empunhado = true;
        if(maoDestino){
            item.compartimentoId = maoDestino.id;
        }

        const maoNome = maoDestino ? `${maoDestino.icone || "✋"} ${maoDestino.nome}` : "Mãos";
        mostrarStatus(`⚔️ "${item.nome}" empunhado(a) em ${maoNome}.`, "ok");
    }

    renderizarGradeCompartimentos();
    renderizarListaInventario();
    atualizarInventarioUI();
    marcarAlteracaoFeita();
}

function moverItemParaCompartimento(itemId, targetCompId){
    const item = inventarioItens.find(it => it.id === itemId);
    if(!item) return;

    if(item.compartimentoId === targetCompId){
        return; // Já está neste compartimento
    }

    const compOrigem = inventarioCompartimentos.find(c => c.id === item.compartimentoId);
    const compDestino = inventarioCompartimentos.find(c => c.id === targetCompId);

    if(targetCompId === "nenhum"){
        if(compOrigem && compOrigem.tipo !== "mao"){
            item.ultimoCompartimentoGuardado = item.compartimentoId;
        }
        item.compartimentoId = "nenhum";
        item.empunhado = false;
        mostrarStatus(`🫳 "${item.nome}" solto(a) no chão (Fora de compartimento).`, "alerta");
    } else if(compDestino){
        const ehMao = compDestino.tipo === "mao" || (compDestino.id && compDestino.id.includes("mao"));
        if(ehMao){
            if(compOrigem && compOrigem.tipo !== "mao"){
                item.ultimoCompartimentoGuardado = item.compartimentoId;
            }
            item.compartimentoId = compDestino.id;
            item.empunhado = true;
            mostrarStatus(`⚔️ "${item.nome}" empunhado(a) em ${compDestino.icone || "✋"} ${compDestino.nome}.`, "ok");
        } else {
            item.compartimentoId = compDestino.id;
            item.empunhado = false;
            item.ultimoCompartimentoGuardado = compDestino.id;
            mostrarStatus(`📦 "${item.nome}" guardado(a) em ${compDestino.icone || "🎒"} ${compDestino.nome}.`, "ok");
        }
    }

    renderizarGradeCompartimentos();
    renderizarHUDMaosAtivas();
    renderizarListaInventario();
    atualizarInventarioUI();
    marcarAlteracaoFeita();
}

function itemRequerRecarga(item){
    if(!item) return false;
    return item.tipo === "arma_fogo" || item.tipo === "besta" || !!item.isArmaDeFogo;
}

function atualizarPreviewFormTipo(){
    const tipoSel = document.getElementById("item_tipo");
    const badgeModo = document.getElementById("inv-form-badge-modo");
    const isArmaFogoCheckbox = document.getElementById("item_is_arma_fogo");
    const wrapCarregada = document.getElementById("wrap_item_carregada");
    if(!tipoSel || !badgeModo) return;
    const tipo = tipoSel.value;
    const cfg = TIPOS_ITEM_CONFIG[tipo] || TIPOS_ITEM_CONFIG.equipamento;
    if(itemEmEdicaoId){
        badgeModo.textContent = "Editando " + cfg.rotulo;
    } else {
        badgeModo.textContent = "Novo: " + cfg.rotulo;
    }
    badgeModo.className = "inv-badge-tag " + cfg.classe;

    if(tipo === "arma_fogo" || tipo === "besta"){
        if(isArmaFogoCheckbox && !itemEmEdicaoId) isArmaFogoCheckbox.checked = true;
        if(wrapCarregada) wrapCarregada.style.display = "inline-flex";
    }
}

function atualizarFatorSugeridoTipoComp(){
    const tipoSel = document.getElementById("novo_comp_tipo");
    const fatorSel = document.getElementById("novo_comp_fator");
    const slotsInput = document.getElementById("novo_comp_slots");
    if(!tipoSel || !fatorSel) return;
    
    const tipo = tipoSel.value;
    if(tipo === "mochila"){
        fatorSel.value = "2.0";
        if(slotsInput) slotsInput.value = "8";
    } else if(tipo === "mao"){
        fatorSel.value = "1.0";
        if(slotsInput) slotsInput.value = "1";
    } else if(tipo === "bainha"){
        fatorSel.value = "1.0";
        if(slotsInput) slotsInput.value = "1";
    } else if(tipo === "bolso"){
        fatorSel.value = "1.0";
        if(slotsInput) slotsInput.value = "2";
    } else {
        fatorSel.value = "1.0";
        if(slotsInput) slotsInput.value = "6";
    }
}

function aoMudarCompartimentoFormItem(){
    // Hook caso precise de ajustes visuais adicionais
}

function aoAlterarEspacosFormItem(origem){
    const baseInput = document.getElementById("item_espaco");
    const maoInput = document.getElementById("item_espaco_mao");
    const mochilaInput = document.getElementById("item_espaco_mochila");
    if(!baseInput) return;
    
    const valBase = parseFloat(baseInput.value) || 1.0;
    
    if(origem === "base"){
        // Sugere automaticamente valores proporcionais se ainda forem proporcionais ao antigo
        if(maoInput && (!maoInput.value || parseFloat(maoInput.value) === 1.0 || parseFloat(maoInput.value) === 0)){
            maoInput.value = valBase;
        }
        if(mochilaInput && (!mochilaInput.value || parseFloat(mochilaInput.value) === 2.0 || parseFloat(mochilaInput.value) === valBase * 2)){
            mochilaInput.value = valBase * 2;
        }
    }
}

function popularSelectCompartimentosForm(){
    const select = document.getElementById("item_compartimento");
    if(!select) return;
    const valorAtual = select.value;
    select.innerHTML = "";

    if(inventarioCompartimentos.length === 0){
        const opt = document.createElement("option");
        opt.value = "nenhum";
        opt.textContent = "Sem compartimento definido";
        select.appendChild(opt);
        return;
    }

    inventarioCompartimentos.forEach(comp => {
        const opt = document.createElement("option");
        opt.value = comp.id;
        const slotsUsados = calcularSlotsOcupados(comp.id);
        const slotsUsadosFmt = slotsUsados % 1 === 0 ? slotsUsados.toFixed(0) : slotsUsados.toFixed(1);
        const fatorTxt = (comp.fatorMultiplicador && comp.fatorMultiplicador !== 1.0) ? ` [${comp.fatorMultiplicador}x]` : "";
        opt.textContent = `${comp.icone || "📦"} ${comp.nome}${fatorTxt} (${slotsUsadosFmt}/${comp.maxSlots} slots)`;
        select.appendChild(opt);
    });

    const optNenhum = document.createElement("option");
    optNenhum.value = "nenhum";
    optNenhum.textContent = "⚠️ Fora de Compartimento (Solto)";
    select.appendChild(optNenhum);

    if(valorAtual && select.querySelector(`option[value="${valorAtual}"]`)){
        select.value = valorAtual;
    } else if(inventarioCompartimentos.length > 0){
        select.value = inventarioCompartimentos[0].id;
    }
}

function renderizarGradeCompartimentos(){
    const container = document.getElementById("grid-compartimentos");
    const totalUsadosEl = document.getElementById("comp-total-slots-usados");
    const totalMaxEl = document.getElementById("comp-total-slots-max");
    if(!container) return;

    const totalSlotsMax = calcularTotalGeralSlotsMaximos();
    const totalSlotsUsados = inventarioCompartimentos.reduce((sum, c) => sum + calcularSlotsOcupados(c.id), 0);
    const usadosFmt = totalSlotsUsados % 1 === 0 ? totalSlotsUsados.toFixed(0) : totalSlotsUsados.toFixed(1);

    if(totalUsadosEl) totalUsadosEl.textContent = usadosFmt;
    if(totalMaxEl) totalMaxEl.textContent = totalSlotsMax;

    if(inventarioCompartimentos.length === 0){
        container.innerHTML = `
            <div class="inv-vazio-aviso" style="padding: 16px;">
                Nenhum compartimento ativo (mãos, bolsos ou mochilas foram removidos). Use o formulário abaixo para adicionar novos recipientes.
            </div>`;
        popularSelectCompartimentosForm();
        return;
    }

    container.innerHTML = "";
    inventarioCompartimentos.forEach(comp => {
        const slotsUsados = calcularSlotsOcupados(comp.id);
        const maxSlots = Math.max(1, parseInt(comp.maxSlots, 10) || 1);
        const pctSlots = Math.min(100, Math.max(0, (slotsUsados / maxSlots) * 100));
        const estourado = slotsUsados > maxSlots;
        const cheio = slotsUsados >= maxSlots;
        const slotsUsadosFmt = slotsUsados % 1 === 0 ? slotsUsados.toFixed(0) : slotsUsados.toFixed(1);

        // Itens dentro deste compartimento
        const itensNesteComp = inventarioItens.filter(it => (it.compartimentoId || "comp_geral") === comp.id);
        const nomesItens = itensNesteComp.map(it => {
            const ef = obterEspacoEfetivoItemNoCompartimento(it, comp);
            const efFmt = ef % 1 === 0 ? ef.toFixed(0) : ef.toFixed(1);
            return `${it.nome} (${it.qtd}x · ${efFmt}s)`;
        }).join(", ") || "Vazio";

        const card = document.createElement("div");
        card.className = "comp-card" + (estourado ? " estourado" : (cheio ? " cheio" : ""));
        card.id = "comp_card_" + comp.id;
        card.dataset.compId = comp.id;

        // Suporte a Drag and Drop (Zona de Queda para Compartimentos)
        card.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            card.classList.add("drag-over");
        });
        card.addEventListener("dragenter", (e) => {
            e.preventDefault();
            card.classList.add("drag-over");
        });
        card.addEventListener("dragleave", (e) => {
            if (!card.contains(e.relatedTarget)) {
                card.classList.remove("drag-over");
            }
        });
        card.addEventListener("drop", (e) => {
            e.preventDefault();
            card.classList.remove("drag-over");
            const itemId = e.dataTransfer.getData("text/plain");
            if (itemId) {
                moverItemParaCompartimento(itemId, comp.id);
            }
        });

        // Topo
        const topo = document.createElement("div");
        topo.className = "comp-card-topo";

        const nomeWrap = document.createElement("div");
        nomeWrap.className = "comp-card-nome-wrap";
        nomeWrap.title = comp.nome;

        const icone = document.createElement("span");
        icone.className = "comp-card-icone";
        icone.textContent = comp.icone || "📦";

        const nome = document.createElement("span");
        nome.textContent = comp.nome;

        nomeWrap.append(icone, nome);

        // Adiciona badge informativa do modificador de volume caso diferente de 1.0x
        const fator = comp.fatorMultiplicador !== undefined ? parseFloat(comp.fatorMultiplicador) : (comp.tipo === "mochila" ? 2.0 : 1.0);
        if(fator && fator !== 1.0){
            const badgeFator = document.createElement("span");
            badgeFator.className = "comp-card-badge-tag " + (fator > 1.0 ? "fator-maior" : "fator-menor");
            badgeFator.textContent = fator + "x volume";
            badgeFator.title = `Modificador deste compartimento: itens ocupam ${fator}x seu espaço base aqui`;
            nomeWrap.appendChild(badgeFator);
        }

        const acoes = document.createElement("div");
        acoes.className = "comp-card-acoes";

        const btnEditar = document.createElement("button");
        btnEditar.type = "button";
        btnEditar.className = "comp-btn-acao";
        btnEditar.innerHTML = "✏️";
        btnEditar.title = "Editar capacidade e modificador deste compartimento";
        btnEditar.onclick = () => editarCompartimento(comp.id);

        const btnExcluir = document.createElement("button");
        btnExcluir.type = "button";
        btnExcluir.className = "comp-btn-acao excluir";
        btnExcluir.innerHTML = "✕";
        btnExcluir.title = "Remover este compartimento";
        btnExcluir.onclick = () => excluirCompartimento(comp.id);

        acoes.append(btnEditar, btnExcluir);
        topo.append(nomeWrap, acoes);
        card.appendChild(topo);

        // Slots linha de métrica
        const slotsLinha = document.createElement("div");
        slotsLinha.className = "comp-card-slots-linha";
        slotsLinha.innerHTML = `<span>Espaço Ocupado</span> <span class="comp-card-slots-valor">${slotsUsadosFmt} / ${maxSlots} slots</span>`;
        card.appendChild(slotsLinha);

        // Barra de progresso dos slots
        const trilho = document.createElement("div");
        trilho.className = "comp-slots-trilho";
        trilho.title = `${slotsUsadosFmt} de ${maxSlots} espaços preenchidos`;

        const fill = document.createElement("div");
        fill.className = "comp-slots-fill" + (estourado ? " estourado" : (cheio ? " cheio" : ""));
        fill.style.width = Math.min(100, pctSlots) + "%";
        trilho.appendChild(fill);
        card.appendChild(trilho);

        // Preview dos itens com mini tags arrastáveis
        const preview = document.createElement("div");
        preview.className = "comp-card-itens-preview";
        if (itensNesteComp.length === 0) {
            preview.textContent = "Contém: Vazio";
        } else {
            const rotulo = document.createElement("span");
            rotulo.textContent = "Contém: ";
            rotulo.style.marginRight = "4px";
            preview.appendChild(rotulo);

            itensNesteComp.forEach(it => {
                const tag = document.createElement("span");
                tag.className = "inv-badge-tag";
                tag.style.cssText = "font-size:10px; padding:1px 5px; margin-right:3px; cursor:grab; background:var(--bg-card); border:1px solid var(--line); display:inline-block;";
                tag.setAttribute("draggable", "true");
                tag.textContent = `${it.nome} (${it.qtd}x)`;
                tag.title = `Item: ${it.nome}. Arraste para mover para outro compartimento.`;
                tag.addEventListener("dragstart", (e) => {
                    e.stopPropagation();
                    e.dataTransfer.setData("text/plain", it.id);
                    e.dataTransfer.effectAllowed = "move";
                    tag.classList.add("arrastando");
                });
                tag.addEventListener("dragend", () => {
                    tag.classList.remove("arrastando");
                });
                preview.appendChild(tag);
            });
        }
        card.appendChild(preview);

        container.appendChild(card);
    });

    popularSelectCompartimentosForm();
}

function adicionarNovoCompartimento(){
    const nomeInput = document.getElementById("novo_comp_nome");
    const iconeSelect = document.getElementById("novo_comp_icone");
    const tipoSelect = document.getElementById("novo_comp_tipo");
    const fatorSelect = document.getElementById("novo_comp_fator");
    const slotsInput = document.getElementById("novo_comp_slots");

    const nome = (nomeInput?.value || "").trim();
    if(!nome){
        mostrarStatus("✗ Informe um nome para o compartimento/bolsa.", "erro");
        if(nomeInput) nomeInput.focus();
        return;
    }

    const icone = iconeSelect?.value || "🎒";
    const tipo = tipoSelect?.value || "mochila";
    const fatorMultiplicador = parseFloat(fatorSelect?.value) || 1.0;
    const maxSlots = Math.max(1, parseInt(slotsInput?.value, 10) || 6);

    const novoComp = {
        id: gerarIdCompartimento(),
        nome,
        icone,
        tipo,
        fatorMultiplicador,
        maxSlots,
        nativo: false,
        deletavel: true
    };

    inventarioCompartimentos.push(novoComp);
    if(nomeInput) nomeInput.value = "";
    if(slotsInput) slotsInput.value = "8";

    renderizarGradeCompartimentos();
    atualizarInventarioUI();
    marcarAlteracaoFeita();
    mostrarStatus(`✓ Compartimento "${nome}" adicionado com sucesso.`, "ok");
}

function editarCompartimento(id){
    const comp = inventarioCompartimentos.find(c => c.id === id);
    if(!comp) return;

    const novoNome = prompt(`Editar nome do compartimento:`, comp.nome);
    if(novoNome === null) return;
    const nomeLimpo = novoNome.trim();
    if(!nomeLimpo){
        mostrarStatus("✗ O nome do compartimento não pode ficar vazio.", "erro");
        return;
    }

    const novosSlotsStr = prompt(`Capacidade de slots (espaços) para "${nomeLimpo}":`, comp.maxSlots);
    if(novosSlotsStr === null) return;
    const novosSlots = Math.max(1, parseInt(novosSlotsStr, 10) || comp.maxSlots);

    const novoFatorStr = prompt(`Multiplicador de volume dos itens guardados (ex: 1.0 para normal, 2.0 para mochila/dobro):`, comp.fatorMultiplicador || 1.0);
    if(novoFatorStr !== null){
        const valFator = parseFloat(novoFatorStr);
        if(!isNaN(valFator) && valFator > 0){
            comp.fatorMultiplicador = valFator;
        }
    }

    comp.nome = nomeLimpo;
    comp.maxSlots = novosSlots;

    renderizarGradeCompartimentos();
    atualizarInventarioUI();
    marcarAlteracaoFeita();
    mostrarStatus(`✓ Compartimento "${comp.nome}" atualizado.`, "ok");
}

function excluirCompartimento(id){
    const comp = inventarioCompartimentos.find(c => c.id === id);
    if(!comp) return;

    const itensNesteComp = inventarioItens.filter(it => (it.compartimentoId || "comp_geral") === id);
    const avisoItens = itensNesteComp.length > 0 
        ? `<br><br><span style="color:#f1c40f;">Atenção:</span> Existem <strong>${itensNesteComp.length} itens</strong> guardados aqui. Eles serão marcados como soltos.` 
        : "";

    const mensagemExclusao = `Tem certeza que deseja remover o compartimento <strong>${comp.icone} ${comp.nome}</strong>?${avisoItens}`;

    abrirModalConfirmacao({
        titulo: "Remover Compartimento",
        icone: "🗑",
        tema: "tema-perigo",
        mensagem: mensagemExclusao,
        rotuloConfirmar: "Remover",
        aoConfirmar: () => {
            inventarioCompartimentos = inventarioCompartimentos.filter(c => c.id !== id);
            // Reatribui itens órfãos para "nenhum"
            inventarioItens.forEach(it => {
                if((it.compartimentoId || "comp_geral") === id){
                    it.compartimentoId = "nenhum";
                }
            });
            renderizarGradeCompartimentos();
            atualizarInventarioUI();
            marcarAlteracaoFeita();
            mostrarStatus(`✓ Compartimento "${comp.nome}" removido.`, "ok");
        }
    });
}

function atualizarCompartimentosUI(){
    if(!Array.isArray(inventarioCompartimentos)){
        inventarioCompartimentos = clonarCompartimentosPadrao();
    }
    renderizarGradeCompartimentos();
}

let modoVisualizacaoInventario = "cards";

function alternarModoVisualizacaoInventario(modo){
    modoVisualizacaoInventario = modo === "tabela" ? "tabela" : "cards";
    const btnCards = document.getElementById("inv-visao-btn-cards");
    const btnTabela = document.getElementById("inv-visao-btn-tabela");
    if(btnCards) btnCards.classList.toggle("ativo", modoVisualizacaoInventario === "cards");
    if(btnTabela) btnTabela.classList.toggle("ativo", modoVisualizacaoInventario === "tabela");
    const listEl = document.getElementById("lista-inventario");
    if(listEl){
        listEl.className = modoVisualizacaoInventario === "tabela" ? "inv-lista-tabela" : "inv-lista-grid";
    }
    renderizarListaInventario();
}

function aoAlternarFormArmaFogo(){
    const isArmaFogo = !!(document.getElementById("item_is_arma_fogo")?.checked);
    const wrapCarregada = document.getElementById("wrap_item_carregada");
    if(wrapCarregada) wrapCarregada.style.display = isArmaFogo ? "inline-flex" : "none";
}

function alternarStatusCarregadaArma(id){
    const item = inventarioItens.find(it => it.id === id);
    if(!item) return;
    item.carregada = !item.carregada;
    atualizarInventarioUI();
    marcarAlteracaoFeita();
    const isBesta = item.tipo === "besta";
    if(isBesta){
        mostrarStatus(item.carregada ? `🎯 Virote engatado! Besta "${item.nome}" pronta para disparar.` : `❌ Besta "${item.nome}" descarregada.`, "ok");
    } else {
        mostrarStatus(item.carregada ? `⚡ Pederneira preparada! "${item.nome}" foi carregada.` : `❌ "${item.nome}" descarregada.`, "ok");
    }
}

function dispararArmaDeFogo(id){
    const item = inventarioItens.find(it => it.id === id);
    if(!item) return;
    item.carregada = false;
    atualizarInventarioUI();
    marcarAlteracaoFeita();
    const isBesta = item.tipo === "besta";
    if(isBesta){
        mostrarStatus(`💥 DISPARO DE VIROTE! Besta "${item.nome}" foi disparada! (Agora descarregada)`, "ok");
    } else {
        mostrarStatus(`💥 FOGO! "${item.nome}" foi disparada! (Agora descarregada)`, "ok");
    }
}

function carregarArmaDeFogo(id){
    const item = inventarioItens.find(it => it.id === id);
    if(!item) return;
    item.carregada = true;
    atualizarInventarioUI();
    marcarAlteracaoFeita();
    const isBesta = item.tipo === "besta";
    if(isBesta){
        mostrarStatus(`🎯 VIROTE ENGATADO! Besta "${item.nome}" armada e pronta para o disparo!`, "ok");
    } else {
        mostrarStatus(`⚡ Pederneira preparada! "${item.nome}" carregada!`, "ok");
    }
}

function usarConsumivel(id){
    const item = inventarioItens.find(it => it.id === id);
    if(!item) return;
    let qtd = Math.max(1, parseInt(item.qtd, 10) || 1);
    if(qtd > 1){
        item.qtd = qtd - 1;
        mostrarStatus(`🧪 Usou 1x "${item.nome}". Restam ${item.qtd}x.`, "ok");
        atualizarInventarioUI();
        marcarAlteracaoFeita();
    } else {
        abrirModalConfirmacao({
            titulo: "Consumir Último Item",
            icone: "🧪",
            tema: "tema-alerta",
            mensagem: `Você usou a última unidade de <strong>${item.nome}</strong>. Deseja remover este item do inventário?`,
            rotuloConfirmar: "Remover Item",
            aoConfirmar: () => {
                inventarioItens = inventarioItens.filter(it => it.id !== id);
                atualizarInventarioUI();
                marcarAlteracaoFeita();
                mostrarStatus(`🧪 Usou o último "${item.nome}" (removido).`, "ok");
            }
        });
    }
}

function guardarItemMao(id){
    const item = inventarioItens.find(it => it.id === id);
    if(!item) return;
    if(itemEstaEmpunhado(item)){
        alternarEmpunhaduraItem(id);
    }
}

function soltarItemMao(id){
    const item = inventarioItens.find(it => it.id === id);
    if(!item) return;
    const compAtual = inventarioCompartimentos.find(c => c.id === item.compartimentoId);
    if(compAtual && compAtual.tipo !== "mao"){
        item.ultimoCompartimentoGuardado = item.compartimentoId;
    }
    item.empunhado = false;
    item.compartimentoId = "nenhum";
    mostrarStatus(`🫳 "${item.nome}" solto(a) no chão (Fora de compartimento).`, "alerta");
    renderizarGradeCompartimentos();
    renderizarHUDMaosAtivas();
    renderizarListaInventario();
    atualizarInventarioUI();
    marcarAlteracaoFeita();
}

/* ============================================================
   SISTEMA DE TRANSFERÊNCIA DE ITENS (CEDER ITEM ENTRE JOGADORES)
   ============================================================ */

function abrirModalCederItem(itemId) {
    const item = inventarioItens.find(it => it.id === itemId);
    if (!item) return;

    const indice = typeof carregarIndiceFichas === "function" ? carregarIndiceFichas() : [];
    const outrasFichas = indice.filter(f => f.id !== fichaId);

    let htmlOpcoesFichas = "";
    if (outrasFichas.length > 0) {
        htmlOpcoesFichas = `
            <div style="margin-bottom:14px; text-align:left;">
                <label style="display:block; font-size:12px; font-weight:600; color:var(--accent); margin-bottom:6px;">
                    1. Transferir Direto para Ficha Salva neste Navegador:
                </label>
                <div style="display:flex; flex-direction:column; gap:6px; max-height:140px; overflow-y:auto; padding-right:4px;">
                    ${outrasFichas.map(f => `
                        <button type="button" class="btn-secundario" style="justify-content:space-between; font-size:12px; padding:6px 10px;" onclick="confirmarCederItemParaFichaLocal('${item.id}', '${f.id}', '${escapeHTML(f.nome || "Ficha").replace(/'/g, "\\'")}')">
                            <span>👤 <strong>${escapeHTML(f.nome || "Sem Nome")}</strong></span>
                            <span style="font-size:10px; color:var(--ink-dim);">Transferir ➔</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        htmlOpcoesFichas = `
            <div style="margin-bottom:14px; padding:8px 12px; background:var(--bg-inset); border:1px dashed var(--line); border-radius:4px; font-size:12px; color:var(--ink-dim); text-align:left;">
                💡 <em>Nenhuma outra ficha salva encontrada neste navegador. Salve a ficha de outro jogador ou use a opção de código abaixo para enviar a outro dispositivo.</em>
            </div>
        `;
    }

    const modalMsg = `
        <div style="text-align:center; font-family:'EB Garamond', Georgia, serif;">
            <p style="font-size:14px; margin-bottom:12px;">Deseja ceder / transferir o item <strong style="color:var(--ink);">${escapeHTML(item.nome)}</strong> (${item.qtd || 1}x) para outro jogador?</p>
            ${htmlOpcoesFichas}
            <div style="text-align:left; border-top:1px solid var(--line); padding-top:12px;">
                <label style="display:block; font-size:12px; font-weight:600; color:var(--accent); margin-bottom:6px;">
                    2. Enviar para Amigo via Código (WhatsApp / Discord / Chat):
                </label>
                <p style="font-size:11px; color:var(--ink-dim); margin-bottom:8px;">
                    Gere o código do item para enviar ao seu amigo. Ele poderá usar o botão <strong>"📥 Receber Item"</strong> na ficha dele para integrar este objeto.
                </p>
            </div>
        </div>
    `;

    abrirModalConfirmacao({
        titulo: `Ceder Item: ${item.nome}`,
        icone: "🤝",
        tema: "tema-salvar",
        mensagem: modalMsg,
        rotuloConfirmar: "📋 Copiar Código de Transferência",
        aoConfirmar: () => {
            copiarCodigoTransferenciaItem(item);
        }
    });
}

function copiarCodigoTransferenciaItem(item) {
    const payload = {
        was_item_v1: true,
        nome: item.nome,
        tipo: item.tipo,
        qtd: item.qtd || 1,
        peso: item.peso || 1.0,
        espaco: item.espaco || 1.0,
        espacoMao: item.espacoMao,
        espacoMochila: item.espacoMochila,
        isArmaDeFogo: !!item.isArmaDeFogo,
        carregada: item.carregada !== false,
        ilegal: !!item.ilegal,
        descricao: item.descricao || ""
    };

    const codeStr = "WAS_ITEM:" + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(codeStr).then(() => {
            mostrarStatus(`📋 Código do item "${item.nome}" copiado para a área de transferência!`, "ok");
            exibirModalCodigoGerado(item.nome, codeStr);
        }).catch(() => {
            exibirModalCodigoGerado(item.nome, codeStr);
        });
    } else {
        exibirModalCodigoGerado(item.nome, codeStr);
    }
}

function exibirModalCodigoGerado(itemNome, codeStr) {
    const modalMsg = `
        <div style="text-align:left; font-family:'EB Garamond', Georgia, serif;">
            <p style="font-size:13.5px; margin-bottom:8px; color:var(--ink);">
                Código de transferência gerado para o item <strong style="color:var(--accent);">${escapeHTML(itemNome)}</strong>:
            </p>
            <textarea id="output-codigo-item" readonly onclick="this.select()" style="width:100%; height:85px; padding:8px; font-family:monospace; font-size:11px; background:var(--bg-inset); color:var(--ink); border:1px solid var(--line); border-radius:4px; resize:none; box-sizing:border-box;">${codeStr}</textarea>
            <p style="font-size:11px; color:var(--ink-dim); margin-top:6px;">
                💡 Envie este código via WhatsApp / Discord / Chat para o seu amigo.
            </p>
        </div>
    `;

    abrirModalConfirmacao({
        titulo: `Código do Item: ${itemNome}`,
        icone: "📋",
        tema: "tema-salvar",
        mensagem: modalMsg,
        rotuloConfirmar: "📋 Copiar Texto",
        aoConfirmar: () => {
            const txtArea = document.getElementById("output-codigo-item");
            if (txtArea) {
                txtArea.select();
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(txtArea.value);
                } else {
                    document.execCommand('copy');
                }
                mostrarStatus("📋 Código copiado!", "ok");
            }
        }
    });

    setTimeout(() => {
        const txtArea = document.getElementById("output-codigo-item");
        if (txtArea) {
            txtArea.focus();
            txtArea.select();
        }
    }, 150);
}

async function confirmarCederItemParaFichaLocal(itemId, targetFichaId, targetFichaNome) {
    const itemIndex = inventarioItens.findIndex(it => it.id === itemId);
    if (itemIndex === -1) return;
    const item = inventarioItens[itemIndex];

    try {
        let chaveAlvo = CHAVE_PREFIXO + "ficha:" + targetFichaId;
        let rawTarget = localStorage.getItem(chaveAlvo);
        if (!rawTarget) {
            chaveAlvo = "we_are_strangers_ficha_" + targetFichaId;
            rawTarget = localStorage.getItem(chaveAlvo);
        }

        let targetData = rawTarget ? descompactarDadosStorage(rawTarget) : null;
        if (!targetData) {
            targetData = await carregarFichaIDB(targetFichaId);
        }

        if (!targetData) {
            mostrarStatus("✗ Ficha de destino não encontrada no armazenamento local.", "erro");
            return;
        }

        if (!targetData.inventario) {
            targetData.inventario = { cargaMaxima: 20.0, compartimentos: [], itens: [] };
        }
        if (!Array.isArray(targetData.inventario.itens)) {
            targetData.inventario.itens = targetData.inventarioItens || [];
        }

        const itemTransferido = JSON.parse(JSON.stringify(item));
        itemTransferido.id = "item_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
        itemTransferido.compartimentoId = "comp_geral";
        itemTransferido.empunhado = false;

        targetData.inventario.itens.push(itemTransferido);
        targetData.atualizadoEm = new Date().toISOString();

        try {
            localStorage.setItem(CHAVE_PREFIXO + "ficha:" + targetFichaId, compactarDadosStorage(targetData));
        } catch (errQuota) {
            console.warn("Aviso de quota ao transferir item:", errQuota);
        }
        salvarFichaIDB(targetFichaId, targetData).catch(() => {});

        inventarioItens.splice(itemIndex, 1);

        renderizarGradeCompartimentos();
        renderizarHUDMaosAtivas();
        renderizarListaInventario();
        atualizarInventarioUI();
        marcarAlteracaoFeita();

        mostrarStatus(`🤝 Item "${item.nome}" cedido com sucesso para a ficha de "${targetFichaNome}"!`, "ok");
    } catch (e) {
        console.error("Erro ao transferir item:", e);
        mostrarStatus("✗ Ocorreu um erro ao transferir o item.", "erro");
    }
}

function abrirModalReceberItem() {
    const modalMsg = `
        <div style="text-align:left; font-family:'EB Garamond', Georgia, serif;">
            <p style="font-size:13.5px; margin-bottom:8px; color:var(--ink);">
                Cole abaixo o <strong>Código de Transferência</strong> recebido de outro jogador (começando com <code>WAS_ITEM:</code>):
            </p>
            <textarea id="input-receber-item-codigo" placeholder="Cole o código do item aqui... (ex: WAS_ITEM:eyJub21l...)" style="width:100%; height:90px; padding:8px; font-family:monospace; font-size:11px; background:var(--bg-inset); color:var(--ink); border:1px solid var(--line); border-radius:4px; resize:vertical; box-sizing:border-box;"></textarea>
            <p style="font-size:11.5px; color:var(--ink-dim); margin-top:6px;">
                💡 Ao confirmar, o objeto será decodificado e incorporado ao seu inventário.
            </p>
        </div>
    `;

    abrirModalConfirmacao({
        titulo: "Receber Item Cedido",
        icone: "📥",
        tema: "tema-salvar",
        mensagem: modalMsg,
        rotuloConfirmar: "📥 Incorporar Item",
        aoConfirmar: () => {
            const txtArea = document.getElementById("input-receber-item-codigo");
            if (!txtArea) return;
            processarCodigoReceberItem(txtArea.value || "");
        }
    });

    setTimeout(() => {
        const txtArea = document.getElementById("input-receber-item-codigo");
        if (txtArea) txtArea.focus();
    }, 150);
}

function processarCodigoReceberItem(inputCode) {
    if (!inputCode) {
        mostrarStatus("✗ Nenhum código informado.", "alerta");
        return;
    }

    const trimmed = inputCode.trim();
    if (!trimmed.startsWith("WAS_ITEM:")) {
        mostrarStatus("✗ Código de item inválido. Certifique-se de colar o código gerado no formato WAS_ITEM:...", "erro");
        return;
    }

    try {
        const base64Str = trimmed.replace("WAS_ITEM:", "");
        const jsonStr = decodeURIComponent(escape(atob(base64Str)));
        const data = JSON.parse(jsonStr);

        if (!data.nome || !data.was_item_v1) {
            mostrarStatus("✗ Formato de item inválido ou corrompido.", "erro");
            return;
        }

        const novoItem = {
            id: "item_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
            nome: data.nome,
            tipo: data.tipo || "equipamento",
            compartimentoId: "comp_geral",
            espaco: data.espaco || 1.0,
            espacoMao: data.espacoMao,
            espacoMochila: data.espacoMochila,
            qtd: Math.max(1, parseInt(data.qtd, 10) || 1),
            peso: Math.max(0, parseFloat(data.peso) || 1.0),
            ilegal: !!data.ilegal,
            isArmaDeFogo: !!data.isArmaDeFogo,
            carregada: data.carregada !== false,
            empunhado: false,
            descricao: data.descricao || ""
        };

        inventarioItens.push(novoItem);

        renderizarGradeCompartimentos();
        renderizarHUDMaosAtivas();
        renderizarListaInventario();
        atualizarInventarioUI();
        marcarAlteracaoFeita();

        mostrarStatus(`🎉 Item "${novoItem.nome}" recebido com sucesso e adicionado ao seu inventário!`, "ok");
    } catch (e) {
        console.error("Erro ao decodificar código do item:", e);
        mostrarStatus("✗ Não foi possível processar o código do item. Verifique o código digitado.", "erro");
    }
}

function trocarMaosRapido(){
    const gridEl = document.getElementById("inv-hud-maos-grid");
    if(gridEl){
        gridEl.classList.remove("animando-swap");
        void gridEl.offsetWidth; // Força reflow para reiniciar animação CSS
        gridEl.classList.add("animando-swap");
        setTimeout(() => {
            const el = document.getElementById("inv-hud-maos-grid");
            if(el) el.classList.remove("animando-swap");
        }, 480);
    }

    const compsMao = inventarioCompartimentos.filter(c => c.tipo === "mao" || (c.id && c.id.includes("mao")));
    
    if(compsMao.length >= 2){
        const compDir = compsMao[0];
        const compEsq = compsMao[1];

        // Alterna os compartimentoId dos itens entre compDir e compEsq
        inventarioItens.forEach(it => {
            if(it.compartimentoId === compDir.id){
                it.compartimentoId = compEsq.id;
            } else if(it.compartimentoId === compEsq.id){
                it.compartimentoId = compDir.id;
            }
        });
    } else {
        const empunhados = inventarioItens.filter(it => itemEstaEmpunhado(it));
        if(empunhados.length >= 2){
            const tempComp = empunhados[0].compartimentoId;
            empunhados[0].compartimentoId = empunhados[1].compartimentoId;
            empunhados[1].compartimentoId = tempComp;
        }
    }

    mostrarStatus("🔄 Fast Swap! Itens alternados entre a Mão Direita e a Mão Esquerda.", "ok");
    atualizarInventarioUI();
    marcarAlteracaoFeita();

    if (typeof verificarSegredoFastSwapMalabatonto === "function") {
        verificarSegredoFastSwapMalabatonto();
    }
}

function renderizarHUDMaosAtivas(){
    const container = document.getElementById("inv-hud-maos-grid");
    if(!container) return;

    const compsMao = inventarioCompartimentos.filter(c => c.tipo === "mao" || (c.id && c.id.includes("mao")));
    let listaSlots = [];

    if(compsMao.length >= 2){
        compsMao.forEach((comp, idx) => {
            const isDireita = idx === 0 || comp.id === "comp_mao_dir" || (comp.nome && comp.nome.toLowerCase().includes("direita"));
            const itemsEquipados = inventarioItens.filter(it => (it.compartimentoId === comp.id || (itemEstaEmpunhado(it) && it.compartimentoId === comp.id)));
            listaSlots.push({
                comp,
                isDireita,
                classeSlot: isDireita ? "mao-direita" : "mao-esquerda",
                titulo: `${isDireita ? "✋" : "🤚"} ${comp.nome}`,
                items: itemsEquipados
            });
        });
    } else if(compsMao.length === 1){
        const comp = compsMao[0];
        const itemsEquipados = inventarioItens.filter(it => (it.compartimentoId === comp.id || (itemEstaEmpunhado(it) && it.compartimentoId === comp.id)));
        listaSlots = [
            {
                comp,
                isDireita: true,
                classeSlot: "mao-direita",
                titulo: `✋ ${comp.nome}`,
                items: itemsEquipados
            },
            {
                comp: null,
                isDireita: false,
                classeSlot: "mao-esquerda",
                titulo: "🤚 Mão Esquerda (Secundária / Livre)",
                items: []
            }
        ];
    } else {
        const empunhados = inventarioItens.filter(it => itemEstaEmpunhado(it));
        listaSlots = [
            {
                comp: null,
                isDireita: true,
                classeSlot: "mao-direita",
                titulo: "✋ Mão Direita (Dominante)",
                items: empunhados.slice(0, 1)
            },
            {
                comp: null,
                isDireita: false,
                classeSlot: "mao-esquerda",
                titulo: "🤚 Mão Esquerda (Secundária)",
                items: empunhados.slice(1, 2)
            }
        ];
    }

    // Ordena para colocar a Mão Direita no slot da esquerda e a Mão Esquerda no slot da direita
    listaSlots.sort((a, b) => (b.isDireita ? 1 : 0) - (a.isDireita ? 1 : 0));

    container.innerHTML = "";
    listaSlots.forEach(slot => {
        const card = document.createElement("div");
        const temItem = slot.items && slot.items.length > 0;
        card.className = `inv-hud-slot-card ${slot.classeSlot}` + (temItem ? " ocupado" : "");

        const compTargetId = slot.comp ? slot.comp.id : (slot.isDireita ? "comp_mao_dir" : "comp_mao_esq");
        
        // Zona de soltura no HUD da Mão
        card.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            card.classList.add("drag-over");
        });
        card.addEventListener("dragenter", (e) => {
            e.preventDefault();
            card.classList.add("drag-over");
        });
        card.addEventListener("dragleave", (e) => {
            if (!card.contains(e.relatedTarget)) {
                card.classList.remove("drag-over");
            }
        });
        card.addEventListener("drop", (e) => {
            e.preventDefault();
            card.classList.remove("drag-over");
            const itemId = e.dataTransfer.getData("text/plain");
            if (itemId) {
                moverItemParaCompartimento(itemId, compTargetId);
            }
        });

        const nomeSlotEl = document.createElement("div");
        nomeSlotEl.className = "inv-hud-slot-nome";
        nomeSlotEl.innerHTML = `
            <span style="display:flex; align-items:center; gap:6px;">
                <strong>${slot.titulo}</strong>
            </span>
            <span class="inv-badge-tag ${temItem ? 'estado-empunhado' : 'estado-guardado'}">${temItem ? 'EMPUNHADO' : 'LIVRE'}</span>
        `;
        card.appendChild(nomeSlotEl);

        if(temItem){
            slot.items.forEach(it => {
                const cfg = TIPOS_ITEM_CONFIG[it.tipo] || TIPOS_ITEM_CONFIG.equipamento;
                const detalhe = document.createElement("div");
                detalhe.className = "inv-hud-item-detalhe";
                detalhe.setAttribute("draggable", "true");
                detalhe.title = "Arraste este item empunhado para mover a outro compartimento/guardar";

                detalhe.addEventListener("dragstart", (e) => {
                    e.stopPropagation();
                    e.dataTransfer.setData("text/plain", it.id);
                    e.dataTransfer.effectAllowed = "move";
                    detalhe.classList.add("arrastando");
                });
                detalhe.addEventListener("dragend", () => {
                    detalhe.classList.remove("arrastando");
                });

                const nomeWrap = document.createElement("div");
                nomeWrap.className = "inv-hud-item-nome-wrap";
                nomeWrap.innerHTML = `<span>${cfg.icone}</span> <span class="inv-hud-item-nome">${it.nome}</span>`;
                detalhe.appendChild(nomeWrap);

                // Se for arma de fogo ou besta com recarga, mostra status carregada/descarregada
                if(itemRequerRecarga(it)){
                    const isBesta = it.tipo === "besta";
                    const stTag = document.createElement("span");
                    stTag.className = "inv-badge-tag " + (it.carregada !== false ? "status-carregada" : "status-descarregada");
                    stTag.textContent = it.carregada !== false ? (isBesta ? "⚡ ENGATADA" : "⚡ CARREGADA") : "❌ DESCARREGADA";
                    stTag.title = isBesta ? "Besta engatada. Clique para alternar estado." : "Arma de fogo. Clique para alternar estado.";
                    stTag.onclick = (e) => { e.stopPropagation(); alternarStatusCarregadaArma(it.id); };
                    detalhe.appendChild(stTag);
                }

                card.appendChild(detalhe);

                // Ações rápidas no HUD
                const acoesEl = document.createElement("div");
                acoesEl.className = "inv-hud-acoes";

                if(itemRequerRecarga(it)){
                    const isBesta = it.tipo === "besta";
                    if(it.carregada !== false){
                        const btnDisp = document.createElement("button");
                        btnDisp.type = "button";
                        btnDisp.className = "inv-btn-acao-item btn-disparar";
                        btnDisp.innerHTML = isBesta ? "💥 Disparar Virote" : "💥 Disparar";
                        btnDisp.title = isBesta ? "Efetuar disparo de virote com a besta" : "Efetuar disparo com esta arma";
                        btnDisp.onclick = () => dispararArmaDeFogo(it.id);
                        acoesEl.appendChild(btnDisp);
                    } else {
                        const btnCarr = document.createElement("button");
                        btnCarr.type = "button";
                        btnCarr.className = "inv-btn-acao-item btn-carregar";
                        btnCarr.innerHTML = isBesta ? "⚡ Recarregar" : "⚡ Carregar";
                        btnCarr.title = isBesta ? "Engatar virote na besta" : "Preparar pederneira e carregar arma";
                        btnCarr.onclick = () => carregarArmaDeFogo(it.id);
                        acoesEl.appendChild(btnCarr);
                    }
                }

                if(it.tipo === "consumivel"){
                    const btnUsar = document.createElement("button");
                    btnUsar.type = "button";
                    btnUsar.className = "inv-btn-acao-item btn-usar";
                    btnUsar.innerHTML = "🧪 Usar 1";
                    btnUsar.title = "Consumir 1 unidade";
                    btnUsar.onclick = () => usarConsumivel(it.id);
                    acoesEl.appendChild(btnUsar);
                }

                const btnGuardar = document.createElement("button");
                btnGuardar.type = "button";
                btnGuardar.className = "inv-btn-acao-item btn-hud-guardar";
                btnGuardar.innerHTML = "🎒 Guardar";
                btnGuardar.title = "Guardar este item no compartimento de armazenamento (Mochila/Bolsos)";
                btnGuardar.onclick = () => guardarItemMao(it.id);
                acoesEl.appendChild(btnGuardar);

                const btnSoltar = document.createElement("button");
                btnSoltar.type = "button";
                btnSoltar.className = "inv-btn-acao-item btn-hud-soltar";
                btnSoltar.innerHTML = "🫳 Soltar";
                btnSoltar.title = "Soltar o item no chão / retirar de qualquer compartimento";
                btnSoltar.onclick = () => soltarItemMao(it.id);
                acoesEl.appendChild(btnSoltar);

                card.appendChild(acoesEl);
            });
        } else {
            const vazioTxt = document.createElement("div");
            vazioTxt.className = "inv-hud-vazio-txt";
            vazioTxt.textContent = slot.isDireita ? "✋ Mão Direita livre (Nenhum item empunhado)" : "🤚 Mão Esquerda livre (Nenhum item empunhado)";
            card.appendChild(vazioTxt);
        }
        container.appendChild(card);
    });
}

function atualizarInventarioUI(){
    const cargaTotal = calcularCargaTotal();
    const cargaMax = obterCargaMaxima();
    const pct = cargaMax > 0 ? (cargaTotal / cargaMax) * 100 : 0;
    const pctArredondado = Math.round(pct);

    // Atualiza números do painel
    const cargaTotalEl = document.getElementById("inv-carga-total");
    if(cargaTotalEl){
        cargaTotalEl.textContent = cargaTotal % 1 === 0 ? cargaTotal.toFixed(1) : Number(cargaTotal.toFixed(2)).toString();
    }

    const cargaPctEl = document.getElementById("inv-carga-pct");
    if(cargaPctEl){
        cargaPctEl.textContent = pctArredondado + "%";
    }

    const pilulaStatusEl = document.getElementById("inv-status-pilula");
    const barraFillEl = document.getElementById("inv-barra-preenchimento");
    const alertaBoxEl = document.getElementById("inv-alerta-sobrecarga-box");
    const barraStatusTextoEl = document.getElementById("inv-barra-status-texto");
    const barraDescEl = document.getElementById("inv-barra-desc");

    if(barraDescEl){
        const totalFmt = cargaTotal % 1 === 0 ? cargaTotal.toFixed(1) : Number(cargaTotal.toFixed(2)).toString();
        const maxFmt = cargaMax % 1 === 0 ? cargaMax.toFixed(1) : Number(cargaMax.toFixed(2)).toString();
        barraDescEl.textContent = `Capacidade de Carga: ${totalFmt} / ${maxFmt} kg`;
    }

    // Determina o estado da carga (Leve <= 70%, Pesado 70%-100%, Sobrecarga > 100%)
    let estadoCarga = "leve";
    let textoStatus = "Peso Confortável";
    if(pct > 100){
        estadoCarga = "sobrecarga";
        const excesso = (cargaTotal - cargaMax).toFixed(1);
        textoStatus = `Sobrecarga (+${excesso} kg)`;
    } else if(pct >= 70){
        estadoCarga = "pesado";
        textoStatus = "Carga Pesada";
    }

    if (typeof window._ultimoEstadoCargaInventario !== "undefined" && window._ultimoEstadoCargaInventario !== estadoCarga) {
        if (typeof tocarSomStatus === "function") {
            if (estadoCarga === "sobrecarga" || estadoCarga === "pesado") {
                tocarSomStatus("debuff", "ganhar", estadoCarga);
            } else if (window._ultimoEstadoCargaInventario === "sobrecarga" || window._ultimoEstadoCargaInventario === "pesado") {
                tocarSomStatus("debuff", "curar", "carga_aliviada");
            }
        }
    }
    window._ultimoEstadoCargaInventario = estadoCarga;

    if(pilulaStatusEl){
        pilulaStatusEl.className = "inv-status-pill " + estadoCarga;
        pilulaStatusEl.textContent = estadoCarga.toUpperCase();
    }

    if(barraStatusTextoEl){
        barraStatusTextoEl.textContent = textoStatus;
    }

    if(barraFillEl){
        barraFillEl.style.width = Math.min(100, Math.max(0, pct)) + "%";
        barraFillEl.className = "inv-barra-fill " + (estadoCarga !== "leve" ? estadoCarga : "");
    }

    if(alertaBoxEl){
        alertaBoxEl.style.display = (pct > 100) ? "flex" : "none";
    }

    // Contagem total de itens e contagens por categoria
    let qtdItensTotal = 0;
    let countsPorCat = {
        todos: inventarioItens.length,
        arma_branca: 0,
        arma_fogo: 0,
        arco: 0,
        besta: 0,
        veste: 0,
        equipamento: 0,
        consumivel: 0,
        ilegal: 0
    };

    inventarioItens.forEach(it => {
        const q = Math.max(1, parseInt(it.qtd, 10) || 1);
        qtdItensTotal += q;
        let t = it.tipo;
        if(t === "arma") t = "arma_branca";
        if(countsPorCat[t] !== undefined) countsPorCat[t]++;
        if(it.ilegal) countsPorCat.ilegal++;
    });

    const totalItensEl = document.getElementById("inv-total-itens");
    const totalLotesRotuloEl = document.getElementById("inv-total-lotes-rotulo");
    if(totalItensEl) totalItensEl.textContent = qtdItensTotal;
    if(totalLotesRotuloEl){
        const lotes = inventarioItens.length;
        totalLotesRotuloEl.textContent = lotes === 1 ? `unidade (${lotes} tipo)` : `unidades (${lotes} tipos)`;
    }

    // Atualiza contadores das abas/botões de filtro
    ["todos", "arma_branca", "arma_fogo", "arco", "besta", "veste", "equipamento", "consumivel", "ilegal"].forEach(cat => {
        const el = document.getElementById("count-filtro-" + cat);
        if(el) el.textContent = countsPorCat[cat] || 0;
    });

    const tabBadgeInvEl = document.getElementById("tab-badge-inv-qtd");
    if(tabBadgeInvEl) tabBadgeInvEl.textContent = inventarioItens.length;

    renderizarGradeCompartimentos();
    renderizarHUDMaosAtivas();
    renderizarListaInventario();
}

function renderizarListaInventario(){
    const container = document.getElementById("lista-inventario");
    if(!container) return;

    // Filtra itens
    let itensExibidos = inventarioItens.filter(it => {
        // Filtro por categoria
        if(filtroCategoriaInventarioAtivo === "ilegal"){
            if(!it.ilegal) return false;
        } else if(filtroCategoriaInventarioAtivo === "arma"){
            if(!["arma_branca", "arma_fogo", "arco", "besta", "arma"].includes(it.tipo)) return false;
        } else if(filtroCategoriaInventarioAtivo !== "todos"){
            let tipoItem = it.tipo;
            if(tipoItem === "arma") tipoItem = "arma_branca";
            if(tipoItem !== filtroCategoriaInventarioAtivo) return false;
        }
        // Filtro por busca de texto
        if(termoBuscaInventario.trim() !== ""){
            const busca = termoBuscaInventario.toLowerCase();
            const nomeMatch = (it.nome || "").toLowerCase().includes(busca);
            const descMatch = (it.descricao || "").toLowerCase().includes(busca);
            const tipoMatch = (TIPOS_ITEM_CONFIG[it.tipo]?.rotulo || "").toLowerCase().includes(busca);
            const comp = inventarioCompartimentos.find(c => c.id === it.compartimentoId);
            const compMatch = (comp?.nome || "").toLowerCase().includes(busca);
            const estadoEmpunhadura = itemEstaEmpunhado(it) ? "empunhado" : "guardado";
            const estadoMatch = estadoEmpunhadura.includes(busca);
            if(!nomeMatch && !descMatch && !tipoMatch && !compMatch && !estadoMatch) return false;
        }
        return true;
    });

    if(itensExibidos.length === 0){
        if(inventarioItens.length === 0){
            container.innerHTML = '<div class="inv-vazio-aviso">Nenhum item cadastrado no inventário. Utilize o formulário acima para adicionar armas, vestes ou equipamentos aos compartimentos.</div>';
        } else {
            container.innerHTML = '<div class="inv-vazio-aviso">Nenhum item encontrado com os filtros ou termo de busca atuais.</div>';
        }
        return;
    }

    container.innerHTML = "";

    if(modoVisualizacaoInventario === "tabela"){
        // MODO TABELA TÁTICA COMPACTA
        const tableWrap = document.createElement("div");
        tableWrap.className = "inv-tabela-wrap";

        const table = document.createElement("table");
        table.className = "inv-tabela-tatica";

        table.innerHTML = `
            <thead>
                <tr>
                    <th>Item / Categoria</th>
                    <th>Local / Empunhadura</th>
                    <th>Status / Fogo</th>
                    <th>Qtd</th>
                    <th>Peso / Slots</th>
                    <th style="text-align:right;">Ações Rápidas</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector("tbody");

        itensExibidos.forEach(item => {
            const cfg = TIPOS_ITEM_CONFIG[item.tipo] || TIPOS_ITEM_CONFIG.equipamento;
            const qtd = Math.max(1, parseInt(item.qtd, 10) || 1);
            const pesoUnit = Math.max(0, parseFloat(item.peso) || 0);
            const pesoTotal = (qtd * pesoUnit);
            const pesoTotalFmt = pesoTotal % 1 === 0 ? pesoTotal.toFixed(1) : Number(pesoTotal.toFixed(2)).toString();

            const comp = inventarioCompartimentos.find(c => c.id === item.compartimentoId);
            const espacoUnitEfetivo = obterEspacoEfetivoItemNoCompartimento(item, comp || item.compartimentoId);
            const espacoTotal = espacoUnitEfetivo * qtd;
            const espacoTotalFmt = espacoTotal % 1 === 0 ? espacoTotal.toFixed(0) : espacoTotal.toFixed(1);

            const compNome = comp ? `${comp.icone || "📦"} ${comp.nome}` : (item.compartimentoId === "nenhum" ? "⚠️ Fora de Compartimento" : "📦 Geral");
            const estaEmpunhado = itemEstaEmpunhado(item);

            const tr = document.createElement("tr");
            tr.className = (estaEmpunhado ? "empunhado" : "") + (item.ilegal ? " ilegal" : "");
            tr.setAttribute("draggable", "true");
            tr.title = "Arraste esta linha para mover o item para outro compartimento";

            tr.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", item.id);
                e.dataTransfer.effectAllowed = "move";
                tr.classList.add("arrastando");
            });
            tr.addEventListener("dragend", () => {
                tr.classList.remove("arrastando");
            });

            // Coluna 1: Item & Categoria
            const tdItem = document.createElement("td");
            tdItem.innerHTML = `
                <div style="display:flex; align-items:center; gap:6px;">
                    <span>${cfg.icone}</span>
                    <div>
                        <strong style="font-family:'MirageFinal', serif; font-size:14px; color:var(--ink);">${item.nome}</strong>
                        <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:2px;">
                            <span class="inv-badge-tag ${cfg.classe}">${cfg.rotulo}</span>
                            ${item.isArmaDeFogo ? '<span class="inv-badge-tag arma-fogo">🔫 PEDERNEIRA</span>' : ''}
                            ${item.ilegal ? '<span class="inv-badge-tag ilegal-tag">🚫 ILEGAL</span>' : ''}
                        </div>
                    </div>
                </div>
            `;

            // Coluna 2: Local & Empunhadura
            const tdLocal = document.createElement("td");
            tdLocal.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:2px;">
                    <span class="inv-badge-tag compartimento-tag" style="align-self:flex-start;">${compNome}</span>
                    <button type="button" class="inv-badge-tag inv-btn-empunhadura-toggle ${estaEmpunhado ? 'estado-empunhado' : 'estado-guardado'}" onclick="alternarEmpunhaduraItem('${item.id}')" style="align-self:flex-start;">
                        ${estaEmpunhado ? '✋ EMPUNHADO' : '🎒 GUARDADO'}
                    </button>
                </div>
            `;

            // Coluna 3: Status / Arma de fogo ou Besta
            const tdStatus = document.createElement("td");
            if(itemRequerRecarga(item)){
                const isBesta = item.tipo === "besta";
                const btnSt = document.createElement("span");
                btnSt.className = "inv-badge-tag " + (item.carregada !== false ? "status-carregada" : "status-descarregada");
                btnSt.textContent = item.carregada !== false ? (isBesta ? "⚡ ENGATADA" : "⚡ CARREGADA") : "❌ DESCARREGADA";
                btnSt.title = isBesta ? "Besta com virote. Clique para alternar estado." : "Clique para alternar se a arma de fogo está carregada ou descarregada";
                btnSt.onclick = () => alternarStatusCarregadaArma(item.id);
                tdStatus.appendChild(btnSt);
            } else {
                tdStatus.innerHTML = '<span style="color:var(--ink-faint); font-size:11px;">Padrão</span>';
            }

            // Coluna 4: Qtd
            const tdQtd = document.createElement("td");
            tdQtd.innerHTML = `
                <div class="inv-qtd-controles">
                    <button type="button" class="inv-btn-qtd" onclick="alterarQtdItemInventario('${item.id}', -1)">-</button>
                    <span class="inv-qtd-display">${qtd}x</span>
                    <button type="button" class="inv-btn-qtd" onclick="alterarQtdItemInventario('${item.id}', 1)">+</button>
                </div>
            `;

            // Coluna 5: Peso e Slots
            const estaSolto = item.compartimentoId === "nenhum";
            const tdPeso = document.createElement("td");
            if(estaSolto){
                tdPeso.innerHTML = `
                    <div style="font-size:12px; color:var(--ink-dim);" title="Item solto no chão: peso zerado na carga carregada pelo personagem (${pesoTotalFmt} kg original)">
                        <span style="text-decoration:line-through; opacity:0.5; margin-right:3px;">${pesoTotalFmt} kg</span>
                        <strong style="color:#e67e22;">0.0</strong> kg <span style="font-size:10.5px; color:#e67e22;">(Solto)</span>
                    </div>
                `;
            } else {
                tdPeso.innerHTML = `
                    <div style="font-size:12px; color:var(--ink-dim);">
                        <strong>${pesoTotalFmt}</strong> kg <span style="font-size:10.5px;">(${espacoTotalFmt} slot${espacoTotal === 1 ? '' : 's'})</span>
                    </div>
                `;
            }

            // Coluna 6: Ações Rápidas
            const tdAcoes = document.createElement("td");
            tdAcoes.style.textAlign = "right";

            const acoesWrap = document.createElement("div");
            acoesWrap.style.display = "inline-flex";
            acoesWrap.style.gap = "4px";

            if(itemRequerRecarga(item)){
                const isBesta = item.tipo === "besta";
                if(item.carregada !== false){
                    const btnDisp = document.createElement("button");
                    btnDisp.type = "button";
                    btnDisp.className = "inv-btn-acao-item btn-disparar";
                    btnDisp.innerHTML = isBesta ? "💥 Disparar Virote" : "💥 Disparar";
                    btnDisp.onclick = () => dispararArmaDeFogo(item.id);
                    acoesWrap.appendChild(btnDisp);
                } else {
                    const btnCarr = document.createElement("button");
                    btnCarr.type = "button";
                    btnCarr.className = "inv-btn-acao-item btn-carregar";
                    btnCarr.innerHTML = isBesta ? "⚡ Recarregar" : "⚡ Carregar";
                    btnCarr.onclick = () => carregarArmaDeFogo(item.id);
                    acoesWrap.appendChild(btnCarr);
                }
            }

            if(item.tipo === "consumivel"){
                const btnUsar = document.createElement("button");
                btnUsar.type = "button";
                btnUsar.className = "inv-btn-acao-item btn-usar";
                btnUsar.innerHTML = "🧪 Usar 1";
                btnUsar.onclick = () => usarConsumivel(item.id);
                acoesWrap.appendChild(btnUsar);
            }

            const btnCeder = document.createElement("button");
            btnCeder.type = "button";
            btnCeder.className = "inv-btn-acao-item";
            btnCeder.style.color = "var(--accent)";
            btnCeder.innerHTML = "🤝";
            btnCeder.title = "Ceder / Transferir este item para outro jogador ou ficha";
            btnCeder.onclick = () => abrirModalCederItem(item.id);

            const btnEdit = document.createElement("button");
            btnEdit.type = "button";
            btnEdit.className = "inv-btn-acao-item";
            btnEdit.innerHTML = "✏️";
            btnEdit.title = "Editar";
            btnEdit.onclick = () => editarItemInventario(item.id);

            const btnDel = document.createElement("button");
            btnDel.type = "button";
            btnDel.className = "inv-btn-acao-item excluir";
            btnDel.innerHTML = "✕";
            btnDel.title = "Excluir";
            btnDel.onclick = () => excluirItemInventario(item.id);

            acoesWrap.append(btnCeder, btnEdit, btnDel);
            tdAcoes.appendChild(acoesWrap);

            tr.append(tdItem, tdLocal, tdStatus, tdQtd, tdPeso, tdAcoes);
            tbody.appendChild(tr);
        });

        tableWrap.appendChild(table);
        container.appendChild(tableWrap);
        return;
    }

    // MODO CARDS (DOSSIÊ)
    itensExibidos.forEach(item => {
        const cfg = TIPOS_ITEM_CONFIG[item.tipo] || TIPOS_ITEM_CONFIG.equipamento;
        const qtd = Math.max(1, parseInt(item.qtd, 10) || 1);
        const pesoUnit = Math.max(0, parseFloat(item.peso) || 0);
        const pesoTotal = (qtd * pesoUnit);
        const pesoTotalFmt = pesoTotal % 1 === 0 ? pesoTotal.toFixed(1) : Number(pesoTotal.toFixed(2)).toString();
        const pesoUnitFmt = pesoUnit % 1 === 0 ? pesoUnit.toFixed(1) : Number(pesoUnit.toFixed(2)).toString();

        const comp = inventarioCompartimentos.find(c => c.id === item.compartimentoId);
        const espacoUnitEfetivo = obterEspacoEfetivoItemNoCompartimento(item, comp || item.compartimentoId);
        const espacoTotal = espacoUnitEfetivo * qtd;
        const espacoTotalFmt = espacoTotal % 1 === 0 ? espacoTotal.toFixed(0) : espacoTotal.toFixed(1);

        const compNome = comp ? `${comp.icone || "📦"} ${comp.nome}` : (item.compartimentoId === "nenhum" ? "⚠️ Fora de Compartimento" : "📦 Geral");
        const estaEmpunhado = itemEstaEmpunhado(item);

        const card = document.createElement("div");
        card.className = "inv-item-card" + (item.ilegal ? " ilegal" : "") + (estaEmpunhado ? " empunhado" : "");
        card.id = "card_" + item.id;
        card.setAttribute("draggable", "true");
        card.title = "Arraste este card para mover o item para outro compartimento";

        card.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", item.id);
            e.dataTransfer.effectAllowed = "move";
            card.classList.add("arrastando");
        });
        card.addEventListener("dragend", () => {
            card.classList.remove("arrastando");
        });

        // Topo do card
        const topo = document.createElement("div");
        topo.className = "inv-item-topo";

        const infoPrinc = document.createElement("div");
        infoPrinc.className = "inv-item-info-principal";

        const nomeLinha = document.createElement("div");
        nomeLinha.className = "inv-item-nome-linha";

        const iconeEl = document.createElement("span");
        iconeEl.className = "inv-item-icone";
        iconeEl.textContent = cfg.icone;

        const nomeEl = document.createElement("div");
        nomeEl.className = "inv-item-nome";
        nomeEl.textContent = item.nome;

        nomeLinha.append(iconeEl, nomeEl);

        const badgesEl = document.createElement("div");
        badgesEl.className = "inv-item-badges";

        // Botão/Badge interativo EMPUNHADO / GUARDADO
        const empunhaduraBadge = document.createElement("button");
        empunhaduraBadge.type = "button";
        empunhaduraBadge.className = "inv-badge-tag inv-btn-empunhadura-toggle " + (estaEmpunhado ? "estado-empunhado" : "estado-guardado");
        empunhaduraBadge.setAttribute("aria-pressed", estaEmpunhado ? "true" : "false");
        empunhaduraBadge.title = estaEmpunhado 
            ? "Item EMPUNHADO nas mãos. Clique para alternar e GUARDAR na mochila/compartimento." 
            : "Item GUARDADO. Clique para alternar e EMPUNHAR em uma das mãos.";
        empunhaduraBadge.innerHTML = estaEmpunhado 
            ? `✋ EMPUNHADO` 
            : `🎒 GUARDADO`;
        empunhaduraBadge.onclick = (e) => {
            e.stopPropagation();
            alternarEmpunhaduraItem(item.id);
        };
        badgesEl.appendChild(empunhaduraBadge);

        const tipoBadge = document.createElement("span");
        tipoBadge.className = "inv-badge-tag " + cfg.classe;
        tipoBadge.textContent = cfg.rotulo;
        badgesEl.appendChild(tipoBadge);

        // Badge para Arma de Fogo ou Besta
        if(itemRequerRecarga(item)){
            const isBesta = item.tipo === "besta";
            if(item.isArmaDeFogo && item.tipo !== "arma_fogo" && item.tipo !== "besta"){
                const fogoBadge = document.createElement("span");
                fogoBadge.className = "inv-badge-tag arma-fogo";
                fogoBadge.textContent = "🔫 PEDERNEIRA";
                badgesEl.appendChild(fogoBadge);
            }

            const statusFogoBadge = document.createElement("span");
            statusFogoBadge.className = "inv-badge-tag " + (item.carregada !== false ? "status-carregada" : "status-descarregada");
            statusFogoBadge.textContent = item.carregada !== false ? (isBesta ? "⚡ ENGATADA" : "⚡ CARREGADA") : "❌ DESCARREGADA";
            statusFogoBadge.title = isBesta ? "Besta com virote engatado. Clique para alternar estado." : "Arma de fogo. Clique para alternar se está carregada ou descarregada";
            statusFogoBadge.onclick = (e) => {
                e.stopPropagation();
                alternarStatusCarregadaArma(item.id);
            };
            badgesEl.appendChild(statusFogoBadge);
        }

        const compBadge = document.createElement("span");
        compBadge.className = "inv-badge-tag compartimento-tag";
        compBadge.textContent = compNome;
        compBadge.title = "Guardado em: " + compNome;
        badgesEl.appendChild(compBadge);

        if(item.ilegal){
            const ilegalBadge = document.createElement("span");
            ilegalBadge.className = "inv-badge-tag ilegal-tag";
            ilegalBadge.innerHTML = "🚫 ILEGAL";
            ilegalBadge.title = "Item proibido pelas autoridades ou contrabando";
            badgesEl.appendChild(ilegalBadge);
        }

        infoPrinc.append(nomeLinha, badgesEl);

        const estaSolto = item.compartimentoId === "nenhum";
        const pesoBadge = document.createElement("div");
        pesoBadge.className = "inv-item-peso-badge" + (estaSolto ? " solto" : "");
        if(estaSolto){
            pesoBadge.title = `Item solto no chão: peso zerado na carga do personagem (${pesoTotalFmt} kg original)`;
            pesoBadge.innerHTML = `<span style="text-decoration:line-through; opacity:0.5; font-size:10px; margin-right:3px;">${pesoTotalFmt}kg</span><strong style="color:#e67e22;">0.0</strong> kg<span class="inv-item-espaco-sub" style="color:#e67e22;">🫳 Solto (0 kg)</span>`;
        } else {
            pesoBadge.title = `Peso: ${pesoUnitFmt} kg × ${qtd} un = ${pesoTotalFmt} kg | Espaço efetivo: ${espacoTotalFmt} slots`;
            pesoBadge.innerHTML = `<strong>${pesoTotalFmt}</strong> kg<span class="inv-item-espaco-sub">${espacoTotalFmt} slot${espacoTotal === 1 ? '' : 's'}</span>`;
        }

        topo.append(infoPrinc, pesoBadge);
        card.appendChild(topo);

        // Descrição (se houver)
        if(item.descricao && item.descricao.trim() !== ""){
            const descEl = document.createElement("div");
            descEl.className = "inv-item-descricao";
            descEl.textContent = item.descricao;
            card.appendChild(descEl);
        }

        // Rodapé com controle de quantidade e ações
        const rodape = document.createElement("div");
        rodape.className = "inv-item-rodape";

        const qtdWrap = document.createElement("div");
        qtdWrap.className = "inv-qtd-controles";
        qtdWrap.title = "Ajustar quantidade deste item";

        const btnMenos = document.createElement("button");
        btnMenos.type = "button";
        btnMenos.className = "inv-btn-qtd";
        btnMenos.textContent = "-";
        btnMenos.onclick = () => alterarQtdItemInventario(item.id, -1);

        const qtdDisplay = document.createElement("span");
        qtdDisplay.className = "inv-qtd-display";
        qtdDisplay.textContent = qtd + "x";

        const btnMais = document.createElement("button");
        btnMais.type = "button";
        btnMais.className = "inv-btn-qtd";
        btnMais.textContent = "+";
        btnMais.onclick = () => alterarQtdItemInventario(item.id, 1);

        qtdWrap.append(btnMenos, qtdDisplay, btnMais);

        const acoesWrap = document.createElement("div");
        acoesWrap.className = "inv-item-acoes";

        // Ações específicas para arma de fogo ou besta
        if(itemRequerRecarga(item)){
            const isBesta = item.tipo === "besta";
            if(item.carregada !== false){
                const btnDisp = document.createElement("button");
                btnDisp.type = "button";
                btnDisp.className = "inv-btn-acao-item btn-disparar";
                btnDisp.innerHTML = isBesta ? "💥 Disparar Virote" : "💥 Disparar";
                btnDisp.title = isBesta ? "Efetuar disparo de virote com a besta" : "Efetuar disparo";
                btnDisp.onclick = () => dispararArmaDeFogo(item.id);
                acoesWrap.appendChild(btnDisp);
            } else {
                const btnCarr = document.createElement("button");
                btnCarr.type = "button";
                btnCarr.className = "inv-btn-acao-item btn-carregar";
                btnCarr.innerHTML = isBesta ? "⚡ Recarregar" : "⚡ Carregar";
                btnCarr.title = isBesta ? "Engatar virote na besta" : "Carregar arma de fogo";
                btnCarr.onclick = () => carregarArmaDeFogo(item.id);
                acoesWrap.appendChild(btnCarr);
            }
        }

        // Ação rápida para consumível
        if(item.tipo === "consumivel"){
            const btnUsar = document.createElement("button");
            btnUsar.type = "button";
            btnUsar.className = "inv-btn-acao-item btn-usar";
            btnUsar.innerHTML = "🧪 Usar 1";
            btnUsar.title = "Consumir 1 unidade";
            btnUsar.onclick = () => usarConsumivel(item.id);
            acoesWrap.appendChild(btnUsar);
        }

        // Botão alternar empunhar/guardar
        const btnAlternarEmpunhar = document.createElement("button");
        btnAlternarEmpunhar.type = "button";
        btnAlternarEmpunhar.className = "inv-btn-acao-item btn-toggle-empunhar " + (estaEmpunhado ? "empunhado" : "guardado");
        btnAlternarEmpunhar.title = estaEmpunhado ? "Guardar no compartimento" : "Empunhar nas mãos";
        btnAlternarEmpunhar.innerHTML = estaEmpunhado ? "🎒 Guardar" : "✋ Empunhar";
        btnAlternarEmpunhar.onclick = () => alternarEmpunhaduraItem(item.id);

        const btnCeder = document.createElement("button");
        btnCeder.type = "button";
        btnCeder.className = "inv-btn-acao-item";
        btnCeder.style.color = "var(--accent)";
        btnCeder.innerHTML = "🤝 Ceder";
        btnCeder.title = "Ceder / Transferir este item para outro jogador ou ficha";
        btnCeder.onclick = () => abrirModalCederItem(item.id);

        const btnEditar = document.createElement("button");
        btnEditar.type = "button";
        btnEditar.className = "inv-btn-acao-item";
        btnEditar.innerHTML = "✏️ Editar";
        btnEditar.title = "Editar informações deste item";
        btnEditar.onclick = () => editarItemInventario(item.id);

        const btnDuplicar = document.createElement("button");
        btnDuplicar.type = "button";
        btnDuplicar.className = "inv-btn-acao-item";
        btnDuplicar.innerHTML = "⎘";
        btnDuplicar.title = "Duplicar item";
        btnDuplicar.onclick = () => duplicarItemInventario(item.id);

        const btnExcluir = document.createElement("button");
        btnExcluir.type = "button";
        btnExcluir.className = "inv-btn-acao-item excluir";
        btnExcluir.innerHTML = "✕";
        btnExcluir.title = "Excluir item";
        btnExcluir.onclick = () => excluirItemInventario(item.id);

        acoesWrap.append(btnAlternarEmpunhar, btnCeder, btnEditar, btnDuplicar, btnExcluir);
        rodape.append(qtdWrap, acoesWrap);
        card.appendChild(rodape);

        container.appendChild(card);
    });
}

function salvarItemInventario(){
    const nomeInput = document.getElementById("item_nome");
    const tipoSelect = document.getElementById("item_tipo");
    const compSelect = document.getElementById("item_compartimento");
    const espacoInput = document.getElementById("item_espaco");
    const espacoMaoInput = document.getElementById("item_espaco_mao");
    const espacoMochilaInput = document.getElementById("item_espaco_mochila");
    const qtdInput = document.getElementById("item_qtd");
    const pesoInput = document.getElementById("item_peso");
    const ilegalInput = document.getElementById("item_ilegal");
    const isArmaFogoInput = document.getElementById("item_is_arma_fogo");
    const carregadaInput = document.getElementById("item_carregada");
    const descTextarea = document.getElementById("item_descricao");

    const nome = (nomeInput?.value || "").trim();
    if(!nome){
        mostrarStatus("✗ Informe o nome do item para adicioná-lo.", "erro");
        if(nomeInput) nomeInput.focus();
        return;
    }

    const tipo = tipoSelect?.value || "equipamento";
    const compartimentoId = compSelect?.value || (inventarioCompartimentos[0]?.id || "comp_geral");
    const espaco = Math.max(0, parseFloat(espacoInput?.value) || 1.0);
    const espacoMao = espacoMaoInput?.value !== "" ? Math.max(0, parseFloat(espacoMaoInput?.value) || 0) : espaco;
    const espacoMochila = espacoMochilaInput?.value !== "" ? Math.max(0, parseFloat(espacoMochilaInput?.value) || 0) : espaco * 2;
    const qtd = Math.max(1, parseInt(qtdInput?.value, 10) || 1);
    const peso = Math.max(0, parseFloat(pesoInput?.value) || 0);
    const ilegal = !!(ilegalInput?.checked);
    const isArmaDeFogo = !!(isArmaFogoInput?.checked) || tipo === "arma_fogo" || tipo === "besta";
    const carregada = isArmaDeFogo ? !!(carregadaInput?.checked) : true;
    const descricao = (descTextarea?.value || "").trim();

    const compEscolhido = inventarioCompartimentos.find(c => c.id === compartimentoId);
    const ehMaoEscolhido = (compEscolhido && compEscolhido.tipo === "mao") || (compartimentoId && compartimentoId.includes("mao"));

    if(itemEmEdicaoId){
        // Atualiza item existente
        const idx = inventarioItens.findIndex(it => it.id === itemEmEdicaoId);
        if(idx !== -1){
            inventarioItens[idx].nome = nome;
            inventarioItens[idx].tipo = tipo;
            inventarioItens[idx].compartimentoId = compartimentoId;
            inventarioItens[idx].espaco = espaco;
            inventarioItens[idx].espacoMao = espacoMao;
            inventarioItens[idx].espacoMochila = espacoMochila;
            inventarioItens[idx].qtd = qtd;
            inventarioItens[idx].peso = peso;
            inventarioItens[idx].ilegal = ilegal;
            inventarioItens[idx].isArmaDeFogo = isArmaDeFogo;
            inventarioItens[idx].carregada = carregada;
            inventarioItens[idx].descricao = descricao;
            inventarioItens[idx].empunhado = ehMaoEscolhido;
            inventarioItens[idx].atualizadoEm = new Date().toISOString();
            mostrarStatus(`✓ Item "${nome}" atualizado no inventário.`, "ok");
        }
        cancelarEdicaoItem();
    } else {
        // Adiciona novo item
        const novoItem = {
            id: gerarIdItem(),
            nome,
            tipo,
            compartimentoId,
            espaco,
            espacoMao,
            espacoMochila,
            qtd,
            peso,
            ilegal,
            isArmaDeFogo,
            carregada,
            descricao,
            empunhado: ehMaoEscolhido,
            criadoEm: new Date().toISOString()
        };
        inventarioItens.push(novoItem);
        mostrarStatus(`✓ Item "${nome}" adicionado ao inventário.`, "ok");
        limparFormularioItem();
    }

    atualizarInventarioUI();
    marcarAlteracaoFeita();
}

function editarItemInventario(id){
    const item = inventarioItens.find(it => it.id === id);
    if(!item) return;

    itemEmEdicaoId = id;

    const nomeInput = document.getElementById("item_nome");
    const tipoSelect = document.getElementById("item_tipo");
    const compSelect = document.getElementById("item_compartimento");
    const espacoInput = document.getElementById("item_espaco");
    const espacoMaoInput = document.getElementById("item_espaco_mao");
    const espacoMochilaInput = document.getElementById("item_espaco_mochila");
    const qtdInput = document.getElementById("item_qtd");
    const pesoInput = document.getElementById("item_peso");
    const ilegalInput = document.getElementById("item_ilegal");
    const isArmaFogoInput = document.getElementById("item_is_arma_fogo");
    const carregadaInput = document.getElementById("item_carregada");
    const descTextarea = document.getElementById("item_descricao");
    const tituloTxt = document.getElementById("inv-form-titulo-txt");
    const btnSalvarTxt = document.getElementById("txt-btn-salvar-item");
    const btnCancelar = document.getElementById("btn-cancelar-edicao-item");
    const formBox = document.getElementById("inv-form-box");

    popularSelectCompartimentosForm();

    if(nomeInput) nomeInput.value = item.nome;
    if(tipoSelect) tipoSelect.value = item.tipo;
    if(compSelect) compSelect.value = item.compartimentoId || (inventarioCompartimentos[0]?.id || "nenhum");
    if(espacoInput) espacoInput.value = item.espaco !== undefined ? item.espaco : 1;
    if(espacoMaoInput) espacoMaoInput.value = item.espacoMao !== undefined ? item.espacoMao : (item.espaco || 1);
    if(espacoMochilaInput) espacoMochilaInput.value = item.espacoMochila !== undefined ? item.espacoMochila : ((item.espaco || 1) * 2);
    if(qtdInput) qtdInput.value = item.qtd;
    if(pesoInput) pesoInput.value = item.peso;
    if(ilegalInput) ilegalInput.checked = !!item.ilegal;
    if(isArmaFogoInput) isArmaFogoInput.checked = !!item.isArmaDeFogo;
    if(carregadaInput) carregadaInput.checked = item.carregada !== false;
    if(descTextarea) descTextarea.value = item.descricao || "";

    aoAlternarFormArmaFogo();

    if(tituloTxt) tituloTxt.textContent = "Editar Item: " + item.nome;
    if(btnSalvarTxt) btnSalvarTxt.textContent = "Salvar Alterações";
    if(btnCancelar) btnCancelar.style.display = "inline-block";
    if(formBox) formBox.classList.add("modo-edicao");

    atualizarPreviewFormTipo();

    formBox?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nomeInput?.focus();
}

function cancelarEdicaoItem(){
    itemEmEdicaoId = null;
    limparFormularioItem();
    const tituloTxt = document.getElementById("inv-form-titulo-txt");
    const btnSalvarTxt = document.getElementById("txt-btn-salvar-item");
    const btnCancelar = document.getElementById("btn-cancelar-edicao-item");
    const formBox = document.getElementById("inv-form-box");

    if(tituloTxt) tituloTxt.textContent = "Adicionar Item ao Inventário";
    if(btnSalvarTxt) btnSalvarTxt.textContent = "Adicionar Item";
    if(btnCancelar) btnCancelar.style.display = "none";
    if(formBox) formBox.classList.remove("modo-edicao");

    atualizarPreviewFormTipo();
}

function limparFormularioItem(){
    const nomeInput = document.getElementById("item_nome");
    const tipoSelect = document.getElementById("item_tipo");
    const espacoInput = document.getElementById("item_espaco");
    const espacoMaoInput = document.getElementById("item_espaco_mao");
    const espacoMochilaInput = document.getElementById("item_espaco_mochila");
    const qtdInput = document.getElementById("item_qtd");
    const pesoInput = document.getElementById("item_peso");
    const ilegalInput = document.getElementById("item_ilegal");
    const isArmaFogoInput = document.getElementById("item_is_arma_fogo");
    const carregadaInput = document.getElementById("item_carregada");
    const descTextarea = document.getElementById("item_descricao");

    if(nomeInput) nomeInput.value = "";
    if(tipoSelect) tipoSelect.value = "equipamento";
    if(espacoInput) espacoInput.value = "1";
    if(espacoMaoInput) espacoMaoInput.value = "1";
    if(espacoMochilaInput) espacoMochilaInput.value = "2";
    if(qtdInput) qtdInput.value = "1";
    if(pesoInput) pesoInput.value = "1.0";
    if(ilegalInput) ilegalInput.checked = false;
    if(isArmaFogoInput) isArmaFogoInput.checked = false;
    if(carregadaInput) carregadaInput.checked = true;
    if(descTextarea) descTextarea.value = "";

    aoAlternarFormArmaFogo();
    popularSelectCompartimentosForm();
    atualizarPreviewFormTipo();
}

function alterarQtdItemInventario(id, delta){
    const item = inventarioItens.find(it => it.id === id);
    if(!item) return;

    let novaQtd = (parseInt(item.qtd, 10) || 1) + delta;
    if(novaQtd <= 0){
        excluirItemInventario(id);
        return;
    }

    item.qtd = novaQtd;
    atualizarInventarioUI();
    marcarAlteracaoFeita();
}

function duplicarItemInventario(id){
    const item = inventarioItens.find(it => it.id === id);
    if(!item) return;

    const copia = {
        ...item,
        id: gerarIdItem(),
        nome: item.nome + " (Cópia)",
        criadoEm: new Date().toISOString()
    };
    inventarioItens.push(copia);
    atualizarInventarioUI();
    marcarAlteracaoFeita();
    mostrarStatus(`✓ Cópia de "${item.nome}" criada no inventário.`, "ok");
}

function excluirItemInventario(id){
    const item = inventarioItens.find(it => it.id === id);
    if(!item) return;

    abrirModalConfirmacao({
        titulo: "Excluir Item",
        icone: "🗑",
        tema: "tema-perigo",
        mensagem: `Tem certeza que deseja remover <strong>${item.nome}</strong> do inventário?`,
        rotuloConfirmar: "Excluir",
        aoConfirmar: () => {
            inventarioItens = inventarioItens.filter(it => it.id !== id);
            if(itemEmEdicaoId === id) cancelarEdicaoItem();
            atualizarInventarioUI();
            marcarAlteracaoFeita();
            mostrarStatus(`✓ Item "${item.nome}" removido do inventário.`, "ok");
        }
    });
}

function filtrarCategoriaInventario(cat){
    filtroCategoriaInventarioAtivo = cat;
    document.querySelectorAll(".inv-filtro-btn").forEach(btn => {
        btn.classList.toggle("ativo", btn.id === "filtro-btn-" + cat);
    });
    renderizarListaInventario();
}

function buscarItensInventario(termo){
    termoBuscaInventario = termo || "";
    renderizarListaInventario();
}

function inicializarInventario(){
    if(!Array.isArray(inventarioCompartimentos) || inventarioCompartimentos.length === 0){
        inventarioCompartimentos = clonarCompartimentosPadrao();
    }
    atualizarCompartimentosUI();
    atualizarPreviewFormTipo();
    atualizarInventarioUI();
}

/* ============================================================
   MÓDULO DE TRANSFERÊNCIA DE ITENS (CEDER / RECEBER ITEM)
   ============================================================ */
let itemParaCederId = null;

function abrirModalCederItem(id) {
    const item = inventarioItens.find(it => it.id === id);
    if (!item) return;

    itemParaCederId = id;
    const resumoEl = document.getElementById("ceder-item-resumo");
    const textareaEl = document.getElementById("ceder_codigo_textarea");
    const modal = document.getElementById("modal-ceder-item");

    if (resumoEl) {
        const cfg = TIPOS_ITEM_CONFIG[item.tipo] || TIPOS_ITEM_CONFIG.equipamento;
        resumoEl.innerHTML = `
            <div style="font-weight:600; font-size:14px; color:var(--accent); margin-bottom:4px;">
                ${cfg.icone} ${escapeHTML(item.nome)} (${item.qtd}x)
            </div>
            <div style="font-size:12px; opacity:0.85;">
                Tipo: ${cfg.rotulo} • Peso: ${item.peso} kg • Espaço: ${item.espaco} slots
                ${item.descricao ? `<br><em>${escapeHTML(item.descricao)}</em>` : ''}
            </div>
        `;
    }

    const itemData = {
        v: 1,
        nome: item.nome,
        tipo: item.tipo,
        espaco: item.espaco,
        espacoMao: item.espacoMao,
        espacoMochila: item.espacoMochila,
        qtd: item.qtd,
        peso: item.peso,
        ilegal: item.ilegal,
        isArmaDeFogo: item.isArmaDeFogo,
        carregada: item.carregada,
        descricao: item.descricao
    };

    const codigoEncoded = "WAS_ITEM:" + btoa(unescape(encodeURIComponent(JSON.stringify(itemData))));
    if (textareaEl) textareaEl.value = codigoEncoded;

    if (modal) {
        modal.style.display = "flex";
        requestAnimationFrame(() => modal.classList.add("aberto"));
    }
}

function fecharModalCederItem() {
    const modal = document.getElementById("modal-ceder-item");
    if (!modal) return;
    modal.classList.remove("aberto");
    setTimeout(() => { modal.style.display = "none"; }, 200);
    itemParaCederId = null;
}

function fecharModalCederItemPorOverlay(e) {
    if (e.target === document.getElementById("modal-ceder-item")) {
        fecharModalCederItem();
    }
}

function copiarEConfirmarCederItem() {
    const textareaEl = document.getElementById("ceder_codigo_textarea");
    const checkboxRemover = document.getElementById("ceder_remover_do_meu_inv");

    if (textareaEl && textareaEl.value) {
        try {
            navigator.clipboard.writeText(textareaEl.value);
            mostrarStatus("✓ Código de transferência copiado para a área de transferência!", "ok");
        } catch(e) {
            textareaEl.select();
            document.execCommand("copy");
            mostrarStatus("✓ Código copiado!", "ok");
        }
    }

    if (checkboxRemover && checkboxRemover.checked && itemParaCederId) {
        inventarioItens = inventarioItens.filter(it => it.id !== itemParaCederId);
        atualizarInventarioUI();
        marcarAlteracaoFeita();
        mostrarStatus("✓ Item transferido e removido do seu inventário.", "ok");
    }

    fecharModalCederItem();
}

function abrirModalReceberItem() {
    const modal = document.getElementById("modal-receber-item");
    const textareaEl = document.getElementById("receber_codigo_textarea");
    if (textareaEl) textareaEl.value = "";
    if (modal) {
        modal.style.display = "flex";
        requestAnimationFrame(() => modal.classList.add("aberto"));
    }
}

function fecharModalReceberItem() {
    const modal = document.getElementById("modal-receber-item");
    if (!modal) return;
    modal.classList.remove("aberto");
    setTimeout(() => { modal.style.display = "none"; }, 200);
}

function fecharModalReceberItemPorOverlay(e) {
    if (e.target === document.getElementById("modal-receber-item")) {
        fecharModalReceberItem();
    }
}

function processarReceberItemCodigo() {
    const textareaEl = document.getElementById("receber_codigo_textarea");
    const codigoBruto = (textareaEl?.value || "").trim();

    if (!codigoBruto) {
        mostrarStatus("✗ Cole o código de transferência recebido.", "erro");
        return;
    }

    try {
        let jsonStr = "";
        if (codigoBruto.startsWith("WAS_ITEM:")) {
            const b64 = codigoBruto.replace("WAS_ITEM:", "");
            jsonStr = decodeURIComponent(escape(atob(b64)));
        } else {
            jsonStr = codigoBruto;
        }

        const data = JSON.parse(jsonStr);
        if (!data || !data.nome) {
            throw new Error("Dados de item inválidos");
        }

        const compGeral = inventarioCompartimentos[0]?.id || "comp_geral";
        const novoItem = {
            id: gerarIdItem(),
            nome: data.nome,
            tipo: data.tipo || "equipamento",
            compartimentoId: compGeral,
            espaco: data.espaco !== undefined ? data.espaco : 1,
            espacoMao: data.espacoMao !== undefined ? data.espacoMao : 1,
            espacoMochila: data.espacoMochila !== undefined ? data.espacoMochila : 2,
            qtd: data.qtd || 1,
            peso: data.peso || 0,
            ilegal: !!data.ilegal,
            isArmaDeFogo: !!data.isArmaDeFogo,
            carregada: data.carregada !== false,
            descricao: data.descricao || "",
            empunhado: false,
            criadoEm: new Date().toISOString()
        };

        inventarioItens.push(novoItem);
        atualizarInventarioUI();
        marcarAlteracaoFeita();
        fecharModalReceberItem();
        mostrarStatus(`✓ Item "${novoItem.nome}" adicionado com sucesso ao seu inventário!`, "ok");
    } catch(err) {
        console.error("Erro ao receber item:", err);
        mostrarStatus("✗ Código de item inválido ou corrompido.", "erro");
    }
}

/* ============================================================
   MÓDULO ABA 4: CONQUISTAS & FEITOS (OFICIAIS / CAMPANHA)
   ============================================================ */
const CONQUISTAS_OFICIAIS = [
    { id: "ofic_ind_1", nivel1: "oficiais", nivel2: "individual", icone: "👁️", titulo: "Olhos Atentos", pontos: 25, desc: "Obteve um sucesso absoluto em um teste de Percepção / Localizar em ambiente hostil." },
    { id: "ofic_ind_2", nivel1: "oficiais", nivel2: "individual", icone: "🩸", titulo: "Sobrevivente do Caos", pontos: 50, desc: "Sobreviveu a um confronto crítico ficando com menos de 10% de Vida." },
    { id: "ofic_ind_3", nivel1: "oficiais", nivel2: "individual", icone: "📜", titulo: "Dedutivista Experiente", pontos: 30, desc: "Desvendou um enigma arcaico ou decifrou um código antigo utilizando Mnemônica ou História." },
    { id: "ofic_ind_4", nivel1: "oficiais", nivel2: "individual", icone: "🎯", titulo: "Tiro Certeiro", pontos: 40, desc: "Acertou um disparo crítico em um alvo a mais de 30 metros de distância." },
    { id: "ofic_ind_5", nivel1: "oficiais", nivel2: "individual", icone: "🧪", titulo: "Mestre da Alquimia", pontos: 35, desc: "Sintetizou com sucesso um antídoto ou elixir sob pressão durante o combate." },
    { id: "ofic_ind_6", nivel1: "oficiais", nivel2: "individual", icone: "🧘", titulo: "Mente Inabalável", pontos: 50, desc: "Manteve o autocontrole absoluto e recuperou Sanidade Mental após encarar um horror inexplicável." },
    { id: "ofic_ind_7", nivel1: "oficiais", nivel2: "individual", icone: "👟", titulo: "Sombra Noturna", pontos: 30, desc: "Infiltrou-se em um perímetro fortemente vigiado sem disparar nenhum alarme." },
    { id: "ofic_ind_8", nivel1: "oficiais", nivel2: "individual", icone: "⚔️", titulo: "Duelo de Honra", pontos: 45, desc: "Derrotou um adversário em um duelo corporal 1v1 usando Luta ou Rijeza." },

    { id: "ofic_eq_1", nivel1: "oficiais", nivel2: "equipe", icone: "🤝", titulo: "União Tática", pontos: 50, desc: "A equipe realizou um ataque coordenado derrubando uma ameaça sem baixas." },
    { id: "ofic_eq_2", nivel1: "oficiais", nivel2: "equipe", icone: "🏕️", titulo: "Refúgio Seguro", pontos: 40, desc: "Estabeleceram um acampamento fortificado seguro durante uma noite de tempestade sobrenatural." },
    { id: "ofic_eq_3", nivel1: "oficiais", nivel2: "equipe", icone: "🔍", titulo: "Verdade Revelada", pontos: 60, desc: "A equipe reuniu todas as pistas de um caso arquivado e solucionou o mistério central." },
    { id: "ofic_eq_4", nivel1: "oficiais", nivel2: "equipe", icone: "🛡️", titulo: "Escudo Fraterno", pontos: 45, desc: "Um membro da equipe usou sua própria ação para proteger um aliado inconsciente." },
    { id: "ofic_eq_5", nivel1: "oficiais", nivel2: "equipe", icone: "🔥", titulo: "Fuga Dramática", pontos: 50, desc: "Escaparam com sucesso de um edifício em chamas ou ruína prestes a desmoronar." },
    { id: "ofic_eq_6", nivel1: "oficiais", nivel2: "equipe", icone: "🗝️", titulo: "Segredo do Culto", pontos: 70, desc: "Localizaram o covil secreto dos antagonistas e interromperam o ritual a tempo." }
];

const CONQUISTAS_SECRETAS = [
    {
        id: "sec_easteregg_rodape",
        nivel1: "secretas",
        nivel2: "individual",
        icone: "👁️",
        titulo: "eSPECtador Incherido",
        pontos: 0,
        desc: "Desbloqueie as Conquistas Secretas."
    },
    {
        id: "sec_malabatonto",
        nivel1: "secretas",
        nivel2: "individual",
        icone: "🤹",
        titulo: "Malabatonto",
        pontos: 0,
        desc: "Faça malabarismo."
    },
    {
        id: "sec_trenzinho_luz",
        nivel1: "secretas",
        nivel2: "individual",
        icone: "🚂",
        titulo: "Trenzinho de luz",
        pontos: 0,
        desc: "Siga os atalhos."
    },
    {
        id: "sec_epileptico",
        nivel1: "secretas",
        nivel2: "individual",
        icone: "⚡",
        titulo: "Epiléptico",
        pontos: 0,
        desc: "Último herói da Terra: aaaaaaaaaaaaaaaaAAAAAAAAAAAAAAAAAAAHHHHHHH!!!!!!!!!"
    },
    {
        id: "sec_anti_contraste",
        nivel1: "secretas",
        nivel2: "individual",
        icone: "🫥",
        titulo: "Anti-Contraste",
        pontos: 0,
        desc: "Tire os textos da ficha sem tirar os textos da ficha"
    },
    {
        id: "sec_esquelebros",
        nivel1: "secretas",
        nivel2: "individual",
        icone: "💀",
        titulo: "Esquele-BROS",
        pontos: 0,
        desc: "Interprete ao pé das LETRAS"
    },
    {
        id: "sec_farmador_aura",
        nivel1: "secretas",
        nivel2: "individual",
        icone: "✨",
        titulo: "Farmador de Aura",
        pontos: 0,
        desc: "6767676767676767676767676767676767676767."
    },
    {
        id: "sec_paranoia",
        nivel1: "secretas",
        nivel2: "individual",
        icone: "💾",
        titulo: "Paranóia",
        pontos: 0,
        desc: "Tu sabe que tem modo automático, né?"
    },
    {
        id: "sec_reve",
        nivel1: "secretas",
        nivel2: "individual",
        icone: "🪩",
        titulo: "REVE",
        pontos: 0,
        desc: "Virou balada?"
    },
    {
        id: "sec_segredo_fonte",
        nivel1: "secretas",
        nivel2: "individual",
        icone: "💻",
        titulo: "Segredo-Fonte",
        pontos: 0,
        desc: "Deixa eu adivinhar... seu nome é Felipe e sua habilidade é Quebrar Códigos?"
    },
    {
        id: "sec_jackpot",
        nivel1: "secretas",
        nivel2: "individual",
        icone: "🎰",
        titulo: "JACKPOT",
        pontos: 0,
        desc: "7.7.7."
    },
    {
        id: "sec_companhia",
        nivel1: "secretas",
        nivel2: "individual",
        icone: "📞",
        titulo: "Companhia",
        pontos: 0,
        desc: "O Yudi ficava orgulhoso, mas o crédito do celular dos seus pais não."
    }
];

let conquistasCampanha = [];
let conquistasDesbloqueadas = new Set();
let conquistasSecretasDesbloqueadas = false;
let conqNivel1Ativo = "oficiais";
let conqNivel2Ativo = "individual";
let conqTermoBusca = "";
let modalConqCampanhaEmEdicaoId = null;
let modalCodigoConqModo = "exportar";

/* ============================================================
   CAMADA DE CRIPTOGRAFIA / OFUSCAÇÃO DE CONQUISTAS SECRETAS
   Evita que jogadores inspecionem o JSON salvo ou o localStorage
   e descubram os segredos e gatilhos ocultos da aplicação.
   ============================================================ */
const _WAS_SEC_SALT = "WAS_SECRET_SALT_2026_#StrangersSecretKey!";

function ofuscarIdSecreto(id) {
    if (!id || typeof id !== "string") return id;
    try {
        let res = "";
        for (let i = 0; i < id.length; i++) {
            const cCode = id.charCodeAt(i);
            const sCode = _WAS_SEC_SALT.charCodeAt((i * 11 + 17) % _WAS_SEC_SALT.length);
            res += String.fromCharCode(cCode ^ sCode);
        }
        const b64 = btoa(unescape(encodeURIComponent(res)));
        return "_sec_enc_" + b64.replace(/=/g, "");
    } catch(e) {
        return id;
    }
}

function desofuscarIdSecreto(token) {
    if (!token || typeof token !== "string") return token;
    // Se for legado em texto puro conhecido, aceita diretamente
    if (CONQUISTAS_SECRETAS.some(c => c.id === token)) {
        return token;
    }
    if (!token.startsWith("_sec_enc_")) {
        return token;
    }
    try {
        let b64 = token.substring(9);
        while (b64.length % 4 !== 0) {
            b64 += "=";
        }
        const str = decodeURIComponent(escape(atob(b64)));
        let id = "";
        for (let i = 0; i < str.length; i++) {
            const cCode = str.charCodeAt(i);
            const sCode = _WAS_SEC_SALT.charCodeAt((i * 11 + 17) % _WAS_SEC_SALT.length);
            id += String.fromCharCode(cCode ^ sCode);
        }
        if (CONQUISTAS_SECRETAS.some(c => c.id === id)) {
            return id;
        }
        return token;
    } catch(e) {
        return token;
    }
}

function ofuscarListaConquistasParaSalvar(listaIds) {
    if (!Array.isArray(listaIds)) return [];
    return listaIds.map(id => {
        if (CONQUISTAS_SECRETAS.some(c => c.id === id)) {
            return ofuscarIdSecreto(id);
        }
        return id;
    });
}

function desofuscarListaConquistasCarregadas(listaTokens) {
    if (!Array.isArray(listaTokens)) return [];
    return listaTokens.map(tok => {
        if (typeof tok === "string" && (tok.startsWith("_sec_enc_") || tok.startsWith("sec_"))) {
            return desofuscarIdSecreto(tok);
        }
        return tok;
    });
}

function salvarSegredosDesbloqueadosStorage() {
    try {
        const segredosAtivos = Array.from(conquistasDesbloqueadas).filter(id => CONQUISTAS_SECRETAS.some(c => c.id === id));
        const ofuscados = segredosAtivos.map(id => ofuscarIdSecreto(id));
        localStorage.setItem("we_are_strangers_segredos_desbloqueados", JSON.stringify(ofuscados));
    } catch(e) {}
}

function atualizarTooltipLogoRodape() {
    const desbloqueada = (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));
    const textoTooltip = desbloqueada ? "🖕🫠🖕" : "🖕🙂🖕";
    const logoEl = document.getElementById("rodape-spec-logo") || document.querySelector(".rodape-spec");
    if (logoEl) {
        logoEl.setAttribute("title", textoTooltip);
        const svgEl = logoEl.querySelector("svg");
        if (svgEl) {
            svgEl.setAttribute("title", textoTooltip);
            const titleEl = svgEl.querySelector("title");
            if (titleEl) {
                titleEl.textContent = textoTooltip;
            }
        }
    }
}

function verificarConquistasSecretasArmazenadas() {
    try {
        localStorage.removeItem("we_are_strangers_conquistas_secretas");
        const raw = localStorage.getItem("we_are_strangers_segredos_desbloqueados");
        if (raw) {
            const segredosSalvos = JSON.parse(raw || "[]");
            if (Array.isArray(segredosSalvos)) {
                segredosSalvos.forEach(item => {
                    const idReal = desofuscarIdSecreto(item);
                    if (CONQUISTAS_SECRETAS.some(c => c.id === idReal)) {
                        conquistasDesbloqueadas.add(idReal);
                    }
                });
            }
        }

        // Se a primeira conquista "sec_easteregg_rodape" não foi desbloqueada, limpa qualquer outra conquista secreta
        if (!conquistasDesbloqueadas.has("sec_easteregg_rodape")) {
            CONQUISTAS_SECRETAS.forEach(c => {
                if (c.id !== "sec_easteregg_rodape") {
                    conquistasDesbloqueadas.delete(c.id);
                }
            });
        }

        // Garante armazenamento ofuscado
        salvarSegredosDesbloqueadosStorage();

        // Atualiza a mensagem com emojis na logo conforme o estado da conquista
        atualizarTooltipLogoRodape();

        // A aba de SECRETAS e a flag global só ficam ativas se o jogador já tiver desbloqueado a primeira conquista "sec_easteregg_rodape" (duplo-clique na logo)
        const primeiroDesbloqueado = conquistasDesbloqueadas.has("sec_easteregg_rodape");
        conquistasSecretasDesbloqueadas = primeiroDesbloqueado;
        
        const btnSecretas = document.getElementById("conq-btn-n1-secretas");
        if (btnSecretas) {
            btnSecretas.style.display = primeiroDesbloqueado ? "inline-flex" : "none";
        }
        if (!primeiroDesbloqueado && conqNivel1Ativo === "secretas") {
            conqNivel1Ativo = "oficiais";
        }
    } catch(e) {}
}

function desbloquearConquistaSecreta(id) {
    if (conquistasDesbloqueadas.has(id)) {
        return false;
    }

    // Regra geral de Conquistas Secretas: nenhuma conquista secreta secundária (como Trenzinho de Luz ou Malabatonto)
    // pode ser desbloqueada sem antes dar o duplo-clique na logo e desbloquear a primeira conquista ("eSPECtador Incherido")
    if (id !== "sec_easteregg_rodape") {
        const segredosDesbloqueados = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
            (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));
        if (!segredosDesbloqueados) {
            return false;
        }
    }

    conquistasDesbloqueadas.add(id);

    // Revela a aba de secretas caso ainda esteja oculta para que a nova conquista apareça
    if (id === "sec_easteregg_rodape") {
        conquistasSecretasDesbloqueadas = true;
        atualizarTooltipLogoRodape();
    }
    const btnSecretas = document.getElementById("conq-btn-n1-secretas");
    if (btnSecretas && conquistasSecretasDesbloqueadas) {
        btnSecretas.style.display = "inline-flex";
    }

    salvarSegredosDesbloqueadosStorage();

    const conquista = CONQUISTAS_SECRETAS.find(c => c.id === id);
    const titulo = conquista ? conquista.titulo : id;

    if (typeof tocarEfeitoSonoro === "function") {
        tocarEfeitoSonoro({ tipo: "amaldicoado" }, 35, 2);
    } else if (typeof tocarSom === "function") {
        tocarSom("vitoria");
    }

    if (typeof mostrarStatus === "function") {
        mostrarStatus(`🔮 Conquista Secreta Desbloqueada: ${titulo}! (${conquista?.desc || ""})`, "ok");
    }

    if (id !== "sec_esquelebros" && typeof exibirToastConquista === "function") {
        exibirToastConquista(conquista || { id, titulo, desc: "" }, "🔮 CONQUISTA SECRETA DESBLOQUEADA!");
    }

    if (typeof salvarFichaAutomatico === "function") {
        salvarFichaAutomatico();
    } else if (typeof marcarAlteracaoFeita === "function") {
        marcarAlteracaoFeita();
    }

    if (typeof renderizarListaConquistas === "function") {
        renderizarListaConquistas();
    }

    if (typeof transmitirConquistaSecretaCampanha === "function") {
        transmitirConquistaSecretaCampanha(conquista || { id, titulo, desc: "" });
    }

    if (id === "sec_epileptico") {
        executarCinematicaEpileptico();
    } else if (id === "sec_anti_contraste") {
        executarAnimacaoStrokesRoxas();
    } else if (id === "sec_esquelebros") {
        executarCinematicaEsqueleBros();
    } else if (id === "sec_reve") {
        executarCinematicaReve();
    } else if (id === "sec_segredo_fonte") {
        executarCinematicaSegredoFonte();
    } else if (id === "sec_jackpot") {
        executarCinematicaJackpot();
    } else if (id === "sec_companhia") {
        renderizarBadgePremioYudi();
    }

    return true;
}

function executarCinematicaEpileptico() {
    const segredosDesbloqueados = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
        (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));
    if (!segredosDesbloqueados) return;

    // 1. O site inteiro TRAVA no modo escuro imediatamente
    window._bloqueioEpilepticoEmAndamento = true;
    aplicarModoTema("escuro", true);

    const btnTema = document.getElementById("btn-tema-toggle");
    if (btnTema) {
        btnTema.style.pointerEvents = "none";
        btnTema.style.opacity = "0.5";
        btnTema.setAttribute("disabled", "true");
    }

    // 2. Cinco segundos depois (5000ms), inicia a animação lenta de super-nova branca
    // saindo do símbolo do Sol do modo claro até tomar a tela completamente
    setTimeout(() => {
        let origemX = window.innerWidth / 2;
        let origemY = window.innerHeight / 2;

        const elSol = document.getElementById("btn-tema-icone") || document.getElementById("btn-tema-toggle");
        if (elSol) {
            const rect = elSol.getBoundingClientRect();
            origemX = rect.left + rect.width / 2;
            origemY = rect.top + rect.height / 2;
        }

        let overlay = document.getElementById("overlay-cinematica-epileptico");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "overlay-cinematica-epileptico";
            document.body.appendChild(overlay);
        }
        overlay.className = "overlay-cinematica-epileptico fase-supernova";
        overlay.style.setProperty("--supernova-origem-x", `${origemX}px`);
        overlay.style.setProperty("--supernova-origem-y", `${origemY}px`);
        overlay.innerHTML = `
            <div class="supernova-core"></div>
            <div class="supernova-flash-total"></div>
        `;

        if (typeof tocarEfeitoSonoro === "function") {
            tocarEfeitoSonoro({ tipo: "amaldicoado" }, 35, 2);
        }

        // 3. Fica travado com a forte luz branca por 10 segundos após a expansão (3.5s + 10s = 13.5s)
        // e, do nada, o site inteiro fica PRETO
        setTimeout(() => {
            overlay.className = "overlay-cinematica-epileptico fase-blackout";
            overlay.innerHTML = "";

            // Durante o blackout, prepara a navegação para a aba de Conquistas Secretas
            if (typeof alternarAba === "function") {
                alternarAba("conquistas", false);
            }
            conquistasSecretasDesbloqueadas = true;
            const btnSecretas = document.getElementById("conq-btn-n1-secretas");
            if (btnSecretas) {
                btnSecretas.style.display = "inline-flex";
            }
            if (typeof alternarNivel1Conquistas === "function") {
                alternarNivel1Conquistas("secretas");
            }
            if (typeof renderizarListaConquistas === "function") {
                renderizarListaConquistas();
            }

            // Centraliza no card da conquista Epiléptico
            setTimeout(() => {
                const cardEpileptico = document.getElementById("conq-card-sec_epileptico") ||
                    document.querySelector('#conq-lista-grid .conq-card[data-conq-id="sec_epileptico"]');
                if (cardEpileptico) {
                    cardEpileptico.scrollIntoView({ behavior: "instant", block: "center" });
                }
            }, 100);

            // 4. Cinco segundos depois (5000ms após o blackout), o site clareia numa leve transição
            // de uma luz roxa que nasce do card da conquista e ilumina e revela a página com a conquista desbloqueada
            setTimeout(() => {
                let cardX = window.innerWidth / 2;
                let cardY = window.innerHeight / 2;

                const cardEpileptico = document.getElementById("conq-card-sec_epileptico") ||
                    document.querySelector('#conq-lista-grid .conq-card[data-conq-id="sec_epileptico"]');
                if (cardEpileptico) {
                    const r = cardEpileptico.getBoundingClientRect();
                    cardX = r.left + r.width / 2;
                    cardY = r.top + r.height / 2;
                    cardEpileptico.classList.add("destaque-supernova-epileptico");
                }

                overlay.className = "overlay-cinematica-epileptico fase-revelacao-roxa";
                overlay.style.setProperty("--card-origem-x", `${cardX}px`);
                overlay.style.setProperty("--card-origem-y", `${cardY}px`);
                overlay.innerHTML = `<div class="aura-roxa-nascendo"></div>`;

                if (typeof tocarEfeitoSonoro === "function") {
                    tocarEfeitoSonoro({ tipo: "vitoria" }, 40, 2);
                }

                // Finaliza a cinemática após a transição da luz roxa (~4s)
                setTimeout(() => {
                    if (overlay && overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                    window._bloqueioEpilepticoEmAndamento = false;
                    if (btnTema) {
                        btnTema.style.pointerEvents = "";
                        btnTema.style.opacity = "";
                        btnTema.removeAttribute("disabled");
                    }
                }, 4000);

            }, 5000); // 5 segundos de blackout total

        }, 13500); // 3.5s de expansão + 10s travado no branco total

    }, 5000); // 5 segundos travado no modo escuro antes da supernova
}

let historicoCliquesFastSwapMalabarismo = [];

function verificarSegredoFastSwapMalabatonto() {
    // 1. Só pode ser desbloqueada após a primeira conquista secreta "eSPECtador Incherido"
    const eSPECtadorDesbloqueado = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
        (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));

    if (!eSPECtadorDesbloqueado) {
        historicoCliquesFastSwapMalabarismo = [];
        return;
    }

    if (conquistasDesbloqueadas.has("sec_malabatonto")) {
        return;
    }

    // 2. Verificar se ambas as mãos estão ocupadas
    let ambasOcupadas = false;
    const compsMao = (Array.isArray(inventarioCompartimentos) ? inventarioCompartimentos : []).filter(c => c.tipo === "mao" || (c.id && c.id.includes("mao")));

    if (compsMao.length >= 2) {
        const comp1 = compsMao[0];
        const comp2 = compsMao[1];
        const itens1 = (Array.isArray(inventarioItens) ? inventarioItens : []).filter(it => it.compartimentoId === comp1.id || (typeof itemEstaEmpunhado === "function" && itemEstaEmpunhado(it) && it.compartimentoId === comp1.id));
        const itens2 = (Array.isArray(inventarioItens) ? inventarioItens : []).filter(it => it.compartimentoId === comp2.id || (typeof itemEstaEmpunhado === "function" && itemEstaEmpunhado(it) && it.compartimentoId === comp2.id));
        ambasOcupadas = (itens1.length > 0 && itens2.length > 0);
    } else {
        const empunhados = (Array.isArray(inventarioItens) ? inventarioItens : []).filter(it => (typeof itemEstaEmpunhado === "function" && itemEstaEmpunhado(it)));
        ambasOcupadas = (empunhados.length >= 2);
    }

    if (!ambasOcupadas) {
        historicoCliquesFastSwapMalabarismo = [];
        return;
    }

    // 3. Registrar clique rápido (janela de até 3500ms para 6 cliques)
    const agora = Date.now();
    historicoCliquesFastSwapMalabarismo = historicoCliquesFastSwapMalabarismo.filter(t => (agora - t) < 3500);
    historicoCliquesFastSwapMalabarismo.push(agora);

    // 4. Se o jogador clicar 6 vezes rápido no Fast Swap com as duas mãos ocupadas:
    if (historicoCliquesFastSwapMalabarismo.length >= 6) {
        historicoCliquesFastSwapMalabarismo = [];
        desbloquearConquistaSecreta("sec_malabatonto");

        const btnFastSwap = document.getElementById("btn-fast-swap-maos");
        if (btnFastSwap) {
            btnFastSwap.classList.remove("malabatonto-ativo");
            void btnFastSwap.offsetWidth;
            btnFastSwap.classList.add("malabatonto-ativo");
            setTimeout(() => btnFastSwap.classList.remove("malabatonto-ativo"), 1200);
        }
    }
}

let progressoSequenciaTrenzinho = 0;
let tempoUltimoToqueTrenzinho = 0;

function registrarCliqueAtalhoTrenzinho(tecla) {
    // Só permite progresso, feedback visual ou desbloqueio se o jogador já tiver dado duplo-clique na logo
    // e desbloqueado a primeira conquista secreta 'eSPECtador Incherido'
    const segredosDesbloqueados = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
        (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));

    if (!segredosDesbloqueados) {
        progressoSequenciaTrenzinho = 0;
        return;
    }

    const num = parseInt(tecla, 10);
    if (isNaN(num) || num < 1 || num > 9) return;

    const agora = Date.now();
    // Se passar mais de 15 segundos entre um atalho e outro, a sequência expira
    if (progressoSequenciaTrenzinho > 0 && agora - tempoUltimoToqueTrenzinho > 15000) {
        progressoSequenciaTrenzinho = 0;
    }
    tempoUltimoToqueTrenzinho = agora;

    // Se o jogador pressionar o próximo número esperado da sequência crescente (1 -> 2 -> ... -> 9)
    if (num === progressoSequenciaTrenzinho + 1) {
        progressoSequenciaTrenzinho = num;

        // Feedback luminoso no chip do atalho na barra
        const chip = document.getElementById(`atalho-chip-${num}`);
        if (chip) {
            chip.classList.remove("trenzinho-passo");
            void chip.offsetWidth;
            chip.classList.add("trenzinho-passo");
            setTimeout(() => chip.classList.remove("trenzinho-passo"), 500);
        }

        // Se completou a sequência completa de 1 a 9 em ordem crescente!
        if (progressoSequenciaTrenzinho === 9) {
            progressoSequenciaTrenzinho = 0;
            dispararAnimacaoTrenzinhoDeLuz();
            desbloquearConquistaSecreta("sec_trenzinho_luz");
        }
    } else if (num === 1) {
        // Se o jogador clicou no 1 a qualquer momento, reinicia a sequência a partir do 1
        progressoSequenciaTrenzinho = 1;
        const chip = document.getElementById(`atalho-chip-1`);
        if (chip) {
            chip.classList.remove("trenzinho-passo");
            void chip.offsetWidth;
            chip.classList.add("trenzinho-passo");
            setTimeout(() => chip.classList.remove("trenzinho-passo"), 500);
        }
    } else {
        // Pressionou número fora da ordem crescente, cancela a sequência
        progressoSequenciaTrenzinho = 0;
    }
}

function dispararAnimacaoTrenzinhoDeLuz() {
    // Bloqueia a execução da animação de onda se os segredos não foram desbloqueados via duplo-clique na logo
    const segredosDesbloqueados = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
        (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));
    if (!segredosDesbloqueados) return;

    for (let i = 1; i <= 9; i++) {
        setTimeout(() => {
            const chip = document.getElementById(`atalho-chip-${i}`);
            if (chip) {
                chip.classList.remove("trenzinho-luz-onda");
                void chip.offsetWidth;
                chip.classList.add("trenzinho-luz-onda");
                setTimeout(() => chip.classList.remove("trenzinho-luz-onda"), 900);
            }
        }, (i - 1) * 85);
    }
}

/* ============================================================
   CONQUISTA SECRETA "ANTI-CONTRASTE" - LÓGICA E DISPARO
   ============================================================ */
function executarAnimacaoStrokesRoxas() {
    // Bloqueia a animação caso as conquistas secretas não tenham sido desbloqueadas pelo duplo-clique na logo
    const segredosDesbloqueados = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
        (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));
    if (!segredosDesbloqueados) return;

    document.documentElement.classList.remove("animacao-strokes-roxas");
    void document.documentElement.offsetWidth;
    document.documentElement.classList.add("animacao-strokes-roxas");

    setTimeout(() => {
        document.documentElement.classList.remove("animacao-strokes-roxas");
    }, 950);
}

function normalizarHexRgb(hexCor) {
    if (!hexCor || typeof hexCor !== "string") return null;
    let hex = hexCor.trim();
    if (hex.startsWith("#")) hex = hex.slice(1);
    if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
    }
    if (hex.length !== 6) return null;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
}

function calcularDistanciaRgb(r1, g1, b1, r2, g2, b2) {
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function verificarCorAntiContraste(hexCor, modoClaro) {
    const rgb = normalizarHexRgb(hexCor);
    if (!rgb) return false;
    const { r, g, b } = rgb;

    if (modoClaro) {
        // Modo Claro: tons pergaminho/creme de fundo da ficha (#eae1d0, #e6dcc9, #dcd4c3, #e2d8c6, #dfd5c2, #fcfbfa, #ebe6dc, etc.)
        const alvosClaro = [
            [234, 225, 208], // #eae1d0 (pergaminho novo)
            [230, 220, 201], // #e6dcc9
            [220, 212, 195], // #dcd4c3
            [226, 216, 198], // #e2d8c6
            [223, 213, 194], // #dfd5c2
            [213, 203, 186], // #d5cbba
            [252, 251, 250], // #fcfbfa
            [244, 239, 230], // #f4efe6
            [235, 230, 220], // #ebe6dc
            [251, 248, 242], // #fbf8f2
            [255, 255, 255]  // #ffffff
        ];
        for (const [ar, ag, ab] of alvosClaro) {
            if (calcularDistanciaRgb(r, g, b, ar, ag, ab) <= 45) {
                return true;
            }
        }
        // Faixa de tons de pergaminho/creme de baixo contraste
        if (r >= 200 && g >= 190 && b >= 170 && Math.abs(r - g) <= 30 && Math.abs(g - b) <= 35) {
            return true;
        }
        return false;
    } else {
        // Modo Escuro: tons escuros/quase pretos de fundo da ficha (#111111, #080808, #161616, #141312, #0a0a0a, #000000, #171410)
        const alvosEscuro = [
            [17, 17, 17],    // #111111
            [8, 8, 8],       // #080808
            [22, 22, 22],    // #161616
            [20, 19, 18],    // #141312
            [10, 10, 10],    // #0a0a0a
            [0, 0, 0],       // #000000
            [23, 20, 16],    // #171410
            [28, 25, 20],    // #1c1914
            [26, 26, 26]     // #1a1a1a
        ];
        for (const [ar, ag, ab] of alvosEscuro) {
            if (calcularDistanciaRgb(r, g, b, ar, ag, ab) <= 45) {
                return true;
            }
        }
        // Qualquer tom muito escuro onde todos os canais RGB são <= 35
        if (r <= 35 && g <= 35 && b <= 35) {
            return true;
        }
        return false;
    }
}

function verificarGatilhoAntiContraste() {
    // 1. Só pode ser desbloqueada após a primeira conquista secreta "eSPECtador Incherido" (duplo clique na logo)
    const eSPECtadorDesbloqueado = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
        (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));

    if (!eSPECtadorDesbloqueado) {
        return;
    }

    if (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_anti_contraste")) {
        return;
    }

    // 2. O jogador deve estar com o Contorno desligado
    if (typeof contornoLetrasAtivo !== "undefined" && contornoLetrasAtivo) {
        return;
    }

    // 3. Obter cor tema atual e modo do tema
    const corAtual = (typeof corPrincipalAtual !== "undefined" && corPrincipalAtual) ? corPrincipalAtual : (document.getElementById("ficha_cor")?.value || "");
    const modoClaro = typeof modoClaroAtivo !== "undefined" ? modoClaroAtivo : document.body.classList.contains("modo-claro");

    // 4. Verificar se a cor corresponde ao tom quase invisível no modo atual (ou muito próximo)
    if (verificarCorAntiContraste(corAtual, modoClaro)) {
        desbloquearConquistaSecreta("sec_anti_contraste");
    }
}

/* ============================================================
   CONQUISTA SECRETA "ESQUELE-BROS" - LÓGICA, ÁUDIO & CINEMÁTICA
   ============================================================ */
function verificarGatilhoEsqueleBros() {
    // 1. Só pode ser desbloqueada após a primeira conquista secreta "eSPECtador Incherido" (duplo clique na logo)
    const eSPECtadorDesbloqueado = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
        (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));

    if (!eSPECtadorDesbloqueado) {
        return;
    }

    if (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_esquelebros")) {
        return;
    }

    if (typeof fontesPersonalizadas !== "object" || !fontesPersonalizadas) {
        return;
    }

    // Coletar nomes das fontes configuradas na ficha
    const nomes = [
        fontesPersonalizadas.mirage?.nome,
        fontesPersonalizadas.oldEurope?.nome,
        fontesPersonalizadas.texto?.nome
    ].filter(Boolean).map(n => String(n).toLowerCase().trim());

    // Requer pelo menos 2 fontes ativas na ficha
    if (nomes.length < 2) {
        return;
    }

    // Uma delas precisa ter "sans" e a outra precisa ter "papyrus"
    const temSans = nomes.some(n => n.includes("sans"));
    const temPapyrus = nomes.some(n => n.includes("papyrus"));

    if (temSans && temPapyrus) {
        desbloquearConquistaSecreta("sec_esquelebros");
    }
}

/* ============================================================
   CONQUISTA SECRETA "FARMADOR DE AURA" - LÓGICA E DISPARO
   ============================================================ */
let tempoInicioAura67 = null;

function verificarGatilhoFarmadorAura() {
    // 1. Só pode ser desbloqueada após a primeira conquista secreta "eSPECtador Incherido" (duplo clique na logo)
    const eSPECtadorDesbloqueado = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
        (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));

    if (!eSPECtadorDesbloqueado) {
        tempoInicioAura67 = null;
        return;
    }

    if (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_farmador_aura")) {
        tempoInicioAura67 = null;
        return;
    }

    const atualEl = document.getElementById("recurso_aura_atual");
    const maxEl = document.getElementById("recurso_aura_max");
    const tempEl = document.getElementById("recurso_aura_temp");

    if (!atualEl || !maxEl) {
        tempoInicioAura67 = null;
        return;
    }

    const max = parseInt(maxEl.value, 10) || 1;
    const atual = parseInt(atualEl.value, 10) || 0;
    const temp = tempEl ? (parseInt(tempEl.value, 10) || 0) : 0;

    const pct = max > 0 ? Math.round(((atual + temp) / max) * 100) : 0;
    const pctBase = max > 0 ? Math.round((atual / max) * 100) : 0;

    if (pct === 67 || pctBase === 67) {
        const agora = Date.now();
        if (!tempoInicioAura67) {
            tempoInicioAura67 = agora;
        } else if (agora - tempoInicioAura67 >= 10000) {
            tempoInicioAura67 = null;
            desbloquearConquistaSecreta("sec_farmador_aura");
        }
    } else {
        tempoInicioAura67 = null;
    }
}

setInterval(verificarGatilhoFarmadorAura, 500);

/* ============================================================
   CONQUISTA SECRETA "JACKPOT" - LÓGICA E DISPARO
   ============================================================ */
function verificarGatilhoJackpot() {
    const eSPECtadorDesbloqueado = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
        (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));

    if (!eSPECtadorDesbloqueado) {
        return;
    }

    if (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_jackpot")) {
        return;
    }

    const vidaEl = document.getElementById("recurso_vida_atual");
    const mentalEl = document.getElementById("recurso_mental_atual");
    const estaminaEl = document.getElementById("recurso_estamina_atual");

    if (!vidaEl || !mentalEl || !estaminaEl) {
        return;
    }

    const vida = parseInt(vidaEl.value, 10);
    const mental = parseInt(mentalEl.value, 10);
    const estamina = parseInt(estaminaEl.value, 10);

    if (vida === 7 && mental === 7 && estamina === 7) {
        desbloquearConquistaSecreta("sec_jackpot");
    }
}

setInterval(verificarGatilhoJackpot, 500);

/* ============================================================
   CONQUISTA SECRETA "PARANÓIA" - LÓGICA E DISPARO
   ============================================================ */
let historicoSalvamentosManuaisParanoia = [];

function registrarSalvamentoManual() {
    // 1. Só pode ser desbloqueada após a primeira conquista secreta "eSPECtador Incherido" (duplo clique na logo)
    const eSPECtadorDesbloqueado = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
        (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));

    if (!eSPECtadorDesbloqueado) {
        historicoSalvamentosManuaisParanoia = [];
        return;
    }

    if (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_paranoia")) {
        historicoSalvamentosManuaisParanoia = [];
        return;
    }

    const agora = Date.now();
    const JANELA_7_MINUTOS = 7 * 60 * 1000; // 7 minutos em milissegundos

    // Mantém apenas salvamentos ocorridos nos últimos 7 minutos
    historicoSalvamentosManuaisParanoia = historicoSalvamentosManuaisParanoia.filter(t => (agora - t) <= JANELA_7_MINUTOS);
    historicoSalvamentosManuaisParanoia.push(agora);

    // Se salvou manualmente 5 vezes dentro de 7 minutos, desbloqueia a conquista
    if (historicoSalvamentosManuaisParanoia.length >= 5) {
        historicoSalvamentosManuaisParanoia = [];
        desbloquearConquistaSecreta("sec_paranoia");
    }
}

/* ============================================================
   CONQUISTA SECRETA "REVE" - LÓGICA, ÁUDIO & CINEMÁTICA RAVE
   ============================================================ */
let historicoTrocasMatizReve = [];
let ultimoTempoTrocaReve = 0;

function hexParaMatizGrados(hex) {
    if (!hex || typeof hex !== "string") return 0;
    let c = hex.replace("#", "").trim();
    if (c.length === 3) c = c.split("").map(x => x + x).join("");
    if (c.length !== 6) return 0;
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
        const d = max - min;
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return Math.round(h * 360);
}

function verificarGatilhoReve(corHex) {
    const eSPECtadorDesbloqueado = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
        (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));

    if (!eSPECtadorDesbloqueado) {
        historicoTrocasMatizReve = [];
        ultimoTempoTrocaReve = 0;
        return;
    }

    if (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_reve")) {
        historicoTrocasMatizReve = [];
        ultimoTempoTrocaReve = 0;
        return;
    }

    const agora = Date.now();
    const matizAtual = hexParaMatizGrados(corHex);

    // Regra "sem parar": se o jogador pausar por mais de 450ms, a sequência ininterrupta reinicia
    if (ultimoTempoTrocaReve > 0 && (agora - ultimoTempoTrocaReve) > 450) {
        historicoTrocasMatizReve = [];
    }
    ultimoTempoTrocaReve = agora;

    // Mantém trocas ocorridas nos últimos 3.5 segundos da sequência ininterrupta
    historicoTrocasMatizReve = historicoTrocasMatizReve.filter(item => (agora - item.t) <= 3500);
    historicoTrocasMatizReve.push({ t: agora, h: matizAtual });

    // Regra "loucamente e sem parar": precisa de alternância frenética e contínua por pelo menos 2.2 segundos
    if (historicoTrocasMatizReve.length >= 12) {
        const duracaoIninterrupta = agora - historicoTrocasMatizReve[0].t;

        let mudancaTotalHue = 0;
        for (let i = 1; i < historicoTrocasMatizReve.length; i++) {
            let diff = Math.abs(historicoTrocasMatizReve[i].h - historicoTrocasMatizReve[i - 1].h);
            if (diff > 180) diff = 360 - diff;
            mudancaTotalHue += diff;
        }

        // Exige alternância contínua sem parar (>= 2200ms), com pelo menos 12 eventos frenéticos e rotação significativa de matiz
        if (duracaoIninterrupta >= 2200 && mudancaTotalHue >= 250) {
            historicoTrocasMatizReve = [];
            ultimoTempoTrocaReve = 0;
            desbloquearConquistaSecreta("sec_reve");
        }
    }
}

function tocarAudioRaveBalada() {
    if (!somAtivado) return;
    const ctx = obterAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
    }

    const agora = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.40, agora);
    master.connect(ctx.destination);

    // Beat Four-on-the-Floor Techno Rave
    const bpm = 138;
    const durBeats = (60 / bpm);

    for (let i = 0; i < 16; i++) {
        const t = agora + i * (durBeats / 2); // semicolcheias

        // Kick Drum encorpado de balada (tempos fortes)
        if (i % 2 === 0) {
            const kickOsc = ctx.createOscillator();
            const kickGain = ctx.createGain();
            kickOsc.type = "sine";
            kickOsc.frequency.setValueAtTime(140, t);
            kickOsc.frequency.exponentialRampToValueAtTime(32, t + 0.12);
            kickGain.gain.setValueAtTime(0.7, t);
            kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
            kickOsc.connect(kickGain);
            kickGain.connect(master);
            kickOsc.start(t);
            kickOsc.stop(t + 0.15);
        }

        // Offbeat Hi-Hat sintetizado
        if (i % 2 === 1) {
            try {
                const len = Math.floor(ctx.sampleRate * 0.05);
                const buf = ctx.createBuffer(1, len, ctx.sampleRate);
                const data = buf.getChannelData(0);
                for (let k = 0; k < len; k++) {
                    data[k] = (Math.random() * 2 - 1) * Math.exp(-k / (ctx.sampleRate * 0.012));
                }
                const hatSource = ctx.createBufferSource();
                hatSource.buffer = buf;
                const hatFilter = ctx.createBiquadFilter();
                hatFilter.type = "highpass";
                hatFilter.frequency.setValueAtTime(7000, t);
                const hatGain = ctx.createGain();
                hatGain.gain.setValueAtTime(0.25, t);
                hatSource.connect(hatFilter);
                hatFilter.connect(hatGain);
                hatGain.connect(master);
                hatSource.start(t);
                hatSource.stop(t + 0.06);
            } catch(e) {}
        }

        // Arpejo Synth-Lead RAVE
        const notasRave = [440, 523.25, 659.25, 783.99, 880, 1046.50, 1174.66, 1318.51];
        const freqNota = notasRave[i % notasRave.length];

        const synthOsc = ctx.createOscillator();
        const synthGain = ctx.createGain();
        const synthFilter = ctx.createBiquadFilter();

        synthOsc.type = "sawtooth";
        synthOsc.frequency.setValueAtTime(freqNota, t);

        synthFilter.type = "lowpass";
        synthFilter.frequency.setValueAtTime(1200 + (i * 200), t);
        synthFilter.frequency.exponentialRampToValueAtTime(300, t + 0.15);

        synthGain.gain.setValueAtTime(0.22, t);
        synthGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        synthOsc.connect(synthFilter);
        synthFilter.connect(synthGain);
        synthGain.connect(master);

        synthOsc.start(t);
        synthOsc.stop(t + 0.18);
    }
}

function executarCinematicaReve() {
    const segredosDesbloqueados = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
        (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));
    if (!segredosDesbloqueados) return;

    tocarAudioRaveBalada();

    const antigo = document.getElementById("reve-cinematica-overlay");
    if (antigo) antigo.remove();

    const overlay = document.createElement("div");
    overlay.id = "reve-cinematica-overlay";
    overlay.className = "reve-cinematica-overlay";

    // Criar laser beams e luzes disco de balada
    for (let i = 0; i < 8; i++) {
        const laser = document.createElement("div");
        laser.className = "reve-laser-beam";
        laser.style.left = `${(i * 14) + 2}%`;
        laser.style.animationDelay = `${i * 0.18}s`;
        laser.style.setProperty("--laser-color", `hsl(${i * 45}, 100%, 50%)`);
        overlay.appendChild(laser);
    }

    // Criar barras de equalizador neon animadas na base
    const eqContainer = document.createElement("div");
    eqContainer.className = "reve-equalizer-container";
    for (let i = 0; i < 20; i++) {
        const bar = document.createElement("div");
        bar.className = "reve-eq-bar";
        bar.style.animationDelay = `${(i % 5) * 0.1}s`;
        bar.style.background = `hsl(${(i * 18) % 360}, 100%, 55%)`;
        eqContainer.appendChild(bar);
    }
    overlay.appendChild(eqContainer);

    // Banner da Conquista
    const banner = document.createElement("div");
    banner.className = "reve-banner-box";
    banner.innerHTML = `
        <div class="reve-disco-icone">🪩</div>
        <div class="reve-titulo-destaque">VIRAR BALADA! 🕺💃</div>
        <div class="reve-subtitulo-destaque">🔮 CONQUISTA SECRETA DESBLOQUEADA • "REVE"</div>
        <div class="reve-desc-texto">"Virou balada?"</div>
        <button type="button" class="reve-fechar-btn" onclick="document.getElementById('reve-cinematica-overlay')?.remove()">🪩 CURTIR BALADA [ X ]</button>
    `;
    overlay.appendChild(banner);
    document.body.appendChild(overlay);

    // Efeito de estroboscópio de cores no tema principal durante a balada
    let tempoInicioRave = Date.now();
    let corOriginal = corPrincipalAtual;
    let intervalStrobe = setInterval(() => {
        let decorrido = Date.now() - tempoInicioRave;
        if (decorrido > 3800) {
            clearInterval(intervalStrobe);
            definirCorPrincipal(corOriginal, false, true);
            return;
        }
        let hueStrobe = (decorrido / 8) % 360;
        document.documentElement.style.setProperty('--accent', `hsl(${hueStrobe}, 100%, 55%)`);
    }, 40);

    // Transição suave para navegação à conquista
    setTimeout(() => {
        if (typeof alternarAba === "function") {
            alternarAba("conquistas", false);
        }
        conquistasSecretasDesbloqueadas = true;
        const btnSecretas = document.getElementById("conq-btn-n1-secretas");
        if (btnSecretas) {
            btnSecretas.style.display = "inline-flex";
        }
        if (typeof alternarNivel1Conquistas === "function") {
            alternarNivel1Conquistas("secretas");
        }
        if (typeof renderizarListaConquistas === "function") {
            renderizarListaConquistas();
        }

        setTimeout(() => {
            const cardReve = document.getElementById("conq-card-sec_reve") ||
                document.querySelector('#conq-lista-grid .conq-card[data-conq-id="sec_reve"]');
            if (cardReve) {
                cardReve.scrollIntoView({ behavior: "smooth", block: "center" });
                cardReve.classList.add("reve-card-glow-destaque");
                setTimeout(() => cardReve.classList.remove("reve-card-glow-destaque"), 3500);
            }
        }, 150);

        overlay.style.transition = "opacity 0.8s ease-out";
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 850);
    }, 4200);
}

/* ============================================================
   CONQUISTA SECRETA "SEGREDO-FONTE" - ÁUDIO & CINEMÁTICA HACKER F12
   ============================================================ */
function tocarAudioHackerSegredoFonte() {
    if (!somAtivado) return;
    const ctx = obterAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
    }

    const agora = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.35, agora);
    master.connect(ctx.destination);

    // Beeps de acesso cibernético / terminal hacker
    const freqs = [587.33, 880, 1174.66, 1760, 2349.32, 3520];
    freqs.forEach((f, idx) => {
        const t = agora + (idx * 0.08);
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + 0.08);
    });

    // Sweep de desbloqueio cibernético
    const sweepOsc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweepOsc.type = "sawtooth";
    sweepOsc.frequency.setValueAtTime(200, agora + 0.5);
    sweepOsc.frequency.exponentialRampToValueAtTime(1600, agora + 1.2);
    sweepGain.gain.setValueAtTime(0.2, agora + 0.5);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, agora + 1.3);
    sweepOsc.connect(sweepGain);
    sweepGain.connect(master);
    sweepOsc.start(agora + 0.5);
    sweepOsc.stop(agora + 1.35);
}

function executarCinematicaSegredoFonte() {
    const segredosDesbloqueados = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
        (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));
    if (!segredosDesbloqueados) return;

    tocarAudioHackerSegredoFonte();

    const antigo = document.getElementById("hacker-cinematica-overlay");
    if (antigo) antigo.remove();

    const overlay = document.createElement("div");
    overlay.id = "hacker-cinematica-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(5, 12, 10, 0.94);
        backdrop-filter: blur(8px);
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: monospace;
        color: #00ffcc;
        box-shadow: inset 0 0 100px rgba(0,255,204,0.15);
    `;

    overlay.innerHTML = `
        <div style="background: #0d1520; border: 1px solid #00ffcc; box-shadow: 0 0 35px rgba(0,255,204,0.35); padding: 28px 36px; border-radius: 12px; max-width: 580px; width: 90%; text-align: center;">
            <div style="font-size: 52px; margin-bottom: 12px; filter: drop-shadow(0 0 12px #00ffcc);">💻</div>
            <div style="font-size: 22px; font-weight: bold; color: #00ffcc; text-shadow: 0 0 10px #00ffcc; margin-bottom: 8px;">QUEBRAR CÓDIGOS DETECTADO! ⚡</div>
            <div style="font-size: 13px; color: #38bdf8; letter-spacing: 1px; margin-bottom: 18px; font-weight: bold;">🔮 CONQUISTA SECRETA DESBLOQUEADA • "Segredo-Fonte"</div>
            <div style="background: rgba(0,0,0,0.65); border: 1px solid rgba(0,255,204,0.3); padding: 16px; border-radius: 8px; color: #e2e8f0; font-size: 14px; margin-bottom: 22px; line-height: 1.5;">
                "Deixa eu adivinhar... seu nome é Felipe e sua habilidade é Quebrar Códigos?"
            </div>
            <button type="button" onclick="document.getElementById('hacker-cinematica-overlay')?.remove()" style="background: #00ffcc; color: #090d16; border: none; padding: 11px 26px; font-weight: bold; font-family: monospace; border-radius: 6px; cursor: pointer; font-size: 13px; transition: transform 0.2s ease;">
                [ 💻 HACKEAR SISTEMA / FECHAR ]
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
        if (typeof alternarAba === "function") {
            alternarAba("conquistas", false);
        }
        conquistasSecretasDesbloqueadas = true;
        const btnSecretas = document.getElementById("conq-btn-n1-secretas");
        if (btnSecretas) {
            btnSecretas.style.display = "inline-flex";
        }
        if (typeof alternarNivel1Conquistas === "function") {
            alternarNivel1Conquistas("secretas");
        }
        if (typeof renderizarListaConquistas === "function") {
            renderizarListaConquistas();
        }

        setTimeout(() => {
            const cardFonte = document.getElementById("conq-card-sec_segredo_fonte") ||
                document.querySelector('#conq-lista-grid .conq-card[data-conq-id="sec_segredo_fonte"]');
            if (cardFonte) {
                cardFonte.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }, 150);

        setTimeout(() => {
            if (overlay && overlay.parentNode) {
                overlay.style.transition = "opacity 0.6s ease-out";
                overlay.style.opacity = "0";
                setTimeout(() => overlay.remove(), 600);
            }
        }, 4000);
    }, 1200);
}

/* ============================================================
   CINEMÁTICA / ANIMAÇÃO DA CONQUISTA "JACKPOT" (7.7.7)
   ============================================================ */
function executarCinematicaJackpot() {
    const segredosDesbloqueados = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
        (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));
    if (!segredosDesbloqueados) return;

    const antigo = document.getElementById("jackpot-cinematica-overlay");
    if (antigo) antigo.remove();

    // Efeitos Sonoros com Web Audio API
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            const ctx = new AudioCtx();
            
            const tocarGiro = (freq, tempo) => {
                setTimeout(() => {
                    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    gain.gain.setValueAtTime(0.08, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.08);
                }, tempo);
            };

            const tocarTravaCarretel = (freq, tempo) => {
                setTimeout(() => {
                    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);
                    gain.gain.setValueAtTime(0.2, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.22);
                }, tempo);
            };

            const tocarFanfarraJackpot = (tempoInicio) => {
                setTimeout(() => {
                    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
                    const notas = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
                    notas.forEach((freq, idx) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
                        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.08);
                        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(ctx.currentTime + idx * 0.08);
                        osc.stop(ctx.currentTime + idx * 0.08 + 0.35);
                    });
                }, tempoInicio);
            };

            for (let i = 0; i < 18; i++) {
                tocarGiro(320 + (i % 3) * 120, i * 100);
            }
            tocarTravaCarretel(440, 700);  // Primeiro 7
            tocarTravaCarretel(554, 1400); // Segundo 7
            tocarTravaCarretel(659, 2100); // Terceiro 7 -> JACKPOT!
            tocarFanfarraJackpot(2150);
            tocarFanfarraJackpot(2700);
        }
    } catch (e) {
        console.warn("Áudio do Jackpot não pôde ser inicializado:", e);
    }

    // Criar Overlay
    const overlay = document.createElement("div");
    overlay.id = "jackpot-cinematica-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: radial-gradient(circle, rgba(20, 15, 35, 0.96) 0%, rgba(5, 3, 10, 0.98) 100%);
        backdrop-filter: blur(10px);
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #fff;
        overflow: hidden;
    `;

    const dataFormatadaPtBr = new Date().toLocaleDateString('pt-BR');

    overlay.innerHTML = `
        <canvas id="jackpot-canvas-moedas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;"></canvas>
        <style>
            @keyframes jackpotGlow {
                0%, 100% { box-shadow: 0 0 30px #f59e0b, 0 0 60px #eab308, inset 0 0 20px rgba(245, 158, 11, 0.5); }
                50% { box-shadow: 0 0 60px #f59e0b, 0 0 100px #eab308, inset 0 0 40px rgba(234, 179, 8, 0.8); }
            }
            @keyframes reelSpin {
                0% { transform: translateY(-4%); opacity: 0.8; }
                50% { transform: translateY(4%); opacity: 1; }
                100% { transform: translateY(-4%); opacity: 0.8; }
            }
            @keyframes jackpotPulseText {
                0%, 100% { transform: scale(1); text-shadow: 0 0 20px #fbbf24, 0 0 40px #f59e0b; }
                50% { transform: scale(1.05); text-shadow: 0 0 35px #f59e0b, 0 0 70px #eab308, 0 0 100px #ffffff; }
            }
            @keyframes slotPop {
                0% { transform: scale(0.6); opacity: 0; }
                70% { transform: scale(1.2); }
                100% { transform: scale(1); opacity: 1; }
            }
            .slot-reel {
                width: 90px;
                height: 110px;
                background: linear-gradient(180deg, #1e1b4b 0%, #0f172a 50%, #1e1b4b 100%);
                border: 3px solid #f59e0b;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 56px;
                font-weight: 900;
                color: #fbbf24;
                text-shadow: 0 0 15px #f59e0b;
                box-shadow: inset 0 0 15px rgba(0,0,0,0.8), 0 0 20px rgba(245, 158, 11, 0.4);
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                user-select: none;
            }
            .slot-reel.active-spin {
                animation: reelSpin 0.1s infinite linear;
                filter: blur(1px);
            }
            .slot-reel.locked {
                animation: slotPop 0.4s ease-out forwards;
                border-color: #fef08a;
                background: linear-gradient(180deg, #854d0e 0%, #a16207 50%, #713f12 100%);
                box-shadow: 0 0 35px #f59e0b, inset 0 0 20px #fef08a;
            }
        </style>
        <div style="position: relative; z-index: 2; background: rgba(15, 23, 42, 0.94); border: 3px solid #f59e0b; animation: jackpotGlow 2s infinite ease-in-out; padding: 36px 44px; border-radius: 24px; max-width: 600px; width: 90%; text-align: center;">
            <div style="font-size: 13px; font-weight: 800; letter-spacing: 3px; color: #fbbf24; text-transform: uppercase; margin-bottom: 8px;">
                🎰 CASSINO DAS CONQUISTAS 🎰
            </div>
            <div id="jackpot-titulo-principal" style="font-size: 30px; font-weight: 900; color: #fef08a; margin-bottom: 22px; animation: jackpotPulseText 1.5s infinite ease-in-out; letter-spacing: 1px;">
                TESTANDO SUA SORTE...
            </div>

            <!-- CARRETÉIS DE CAÇA-NÍQUEL -->
            <div style="display: flex; justify-content: center; gap: 18px; margin-bottom: 24px;">
                <div id="slot-1" class="slot-reel active-spin">🎰</div>
                <div id="slot-2" class="slot-reel active-spin">🎰</div>
                <div id="slot-3" class="slot-reel active-spin">🎰</div>
            </div>

            <div id="jackpot-detalhes-box" style="opacity: 0; transition: opacity 0.6s ease; background: rgba(0,0,0,0.65); border: 1px solid rgba(245, 158, 11, 0.4); padding: 18px; border-radius: 12px; margin-bottom: 24px;">
                <div style="font-size: 13px; color: #fbbf24; font-weight: 700; letter-spacing: 1px; margin-bottom: 6px;">
                    🔮 CONQUISTA SECRETA DESBLOQUEADA • "JACKPOT"
                </div>
                <div style="font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 6px; text-shadow: 0 0 12px #f59e0b; margin-bottom: 8px;">
                    7 . 7 . 7
                </div>
                <div style="font-size: 14px; color: #cbd5e1; line-height: 1.5; font-style: italic;">
                    "Vida = 7 • Mental = 7 • Estamina = 7. Três sete em alinhamento perfeito!"
                </div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 8px;">
                    Desbloqueado em: ${dataFormatadaPtBr}
                </div>
            </div>

            <button id="jackpot-btn-fechar" type="button" style="opacity: 0; pointer-events: none; transition: all 0.4s ease; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000; border: none; padding: 14px 36px; font-weight: 900; font-size: 15px; letter-spacing: 1px; border-radius: 30px; cursor: pointer; box-shadow: 0 0 25px rgba(245, 158, 11, 0.6); text-transform: uppercase;">
                🎰 RECEBER PRÊMIO & CONTINUAR 🎰
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    // Canvas de Partículas de Moedas / Estrelas
    const canvas = document.getElementById("jackpot-canvas-moedas");
    if (canvas) {
        const ctx = canvas.getContext("2d");
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const resizeHandler = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resizeHandler);

        const simbolos = ["🪙", "💰", "7️⃣", "✨", "⭐", "💎", "🎰"];
        const particulas = [];

        for (let i = 0; i < 90; i++) {
            particulas.push({
                x: Math.random() * width,
                y: Math.random() * height - height,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * 4 + 3,
                size: Math.random() * 24 + 18,
                simbolo: simbolos[Math.floor(Math.random() * simbolos.length)],
                rotacao: Math.random() * Math.PI * 2,
                vRotacao: (Math.random() - 0.5) * 0.1,
                opacity: Math.random() * 0.7 + 0.3
            });
        }

        let animFrameId;
        function animarCanvas() {
            ctx.clearRect(0, 0, width, height);
            
            particulas.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.rotacao += p.vRotacao;

                if (p.y > height + 50) {
                    p.y = -40;
                    p.x = Math.random() * width;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotacao);
                ctx.globalAlpha = p.opacity;
                ctx.font = `${p.size}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(p.simbolo, 0, 0);
                ctx.restore();
            });

            animFrameId = requestAnimationFrame(animarCanvas);
        }

        animarCanvas();

        overlay._limparCanvas = () => {
            cancelAnimationFrame(animFrameId);
            window.removeEventListener("resize", resizeHandler);
        };
    }

    // Controle dos carretéis
    const slot1 = document.getElementById("slot-1");
    const slot2 = document.getElementById("slot-2");
    const slot3 = document.getElementById("slot-3");
    const tituloPrincipal = document.getElementById("jackpot-titulo-principal");
    const detalhesBox = document.getElementById("jackpot-detalhes-box");
    const btnFechar = document.getElementById("jackpot-btn-fechar");

    const iconesAleatorios = ["🍒", "🔔", "💎", "🍋", "⭐", "🎰", "🍇"];

    const intervalTroca = setInterval(() => {
        if (slot1 && slot1.classList.contains("active-spin")) {
            slot1.textContent = iconesAleatorios[Math.floor(Math.random() * iconesAleatorios.length)];
        }
        if (slot2 && slot2.classList.contains("active-spin")) {
            slot2.textContent = iconesAleatorios[Math.floor(Math.random() * iconesAleatorios.length)];
        }
        if (slot3 && slot3.classList.contains("active-spin")) {
            slot3.textContent = iconesAleatorios[Math.floor(Math.random() * iconesAleatorios.length)];
        }
    }, 70);

    // Parar Carretel 1 no 7 (700ms)
    setTimeout(() => {
        if (slot1) {
            slot1.classList.remove("active-spin");
            slot1.classList.add("locked");
            slot1.textContent = "7";
        }
    }, 700);

    // Parar Carretel 2 no 7 (1400ms)
    setTimeout(() => {
        if (slot2) {
            slot2.classList.remove("active-spin");
            slot2.classList.add("locked");
            slot2.textContent = "7";
        }
    }, 1400);

    // Parar Carretel 3 no 7 (2100ms) -> GRAND JACKPOT!
    setTimeout(() => {
        clearInterval(intervalTroca);
        if (slot3) {
            slot3.classList.remove("active-spin");
            slot3.classList.add("locked");
            slot3.textContent = "7";
        }

        if (tituloPrincipal) {
            tituloPrincipal.innerHTML = "🎉 GRAND JACKPOT! 🎉";
            tituloPrincipal.style.color = "#fef08a";
        }

        if (detalhesBox) {
            detalhesBox.style.opacity = "1";
        }

        if (btnFechar) {
            btnFechar.style.opacity = "1";
            btnFechar.style.pointerEvents = "auto";
            btnFechar.onclick = () => fecharOverlayJackpot();
        }
    }, 2100);

    function fecharOverlayJackpot() {
        if (overlay._limparCanvas) overlay._limparCanvas();
        overlay.style.transition = "opacity 0.5s ease";
        overlay.style.opacity = "0";
        setTimeout(() => {
            overlay.remove();
            
            if (typeof alternarAba === "function") {
                alternarAba("conquistas", false);
            }
            conquistasSecretasDesbloqueadas = true;
            const btnSecretas = document.getElementById("conq-btn-n1-secretas");
            if (btnSecretas) {
                btnSecretas.style.display = "inline-flex";
            }
            if (typeof alternarNivel1Conquistas === "function") {
                alternarNivel1Conquistas("secretas");
            }
            if (typeof renderizarListaConquistas === "function") {
                renderizarListaConquistas();
            }

            setTimeout(() => {
                const cardJackpot = document.getElementById("conq-card-sec_jackpot") ||
                    document.querySelector('#conq-lista-grid .conq-card[data-conq-id="sec_jackpot"]');
                if (cardJackpot) {
                    cardJackpot.scrollIntoView({ behavior: "smooth", block: "center" });
                    cardJackpot.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
                    cardJackpot.style.transform = "scale(1.08)";
                    cardJackpot.style.boxShadow = "0 0 30px #f59e0b";
                    setTimeout(() => {
                        cardJackpot.style.transform = "scale(1)";
                        cardJackpot.style.boxShadow = "";
                    }, 1200);
                }
            }, 200);
        }, 500);
    }

/* ============================================================
   CONQUISTA SECRETA "COMPANHIA" (40028922) — LÓGICA & ROLETA YUDI
   ============================================================ */
let _ligacaoYudiEmAndamento = false;
let estadoPremioYudiGlobal = null;

function verificarGatilhoCompanhia() {
    if (_ligacaoYudiEmAndamento) return;
    _ligacaoYudiEmAndamento = true;

    // Garante que a aba de segredos esteja desbloqueada
    if (typeof conquistasDesbloqueadas !== "undefined" && !conquistasDesbloqueadas.has("sec_easteregg_rodape")) {
        desbloquearConquistaSecreta("sec_easteregg_rodape");
    }

    // Tocador do som de telefone via Web Audio API
    let ctxAudio = null;
    let timerSomRing = null;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            ctxAudio = new AudioCtx();
            
            const tocarBeepDTMF = (f1, f2, dur) => {
                if (ctxAudio.state === 'suspended') ctxAudio.resume().catch(() => {});
                const osc1 = ctxAudio.createOscillator();
                const osc2 = ctxAudio.createOscillator();
                const gain = ctxAudio.createGain();
                osc1.frequency.value = f1;
                osc2.frequency.value = f2;
                gain.gain.setValueAtTime(0.08, ctxAudio.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctxAudio.currentTime + dur);
                osc1.connect(gain); osc2.connect(gain);
                gain.connect(ctxAudio.destination);
                osc1.start(); osc2.start();
                osc1.stop(ctxAudio.currentTime + dur); osc2.stop(ctxAudio.currentTime + dur);
            };

            // Bips rápidos de discagem DTMF (40028922)
            const freqs = [[941, 1336], [1336, 941], [1336, 941], [697, 1336], [852, 1477], [852, 1477], [697, 1336], [697, 1336]];
            freqs.forEach((pair, idx) => {
                setTimeout(() => tocarBeepDTMF(pair[0], pair[1], 0.08), idx * 100);
            });

            // Som de chamada do telefone (tuuu... tuuu...)
            const tocarTuuuPhone = () => {
                if (!ctxAudio || ctxAudio.state === 'closed') return;
                if (ctxAudio.state === 'suspended') ctxAudio.resume().catch(() => {});
                const osc = ctxAudio.createOscillator();
                const gain = ctxAudio.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(425, ctxAudio.currentTime);
                gain.gain.setValueAtTime(0.12, ctxAudio.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctxAudio.currentTime + 1.2);
                osc.connect(gain); gain.connect(ctxAudio.destination);
                osc.start(); osc.stop(ctxAudio.currentTime + 1.2);
            };

            setTimeout(tocarTuuuPhone, 1000);
            timerSomRing = setInterval(tocarTuuuPhone, 2800);
        }
    } catch(e) {}

    // Modal de Ligação de 15 Segundos
    const overlay = document.createElement("div");
    overlay.id = "yudi-ligacao-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: radial-gradient(circle, rgba(15, 23, 42, 0.96) 0%, rgba(3, 7, 18, 0.98) 100%);
        backdrop-filter: blur(10px);
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, sans-serif;
        color: #fff;
        padding: 20px;
    `;

    let tempoRestante = 15;

    overlay.innerHTML = `
        <div style="background: rgba(30, 41, 59, 0.92); border: 2px solid #3b82f6; border-radius: 16px; padding: 32px 28px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 0 40px rgba(59, 130, 246, 0.4); animation: yudiPulseCall 1.5s infinite ease-in-out;">
            <style>
                @keyframes yudiPulseCall {
                    0%, 100% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.4); }
                    50% { box-shadow: 0 0 50px rgba(59, 130, 246, 0.8); }
                }
                @keyframes yudiRingAnim {
                    0%, 100% { transform: rotate(0deg) scale(1); }
                    10%, 30%, 50% { transform: rotate(-12deg) scale(1.15); }
                    20%, 40% { transform: rotate(12deg) scale(1.15); }
                }
                .call-ring-icon {
                    display: inline-block;
                    font-size: 54px;
                    margin-bottom: 12px;
                    animation: yudiRingAnim 1.4s infinite ease-in-out;
                }
            </style>
            <div class="call-ring-icon">📞</div>
            <h2 style="margin: 0 0 6px 0; font-size: 22px; color: #60a5fa; font-weight: 800; letter-spacing: 0.03em;">
                LIGAÇÃO BOM DIA & CIA — 4002-8922
            </h2>
            <p style="margin: 0 0 18px 0; font-size: 14px; color: #93c5fd; opacity: 0.9;">
                Aguarde na linha! A chamada está conectando ao vivo...
            </p>
            
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid #1e3a8a; border-radius: 10px; padding: 14px; margin-bottom: 20px;">
                <div style="font-size: 32px; font-weight: 900; font-family: monospace; color: #f59e0b; margin-bottom: 6px;">
                    <span id="yudi-timer-display">15</span>s
                </div>
                <div style="width: 100%; background: #1e293b; height: 10px; border-radius: 5px; overflow: hidden;">
                    <div id="yudi-progress-bar" style="width: 100%; height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); transition: width 1s linear;"></div>
                </div>
            </div>

            <div id="yudi-call-status-log" style="font-size: 13px; color: #cbd5e1; font-style: italic; font-family: monospace; min-height: 24px;">
                [00:00] Discando 4002-8922...
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const logEl = document.getElementById("yudi-call-status-log");
    const timerDisplay = document.getElementById("yudi-timer-display");
    const progressBar = document.getElementById("yudi-progress-bar");

    const statusMsgs = {
        14: "[00:01] Chamando o programa Bom Dia & Cia...",
        11: "[00:04] Tuuu... Tuuu... Atendendo chamada...",
        8:  "[00:07] Yudi e Priscila estão no estúdio ao vivo...",
        5:  "[00:10] O crédito do celular dos seus pais está acabando...",
        2:  "[00:13] Linha quase conectada! Torça pela roleta!"
    };

    const intervalCount = setInterval(() => {
        tempoRestante--;
        if (timerDisplay) timerDisplay.textContent = tempoRestante;
        if (progressBar) progressBar.style.width = `${(tempoRestante / 15) * 100}%`;

        if (statusMsgs[tempoRestante] && logEl) {
            logEl.textContent = statusMsgs[tempoRestante];
        }

        if (tempoRestante <= 0) {
            clearInterval(intervalCount);
            if (timerSomRing) clearInterval(timerSomRing);
            if (ctxAudio) { ctxAudio.close().catch(()=>{}); }
            overlay.remove();
            _ligacaoYudiEmAndamento = false;

            // Sorteio: 5% de chance de vitória, 95% de chance de falha
            const sorteio = Math.random();
            if (sorteio < 0.05) {
                desbloquearConquistaSecreta("sec_companhia");
                executarRoletaYudi();
            } else {
                exibirMensagemTentativaYudi();
            }
        }
    }, 1000);
}

function exibirMensagemTentativaYudi() {
    const antigo = document.getElementById("yudi-mensagem-falha-overlay");
    if (antigo) antigo.remove();

    const overlay = document.createElement("div");
    overlay.id = "yudi-mensagem-falha-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-family: system-ui, -apple-system, sans-serif;
    `;

    overlay.innerHTML = `
        <div style="background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border: 2px solid #ef4444; border-radius: 16px; padding: 28px; max-width: 520px; width: 100%; text-align: center; box-shadow: 0 0 35px rgba(239, 68, 68, 0.4); color: #fff;">
            <div style="font-size: 48px; margin-bottom: 10px;">📞</div>
            <h3 style="margin: 0 0 14px 0; font-size: 20px; color: #f87171; font-weight: 800;">
                BOM DIA & CIA — AVISO DA LINHA
            </h3>
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 18px; margin-bottom: 20px; font-size: 15px; line-height: 1.6; text-align: left; color: #e2e8f0;">
                <p style="margin: 0 0 12px 0;">
                    Ah! Não foi dessa vez que você conseguiu, mas continue tentando! Ligue somente durante o programa! Valeu!
                </p>
                <p style="margin: 0; font-size: 13.5px; color: #fbbf24; font-style: italic;">
                    PS: não deixe seus pais saberem que você está ligando ☺️
                </p>
            </div>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button type="button" onclick="document.getElementById('yudi-mensagem-falha-overlay').remove(); verificarGatilhoCompanhia();" style="padding: 10px 18px; background: #3b82f6; border: none; border-radius: 8px; color: #fff; font-weight: 700; cursor: pointer; transition: background 0.2s;">
                    📞 Ligar Novamente (40028922)
                </button>
                <button type="button" onclick="document.getElementById('yudi-mensagem-falha-overlay').remove();" style="padding: 10px 18px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #ccc; font-weight: 600; cursor: pointer;">
                    Fechar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

function executarRoletaYudi() {
    const antigo = document.getElementById("yudi-roleta-overlay");
    if (antigo) antigo.remove();

    const PREMIOS_YUDI = [
        { id: "videogame", nome: "Videogame", emoji: "🎮", cor: "#ef4444" },
        { id: "bike", nome: "Bike", emoji: "🚲", cor: "#f59e0b" },
        { id: "patins", nome: "Patim", emoji: "🛼", cor: "#10b981" },
        { id: "skate", nome: "Skate", emoji: "🛹", cor: "#06b6d4" },
        { id: "computador", nome: "Computador", emoji: "💻", cor: "#3b82f6" },
        { id: "boneca", nome: "Boneca", emoji: "🪆", cor: "#8b5cf6" },
        { id: "tv", nome: "TV", emoji: "📺", cor: "#ec4899" }
    ];

    const idxGanhador = Math.floor(Math.random() * PREMIOS_YUDI.length);
    const premioSorteado = PREMIOS_YUDI[idxGanhador];

    const overlay = document.createElement("div");
    overlay.id = "yudi-roleta-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: radial-gradient(circle, rgba(24, 16, 42, 0.98) 0%, rgba(5, 3, 12, 0.99) 100%);
        backdrop-filter: blur(12px);
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, sans-serif;
        color: #fff;
        padding: 20px;
    `;

    overlay.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; max-width: 500px; width: 100%; text-align: center;">
            <div style="margin-bottom: 12px; font-size: 14px; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.1em; background: rgba(251, 191, 36, 0.15); border: 1px solid #fbbf24; padding: 4px 14px; border-radius: 20px;">
                🎉 ROLETA DE PRÊMIOS DO YUDI
            </div>
            <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 900; color: #fff; text-shadow: 0 0 15px rgba(251, 191, 36, 0.5);">
                4002-8922: A ROLETA ESTÁ GIRANDO!
            </h2>

            <!-- Ponteiro indicador -->
            <div style="position: relative; width: 320px; height: 320px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
                <div style="position: absolute; top: -14px; z-index: 10; width: 0; height: 0; border-left: 14px solid transparent; border-right: 14px solid transparent; border-top: 24px solid #f59e0b; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.8));"></div>
                
                <!-- Roda da Roleta -->
                <div id="yudi-roleta-disco" style="width: 300px; height: 300px; border-radius: 50%; border: 6px solid #fbbf24; box-shadow: 0 0 40px rgba(245, 158, 11, 0.5), inset 0 0 20px rgba(0,0,0,0.8); position: relative; overflow: hidden; transition: transform 4.5s cubic-bezier(0.15, 0.85, 0.15, 1);">
                </div>

                <!-- Centro da Roleta -->
                <div style="position: absolute; width: 64px; height: 64px; background: radial-gradient(circle, #fbbf24 0%, #b45309 100%); border: 3px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(0,0,0,0.8); font-size: 22px; z-index: 5;">
                    ⭐
                </div>
            </div>

            <!-- Resultado -->
            <div id="yudi-roleta-resultado" style="opacity: 0; transform: scale(0.8); transition: all 0.5s ease; width: 100%; text-align: center;">
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const disco = document.getElementById("yudi-roleta-disco");
    const totalSeg = PREMIOS_YUDI.length;
    const anguloPorSeg = 360 / totalSeg;

    let conicGradients = [];
    PREMIOS_YUDI.forEach((p, idx) => {
        const inicio = idx * anguloPorSeg;
        const fim = (idx + 1) * anguloPorSeg;
        conicGradients.push(`${p.cor} ${inicio}deg ${fim}deg`);
    });

    disco.style.background = `conic-gradient(${conicGradients.join(", ")})`;

    PREMIOS_YUDI.forEach((p, idx) => {
        const anguloMeio = (idx + 0.5) * anguloPorSeg;
        const rad = (anguloMeio - 90) * (Math.PI / 180);
        const raio = 100;
        const x = 150 + raio * Math.cos(rad);
        const y = 150 + raio * Math.sin(rad);

        const elPr = document.createElement("div");
        elPr.style.cssText = `
            position: absolute;
            left: ${x}px; top: ${y}px;
            transform: translate(-50%, -50%) rotate(${anguloMeio}deg);
            display: flex; flex-direction: column; align-items: center;
            color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.9); font-weight: 800; font-size: 11px;
            pointer-events: none;
        `;
        elPr.innerHTML = `<span style="font-size: 22px;">${p.emoji}</span><span>${p.nome}</span>`;
        disco.appendChild(elPr);
    });

    let timerTick = null;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            const ctxA = new AudioCtx();
            let delayTick = 80;
            let elapsed = 0;

            const tocarTick = () => {
                if (elapsed > 4200) return;
                if (ctxA.state === 'suspended') ctxA.resume().catch(()=>{});
                const osc = ctxA.createOscillator();
                const gain = ctxA.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600 + Math.random() * 200, ctxA.currentTime);
                gain.gain.setValueAtTime(0.08, ctxA.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctxA.currentTime + 0.04);
                osc.connect(gain); gain.connect(ctxA.destination);
                osc.start(); osc.stop(ctxA.currentTime + 0.04);

                elapsed += delayTick;
                delayTick += 12;
                timerTick = setTimeout(tocarTick, delayTick);
            };
            tocarTick();
        }
    } catch(e) {}

    const girosCompletos = 5 * 360;
    const anguloAlvo = girosCompletos + (360 - ((idxGanhador + 0.5) * anguloPorSeg));

    setTimeout(() => {
        disco.style.transform = `rotate(${anguloAlvo}deg)`;
    }, 100);

    setTimeout(() => {
        if (timerTick) clearTimeout(timerTick);

        const dataBrFormatada = new Date().toLocaleDateString('pt-BR');
        const premioObjeto = {
            id: premioSorteado.id,
            nome: premioSorteado.nome,
            emoji: premioSorteado.emoji,
            data: dataBrFormatada
        };

        salvarPremioYudiNaFicha(premioObjeto);

        const boxRes = document.getElementById("yudi-roleta-resultado");
        if (boxRes) {
            boxRes.style.opacity = "1";
            boxRes.style.transform = "scale(1)";
            boxRes.innerHTML = `
                <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(234, 179, 8, 0.15) 100%); border: 2px solid #f59e0b; border-radius: 14px; padding: 20px; box-shadow: 0 0 30px rgba(245, 158, 11, 0.5);">
                    <div style="font-size: 64px; animation: slotPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); margin-bottom: 8px;">
                        ${premioSorteado.emoji}
                    </div>
                    <h3 style="margin: 0 0 6px 0; font-size: 22px; color: #fbbf24; font-weight: 900;">
                        PARABÉNS! VOCÊ GANHOU: ${premioSorteado.nome.toUpperCase()} ${premioSorteado.emoji}!
                    </h3>
                    <p style="margin: 0 0 16px 0; font-size: 13.5px; color: #e2e8f0;">
                        O emoji do prêmio <strong>${premioSorteado.emoji} ${premioSorteado.nome}</strong> foi fixado permanentemente ao lado do seu retrato na ficha do personagem!
                    </p>
                    <button type="button" onclick="fecharRoletaYudiEIrParaConquistas();" style="padding: 10px 24px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border: none; border-radius: 8px; color: #fff; font-weight: 800; font-size: 14px; cursor: pointer; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                        🏆 Ver Conquista "Companhia"
                    </button>
                </div>
            `;
        }
    }, 4600);
}

function fecharRoletaYudiEIrParaConquistas() {
    const overlay = document.getElementById("yudi-roleta-overlay");
    if (overlay) {
        overlay.style.transition = "opacity 0.4s ease";
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 400);
    }
    if (typeof alternarAba === "function") {
        alternarAba("conquistas", false);
    }
    conquistasSecretasDesbloqueadas = true;
    const btnSecretas = document.getElementById("conq-btn-n1-secretas");
    if (btnSecretas) btnSecretas.style.display = "inline-flex";
    if (typeof alternarNivel1Conquistas === "function") alternarNivel1Conquistas("secretas");
    if (typeof renderizarListaConquistas === "function") renderizarListaConquistas();

    setTimeout(() => {
        const cardComp = document.getElementById("conq-card-sec_companhia") ||
            document.querySelector('#conq-lista-grid .conq-card[data-conq-id="sec_companhia"]');
        if (cardComp) {
            cardComp.scrollIntoView({ behavior: "smooth", block: "center" });
            cardComp.style.transform = "scale(1.08)";
            cardComp.style.boxShadow = "0 0 30px #3b82f6";
            setTimeout(() => { cardComp.style.transform = "scale(1)"; cardComp.style.boxShadow = ""; }, 1200);
        }
    }, 200);
}

function salvarPremioYudiNaFicha(premioObj) {
    estadoPremioYudiGlobal = premioObj;
    try {
        localStorage.setItem("we_are_strangers_premio_yudi", JSON.stringify(premioObj));
    } catch(e) {}
    renderizarBadgePremioYudi();
    if (typeof salvarFichaAutomatico === "function") {
        salvarFichaAutomatico();
    } else if (typeof marcarAlteracaoFeita === "function") {
        marcarAlteracaoFeita();
    }
}

function renderizarBadgePremioYudi() {
    let premio = estadoPremioYudiGlobal;
    if (!premio) {
        try {
            const bruto = localStorage.getItem("we_are_strangers_premio_yudi");
            if (bruto) {
                premio = JSON.parse(bruto);
                estadoPremioYudiGlobal = premio;
            }
        } catch(e) {}
    }

    const badgeEl = document.getElementById("ficha-badge-premio-yudi");
    if (!badgeEl) return;

    if (premio && premio.emoji) {
        const dataStr = premio.data || new Date().toLocaleDateString('pt-BR');
        badgeEl.style.display = "inline-flex";
        badgeEl.setAttribute("title", `Prêmio Bom Dia & Cia: ${premio.nome} (${premio.emoji}) - Ganho em ${dataStr}`);
        badgeEl.innerHTML = `<span style="font-size: 16px; margin-right: 4px;">${premio.emoji}</span><span style="font-size: 11px; font-weight: 700; color: #fbbf24; text-transform: uppercase;">${premio.nome}</span>`;
    } else {
        badgeEl.style.display = "none";
    }
}

// Capturador global de teclas numéricas para o código 40028922
window._bufferSequenciaYudi = "";
document.addEventListener("keydown", function(e) {
    if (e.key >= "0" && e.key <= "9") {
        window._bufferSequenciaYudi = (window._bufferSequenciaYudi || "") + e.key;
        if (window._bufferSequenciaYudi.length > 20) {
            window._bufferSequenciaYudi = window._bufferSequenciaYudi.slice(-20);
        }
        if (window._bufferSequenciaYudi.endsWith("40028922")) {
            window._bufferSequenciaYudi = "";
            verificarGatilhoCompanhia();
        }
    }
}, true);

function tocarAudioEsqueleBros() {
    if (!somAtivado) return;
    const ctx = obterAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
    }

    const agora = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.35, agora);
    master.connect(ctx.destination);

    // 1. Sons de diálogo 8-bit estilo Undertale (voz grave de Sans e estridente de Papyrus)
    for (let i = 0; i < 14; i++) {
        const blipTime = agora + i * 0.055;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i < 7 ? "square" : "triangle";
        const freq = i < 7 ? 125 + (i % 2) * 12 : 320 + (i % 3) * 28;
        osc.frequency.setValueAtTime(freq, blipTime);
        gain.gain.setValueAtTime(0.24, blipTime);
        gain.gain.exponentialRampToValueAtTime(0.001, blipTime + 0.04);
        osc.connect(gain);
        gain.connect(master);
        osc.start(blipTime);
        osc.stop(blipTime + 0.045);
    }

    // 2. Riff Chiptune Megalovania & Bonetrousle (Papyrus)
    const notasMegalovania = [
        { f: 293.66, t: 0.72, d: 0.12 }, // D4
        { f: 293.66, t: 0.85, d: 0.12 }, // D4
        { f: 587.33, t: 0.98, d: 0.22 }, // D5
        { f: 440.00, t: 1.22, d: 0.28 }, // A4
        { f: 415.30, t: 1.52, d: 0.22 }, // Ab4
        { f: 392.00, t: 1.76, d: 0.22 }, // G4
        { f: 349.23, t: 2.00, d: 0.22 }, // F4
        { f: 293.66, t: 2.24, d: 0.14 }, // D4
        { f: 349.23, t: 2.40, d: 0.14 }, // F4
        { f: 392.00, t: 2.56, d: 0.24 }, // G4

        // Papyrus / Bonetrousle Xilofone de Ossos
        { f: 587.33, t: 2.84, d: 0.14 }, // D5
        { f: 698.46, t: 3.00, d: 0.14 }, // F5
        { f: 783.99, t: 3.16, d: 0.14 }, // G5
        { f: 830.61, t: 3.32, d: 0.14 }, // G#5
        { f: 880.00, t: 3.48, d: 0.32 }, // A5
        { f: 587.33, t: 3.84, d: 0.16 }, // D5
        { f: 440.00, t: 4.02, d: 0.22 }, // A4
        { f: 587.33, t: 4.26, d: 0.45 }  // D5 final triunfante
    ];

    notasMegalovania.forEach(n => {
        const t = agora + n.t;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = n.t < 2.8 ? "square" : "triangle";
        osc.frequency.setValueAtTime(n.f, t);

        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(0.28, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + n.d);

        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + n.d + 0.02);
    });

    // 3. Efeito cômico de trombone deslizante no final
    const slideTime = agora + 4.75;
    const oscTrombone = ctx.createOscillator();
    const gainTrombone = ctx.createGain();
    oscTrombone.type = "sawtooth";
    oscTrombone.frequency.setValueAtTime(174.61, slideTime); // F3
    oscTrombone.frequency.exponentialRampToValueAtTime(130.81, slideTime + 0.45); // C3
    gainTrombone.gain.setValueAtTime(0.2, slideTime);
    gainTrombone.gain.exponentialRampToValueAtTime(0.001, slideTime + 0.5);

    oscTrombone.connect(gainTrombone);
    gainTrombone.connect(master);
    oscTrombone.start(slideTime);
    oscTrombone.stop(slideTime + 0.52);
}

let timersEsqueleBros = [];

function limparTimersEsqueleBros() {
    if (Array.isArray(timersEsqueleBros)) {
        timersEsqueleBros.forEach(t => clearTimeout(t));
    }
    timersEsqueleBros = [];
}

function tocarVoz8BitSans() {
    if (!somAtivado) return;
    const ctx = obterAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(125 + (Math.random() * 14 - 7), t);
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.038);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
}

function tocarVoz8BitPapyrus() {
    if (!somAtivado) return;
    const ctx = obterAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(340 + (Math.random() * 32 - 16), t);
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.038);
}

function executarCinematicaEsqueleBros() {
    // Bloqueia caso as conquistas secretas não tenham sido desbloqueadas pelo duplo-clique na logo
    const segredosDesbloqueados = (typeof conquistasSecretasDesbloqueadas !== "undefined" && conquistasSecretasDesbloqueadas) &&
        (typeof conquistasDesbloqueadas !== "undefined" && conquistasDesbloqueadas.has("sec_easteregg_rodape"));
    if (!segredosDesbloqueados) return;

    limparTimersEsqueleBros();

    // Disparar áudio personalizado
    tocarAudioEsqueleBros();

    // Remove overlay anterior se existir
    const antigo = document.getElementById("esquelebros-cinematica-overlay");
    if (antigo) antigo.remove();

    const overlay = document.createElement("div");
    overlay.id = "esquelebros-cinematica-overlay";
    overlay.className = "esquelebros-cinematica-overlay";

    // Criar ossos flutuantes coloridos
    const coresOssos = ["#00f0ff", "#ff9900", "#ffffff", "#ffff00"];
    for (let i = 0; i < 16; i++) {
        const osso = document.createElement("div");
        osso.className = "esquelebros-osso-flutuante";
        osso.textContent = i % 3 === 0 ? "💀" : "🦴";
        osso.style.left = `${Math.random() * 90 + 5}%`;
        osso.style.animationDelay = `${Math.random() * 1.5}s`;
        osso.style.animationDuration = `${2.5 + Math.random() * 2}s`;
        osso.style.filter = `drop-shadow(0 0 10px ${coresOssos[i % coresOssos.length]})`;
        overlay.appendChild(osso);
    }

    const box = document.createElement("div");
    box.className = "esquelebros-dialogo-box";
    box.title = "Clique para pular / acelerar o texto";
    box.innerHTML = `
        <div class="esquelebros-topo">
            <span class="esquelebros-titulo-tag">💀 CONQUISTA SECRETA DESBLOQUEADA • ESQUELE-BROS 🦴</span>
            <button type="button" class="esquelebros-fechar-btn" id="esquelebros-fechar-btn" onclick="document.getElementById('esquelebros-cinematica-overlay')?.remove()">[ X ] FECHAR</button>
        </div>
        <div class="esquelebros-fala-linha" id="esquelebros-linha-sans">
            <div class="esquelebros-fala-avatar sans">💀</div>
            <div class="esquelebros-fala-texto sans-texto" id="esquelebros-texto-sans"></div>
        </div>
        <div class="esquelebros-fala-linha" id="esquelebros-linha-papyrus" style="display: none;">
            <div class="esquelebros-fala-avatar papyrus">🦴</div>
            <div class="esquelebros-fala-texto papyrus-texto" id="esquelebros-texto-papyrus"></div>
        </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const textoSans = "* sans: ei. parece que você combinou as fontes certas. interpretação ao pé das letras, hein?";
    const textoPapyrus = "* PAPYRUS: NYEH HEH HEH! NOSSOS NOMES SÃO LENDÁRIOS ATÉ MESMO NESTE UNIVERSO!";

    const elSans = box.querySelector("#esquelebros-texto-sans");
    const elPapyrus = box.querySelector("#esquelebros-texto-papyrus");
    const linhaPapyrus = box.querySelector("#esquelebros-linha-papyrus");

    let animacaoConcluida = false;

    function finalizarTextoImediato() {
        if (animacaoConcluida) return;
        animacaoConcluida = true;
        limparTimersEsqueleBros();
        if (elSans) elSans.textContent = textoSans;
        if (linhaPapyrus) linhaPapyrus.style.display = "flex";
        if (elPapyrus) elPapyrus.textContent = textoPapyrus;
        agendarAutoFechamento(8500);
    }

    // Clique na caixa de diálogo pula a animação letra-a-letra
    box.addEventListener("click", (e) => {
        if (e.target.closest("#esquelebros-fechar-btn")) return;
        if (!animacaoConcluida) {
            finalizarTextoImediato();
        }
    });

    function agendarAutoFechamento(ms = 8500) {
        const timer = setTimeout(() => {
            if (overlay && overlay.parentNode) {
                overlay.style.transition = "opacity 0.6s ease-out";
                overlay.style.opacity = "0";
                setTimeout(() => overlay.remove(), 650);
            }
        }, ms);
        timersEsqueleBros.push(timer);
    }

    function digitar(elemento, textoCompleto, somCallback, onComplete) {
        let index = 0;
        elemento.innerHTML = '<span class="esquelebros-cursor"></span>';

        function passo() {
            if (animacaoConcluida) return;
            index++;
            const charAtual = textoCompleto[index - 1];
            elemento.textContent = textoCompleto.slice(0, index);
            elemento.innerHTML = elemento.textContent + '<span class="esquelebros-cursor"></span>';

            if (charAtual && /[a-zA-Z0-9À-ÿ]/.test(charAtual)) {
                if (typeof somCallback === "function") {
                    somCallback();
                }
            }

            if (index < textoCompleto.length) {
                let delay = 32;
                if ([".", "!", "?"].includes(charAtual)) {
                    delay = 180;
                } else if ([",", ":"].includes(charAtual)) {
                    delay = 110;
                }
                const timer = setTimeout(passo, delay);
                timersEsqueleBros.push(timer);
            } else {
                elemento.textContent = textoCompleto;
                if (typeof onComplete === "function") {
                    onComplete();
                }
            }
        }

        const tInicial = setTimeout(passo, 120);
        timersEsqueleBros.push(tInicial);
    }

    // Iniciar digitação da fala do Sans
    digitar(elSans, textoSans, tocarVoz8BitSans, () => {
        const timerPausa = setTimeout(() => {
            if (animacaoConcluida) return;
            if (linhaPapyrus) linhaPapyrus.style.display = "flex";
            digitar(elPapyrus, textoPapyrus, tocarVoz8BitPapyrus, () => {
                animacaoConcluida = true;
                agendarAutoFechamento(8500);
            });
        }, 360);
        timersEsqueleBros.push(timerPausa);
    });
}

function desbloquearAbaConquistasSecretas(comAnimacao = true) {
    conquistasSecretasDesbloqueadas = true;

    const btnSecretas = document.getElementById("conq-btn-n1-secretas");
    if (btnSecretas) {
        btnSecretas.style.display = "inline-flex";
        if (comAnimacao) {
            btnSecretas.classList.add("destaque-novo-segredo");
            setTimeout(() => {
                btnSecretas.classList.remove("destaque-novo-segredo");
            }, 3000);
        }
    }

    if (!conquistasDesbloqueadas.has("sec_easteregg_rodape")) {
        conquistasDesbloqueadas.add("sec_easteregg_rodape");
        atualizarTooltipLogoRodape();
        salvarSegredosDesbloqueadosStorage();
        if (typeof salvarFichaAutomatico === "function") {
            salvarFichaAutomatico();
        } else if (typeof marcarAlteracaoFeita === "function") {
            marcarAlteracaoFeita();
        }
    } else {
        atualizarTooltipLogoRodape();
    }

    if (typeof renderizarListaConquistas === "function") {
        renderizarListaConquistas();
    }

    if (typeof verificarGatilhoAntiContraste === "function") {
        verificarGatilhoAntiContraste();
    }

    if (typeof verificarGatilhoEsqueleBros === "function") {
        verificarGatilhoEsqueleBros();
    }

    if (typeof verificarGatilhoFarmadorAura === "function") {
        verificarGatilhoFarmadorAura();
    }
}

let ultimoCliqueRodape = 0;
let ultimoToqueRodape = 0;
let tempoUltimoDisparoEasterEgg = 0;

function tratarCliqueDuploRodape(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    acionarEasterEggRodape();
}

function tratarCliqueRodape(e) {
    const agora = Date.now();
    if (agora - ultimoCliqueRodape < 400) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        acionarEasterEggRodape();
        ultimoCliqueRodape = 0;
    } else {
        ultimoCliqueRodape = agora;
    }
}

function tratarToqueRodape(e) {
    const agora = Date.now();
    if (agora - ultimoToqueRodape < 400) {
        if (e) e.preventDefault();
        acionarEasterEggRodape();
        ultimoToqueRodape = 0;
    } else {
        ultimoToqueRodape = agora;
    }
}

function acionarEasterEggRodape() {
    const agora = Date.now();
    if (agora - tempoUltimoDisparoEasterEgg < 500) return;
    tempoUltimoDisparoEasterEgg = agora;

    const jaDesbloqueada = conquistasSecretasDesbloqueadas;

    const logoEl = document.getElementById("rodape-spec-logo") || document.querySelector(".rodape-spec");
    if (logoEl) {
        logoEl.classList.remove("segredo-ativado");
        void logoEl.offsetWidth;
        logoEl.classList.add("segredo-ativado");
    }

    desbloquearAbaConquistasSecretas(true);

    if (typeof tocarEfeitoSonoro === "function") {
        tocarEfeitoSonoro({ tipo: "amaldicoado" }, 30, 2);
    } else if (typeof tocarSom === "function") {
        tocarSom("vitoria");
    }

    if (!jaDesbloqueada) {
        if (typeof mostrarStatus === "function") {
            mostrarStatus("🔮 Segredo Revelado! Aba 'SECRETAS' desbloqueada nas Conquistas!", "ok");
        }
    } else {
        if (typeof mostrarStatus === "function") {
            mostrarStatus("🔮 A insígnia ressoa... Você já desvendou os mistérios das Conquistas Secretas!", "ok");
        }
    }

    if (typeof alternarAba === "function") {
        alternarAba("conquistas");
    }
    alternarNivel1Conquistas("secretas");

    setTimeout(() => {
        const topoConq = document.getElementById("aba-painel-conquistas");
        if (topoConq) {
            topoConq.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, 120);
}

function alternarNivel1Conquistas(nivel1) {
    if (nivel1 === "secretas" && !conquistasSecretasDesbloqueadas) {
        nivel1 = "oficiais";
    }
    conqNivel1Ativo = nivel1;
    document.getElementById("conq-btn-n1-oficiais")?.classList.toggle("ativa", nivel1 === "oficiais");
    document.getElementById("conq-btn-n1-campanha")?.classList.toggle("ativa", nivel1 === "campanha");
    document.getElementById("conq-btn-n1-secretas")?.classList.toggle("ativa", nivel1 === "secretas");

    const acoesWrap = document.getElementById("conq-acoes-campanha-wrap");
    if (acoesWrap) {
        acoesWrap.style.display = (nivel1 === "campanha") ? "flex" : "none";
    }

    const btnEquipe = document.getElementById("conq-btn-n2-equipe");
    if (btnEquipe) {
        btnEquipe.style.display = (nivel1 === "secretas") ? "none" : "";
    }
    if (nivel1 === "secretas" && conqNivel2Ativo === "equipe") {
        conqNivel2Ativo = "individual";
        document.getElementById("conq-btn-n2-individual")?.classList.add("ativa");
        document.getElementById("conq-btn-n2-equipe")?.classList.remove("ativa");
    }

    renderizarListaConquistas();
}

function alternarNivel2Conquistas(nivel2) {
    if (conqNivel1Ativo === "secretas" && nivel2 === "equipe") {
        return;
    }
    conqNivel2Ativo = nivel2;
    document.getElementById("conq-btn-n2-individual")?.classList.toggle("ativa", nivel2 === "individual");
    document.getElementById("conq-btn-n2-equipe")?.classList.toggle("ativa", nivel2 === "equipe");

    renderizarListaConquistas();
}

function buscarConquistas(termo) {
    conqTermoBusca = (termo || "").toLowerCase().trim();
    renderizarListaConquistas();
}

function renderizarListaConquistas() {
    const grid = document.getElementById("conq-lista-grid");
    if (!grid) return;

    // A aba de SECRETAS só aparece se tiver sido desbloqueada via duplo clique na logo
    const btnSecretas = document.getElementById("conq-btn-n1-secretas");
    if (btnSecretas) {
        btnSecretas.style.display = conquistasSecretasDesbloqueadas ? "inline-flex" : "none";
    }
    if (!conquistasSecretasDesbloqueadas && conqNivel1Ativo === "secretas") {
        conqNivel1Ativo = "oficiais";
        document.getElementById("conq-btn-n1-oficiais")?.classList.add("ativa");
        document.getElementById("conq-btn-n1-secretas")?.classList.remove("ativa");
    }

    let listaBase = CONQUISTAS_OFICIAIS;
    if (conqNivel1Ativo === "campanha") {
        listaBase = conquistasCampanha;
    } else if (conqNivel1Ativo === "secretas") {
        listaBase = CONQUISTAS_SECRETAS;
    }

    const listaFiltrada = listaBase.filter(c => {
        if (conqNivel1Ativo !== "secretas") {
            const bateSub = (c.nivel2 === conqNivel2Ativo);
            if (!bateSub) return false;
        }
        if (!conqTermoBusca) return true;
        return c.titulo.toLowerCase().includes(conqTermoBusca) || (c.desc || "").toLowerCase().includes(conqTermoBusca);
    });

    const qtdOficiais = CONQUISTAS_OFICIAIS.length;
    const qtdCampanha = conquistasCampanha.length;
    const qtdSecretas = CONQUISTAS_SECRETAS.length;
    const badgeN1Ofic = document.getElementById("conq-badge-n1-oficiais");
    const badgeN1Camp = document.getElementById("conq-badge-n1-campanha");
    const badgeN1Secr = document.getElementById("conq-badge-n1-secretas");
    if (badgeN1Ofic) badgeN1Ofic.textContent = String(qtdOficiais);
    if (badgeN1Camp) badgeN1Camp.textContent = String(qtdCampanha);
    if (badgeN1Secr) badgeN1Secr.textContent = String(qtdSecretas);

    const qtdSubInd = listaBase.filter(c => c.nivel2 === "individual").length;
    const qtdSubEq = listaBase.filter(c => c.nivel2 === "equipe").length;
    const badgeSubInd = document.getElementById("conq-badge-n2-individual");
    const badgeSubEq = document.getElementById("conq-badge-n2-equipe");
    if (badgeSubInd) badgeSubInd.textContent = String(qtdSubInd);
    if (badgeSubEq) badgeSubEq.textContent = String(qtdSubEq);

    const todasExistentes = [
        ...CONQUISTAS_OFICIAIS,
        ...conquistasCampanha,
        ...(conquistasSecretasDesbloqueadas ? CONQUISTAS_SECRETAS : [])
    ];
    const totalExistentes = todasExistentes.length;
    let totalDesbloqueadas = 0;
    let somaPontos = 0;

    todasExistentes.forEach(c => {
        if (conquistasDesbloqueadas.has(c.id)) {
            totalDesbloqueadas++;
            if (c.nivel1 !== "secretas") {
                somaPontos += (parseInt(c.pontos, 10) || 0);
            }
        }
    });

    const pct = totalExistentes > 0 ? Math.round((totalDesbloqueadas / totalExistentes) * 100) : 0;
    
    const elQtdDesb = document.getElementById("conq-hud-qtd-desbloqueadas");
    const elQtdTot = document.getElementById("conq-hud-qtd-total");
    const elPct = document.getElementById("conq-hud-pct");
    const elFill = document.getElementById("conq-hud-barra-fill");
    const elPts = document.getElementById("conq-hud-pontos-totais");

    if (elQtdDesb) elQtdDesb.textContent = String(totalDesbloqueadas);
    if (elQtdTot) elQtdTot.textContent = String(totalExistentes);
    if (elPct) elPct.textContent = pct + "%";
    if (elFill) elFill.style.width = pct + "%";
    if (elPts) elPts.textContent = String(somaPontos);

    if (listaFiltrada.length === 0) {
        if (conqNivel1Ativo === "campanha" && conquistasCampanha.length === 0) {
            grid.innerHTML = `
                <div class="conq-vazio-box" style="grid-column: 1 / -1;">
                    <span class="conq-vazio-icone">⚔️</span>
                    <div style="font-weight:600; font-size:15px; margin-bottom:4px;">Nenhuma conquista de campanha criada ainda</div>
                    <p style="margin-bottom:12px;">Como Mestre do RPG, você pode criar conquistas exclusivas da sua aventura ou importar uma biblioteca pronta fornecida pelo seu Mestre.</p>
                    <button type="button" class="btn-secundario" onclick="abrirModalNovaConquistaCampanha()">➕ Criar Primeira Conquista</button>
                </div>
            `;
        } else if (conqNivel1Ativo === "secretas") {
            grid.innerHTML = `
                <div class="conq-vazio-box" style="grid-column: 1 / -1;">
                    <span class="conq-vazio-icone">🔮</span>
                    <div style="font-weight:600; font-size:15px; margin-bottom:4px;">Aba de Conquistas Secretas</div>
                    <p style="margin-bottom:12px;">Todos os segredos e easter eggs descobertos no site serão catalogados aqui.</p>
                </div>
            `;
        } else {
            grid.innerHTML = `
                <div class="conq-vazio-box" style="grid-column: 1 / -1;">
                    <span class="conq-vazio-icone">🔍</span>
                    <div>Nenhuma conquista encontrada para os filtros selecionados.</div>
                </div>
            `;
        }
        return;
    }

    grid.innerHTML = "";
    listaFiltrada.forEach(c => {
        const estaDesbloqueada = conquistasDesbloqueadas.has(c.id);
        const ehSecreta = (c.nivel1 === "secretas");
        const card = document.createElement("div");
        card.id = "conq-card-" + c.id;
        card.setAttribute("data-conq-id", c.id);
        card.className = "conq-card" + (ehSecreta ? " conq-secreta" : "") + (estaDesbloqueada ? " desbloqueada" : " bloqueada");
        if (!ehSecreta) {
            card.onclick = () => alternarDesbloqueioConquista(c.id);
        } else {
            card.style.cursor = "default";
        }

        const checkEl = document.createElement("div");
        checkEl.className = "conq-card-check";
        checkEl.innerHTML = estaDesbloqueada ? "✓" : "";

        const iconeBox = document.createElement("div");
        iconeBox.className = "conq-card-icone";
        iconeBox.textContent = c.icone || (ehSecreta ? "👁️" : "🏆");

        const corpo = document.createElement("div");
        corpo.className = "conq-card-corpo";

        const topoRow = document.createElement("div");
        topoRow.className = "conq-card-topo-row";

        const tituloEl = document.createElement("h3");
        tituloEl.className = "conq-card-titulo";
        tituloEl.textContent = c.titulo;

        topoRow.appendChild(tituloEl);

        if (!ehSecreta) {
            const ptsBadge = document.createElement("span");
            ptsBadge.className = "conq-card-pts";
            ptsBadge.textContent = "+" + (c.pontos || 0) + " pts";
            topoRow.appendChild(ptsBadge);
        } else {
            const tagSec = document.createElement("span");
            tagSec.className = "conq-tag secreta";
            tagSec.textContent = "EASTER EGG";
            topoRow.appendChild(tagSec);
        }

        const descEl = document.createElement("p");
        descEl.className = "conq-card-desc";
        descEl.textContent = c.desc || "";

        const rodapeRow = document.createElement("div");
        rodapeRow.className = "conq-card-rodape-row";

        const statusTag = document.createElement("span");
        statusTag.className = "conq-card-status-tag" + (ehSecreta ? " secreta" : "");
        if (ehSecreta) {
            statusTag.textContent = estaDesbloqueada ? "✨ Revelada" : "🔮 Oculta";
        } else {
            statusTag.textContent = estaDesbloqueada ? "✓ Desbloqueada" : "🔒 Bloqueada";
        }

        rodapeRow.appendChild(statusTag);

        if (conqNivel1Ativo === "campanha") {
            const btnsCamp = document.createElement("div");
            btnsCamp.style.display = "flex";
            btnsCamp.style.gap = "6px";

            const btnExcluir = document.createElement("button");
            btnExcluir.type = "button";
            btnExcluir.style.cssText = "background:transparent; border:none; color:var(--accent-dim); cursor:pointer; font-size:12px; padding:2px 4px;";
            btnExcluir.innerHTML = "🗑️ Excluir";
            btnExcluir.onclick = (e) => {
                e.stopPropagation();
                excluirConquistaCampanha(c.id);
            };
            btnsCamp.appendChild(btnExcluir);
            rodapeRow.appendChild(btnsCamp);
        }

        corpo.append(topoRow, descEl, rodapeRow);
        card.append(checkEl, iconeBox, corpo);

        if (ehSecreta && !estaDesbloqueada) {
            let timerSegurar = null;
            let segurando = false;

            const iniciarSegurar = (e) => {
                if (e.button !== undefined && e.button !== 0) return;
                segurando = true;
                card.classList.remove("descricao-revelada");
                card.classList.add("segurando-revelacao");

                timerSegurar = setTimeout(() => {
                    if (!segurando) return;
                    card.classList.add("descricao-revelada");

                    if (typeof tocarEfeitoSonoro === "function") {
                        tocarEfeitoSonoro({ tipo: "misterio" }, 15, 1);
                    } else if (typeof tocarSom === "function") {
                        tocarSom("conquista");
                    }
                }, 5000);
            };

            const cancelarSegurar = () => {
                if (!segurando && !timerSegurar) return;
                segurando = false;
                if (timerSegurar) {
                    clearTimeout(timerSegurar);
                    timerSegurar = null;
                }
                card.classList.remove("segurando-revelacao");
                card.classList.remove("descricao-revelada");
            };

            card.addEventListener("pointerdown", iniciarSegurar);
            card.addEventListener("pointerup", cancelarSegurar);
            card.addEventListener("pointerleave", cancelarSegurar);
            card.addEventListener("pointercancel", cancelarSegurar);
            card.addEventListener("contextmenu", (e) => {
                e.preventDefault();
            });
        }

        grid.appendChild(card);
    });
}

function alternarDesbloqueioConquista(id) {
    if (id.startsWith("sec_") || CONQUISTAS_SECRETAS.some(c => c.id === id)) {
        return; // Conquistas secretas não podem ser bloqueadas
    }
    const estavaDesbloqueada = conquistasDesbloqueadas.has(id);
    if (estavaDesbloqueada) {
        conquistasDesbloqueadas.delete(id);
    } else {
        conquistasDesbloqueadas.add(id);
        if (typeof somAtivado !== "undefined" && somAtivado) {
            tocarSom("vitoria");
        }
    }
    renderizarListaConquistas();
    marcarAlteracaoFeita();

    // Se acabou de ser desbloqueada e há campanha conectada
    if (!estavaDesbloqueada) {
        const c = [...CONQUISTAS_OFICIAIS, ...conquistasCampanha].find(item => item.id === id);
        if (c) {
            if (typeof exibirToastConquista === "function") {
                exibirToastConquista(c, c.nivel2 === "equipe" ? "🤝 FEITO DE EQUIPE DESBLOQUEADO!" : "🌟 CONQUISTA DESBLOQUEADA!");
            }
            if (c.nivel2 === "equipe") {
                if (typeof transmitirDesbloqueioEquipeCampanha === "function") {
                    transmitirDesbloqueioEquipeCampanha(c);
                }
            } else {
                if (typeof transmitirConquistaIndividualCampanha === "function") {
                    transmitirConquistaIndividualCampanha(c);
                }
            }
        }
    } else {
        if (typeof sincronizarEstadoComCampanha === "function") {
            sincronizarEstadoComCampanha();
        }
    }
}

function abrirModalNovaConquistaCampanha() {
    modalConqCampanhaEmEdicaoId = null;
    document.getElementById("modal-conq-form-titulo").innerHTML = "<span>⚔️</span> Nova Conquista de Campanha";
    document.getElementById("conq_form_titulo").value = "";
    document.getElementById("conq_form_icone").value = "⚔️";
    document.getElementById("conq_form_categoria").value = conqNivel2Ativo;
    document.getElementById("conq_form_pontos").value = "50";
    document.getElementById("conq_form_descricao").value = "";

    const modal = document.getElementById("modal-conquista-campanha");
    if (modal) {
        modal.style.display = "flex";
        requestAnimationFrame(() => modal.classList.add("aberto"));
    }
}

function fecharModalConquistaCampanha() {
    const modal = document.getElementById("modal-conquista-campanha");
    if (!modal) return;
    modal.classList.remove("aberto");
    setTimeout(() => { modal.style.display = "none"; }, 200);
}

function fecharModalConquistaCampanhaPorOverlay(e) {
    if (e.target === document.getElementById("modal-conquista-campanha")) {
        fecharModalConquistaCampanha();
    }
}

function salvarConquistaCampanha() {
    const titulo = (document.getElementById("conq_form_titulo")?.value || "").trim();
    if (!titulo) {
        mostrarStatus("✗ Digite o título da conquista.", "erro");
        document.getElementById("conq_form_titulo")?.focus();
        return;
    }

    const icone = (document.getElementById("conq_form_icone")?.value || "⚔️").trim();
    const categoria = document.getElementById("conq_form_categoria")?.value || "individual";
    const pontos = Math.max(0, parseInt(document.getElementById("conq_form_pontos")?.value, 10) || 0);
    const desc = (document.getElementById("conq_form_descricao")?.value || "").trim();

    const novaConq = {
        id: "camp_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
        nivel1: "campanha",
        nivel2: categoria,
        icone,
        titulo,
        pontos,
        desc
    };

    conquistasCampanha.push(novaConq);
    fecharModalConquistaCampanha();
    renderizarListaConquistas();
    marcarAlteracaoFeita();
    mostrarStatus(`✓ Conquista de campanha "${titulo}" criada com sucesso!`, "ok");
}

function excluirConquistaCampanha(id) {
    const item = conquistasCampanha.find(c => c.id === id);
    if (!item) return;

    abrirModalConfirmacao({
        titulo: "Excluir Conquista",
        icone: "🗑️",
        mensagem: `Tem certeza que deseja excluir a conquista de campanha <strong>"${escapeHTML(item.titulo)}"</strong>?`,
        rotuloConfirmar: "Sim, Excluir",
        aoConfirmar: () => {
            conquistasCampanha = conquistasCampanha.filter(c => c.id !== id);
            conquistasDesbloqueadas.delete(id);
            renderizarListaConquistas();
            marcarAlteracaoFeita();
            mostrarStatus("✓ Conquista removida da campanha.", "ok");
        }
    });
}

function exportarBibliotecaConquistasCampanha() {
    modalCodigoConqModo = "exportar";
    document.getElementById("modal-conq-codigo-sub").textContent = "WE'RE STRANGERS • MESTRE DA CAMPANHA";
    document.getElementById("modal-conq-codigo-titulo").innerHTML = "<span>📤</span> Exportar Biblioteca de Conquistas";
    document.getElementById("modal-conq-codigo-instrucao").innerHTML = "Copie o código gerado abaixo para que os jogadores possam importar todas as conquistas da sua campanha nas fichas deles:";
    
    const codeData = {
        tipo: "WAS_CONQUISTAS_CAMPANHA",
        v: 1,
        conquistas: conquistasCampanha
    };

    const codeStr = "WAS_CONQ:" + btoa(unescape(encodeURIComponent(JSON.stringify(codeData))));
    const textarea = document.getElementById("conq_codigo_textarea");
    if (textarea) {
        textarea.value = codeStr;
        textarea.readOnly = true;
    }
    document.getElementById("btn-modal-conq-codigo-acao").textContent = "Copiar Código";

    const modal = document.getElementById("modal-conquistas-codigo");
    if (modal) {
        modal.style.display = "flex";
        requestAnimationFrame(() => modal.classList.add("aberto"));
    }
}

function abrirModalImportarConquistasCampanha() {
    modalCodigoConqModo = "importar";
    document.getElementById("modal-conq-codigo-sub").textContent = "WE'RE STRANGERS • JOGADOR DA CAMPANHA";
    document.getElementById("modal-conq-codigo-titulo").innerHTML = "<span>📥</span> Importar Conquistas da Campanha";
    document.getElementById("modal-conq-codigo-instrucao").innerHTML = "Cole abaixo o código de biblioteca enviado pelo seu Mestre do RPG para carregar as conquistas da campanha na sua ficha:";
    
    const textarea = document.getElementById("conq_codigo_textarea");
    if (textarea) {
        textarea.value = "";
        textarea.readOnly = false;
        textarea.placeholder = "Cole aqui o código enviado pelo seu Mestre (WAS_CONQ:...)...";
    }
    document.getElementById("btn-modal-conq-codigo-acao").textContent = "Importar Conquistas";

    const modal = document.getElementById("modal-conquistas-codigo");
    if (modal) {
        modal.style.display = "flex";
        requestAnimationFrame(() => modal.classList.add("aberto"));
    }
}

function fecharModalConquistasCodigo() {
    const modal = document.getElementById("modal-conquistas-codigo");
    if (!modal) return;
    modal.classList.remove("aberto");
    setTimeout(() => { modal.style.display = "none"; }, 200);
}

function fecharModalConquistasCodigoPorOverlay(e) {
    if (e.target === document.getElementById("modal-conquistas-codigo")) {
        fecharModalConquistasCodigo();
    }
}

function executarAcaoModalCodigoConquistas() {
    const textarea = document.getElementById("conq_codigo_textarea");

    if (modalCodigoConqModo === "exportar") {
        if (textarea && textarea.value) {
            try {
                navigator.clipboard.writeText(textarea.value);
                mostrarStatus("✓ Código de conquistas copiado!", "ok");
            } catch(e) {
                textarea.select();
                document.execCommand("copy");
                mostrarStatus("✓ Código copiado!", "ok");
            }
        }
        fecharModalConquistasCodigo();
    } else {
        const bruto = (textarea?.value || "").trim();
        if (!bruto) {
            mostrarStatus("✗ Cole o código enviado pelo Mestre.", "erro");
            return;
        }

        try {
            let jsonStr = "";
            if (bruto.startsWith("WAS_CONQ:")) {
                const b64 = bruto.replace("WAS_CONQ:", "");
                jsonStr = decodeURIComponent(escape(atob(b64)));
            } else {
                jsonStr = bruto;
            }

            const data = JSON.parse(jsonStr);
            if (!data || !Array.isArray(data.conquistas)) {
                throw new Error("Formato inválido");
            }

            const idsExistentes = new Set(conquistasCampanha.map(c => c.id));
            let adicionadosCount = 0;

            data.conquistas.forEach(c => {
                if (c && c.titulo && !idsExistentes.has(c.id)) {
                    conquistasCampanha.push(c);
                    adicionadosCount++;
                }
            });

            conqNivel1Ativo = "campanha";
            renderizarListaConquistas();
            marcarAlteracaoFeita();
            fecharModalConquistasCodigo();
            mostrarStatus(`✓ ${adicionadosCount} conquistas de campanha importadas com sucesso!`, "ok");
        } catch(err) {
            console.error("Erro ao importar conquistas:", err);
            mostrarStatus("✗ Código de conquistas inválido ou corrompido.", "erro");
        }
    }
}

// ==========================================
// GERENCIADOR DE ABAS PRINCIPAIS (HashRouter) & CONTROLE DE NAVEGADOR
// ==========================================
const ABAS_PRINCIPAIS_VALIDAS = ['ficha', 'pericias', 'tatico', 'inventario', 'conquistas', 'campanhas'];
const ABAS_RESTRITAS_OUTRO_NAVEGADOR = ['pericias', 'tatico', 'inventario', 'conquistas'];
let abaPrincipalAtiva = 'ficha';

function obterIdNavegadorLocal() {
    let id = "";
    try {
        id = localStorage.getItem("we_are_strangers_navegador_id");
        if (!id) {
            id = "was_nav_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
            localStorage.setItem("we_are_strangers_navegador_id", id);
        }
    } catch(e) {
        id = "was_nav_padrao";
    }
    return id;
}

function podeAcessarAbasRestritas() {
    if (typeof fichaCriadaNesteNavegador !== "undefined" && fichaCriadaNesteNavegador) return true;
    if (typeof isMestreCampanha !== "undefined" && isMestreCampanha && typeof salaCampanhaAtiva !== "undefined" && salaCampanhaAtiva) {
        return true;
    }
    return false;
}

function atualizarBloqueioAbasNavegadorUI() {
    const podeAcessar = podeAcessarAbasRestritas();
    ABAS_RESTRITAS_OUTRO_NAVEGADOR.forEach(idAba => {
        const btn = document.getElementById('tab-btn-' + idAba);
        if (btn) {
            if (!podeAcessar) {
                btn.classList.add('aba-bloqueada-outro-navegador');
                btn.setAttribute('title', '🔒 Acesso Restrito: Em outro navegador, esta aba só pode ser visualizada pelo Mestre da sala online.');
            } else {
                btn.classList.remove('aba-bloqueada-outro-navegador');
                btn.removeAttribute('title');
            }
        }
    });

    if (!podeAcessar && ABAS_RESTRITAS_OUTRO_NAVEGADOR.includes(abaPrincipalAtiva)) {
        alternarAba('ficha', true);
    }
}

function alternarAba(abaId, atualizarHash = true){
    if (ABAS_RESTRITAS_OUTRO_NAVEGADOR.includes(abaId) && !podeAcessarAbasRestritas()) {
        mostrarStatus("🔒 Acesso Restrito: Em outro navegador, Perícias, Modo Tático, Inventário e Conquistas só podem ser visualizadas pelo Mestre da sala online.", "aviso");
        abaId = 'ficha';
    } else if(!ABAS_PRINCIPAIS_VALIDAS.includes(abaId)){
        abaId = 'ficha';
    }

    abaPrincipalAtiva = abaId;

    ABAS_PRINCIPAIS_VALIDAS.forEach(id => {
        const btn = document.getElementById('tab-btn-' + id);
        const painel = document.getElementById('aba-painel-' + id);
        const ativa = (id === abaId);

        if(btn){
            btn.classList.toggle('ativa', ativa);
            btn.setAttribute('aria-selected', ativa ? 'true' : 'false');
            btn.tabIndex = ativa ? 0 : -1;
        }

        if(painel){
            if(ativa){
                painel.style.display = '';
                painel.classList.add('ativa');
            } else {
                painel.style.display = 'none';
                painel.classList.remove('ativa');
            }
        }
    });

    try {
        localStorage.setItem('we_are_strangers_aba_ativa', abaId);
    } catch(e) {}

    if(atualizarHash){
        const hashAlvo = '#' + abaId;
        if(window.location.hash !== hashAlvo){
            if(window.history && window.history.replaceState){
                window.history.replaceState(null, '', hashAlvo);
            } else {
                window.location.hash = hashAlvo;
            }
        }
    }

    if(abaId === 'inventario'){
        atualizarInventarioUI();
    } else if(abaId === 'pericias'){
        atualizarPainel();
        if(typeof fecharPopupRolagemAtalho === 'function'){
            fecharPopupRolagemAtalho();
        }
    } else if(abaId === 'tatico'){
        atualizarModoTatico();
        if(typeof fecharPopupRolagemAtalho === 'function'){
            fecharPopupRolagemAtalho();
        }
    } else if(abaId === 'conquistas'){
        renderizarListaConquistas();
    } else if(abaId === 'campanhas'){
        if(typeof renderizarPainelCampanha === 'function'){
            renderizarPainelCampanha();
        }
    }

    if(typeof avaliarMusicaAtual === 'function'){
        avaliarMusicaAtual();
    }
}

function inicializarHashRouterAbas(){
    // 1. Escuta mudanças na Hash da URL (botão voltar/avançar do navegador e links diretos)
    window.addEventListener('hashchange', () => {
        const hash = (window.location.hash || '').replace('#', '').toLowerCase();
        if(ABAS_PRINCIPAIS_VALIDAS.includes(hash) && hash !== abaPrincipalAtiva){
            alternarAba(hash, false);
        }
    });

    // 2. Acessibilidade de Teclado (WAI-ARIA Tabs com setas Direita/Esquerda)
    const navAbas = document.getElementById('navegacao-principal-abas');
    if(navAbas){
        navAbas.addEventListener('keydown', (e) => {
            if(e.key === 'ArrowRight' || e.key === 'ArrowLeft'){
                e.preventDefault();
                const idxAtual = ABAS_PRINCIPAIS_VALIDAS.indexOf(abaPrincipalAtiva);
                let proximoIdx;
                if(e.key === 'ArrowRight'){
                    proximoIdx = (idxAtual + 1) % ABAS_PRINCIPAIS_VALIDAS.length;
                } else {
                    proximoIdx = (idxAtual - 1 + ABAS_PRINCIPAIS_VALIDAS.length) % ABAS_PRINCIPAIS_VALIDAS.length;
                }
                const proximaAba = ABAS_PRINCIPAIS_VALIDAS[proximoIdx];
                alternarAba(proximaAba, true);
                const btn = document.getElementById('tab-btn-' + proximaAba);
                if(btn) btn.focus();
            }
        });
    }

    // 3. Determina aba inicial (URL Hash > LocalStorage > Default 'ficha')
    let abaInicial = 'ficha';
    const hashInicial = (window.location.hash || '').replace('#', '').toLowerCase();
    if(ABAS_PRINCIPAIS_VALIDAS.includes(hashInicial)){
        abaInicial = hashInicial;
    } else {
        try {
            const salva = localStorage.getItem('we_are_strangers_aba_ativa');
            if(salva && ABAS_PRINCIPAIS_VALIDAS.includes(salva)){
                abaInicial = salva;
            }
        } catch(e) {}
    }

    alternarAba(abaInicial, true);
}

/* ============================================================
   MÓDULO DE ATALHOS DE TECLADO PARA ROLAGEM DE PERÍCIAS (1-9)
   ============================================================ */
function escapeHTML(str) {
    if (!str && str !== 0) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const ATALHOS_PADRAO = {
    "1": "Luta",
    "2": "Pontaria",
    "3": "Reflexo",
    "4": "Rijeza",
    "5": "Cirurgia",
    "6": "Furtividade",
    "7": "Tática",
    "8": "Empatia",
    "9": "Diplomacia"
};

let atalhosTecladoConfig = { ...ATALHOS_PADRAO };

function carregarConfigAtalhos() {
    try {
        const salvo = localStorage.getItem("we_are_strangers_atalhos_teclado");
        if (salvo) {
            const parsed = JSON.parse(salvo);
            if (parsed && typeof parsed === "object") {
                atalhosTecladoConfig = { ...ATALHOS_PADRAO, ...parsed };
            }
        }
    } catch (e) {
        console.warn("Aviso ao carregar atalhos de teclado:", e);
    }
}

function salvarConfigAtalhos() {
    try {
        localStorage.setItem("we_are_strangers_atalhos_teclado", JSON.stringify(atalhosTecladoConfig));
    } catch (e) {
        console.warn("Aviso ao salvar atalhos de teclado:", e);
    }
}

function renderizarBarraAtalhosCabecalho() {
    const container = document.getElementById("cabecalho-atalhos-bar");
    if (!container) return;

    let html = "";
    for (let i = 1; i <= 9; i++) {
        const key = String(i);
        const nomePericia = atalhosTecladoConfig[key] || "";
        const rotulo = nomePericia ? nomePericia : "Livre";
        const titleText = nomePericia ? `Tecla [${key}]: Rolar ${nomePericia}` : `Tecla [${key}]: Nenhum atalho definido`;

        html += `
            <div class="atalho-chip ${!nomePericia ? 'atalho-vazio' : ''}" id="atalho-chip-${key}" onclick="executarRolagemAtalho('${key}', '${escapeHTML(nomePericia)}')" title="${escapeHTML(titleText)}">
                <span class="atalho-chip-tecla">${key}</span>
                <span class="atalho-chip-nome">${escapeHTML(rotulo)}</span>
            </div>
        `;
    }
    container.innerHTML = html;
}

function executarRolagemAtalho(tecla, nomePericia) {
    // Registra acionamento do atalho para o segredo do Trenzinho de luz (ordem crescente 1 a 9)
    if (typeof registrarCliqueAtalhoTrenzinho === "function") {
        registrarCliqueAtalhoTrenzinho(tecla);
    }

    if (!nomePericia || nomePericia === "Nenhuma" || nomePericia === "Livre") {
        const chip = document.getElementById(`atalho-chip-${tecla}`);
        if (chip) {
            chip.classList.add("atalho-disparado");
            setTimeout(() => chip.classList.remove("atalho-disparado"), 400);
        }
        mostrarStatus(`⚡ Tecla [${tecla}]: Nenhum atalho configurado. Clique em "⚙️ Personalizar" para definir.`, "");
        return;
    }

    const pericia = encontrarPericia(nomePericia);
    if (!pericia) {
        mostrarStatus(`⚡ Tecla [${tecla}]: Perícia "${nomePericia}" não foi encontrada.`, "erro");
        return;
    }

    // Executa a rolagem oficial do sistema
    const rollInfo = rolar(nomePericia);
    if (!rollInfo) return;

    // Feedback visual do atalho acionado no chip da barra de atalhos
    const chip = document.getElementById(`atalho-chip-${tecla}`);
    if (chip) {
        chip.classList.add("atalho-disparado");
        setTimeout(() => chip.classList.remove("atalho-disparado"), 400);
    }

    // Verifica a aba atual:
    // Se estiver na aba "perícias", mantém a visualização clássica com scroll até a perícia
    // Se estiver em QUALQUER OUTRA ABA, NÃO alterna de aba! Exibe a pop-up flutuante no canto inferior direito
    const naAbaPericias = (typeof abaPrincipalAtiva !== "undefined" && abaPrincipalAtiva === "pericias");

    if (naAbaPericias) {
        const id = idSeguro(nomePericia);
        const painelResultado = document.getElementById("d_" + id);
        if (painelResultado) {
            painelResultado.open = true;
            painelResultado.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
        fecharPopupRolagemAtalho();
        mostrarStatus(`⚡ Atalho [${tecla}]: Rolou ${nomePericia}!`, "ok");
    } else {
        exibirPopupRolagemAtalho(rollInfo, tecla, nomePericia);
        mostrarStatus(`⚡ Atalho [${tecla}]: Rolou ${nomePericia}! (Resultado no pop-up inferior direito)`, "ok");
    }
}

function exibirPopupRolagemAtalho(rollInfo, tecla, nomePericia) {
    if (!rollInfo) return;

    const popup = document.getElementById("popup-atalho-rolagem");
    const container = document.getElementById("popup-atalho-card-conteudo");
    if (!popup || !container) return;

    const horario = rollInfo.itemHistorico ? rollInfo.itemHistorico.horario : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    container.innerHTML = `
        <div class="popup-atalho-cabecalho">
            <div class="popup-atalho-pericia-info">
                <span class="popup-atalho-key-badge">${escapeHTML(tecla)}</span>
                <span class="popup-atalho-titulo">${escapeHTML(nomePericia)}</span>
                <span class="popup-atalho-horario">${escapeHTML(horario)}</span>
            </div>
            <button type="button" class="btn-fechar-popup-atalho" onclick="fecharPopupRolagemAtalho()" title="Fechar este resultado (Esc)" aria-label="Fechar resultado">✕</button>
        </div>
        <div class="popup-atalho-corpo">
            <div class="resultado-painel ${rollInfo.faixa.tipo}" style="margin: 0 0 10px 0;">
                ${typeof montarGalhosInvasores === "function" ? montarGalhosInvasores(rollInfo.faixa.tipo) : ""}
                <div class="resultado-painel-topo">
                    <span class="resultado-painel-linha"></span>
                    <span class="resultado-painel-titulo">RESULTADO DO TESTE</span>
                    <span class="resultado-painel-linha"></span>
                </div>
                <div class="resultado-painel-valor">${rollInfo.resultadoFinal}</div>
                <div class="resultado-painel-selo">
                    ${rollInfo.seloDificuldade}
                </div>
            </div>

            <details class="popup-detalhes-rolagem">
                <summary class="popup-detalhes-summary">
                    <span>Detalhes da rolagem</span>
                    <span class="resultado-resumo ${rollInfo.faixa.tipo}">→ ${rollInfo.resultadoFinal}</span>
                </summary>
                <div class="dados-conteudo" style="padding: 10px 12px;">
                    <div class="dados-etapa"><span class="dados-rotulo">1. Dados rolados (${rollInfo.principal})</span><div class="dados-lista">${rollInfo.linhaQtd}</div></div>
                    <div class="dados-etapa"><span class="dados-rotulo">2. Resultado dos D6</span><div class="dados-lista">${rollInfo.linhaDados}</div></div>
                    ${rollInfo.temAux ? `<div class="dados-etapa"><span class="dados-rotulo">${rollInfo.passoAux}. Atributo(s) Auxiliar(es)</span><div class="dados-lista">${rollInfo.linhaAux}</div></div>` : ""}
                    <div class="dados-etapa">
                        <span class="dados-rotulo">${rollInfo.passoPontos}. Pontos de Perícia</span>
                        <div class="dados-pontos-grid">
                            <div class="ponto-item"><span class="ponto-nome">Puros:</span> <span class="ponto-val">+${rollInfo.puros}</span></div>
                            <div class="ponto-item"><span class="ponto-nome">Bônus:</span> <span class="ponto-val">${rollInfo.bonusFormatado}</span></div>
                            <div class="ponto-item"><span class="ponto-nome">Relacionados:</span> <span class="ponto-val">+${rollInfo.relacionados}</span></div>
                        </div>
                        <div class="dados-soma-pontos">Soma dos Pontos = <strong class="dados-destaque">${rollInfo.totalPontosFormatado}</strong></div>
                    </div>
                </div>
            </details>
        </div>
        <div class="popup-atalho-rodape">
            <span class="popup-atalho-gravado-tag">✓ Adicionado ao Histórico</span>
            <button type="button" class="btn-popup-ver-historico" onclick="abrirModalHistorico()">
                📜 Ver Histórico
            </button>
        </div>
    `;

    popup.style.display = "flex";
    void popup.offsetWidth;
    popup.classList.add("aberto");
    popup.setAttribute("aria-hidden", "false");
}

function fecharPopupRolagemAtalho() {
    const popup = document.getElementById("popup-atalho-rolagem");
    if (!popup) return;
    popup.classList.remove("aberto");
    popup.setAttribute("aria-hidden", "true");
    setTimeout(() => {
        if (!popup.classList.contains("aberto")) {
            popup.style.display = "none";
        }
    }, 240);
}

function inicializarAtalhosTeclado() {
    carregarConfigAtalhos();
    renderizarBarraAtalhosCabecalho();

    document.addEventListener("keydown", function (e) {
        const target = e.target;
        if (!target) return;

        // Ignora se estiver focado em campos de formulários ou editáveis
        const tag = target.tagName ? target.tagName.toUpperCase() : "";
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
            return;
        }

        // Tecla ESC fecha pop-up de rolagem ou modais se abertos
        if (e.key === "Escape") {
            const popupAtalho = document.getElementById("popup-atalho-rolagem");
            if (popupAtalho && popupAtalho.classList.contains("aberto")) {
                fecharPopupRolagemAtalho();
                return;
            }
            const modalAtalhos = document.getElementById("modal-config-atalhos");
            if (modalAtalhos && modalAtalhos.style.display !== "none") {
                fecharModalConfigAtalhos();
                return;
            }
            const modalTipografia = document.getElementById("modal-config-tipografia");
            if (modalTipografia && modalTipografia.style.display !== "none") {
                fecharModalTipografias();
                return;
            }
            const modalMusica = document.getElementById("modal-config-musica");
            if (modalMusica && modalMusica.style.display !== "none") {
                fecharModalMusica();
                return;
            }
        }

        // Ignora atalhos de sistema com Ctrl, Alt ou Meta
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        // Captura teclas 1 a 9
        if (e.key >= "1" && e.key <= "9") {
            const nomePericia = atalhosTecladoConfig[e.key];
            e.preventDefault();
            executarRolagemAtalho(e.key, nomePericia);
        }
    });
}

function obterListaTodasPericias() {
    const base = typeof pericias !== "undefined" ? pericias : [];
    const cust = typeof personalizadas !== "undefined" ? personalizadas : [];
    const uniao = base.concat(cust);
    return uniao.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

function abrirModalConfigAtalhos() {
    atualizarUIConfigAtalhos();
    const modal = document.getElementById("modal-config-atalhos");
    if (modal) {
        modal.style.display = "flex";
        requestAnimationFrame(() => modal.classList.add("aberto"));
        modal.setAttribute("aria-hidden", "false");
    }
}

function fecharModalConfigAtalhos() {
    const modal = document.getElementById("modal-config-atalhos");
    if (modal) {
        modal.classList.remove("aberto");
        modal.setAttribute("aria-hidden", "true");
        setTimeout(() => { modal.style.display = "none"; }, 200);
    }
}

function fecharModalConfigAtalhosPorOverlay(event) {
    if (event.target && event.target.id === "modal-config-atalhos") {
        fecharModalConfigAtalhos();
    }
}

function atualizarUIConfigAtalhos() {
    const grid = document.getElementById("atalhos-grid-config");
    if (!grid) return;

    const todasPericias = obterListaTodasPericias();

    let html = "";
    for (let i = 1; i <= 9; i++) {
        const key = String(i);
        const periciaAtual = atalhosTecladoConfig[key] || "";

        let opcoesHTML = `<option value="">-- Nenhuma Perícia --</option>`;
        todasPericias.forEach(p => {
            const sel = (p.nome === periciaAtual) ? "selected" : "";
            opcoesHTML += `<option value="${escapeHTML(p.nome)}" ${sel}>${escapeHTML(p.nome)} (${escapeHTML(p.categoria)})</option>`;
        });

        html += `
            <div class="atalho-row-item" id="atalho-row-${key}">
                <div class="atalho-key-badge">
                    <span class="key-numero">${key}</span>
                </div>
                <div class="atalho-select-wrap">
                    <select class="atalho-select-pericia" onchange="salvarAtalhoIndividual('${key}', this.value, this)">
                        ${opcoesHTML}
                    </select>
                </div>
                <button type="button" class="btn-testar-atalho" id="btn-testar-atalho-${key}" onclick="executarRolagemAtalho('${key}', atalhosTecladoConfig['${key}'])" ${!periciaAtual ? "disabled" : ""} title="Testar rolagem com a tecla [${key}]">
                    🎲 Rolar
                </button>
            </div>
        `;
    }
    grid.innerHTML = html;
}

function salvarAtalhoIndividual(key, nomePericia, selectEl) {
    atalhosTecladoConfig[key] = nomePericia;
    salvarConfigAtalhos();
    renderizarBarraAtalhosCabecalho();
    marcarAlteracaoFeita();

    // Atualiza o botão de teste individualmente para não destruir o DOM do select
    const btnTestar = document.getElementById(`btn-testar-atalho-${key}`);
    if (btnTestar) {
        if (nomePericia) {
            btnTestar.disabled = false;
            btnTestar.onclick = () => executarRolagemAtalho(key, nomePericia);
        } else {
            btnTestar.disabled = true;
            btnTestar.onclick = null;
        }
    }

    if (nomePericia) {
        mostrarStatus(`⚡ Tecla [${key}] associada a: ${nomePericia}.`, "ok");
    } else {
        mostrarStatus(`⚡ Tecla [${key}] desvinculada.`, "");
    }
}

function restaurarAtalhosPadrao() {
    atalhosTecladoConfig = { ...ATALHOS_PADRAO };
    salvarConfigAtalhos();
    renderizarBarraAtalhosCabecalho();
    atualizarUIConfigAtalhos();
    marcarAlteracaoFeita();
    mostrarStatus("✓ Atalhos de teclado (1-9) restaurados para o padrão.", "ok");
}

// ==========================================
// MÓDULO: PERSONALIZAÇÃO DE TIPOGRAFIAS (.TTF)
// ==========================================

let fontesPersonalizadas = {
    mirage: null,     // { nome: string, dados: dataUrl }
    oldEurope: null,  // { nome: string, dados: dataUrl }
    texto: null       // { nome: string, dados: dataUrl }
};

function obterEstadoTipografiasParaSalvar() {
    return {
        mirage: fontesPersonalizadas.mirage ? { nome: fontesPersonalizadas.mirage.nome, dados: fontesPersonalizadas.mirage.dados } : null,
        oldEurope: fontesPersonalizadas.oldEurope ? { nome: fontesPersonalizadas.oldEurope.nome, dados: fontesPersonalizadas.oldEurope.dados } : null,
        texto: fontesPersonalizadas.texto ? { nome: fontesPersonalizadas.texto.nome, dados: fontesPersonalizadas.texto.dados } : null
    };
}

function aplicarTipografiasDoEstado(estado) {
    if (estado && estado.tipografia && typeof estado.tipografia === "object") {
        fontesPersonalizadas = {
            mirage: estado.tipografia.mirage || null,
            oldEurope: estado.tipografia.oldEurope || null,
            texto: estado.tipografia.texto || null
        };
        aplicarFontesPersonalizadas();
    } else if (estado && estado.fontesPersonalizadas && typeof estado.fontesPersonalizadas === "object") {
        fontesPersonalizadas = {
            mirage: estado.fontesPersonalizadas.mirage || null,
            oldEurope: estado.fontesPersonalizadas.oldEurope || null,
            texto: estado.fontesPersonalizadas.texto || null
        };
        aplicarFontesPersonalizadas();
    } else {
        carregarTipografiaGlobal();
        aplicarFontesPersonalizadas();
    }
}

async function aplicarFontesPersonalizadas() {
    let tagEstilo = document.getElementById("estilo-fontes-personalizadas");
    if (!tagEstilo) {
        tagEstilo = document.createElement("style");
        tagEstilo.id = "estilo-fontes-personalizadas";
        document.head.appendChild(tagEstilo);
    }

    let css = "";

    // 1. Mirage Final
    if (fontesPersonalizadas.mirage && fontesPersonalizadas.mirage.dados) {
        css += `
@font-face {
  font-family: 'MirageFinal';
  src: url("${fontesPersonalizadas.mirage.dados}") format('truetype');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Mirage final';
  src: url("${fontesPersonalizadas.mirage.dados}") format('truetype');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
`;
        try {
            const ff1 = new FontFace('MirageFinal', `url("${fontesPersonalizadas.mirage.dados}")`);
            const ff2 = new FontFace('Mirage final', `url("${fontesPersonalizadas.mirage.dados}")`);
            await Promise.allSettled([ff1.load(), ff2.load()]);
            document.fonts.add(ff1);
            document.fonts.add(ff2);
        } catch(e) { console.warn("FontFace MirageFinal:", e); }
    } else {
        try {
            for (const f of Array.from(document.fonts)) {
                if (f.family === 'MirageFinal' || f.family === '"MirageFinal"' || f.family === 'Mirage final' || f.family === '"Mirage final"') {
                    document.fonts.delete(f);
                }
            }
        } catch(e) {}
    }

    // 2. Old Europe
    if (fontesPersonalizadas.oldEurope && fontesPersonalizadas.oldEurope.dados) {
        css += `
@font-face {
  font-family: 'Old Europe';
  src: url("${fontesPersonalizadas.oldEurope.dados}") format('truetype');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
`;
        try {
            const ff = new FontFace('Old Europe', `url("${fontesPersonalizadas.oldEurope.dados}")`);
            await ff.load();
            document.fonts.add(ff);
        } catch(e) { console.warn("FontFace Old Europe:", e); }
    } else {
        try {
            for (const f of Array.from(document.fonts)) {
                if (f.family === 'Old Europe' || f.family === '"Old Europe"') {
                    document.fonts.delete(f);
                }
            }
        } catch(e) {}
    }

    // 3. EB Garamond (Texto Geral)
    if (fontesPersonalizadas.texto && fontesPersonalizadas.texto.dados) {
        css += `
@font-face {
  font-family: 'EB Garamond';
  src: url("${fontesPersonalizadas.texto.dados}") format('truetype');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
`;
        try {
            const ff = new FontFace('EB Garamond', `url("${fontesPersonalizadas.texto.dados}")`);
            await ff.load();
            document.fonts.add(ff);
        } catch(e) { console.warn("FontFace EB Garamond:", e); }
    } else {
        try {
            for (const f of Array.from(document.fonts)) {
                if (f.family === 'EB Garamond' || f.family === '"EB Garamond"') {
                    document.fonts.delete(f);
                }
            }
        } catch(e) {}
    }

    tagEstilo.textContent = css;
    atualizarBotaoCabecalhoTipografia();
    atualizarUIModalTipografias();
    if (typeof verificarGatilhoEsqueleBros === "function") {
        verificarGatilhoEsqueleBros();
    }
}

function processarUploadFonte(slot, event) {
    const input = event.target;
    if (!input.files || input.files.length === 0) return;
    const arquivo = input.files[0];
    const nome = arquivo.name || "";

    if (!nome.toLowerCase().endsWith(".ttf")) {
        mostrarStatus("✗ Arquivo inválido. Selecione um arquivo de fonte TrueType (.ttf).", "erro");
        input.value = "";
        return;
    }

    if (arquivo.size > 12 * 1024 * 1024) {
        mostrarStatus("✗ Arquivo muito extenso (>12MB). Escolha um arquivo .ttf menor.", "erro");
        input.value = "";
        return;
    }

    mostrarStatus("Lendo arquivo de fonte " + nome + "...", "");
    const leitor = new FileReader();
    leitor.onload = async (e) => {
        try {
            const dataUrl = e.target.result;
            if (!dataUrl || typeof dataUrl !== "string") {
                throw new Error("Falha ao ler dados da fonte.");
            }

            if (slot === "todas") {
                fontesPersonalizadas.mirage = { nome, dados: dataUrl };
                fontesPersonalizadas.oldEurope = { nome, dados: dataUrl };
                fontesPersonalizadas.texto = { nome, dados: dataUrl };
            } else {
                fontesPersonalizadas[slot] = { nome, dados: dataUrl };
            }

            await aplicarFontesPersonalizadas();
            marcarAlteracaoFeita();
            salvarTipografiaGlobal();

            const slotNome = slot === "todas" ? "todas as tipografias" : (slot === "mirage" ? "Mirage Final" : (slot === "oldEurope" ? "Old Europe" : "EB Garamond (Texto)"));
            mostrarStatus(`✓ Fonte "${nome}" aplicada a ${slotNome}!`, "ok");
        } catch (err) {
            console.error("Erro ao aplicar fonte:", err);
            mostrarStatus("✗ Erro ao processar fonte .ttf: " + (err.message || "arquivo corrompido"), "erro");
        } finally {
            input.value = "";
        }
    };
    leitor.onerror = () => {
        mostrarStatus("✗ Não foi possível ler o arquivo .ttf.", "erro");
        input.value = "";
    };
    leitor.readAsDataURL(arquivo);
}

async function restaurarFonteIndividual(slot) {
    if (fontesPersonalizadas[slot]) {
        fontesPersonalizadas[slot] = null;
        await aplicarFontesPersonalizadas();
        marcarAlteracaoFeita();
        salvarTipografiaGlobal();
        const nomeSlot = slot === "mirage" ? "Mirage Final" : (slot === "oldEurope" ? "Old Europe" : "EB Garamond (Texto)");
        mostrarStatus(`✓ ${nomeSlot} restaurada para o padrão original.`, "ok");
    }
}

async function restaurarTodasFontesPadrao() {
    fontesPersonalizadas = { mirage: null, oldEurope: null, texto: null };
    await aplicarFontesPersonalizadas();
    marcarAlteracaoFeita();
    salvarTipografiaGlobal();
    mostrarStatus("✓ Todas as tipografias foram restauradas para o padrão.", "ok");
}

function salvarTipografiaGlobal() {
    try {
        const temAlguma = fontesPersonalizadas.mirage || fontesPersonalizadas.oldEurope || fontesPersonalizadas.texto;
        if (temAlguma) {
            localStorage.setItem("we_are_strangers_tipografias", JSON.stringify(fontesPersonalizadas));
        } else {
            localStorage.removeItem("we_are_strangers_tipografias");
        }
        if (typeof verificarGatilhoEsqueleBros === "function") {
            verificarGatilhoEsqueleBros();
        }
    } catch(e) {
        console.warn("Aviso ao salvar tipografia global:", e);
    }
}

function carregarTipografiaGlobal() {
    try {
        const salvo = localStorage.getItem("we_are_strangers_tipografias");
        if (salvo) {
            const parsed = JSON.parse(salvo);
            if (parsed && typeof parsed === "object") {
                fontesPersonalizadas = {
                    mirage: parsed.mirage || null,
                    oldEurope: parsed.oldEurope || null,
                    texto: parsed.texto || null
                };
            }
        }
    } catch(e) {
        console.warn("Aviso ao carregar tipografia global:", e);
    }
}

function abrirModalTipografias() {
    if (typeof fecharMenuCabecalho === "function") fecharMenuCabecalho();
    atualizarUIModalTipografias();
    const modal = document.getElementById("modal-config-tipografia");
    if (modal) {
        modal.style.display = "flex";
        requestAnimationFrame(() => modal.classList.add("aberto"));
        modal.setAttribute("aria-hidden", "false");
    }
}

function fecharModalTipografias() {
    const modal = document.getElementById("modal-config-tipografia");
    if (modal) {
        modal.classList.remove("aberto");
        modal.setAttribute("aria-hidden", "true");
        setTimeout(() => { modal.style.display = "none"; }, 200);
    }
}

function fecharModalTipografiasPorOverlay(event) {
    if (event.target && event.target.id === "modal-config-tipografia") {
        fecharModalTipografias();
    }
}

function atualizarUIModalTipografias() {
    const slots = [
        { id: "mirage", nome: "Mirage Final" },
        { id: "oldEurope", nome: "Old Europe" },
        { id: "texto", nome: "EB Garamond" }
    ];

    slots.forEach(slot => {
        const dado = fontesPersonalizadas[slot.id];
        const badge = document.getElementById(`badge-status-${slot.id}`);
        const btnRestaurar = document.getElementById(`btn-restaurar-${slot.id}`);

        if (badge) {
            if (dado && dado.nome) {
                badge.textContent = `Personalizada: ${dado.nome}`;
                badge.classList.add("personalizada");
                badge.title = dado.nome;
            } else {
                badge.textContent = "Padrão";
                badge.classList.remove("personalizada");
                badge.title = "Fonte padrão original do sistema";
            }
        }

        if (btnRestaurar) {
            btnRestaurar.disabled = !dado;
        }
    });

    atualizarBotaoCabecalhoTipografia();
}

function atualizarBotaoCabecalhoTipografia() {
    const btn = document.getElementById("btn-abrir-modal-fontes");
    const legenda = document.getElementById("legenda_tipografia_btn");
    if (!btn || !legenda) return;

    let count = 0;
    if (fontesPersonalizadas.mirage) count++;
    if (fontesPersonalizadas.oldEurope) count++;
    if (fontesPersonalizadas.texto) count++;

    if (count > 0) {
        btn.classList.add("com-personalizacao");
        legenda.textContent = `Fontes (${count}/3)`;
        btn.title = `${count} tipografia(s) personalizada(s) ativa(s). Clique para gerenciar.`;
    } else {
        btn.classList.remove("com-personalizacao");
        legenda.textContent = "Fontes .ttf";
        btn.title = "Alterar fontes (Mirage Final, Old Europe e Texto Geral) importando arquivo .ttf";
    }
}

function inicializarTipografias() {
    carregarTipografiaGlobal();
    aplicarFontesPersonalizadas();
    atualizarBotaoCabecalhoTipografia();
}

// ============================================================
// MÓDULO DE IDENTIDADE SECRETA / FICHA ESCONDIDA (DISFARCE)
// ============================================================
let identidadeSecretaAtiva = false;
let identidadeSecretaDados = {
    ativa: false,
    identidade: "Agente Oculto",
    nomeSocial: "",
    codinome: "Codinome Disfarçado",
    temNomeSocial: false,
    temCodinome: true,
    trocarPorCodinome: true,
    titulo: "",
    nivel: "MISERÁVEL",
    classe1: "",
    classe2: "",
    avatar: "",
    cor: "#8e44ad",
    contornoAtivo: true,
    contornoCor: "#ffffff",
    atributos: {
        HPR: 1,
        PRX: 1,
        PSI: 1,
        QI: 1
    },
    recursos: {
        vida: { atual: 100, max: 100, temp: 0 },
        estamina: { atual: 80, max: 80, temp: 0 },
        mental: { atual: 50, max: 50, temp: 0 },
        aura: { atual: 30, max: 30, temp: 0 }
    }
};

let identidadeRealDados = null;
let codigoIdentidadeSecreta = "";
let sessaoIdentidadeSecretaDesbloqueada = false;

function carregarCodigoIdentidadeSecreta() {
    try {
        const salvo = localStorage.getItem("ws_identidade_secreta_codigo");
        if (salvo) codigoIdentidadeSecreta = salvo;
    } catch (e) {}
}
carregarCodigoIdentidadeSecreta();

function salvarCodigoIdentidadeSecretaLocal(cod) {
    codigoIdentidadeSecreta = cod || "";
    try {
        if (codigoIdentidadeSecreta) {
            localStorage.setItem("ws_identidade_secreta_codigo", codigoIdentidadeSecreta);
        } else {
            localStorage.removeItem("ws_identidade_secreta_codigo");
        }
    } catch (e) {}
}

let pendenteQueimaDeArquivoIdentidade = false;
let novaSenhaIdentidade = "";
let ehCriacaoIdentidadeSecreta = false;
let acaoAposSenhaIdentidade = "abrir_modal"; // "abrir_modal" ou "alternar_direto"

function abrirModalIdentidadeSecreta() {
    if (typeof fecharMenuCabecalho === "function") fecharMenuCabecalho();

    if (!codigoIdentidadeSecreta) {
        carregarCodigoIdentidadeSecreta();
    }

    // Exige que o jogador insira a senha para abrir o painel de gerenciamento
    sessaoIdentidadeSecretaDesbloqueada = false;
    acaoAposSenhaIdentidade = "abrir_modal";
    abrirModalSenhaIdentidadeSecreta();
}

function alternarIdentidadeSecretaComSenha() {
    if (!codigoIdentidadeSecreta) {
        carregarCodigoIdentidadeSecreta();
    }

    sessaoIdentidadeSecretaDesbloqueada = false;
    acaoAposSenhaIdentidade = "alternar_direto";
    abrirModalSenhaIdentidadeSecreta();
}

function executarEfeitoTransicaoVisualDisfarce(ativando) {
    const modal = document.getElementById("modal-identidade-secreta");
    if (!modal) return;
    const janela = modal.querySelector(".modal-historico-janela");

    // Remove classes anteriores de transição
    modal.classList.remove("transicao-ativando", "transicao-desativando");
    if (janela) {
        const scanAntiga = janela.querySelector(".disfarce-onda-varredura");
        if (scanAntiga) scanAntiga.remove();
    }

    // Força reflow para reiniciar animações CSS
    void modal.offsetWidth;

    if (ativando) {
        modal.classList.add("transicao-ativando", "disfarce-ativo-visual");
    } else {
        modal.classList.add("transicao-desativando");
        modal.classList.remove("disfarce-ativo-visual");
    }

    // Adiciona feixe holográfico de varredura no painel
    if (janela) {
        const scan = document.createElement("div");
        scan.className = "disfarce-onda-varredura";
        janela.appendChild(scan);
        setTimeout(() => {
            if (scan && scan.parentNode) scan.remove();
        }, 850);
    }

    setTimeout(() => {
        modal.classList.remove("transicao-ativando", "transicao-desativando");
        if (identidadeSecretaAtiva) {
            modal.classList.add("disfarce-ativo-visual");
        } else {
            modal.classList.remove("disfarce-ativo-visual");
        }
    }, 780);
}

function exibirModalIdentidadeSecretaJanela() {
    popularmodalIdentidadeSecretaInputs();
    const modal = document.getElementById("modal-identidade-secreta");
    if (modal) {
        if (identidadeSecretaAtiva) {
            modal.classList.add("disfarce-ativo-visual");
        } else {
            modal.classList.remove("disfarce-ativo-visual");
        }
        modal.style.display = "flex";
        requestAnimationFrame(() => modal.classList.add("aberto"));
        modal.setAttribute("aria-hidden", "false");
    }
}

function fecharModalIdentidadeSecreta() {
    sessaoIdentidadeSecretaDesbloqueada = false;
    pendenteQueimaDeArquivoIdentidade = false;
    novaSenhaIdentidade = "";
    ehCriacaoIdentidadeSecreta = false;
    const modal = document.getElementById("modal-identidade-secreta");
    if (modal) {
        modal.classList.remove("aberto");
        modal.setAttribute("aria-hidden", "true");
        setTimeout(() => { modal.style.display = "none"; }, 200);
    }
}

function fecharModalIdentidadeSecretaPorOverlay(event) {
    if (event.target && event.target.id === "modal-identidade-secreta") {
        fecharModalIdentidadeSecreta();
    }
}

// ============================================================
// MODAL ÚNICO DE SENHA (DENEGAÇÃO PLAUSÍVEL ABSOLUTA)
// ============================================================
function abrirModalSenhaIdentidadeSecreta() {
    const modal = document.getElementById("modal-segredo-senha-unica");
    const input = document.getElementById("input_senha_identidade_secreta");
    const err = document.getElementById("erro_senha_identidade_secreta");
    if (input) input.value = "";
    if (err) { err.style.display = "none"; err.textContent = ""; }
    if (modal) {
        modal.style.display = "flex";
        requestAnimationFrame(() => modal.classList.add("aberto"));
        modal.setAttribute("aria-hidden", "false");
        setTimeout(() => input?.focus(), 150);
    }
}

function fecharModalSenhaIdentidadeSecreta() {
    const modal = document.getElementById("modal-segredo-senha-unica");
    if (modal) {
        modal.classList.remove("aberto");
        modal.setAttribute("aria-hidden", "true");
        setTimeout(() => { modal.style.display = "none"; }, 200);
    }
}

function fecharModalSenhaIdentidadeSecretaPorOverlay(event) {
    if (event.target && event.target.id === "modal-segredo-senha-unica") {
        fecharModalSenhaIdentidadeSecreta();
    }
}

function processarSenhaIdentidadeSecreta() {
    const input = document.getElementById("input_senha_identidade_secreta");
    const err = document.getElementById("erro_senha_identidade_secreta");
    const senha = (input?.value || "").trim();

    if (!senha) {
        if (err) {
            err.textContent = "Por favor, digite uma senha para continuar.";
            err.style.display = "block";
        }
        input?.focus();
        return;
    }

    if (!codigoIdentidadeSecreta) {
        carregarCodigoIdentidadeSecreta();
    }

    // Caso 1: Nenhuma senha salva no navegador -> Criação da Identidade Secreta
    if (!codigoIdentidadeSecreta) {
        ehCriacaoIdentidadeSecreta = true;
        novaSenhaIdentidade = senha;
        pendenteQueimaDeArquivoIdentidade = false;
        sessaoIdentidadeSecretaDesbloqueada = true;
        fecharModalSenhaIdentidadeSecreta();
        exibirModalIdentidadeSecretaJanela();
        return;
    }

    // Caso 2: Senha correta digitada
    if (senha === codigoIdentidadeSecreta) {
        ehCriacaoIdentidadeSecreta = false;
        pendenteQueimaDeArquivoIdentidade = false;
        sessaoIdentidadeSecretaDesbloqueada = true;
        fichaCriadaNesteNavegador = true;
        fecharModalSenhaIdentidadeSecreta();

        if (acaoAposSenhaIdentidade === "alternar_direto") {
            // Se já tiver dados configurados, alterna direto entre verdadeira e falsa
            alternarEstadoAtivoDisfarce();
        } else {
            if (typeof mostrarStatus === "function") {
                mostrarStatus("🔓 Identidade Secreta autenticada com sucesso!", "ok");
            }
            exibirModalIdentidadeSecretaJanela();
        }
        return;
    }

    // Caso 3: Senha incorreta digitada
    if (acaoAposSenhaIdentidade === "alternar_direto") {
        // No Modo Tático: Apenas avisa que a senha está incorreta sem criar nova ficha nem queimar arquivo
        if (err) {
            err.textContent = "Senha incorreta.";
            err.style.display = "block";
        }
        if (typeof mostrarStatus === "function") {
            mostrarStatus("Senha incorreta.", "erro");
        }
        if (input) {
            input.select();
            input.focus();
        }
        return;
    }

    // No Menu Principal / Modal: JOGADA DE MESTRE / CHEQUE-MATE (DENEGAÇÃO PLAUSÍVEL ORIGINAL)
    // Não revelamos que a senha está incorreta para evitar vazamento da existência de segredo.
    // Simulamos a criação de um disfarce para esta nova senha e preparamos a substituição da ficha.
    ehCriacaoIdentidadeSecreta = false;
    pendenteQueimaDeArquivoIdentidade = true;
    novaSenhaIdentidade = senha;
    sessaoIdentidadeSecretaDesbloqueada = true;
    fecharModalSenhaIdentidadeSecreta();

    limparFormularioParaNovoDisfarce();
    exibirModalIdentidadeSecretaJanela();
}

function limparFormularioParaNovoDisfarce() {
    const elId = document.getElementById("secreto_identidade");
    if (elId) elId.value = "Agente Oculto";
    const elSocial = document.getElementById("secreto_nome_social");
    if (elSocial) elSocial.value = "";
    const elTit = document.getElementById("secreto_titulo");
    if (elTit) elTit.value = "";
    const elNivel = document.getElementById("secreto_nivel");
    if (elNivel) elNivel.value = "MISERÁVEL";
    const elC1 = document.getElementById("secreto_classe1");
    if (elC1) elC1.value = "";
    const elC2 = document.getElementById("secreto_classe2");
    if (elC2) elC2.value = "";
    const elCor = document.getElementById("secreto_cor");
    if (elCor) elCor.value = "#8e44ad";
    const elContCor = document.getElementById("secreto_contorno_cor");
    if (elContCor) elContCor.value = "#ffffff";
    const elContChk = document.getElementById("secreto_contorno_ativo");
    if (elContChk) elContChk.checked = true;

    ["HPR", "PRX", "PSI", "QI"].forEach(attr => {
        const el = document.getElementById("secreto_attr_" + attr);
        if (el) el.value = 1;
    });

    const vAtual = document.getElementById("secreto_vida_atual");
    if (vAtual) vAtual.value = 100;
    const vMax = document.getElementById("secreto_vida_max");
    if (vMax) vMax.value = 100;
    const eAtual = document.getElementById("secreto_estamina_atual");
    if (eAtual) eAtual.value = 80;
    const eMax = document.getElementById("secreto_estamina_max");
    if (eMax) eMax.value = 80;
    const mAtual = document.getElementById("secreto_mental_atual");
    if (mAtual) mAtual.value = 50;
    const mMax = document.getElementById("secreto_mental_max");
    if (mMax) mMax.value = 50;
    const aAtual = document.getElementById("secreto_aura_atual");
    if (aAtual) aAtual.value = 30;
    const aMax = document.getElementById("secreto_aura_max");
    if (aMax) aMax.value = 30;

    const imgAvatar = document.getElementById("secreto_avatar_preview");
    if (imgAvatar) imgAvatar.src = "";
    const phAvatar = document.getElementById("secreto_avatar_placeholder");
    if (phAvatar) phAvatar.style.display = "flex";
}

// ============================================================
// MODAL DE BACKUP OBRIGATÓRIO E OPSEC
// ============================================================
function abrirModalBackupOpsec(senhaParaExibir) {
    const modal = document.getElementById("modal-segredo-backup-opsec");
    const campoSenha = document.getElementById("opsec_campo_senha_exibicao");
    if (campoSenha) {
        campoSenha.value = senhaParaExibir || codigoIdentidadeSecreta || "";
    }
    atualizarUIOpsecSalvamento();
    if (modal) {
        modal.style.display = "flex";
        requestAnimationFrame(() => modal.classList.add("aberto"));
        modal.setAttribute("aria-hidden", "false");
    }
}

function fecharModalBackupOpsec() {
    const modal = document.getElementById("modal-segredo-backup-opsec");
    if (modal) {
        modal.classList.remove("aberto");
        modal.setAttribute("aria-hidden", "true");
        setTimeout(() => { modal.style.display = "none"; }, 200);
    }
}

function fecharModalBackupOpsecPorOverlay(event) {
    if (event.target && event.target.id === "modal-segredo-backup-opsec") {
        fecharModalBackupOpsec();
    }
}

function copiarSenhaSecretaOpsec() {
    const campo = document.getElementById("opsec_campo_senha_exibicao");
    const senha = (campo?.value || codigoIdentidadeSecreta || "").trim();
    if (!senha) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(senha).then(() => {
            mostrarStatus("📋 Senha copiada! Guarde-a em local oculto do seu computador.", "ok");
        }).catch(() => {
            campo?.select();
            document.execCommand("copy");
            mostrarStatus("📋 Senha copiada!", "ok");
        });
    } else {
        campo?.select();
        document.execCommand("copy");
        mostrarStatus("📋 Senha copiada!", "ok");
    }
}

function exportarBackupSecretoIdentidade() {
    exportarJSON();
    if (typeof mostrarStatus === "function") {
        mostrarStatus("✓ Backup secreto exportado! Guarde-o ESCONDIDO nos seus arquivos.", "ok");
    }
}

function atualizarUIOpsecSalvamento() {
    const tag = document.getElementById("opsec_status_salvamento_tag");
    const btn = document.getElementById("btn_alternar_salvamento_opsec");
    if (salvamentoManualAtivo) {
        if (tag) {
            tag.textContent = "Manual (Recomendado/Seguro)";
            tag.style.background = "rgba(34, 197, 94, 0.2)";
            tag.style.color = "#4ade80";
        }
        if (btn) {
            btn.textContent = "✓ Salvamento Automático Desativado (Modo Seguro)";
            btn.style.color = "#4ade80";
        }
    } else {
        if (tag) {
            tag.textContent = "Automático Ativo";
            tag.style.background = "rgba(239, 68, 68, 0.2)";
            tag.style.color = "#f87171";
        }
        if (btn) {
            btn.textContent = "⚡ Desativar Salvamento Automático Agora";
            btn.style.color = "var(--ink)";
        }
    }
}

function alternarSalvamentoModoOpsec() {
    alternarModoSalvamentoManual();
    atualizarUIOpsecSalvamento();
}

function aplicarDisfarceComoFichaVerdadeira() {
    const d = identidadeSecretaDados;
    if (d) {
        if (d.identidade && document.getElementById("ficha_identidade")) {
            document.getElementById("ficha_identidade").value = d.identidade;
        }
        if (document.getElementById("ficha_nome_social")) {
            document.getElementById("ficha_nome_social").value = d.nomeSocial || "";
        }
        if (document.getElementById("ficha_titulo")) {
            document.getElementById("ficha_titulo").value = d.titulo || "";
        }
        if (d.avatar) {
            avatarAtual = d.avatar;
            if (typeof aplicarAvatar === "function") aplicarAvatar();
        }
        if (d.nivel && document.getElementById("ficha_nivel")) {
            document.getElementById("ficha_nivel").value = d.nivel;
        }
        if (d.classe1 && document.getElementById("ficha_classe1")) {
            document.getElementById("ficha_classe1").value = d.classe1;
        }
        if (d.classe2 && document.getElementById("ficha_classe2")) {
            document.getElementById("ficha_classe2").value = d.classe2;
        }
        if (d.cor) {
            if (document.getElementById("ficha_cor")) document.getElementById("ficha_cor").value = d.cor;
            if (typeof definirCorPrincipal === "function") definirCorPrincipal(d.cor, false);
        }
        if (d.contornoCor) {
            if (document.getElementById("ficha_contorno_cor")) document.getElementById("ficha_contorno_cor").value = d.contornoCor;
            if (typeof definirCorContorno === "function") definirCorContorno(d.contornoCor, false);
        }
        if (typeof alternarContornoLetras === "function") alternarContornoLetras(!!d.contornoAtivo, false);

        if (d.atributos) {
            if (document.getElementById("attr_HPR")) document.getElementById("attr_HPR").value = d.atributos.HPR ?? 1;
            if (document.getElementById("attr_PRX")) document.getElementById("attr_PRX").value = d.atributos.PRX ?? 1;
            if (document.getElementById("attr_PSI")) document.getElementById("attr_PSI").value = d.atributos.PSI ?? 1;
            if (document.getElementById("attr_QI"))  document.getElementById("attr_QI").value  = d.atributos.QI ?? 1;
            if (typeof atualizarPainel === "function") atualizarPainel();
        }
    }
    // A verdadeira identidade original é EXCLUÍDA do navegador
    identidadeRealDados = null;
    try {
        const salvo = localStorage.getItem("we_are_strangers_fichas");
        if (salvo) {
            let lista = JSON.parse(salvo);
            if (Array.isArray(lista) && typeof fichaId !== "undefined" && fichaId) {
                const idx = lista.findIndex(f => f.id === fichaId);
                if (idx !== -1) {
                    lista[idx].identidadeRealDados = null;
                    if (d && d.identidade) lista[idx].nome = d.identidade;
                    localStorage.setItem("we_are_strangers_fichas", JSON.stringify(lista));
                }
            }
        }
    } catch(e) {}
}

function bloquearAcessoIdentidadeSecreta() {
    sessaoIdentidadeSecretaDesbloqueada = false;
    fecharModalIdentidadeSecreta();
    if (typeof mostrarStatus === "function") {
        mostrarStatus("🔒 Identidade Secreta bloqueada novamente.", "info");
    }
}

function obterValoresReaisPersonagem() {
    if (identidadeSecretaAtiva && identidadeRealDados) {
        return {
            atributos: {
                HPR: identidadeRealDados.atributos?.HPR ?? (parseInt(document.getElementById("attr_HPR")?.value, 10) || 1),
                PRX: identidadeRealDados.atributos?.PRX ?? (parseInt(document.getElementById("attr_PRX")?.value, 10) || 1),
                PSI: identidadeRealDados.atributos?.PSI ?? (parseInt(document.getElementById("attr_PSI")?.value, 10) || 1),
                QI:  identidadeRealDados.atributos?.QI  ?? (parseInt(document.getElementById("attr_QI")?.value, 10) || 1)
            },
            recursos: {
                vida: {
                    atual: identidadeRealDados.recursos?.vida?.atual ?? (parseInt(document.getElementById("recurso_vida_atual")?.value, 10) || 100),
                    max:   identidadeRealDados.recursos?.vida?.max   ?? (parseInt(document.getElementById("recurso_vida_max")?.value, 10) || 100),
                    temp:  identidadeRealDados.recursos?.vida?.temp  ?? (parseInt(document.getElementById("recurso_vida_temp")?.value, 10) || 0)
                },
                estamina: {
                    atual: identidadeRealDados.recursos?.estamina?.atual ?? (parseInt(document.getElementById("recurso_estamina_atual")?.value, 10) || 80),
                    max:   identidadeRealDados.recursos?.estamina?.max   ?? (parseInt(document.getElementById("recurso_estamina_max")?.value, 10) || 80),
                    temp:  identidadeRealDados.recursos?.estamina?.temp  ?? (parseInt(document.getElementById("recurso_estamina_temp")?.value, 10) || 0)
                },
                mental: {
                    atual: identidadeRealDados.recursos?.mental?.atual ?? (parseInt(document.getElementById("recurso_mental_atual")?.value, 10) || 50),
                    max:   identidadeRealDados.recursos?.mental?.max   ?? (parseInt(document.getElementById("recurso_mental_max")?.value, 10) || 50),
                    temp:  identidadeRealDados.recursos?.mental?.temp  ?? (parseInt(document.getElementById("recurso_mental_temp")?.value, 10) || 0)
                },
                aura: {
                    atual: identidadeRealDados.recursos?.aura?.atual ?? (parseInt(document.getElementById("recurso_aura_atual")?.value, 10) || 30),
                    max:   identidadeRealDados.recursos?.aura?.max   ?? (parseInt(document.getElementById("recurso_aura_max")?.value, 10) || 30),
                    temp:  identidadeRealDados.recursos?.aura?.temp  ?? (parseInt(document.getElementById("recurso_aura_temp")?.value, 10) || 0)
                }
            }
        };
    }
    return {
        atributos: {
            HPR: parseInt(document.getElementById("attr_HPR")?.value, 10) || 1,
            PRX: parseInt(document.getElementById("attr_PRX")?.value, 10) || 1,
            PSI: parseInt(document.getElementById("attr_PSI")?.value, 10) || 1,
            QI:  parseInt(document.getElementById("attr_QI")?.value, 10) || 1
        },
        recursos: {
            vida: {
                atual: parseInt(document.getElementById("recurso_vida_atual")?.value, 10) || 100,
                max:   parseInt(document.getElementById("recurso_vida_max")?.value, 10) || 100,
                temp:  parseInt(document.getElementById("recurso_vida_temp")?.value, 10) || 0
            },
            estamina: {
                atual: parseInt(document.getElementById("recurso_estamina_atual")?.value, 10) || 80,
                max:   parseInt(document.getElementById("recurso_estamina_max")?.value, 10) || 80,
                temp:  parseInt(document.getElementById("recurso_estamina_temp")?.value, 10) || 0
            },
            mental: {
                atual: parseInt(document.getElementById("recurso_mental_atual")?.value, 10) || 50,
                max:   parseInt(document.getElementById("recurso_mental_max")?.value, 10) || 50,
                temp:  parseInt(document.getElementById("recurso_mental_temp")?.value, 10) || 0
            },
            aura: {
                atual: parseInt(document.getElementById("recurso_aura_atual")?.value, 10) || 30,
                max:   parseInt(document.getElementById("recurso_aura_max")?.value, 10) || 30,
                temp:  parseInt(document.getElementById("recurso_aura_temp")?.value, 10) || 0
            }
        }
    };
}

function validarLimitePontoDisfarce(inputEl, chaveTipo) {
    if (!inputEl) return;
    const reais = obterValoresReaisPersonagem();
    let maxPermitido = 999999;
    let nomeCampo = "ponto";

    switch(chaveTipo) {
        case 'attr_HPR': maxPermitido = reais.atributos.HPR; nomeCampo = "HPR"; break;
        case 'attr_PRX': maxPermitido = reais.atributos.PRX; nomeCampo = "PRX"; break;
        case 'attr_PSI': maxPermitido = reais.atributos.PSI; nomeCampo = "PSI"; break;
        case 'attr_QI':  maxPermitido = reais.atributos.QI;  nomeCampo = "QI"; break;
        case 'recurso_vida_max': maxPermitido = reais.recursos.vida.max; nomeCampo = "Vida Máxima"; break;
        case 'recurso_vida_atual': maxPermitido = reais.recursos.vida.max; nomeCampo = "Vida Atual"; break;
        case 'recurso_vida_temp': maxPermitido = Math.max(0, reais.recursos.vida.temp); nomeCampo = "Vida Temporária"; break;
        case 'recurso_estamina_max': maxPermitido = reais.recursos.estamina.max; nomeCampo = "Estamina Máxima"; break;
        case 'recurso_estamina_atual': maxPermitido = reais.recursos.estamina.max; nomeCampo = "Estamina Atual"; break;
        case 'recurso_estamina_temp': maxPermitido = Math.max(0, reais.recursos.estamina.temp); nomeCampo = "Estamina Temporária"; break;
        case 'recurso_mental_max': maxPermitido = reais.recursos.mental.max; nomeCampo = "Sanidade Máxima"; break;
        case 'recurso_mental_atual': maxPermitido = reais.recursos.mental.max; nomeCampo = "Sanidade Atual"; break;
        case 'recurso_mental_temp': maxPermitido = Math.max(0, reais.recursos.mental.temp); nomeCampo = "Sanidade Temporária"; break;
        case 'recurso_aura_max': maxPermitido = reais.recursos.aura.max; nomeCampo = "Aura Máxima"; break;
        case 'recurso_aura_atual': maxPermitido = reais.recursos.aura.max; nomeCampo = "Aura Atual"; break;
        case 'recurso_aura_temp': maxPermitido = Math.max(0, reais.recursos.aura.temp); nomeCampo = "Aura Temporária"; break;
    }

    let val = parseInt(inputEl.value, 10);
    if (isNaN(val) || val < 0) {
        val = 0;
    }
    if (val > maxPermitido) {
        inputEl.value = maxPermitido;
        if (typeof mostrarStatus === "function") {
            mostrarStatus(`⚠️ Regra do Disfarce: ${nomeCampo} falso limitado ao valor real (${maxPermitido})!`, "erro");
        }
    }
}

function popularmodalIdentidadeSecretaInputs() {
    const d = identidadeSecretaDados;
    const reais = obterValoresReaisPersonagem();

    if (document.getElementById("secreto_identidade")) document.getElementById("secreto_identidade").value = d.identidade || "";
    if (document.getElementById("secreto_nomeSocial")) document.getElementById("secreto_nomeSocial").value = d.nomeSocial || "";
    if (document.getElementById("secreto_titulo")) document.getElementById("secreto_titulo").value = d.titulo || "";
    if (document.getElementById("secreto_nivel")) document.getElementById("secreto_nivel").value = d.nivel || "";
    if (document.getElementById("secreto_classe1")) document.getElementById("secreto_classe1").value = d.classe1 || "";
    if (document.getElementById("secreto_classe2")) document.getElementById("secreto_classe2").value = d.classe2 || "";
    if (document.getElementById("secreto_cor")) document.getElementById("secreto_cor").value = d.cor || "#8e44ad";
    
    const chkCont = document.getElementById("secreto_contorno_ativo");
    if (chkCont) chkCont.checked = !!d.contornoAtivo;
    const colorCont = document.getElementById("secreto_contorno_cor");
    if (colorCont) colorCont.value = d.contornoCor || "#ffffff";

    // Avatar
    const imgEl = document.getElementById("secreto_avatar_img");
    const phEl = document.getElementById("secreto_avatar_placeholder");
    const btnRemover = document.getElementById("btn_remover_secreto_avatar");
    if (d.avatar) {
        if (imgEl) { imgEl.src = d.avatar; imgEl.style.display = "block"; }
        if (phEl) phEl.style.display = "none";
        if (btnRemover) btnRemover.style.display = "inline-block";
    } else {
        if (imgEl) { imgEl.src = ""; imgEl.style.display = "none"; }
        if (phEl) phEl.style.display = "block";
        if (btnRemover) btnRemover.style.display = "none";
    }

    // Atributos Falsos (limitados aos atributos reais)
    const attrHPR = document.getElementById("secreto_attr_HPR");
    const attrPRX = document.getElementById("secreto_attr_PRX");
    const attrPSI = document.getElementById("secreto_attr_PSI");
    const attrQI  = document.getElementById("secreto_attr_QI");

    if (attrHPR) {
        attrHPR.max = reais.atributos.HPR;
        attrHPR.value = Math.min(reais.atributos.HPR, d.atributos?.HPR ?? reais.atributos.HPR);
    }
    if (attrPRX) {
        attrPRX.max = reais.atributos.PRX;
        attrPRX.value = Math.min(reais.atributos.PRX, d.atributos?.PRX ?? reais.atributos.PRX);
    }
    if (attrPSI) {
        attrPSI.max = reais.atributos.PSI;
        attrPSI.value = Math.min(reais.atributos.PSI, d.atributos?.PSI ?? reais.atributos.PSI);
    }
    if (attrQI) {
        attrQI.max = reais.atributos.QI;
        attrQI.value = Math.min(reais.atributos.QI, d.atributos?.QI ?? reais.atributos.QI);
    }

    const rotHPR = document.getElementById("secreto_max_rotulo_HPR");
    if (rotHPR) rotHPR.textContent = `Real: ${reais.atributos.HPR}`;
    const rotPRX = document.getElementById("secreto_max_rotulo_PRX");
    if (rotPRX) rotPRX.textContent = `Real: ${reais.atributos.PRX}`;
    const rotPSI = document.getElementById("secreto_max_rotulo_PSI");
    if (rotPSI) rotPSI.textContent = `Real: ${reais.atributos.PSI}`;
    const rotQI = document.getElementById("secreto_max_rotulo_QI");
    if (rotQI) rotQI.textContent = `Real: ${reais.atributos.QI}`;

    // Recursos Falsos (limitados aos recursos reais)
    const dRec = d.recursos || {};
    
    const vAtual = document.getElementById("secreto_vida_atual");
    const vMax = document.getElementById("secreto_vida_max");
    const vTemp = document.getElementById("secreto_vida_temp");
    if (vMax) {
        vMax.max = reais.recursos.vida.max;
        vMax.value = Math.min(reais.recursos.vida.max, dRec.vida?.max ?? reais.recursos.vida.max);
    }
    if (vAtual) {
        vAtual.max = reais.recursos.vida.max;
        vAtual.value = Math.min(reais.recursos.vida.max, dRec.vida?.atual ?? reais.recursos.vida.atual);
    }
    if (vTemp) {
        vTemp.max = Math.max(0, reais.recursos.vida.temp);
        vTemp.value = Math.min(reais.recursos.vida.temp, dRec.vida?.temp ?? 0);
    }
    const rotVida = document.getElementById("secreto_max_rotulo_vida");
    if (rotVida) rotVida.textContent = `Real: ${reais.recursos.vida.max}`;

    const eAtual = document.getElementById("secreto_estamina_atual");
    const eMax = document.getElementById("secreto_estamina_max");
    const eTemp = document.getElementById("secreto_estamina_temp");
    if (eMax) {
        eMax.max = reais.recursos.estamina.max;
        eMax.value = Math.min(reais.recursos.estamina.max, dRec.estamina?.max ?? reais.recursos.estamina.max);
    }
    if (eAtual) {
        eAtual.max = reais.recursos.estamina.max;
        eAtual.value = Math.min(reais.recursos.estamina.max, dRec.estamina?.atual ?? reais.recursos.estamina.atual);
    }
    if (eTemp) {
        eTemp.max = Math.max(0, reais.recursos.estamina.temp);
        eTemp.value = Math.min(reais.recursos.estamina.temp, dRec.estamina?.temp ?? 0);
    }
    const rotEstamina = document.getElementById("secreto_max_rotulo_estamina");
    if (rotEstamina) rotEstamina.textContent = `Real: ${reais.recursos.estamina.max}`;

    const mAtual = document.getElementById("secreto_mental_atual");
    const mMax = document.getElementById("secreto_mental_max");
    const mTemp = document.getElementById("secreto_mental_temp");
    if (mMax) {
        mMax.max = reais.recursos.mental.max;
        mMax.value = Math.min(reais.recursos.mental.max, dRec.mental?.max ?? reais.recursos.mental.max);
    }
    if (mAtual) {
        mAtual.max = reais.recursos.mental.max;
        mAtual.value = Math.min(reais.recursos.mental.max, dRec.mental?.atual ?? reais.recursos.mental.atual);
    }
    if (mTemp) {
        mTemp.max = Math.max(0, reais.recursos.mental.temp);
        mTemp.value = Math.min(reais.recursos.mental.temp, dRec.mental?.temp ?? 0);
    }
    const rotMental = document.getElementById("secreto_max_rotulo_mental");
    if (rotMental) rotMental.textContent = `Real: ${reais.recursos.mental.max}`;

    const aAtual = document.getElementById("secreto_aura_atual");
    const aMax = document.getElementById("secreto_aura_max");
    const aTemp = document.getElementById("secreto_aura_temp");
    if (aMax) {
        aMax.max = reais.recursos.aura.max;
        aMax.value = Math.min(reais.recursos.aura.max, dRec.aura?.max ?? reais.recursos.aura.max);
    }
    if (aAtual) {
        aAtual.max = reais.recursos.aura.max;
        aAtual.value = Math.min(reais.recursos.aura.max, dRec.aura?.atual ?? reais.recursos.aura.atual);
    }
    if (aTemp) {
        aTemp.max = Math.max(0, reais.recursos.aura.temp);
        aTemp.value = Math.min(reais.recursos.aura.temp, dRec.aura?.temp ?? 0);
    }
    const rotAura = document.getElementById("secreto_max_rotulo_aura");
    if (rotAura) rotAura.textContent = `Real: ${reais.recursos.aura.max}`;

    // Botão / Status Ativo no Modal
    const btnToggle = document.getElementById("btn_toggle_ativar_disfarce");
    const subtexto = document.getElementById("subtexto_status_disfarce");
    if (btnToggle) {
        if (!fichaCriadaNesteNavegador) {
            btnToggle.disabled = true;
            btnToggle.style.opacity = "0.6";
            btnToggle.style.cursor = "not-allowed";
            btnToggle.innerHTML = "🔒 Disfarce Permanente";
            btnToggle.style.background = "#8e44ad";
            btnToggle.style.borderColor = "#9b59b6";
            if (subtexto) subtexto.innerHTML = "<span style='color:#e0aaff;'>🔒 <strong>Ficha em outro navegador:</strong> A Identidade Secreta está fixada e não pode ser desativada aqui.</span>";
        } else if (identidadeSecretaAtiva) {
            btnToggle.disabled = false;
            btnToggle.style.opacity = "1";
            btnToggle.style.cursor = "pointer";
            btnToggle.innerHTML = "👤 Voltar para Identidade Real";
            btnToggle.style.background = "#e74c3c";
            btnToggle.style.borderColor = "#c0392b";
            if (subtexto) subtexto.innerHTML = "<strong style='color:#2ecc71;'>✓ DISFARCE ATIVO:</strong> Todos na campanha estão vendo seus dados, atributos e status vitais disfarçados.";
        } else {
            btnToggle.disabled = false;
            btnToggle.style.opacity = "1";
            btnToggle.style.cursor = "pointer";
            btnToggle.innerHTML = "🎭 Ativar Disfarce Agora";
            btnToggle.style.background = "#8e44ad";
            btnToggle.style.borderColor = "#9b59b6";
            if (subtexto) subtexto.innerHTML = "Quando ativado, seus aliados e a campanha verão seus dados, atributos e status vitais disfarçados.";
        }
    }
}

function salvarDadosNovosDisfarce() {
    const reais = obterValoresReaisPersonagem();

    identidadeSecretaDados.identidade = document.getElementById("secreto_identidade")?.value.trim() || "Agente Oculto";
    identidadeSecretaDados.nomeSocial = document.getElementById("secreto_nomeSocial")?.value.trim() || "";
    identidadeSecretaDados.titulo = document.getElementById("secreto_titulo")?.value.trim() || "";
    identidadeSecretaDados.nivel = document.getElementById("secreto_nivel")?.value || "";
    identidadeSecretaDados.classe1 = document.getElementById("secreto_classe1")?.value || "";
    identidadeSecretaDados.classe2 = document.getElementById("secreto_classe2")?.value || "";
    identidadeSecretaDados.cor = document.getElementById("secreto_cor")?.value || "#8e44ad";
    identidadeSecretaDados.contornoAtivo = !!document.getElementById("secreto_contorno_ativo")?.checked;
    identidadeSecretaDados.contornoCor = document.getElementById("secreto_contorno_cor")?.value || "#ffffff";

    // Enforça a regra: Atributos falsos NUNCA podem ser maiores que os reais
    identidadeSecretaDados.atributos = {
        HPR: Math.min(reais.atributos.HPR, Math.max(0, parseInt(document.getElementById("secreto_attr_HPR")?.value, 10) || 0)),
        PRX: Math.min(reais.atributos.PRX, Math.max(0, parseInt(document.getElementById("secreto_attr_PRX")?.value, 10) || 0)),
        PSI: Math.min(reais.atributos.PSI, Math.max(0, parseInt(document.getElementById("secreto_attr_PSI")?.value, 10) || 0)),
        QI:  Math.min(reais.atributos.QI,  Math.max(0, parseInt(document.getElementById("secreto_attr_QI")?.value, 10) || 0))
    };

    // Enforça a regra: Recursos falsos NUNCA podem ser maiores que os reais
    const fvMax = Math.min(reais.recursos.vida.max, Math.max(1, parseInt(document.getElementById("secreto_vida_max")?.value, 10) || 1));
    const feMax = Math.min(reais.recursos.estamina.max, Math.max(1, parseInt(document.getElementById("secreto_estamina_max")?.value, 10) || 1));
    const fmMax = Math.min(reais.recursos.mental.max, Math.max(1, parseInt(document.getElementById("secreto_mental_max")?.value, 10) || 1));
    const faMax = Math.min(reais.recursos.aura.max, Math.max(1, parseInt(document.getElementById("secreto_aura_max")?.value, 10) || 1));

    identidadeSecretaDados.recursos = {
        vida: {
            max: fvMax,
            atual: Math.min(fvMax, Math.max(0, parseInt(document.getElementById("secreto_vida_atual")?.value, 10) || 0)),
            temp: Math.min(Math.max(0, reais.recursos.vida.temp), Math.max(0, parseInt(document.getElementById("secreto_vida_temp")?.value, 10) || 0))
        },
        estamina: {
            max: feMax,
            atual: Math.min(feMax, Math.max(0, parseInt(document.getElementById("secreto_estamina_atual")?.value, 10) || 0)),
            temp: Math.min(Math.max(0, reais.recursos.estamina.temp), Math.max(0, parseInt(document.getElementById("secreto_estamina_temp")?.value, 10) || 0))
        },
        mental: {
            max: fmMax,
            atual: Math.min(fmMax, Math.max(0, parseInt(document.getElementById("secreto_mental_atual")?.value, 10) || 0)),
            temp: Math.min(Math.max(0, reais.recursos.mental.temp), Math.max(0, parseInt(document.getElementById("secreto_mental_temp")?.value, 10) || 0))
        },
        aura: {
            max: faMax,
            atual: Math.min(faMax, Math.max(0, parseInt(document.getElementById("secreto_aura_atual")?.value, 10) || 0)),
            temp: Math.min(Math.max(0, reais.recursos.aura.temp), Math.max(0, parseInt(document.getElementById("secreto_aura_temp")?.value, 10) || 0))
        }
    };
}

function salvarConfigIdentidadeSecreta(comToast = true) {
    if (pendenteQueimaDeArquivoIdentidade) {
        // JOGADA DE MESTRE: A ficha de disfarce anterior agora é considerada a FICHA VERDADEIRA
        // E a VERDADEIRA ORIGINAL é EXCLUÍDA do navegador!
        aplicarDisfarceComoFichaVerdadeira();
        codigoIdentidadeSecreta = novaSenhaIdentidade;
        salvarCodigoIdentidadeSecretaLocal(codigoIdentidadeSecreta);
        pendenteQueimaDeArquivoIdentidade = false;

        salvarDadosNovosDisfarce();
        fecharModalIdentidadeSecreta();
        abrirModalBackupOpsec(codigoIdentidadeSecreta);
        if (typeof mostrarStatus === "function") {
            mostrarStatus("⚠️ A ficha anterior agora é a sua ficha verdadeira. A original foi excluída deste navegador!", "aviso");
        }
        if (typeof marcarAlteracaoFeita === "function") marcarAlteracaoFeita();
        return;
    }

    if (ehCriacaoIdentidadeSecreta) {
        codigoIdentidadeSecreta = novaSenhaIdentidade;
        salvarCodigoIdentidadeSecretaLocal(codigoIdentidadeSecreta);
        ehCriacaoIdentidadeSecreta = false;

        salvarDadosNovosDisfarce();
        fecharModalIdentidadeSecreta();
        abrirModalBackupOpsec(codigoIdentidadeSecreta);
        if (typeof mostrarStatus === "function") {
            mostrarStatus("🎭 Identidade Secreta criada com sucesso!", "ok");
        }
        if (typeof marcarAlteracaoFeita === "function") marcarAlteracaoFeita();
        return;
    }

    salvarDadosNovosDisfarce();

    if (identidadeSecretaAtiva) {
        aplicarDisfarceNaFicha();
    }

    fecharModalIdentidadeSecreta();
    if (comToast && typeof mostrarStatus === "function") {
        mostrarStatus("🎭 Configurações da Identidade Secreta salvas!", "ok");
    }
    if (typeof marcarAlteracaoFeita === "function") marcarAlteracaoFeita();
}

function alternarEstadoAtivoDisfarce() {
    salvarConfigIdentidadeSecreta(false);
    if (!fichaCriadaNesteNavegador) {
        if (typeof mostrarStatus === "function") {
            mostrarStatus("🔒 Em outro navegador, a Identidade Secreta permanece fixada.", "aviso");
        }
        return;
    }
    if (identidadeSecretaAtiva) {
        desativarDisfarceFicha();
    } else {
        ativarDisfarceFicha();
    }
    popularmodalIdentidadeSecretaInputs();
}

function ativarDisfarceFicha() {
    executarEfeitoTransicaoVisualDisfarce(true);
    if (!identidadeRealDados) {
        identidadeRealDados = {
            avatar: avatarAtual,
            identidade: document.getElementById("ficha_identidade")?.value || "",
            nomeSocial: document.getElementById("ficha_nome_social")?.value || "",
            codinome: document.getElementById("ficha_codinome")?.value || "",
            titulo: document.getElementById("ficha_titulo")?.value || "",
            temNomeSocial: !!document.getElementById("ficha_tem_nome_social")?.checked,
            temCodinome: !!document.getElementById("ficha_tem_codinome")?.checked,
            trocarPorCodinome: !!document.getElementById("ficha_trocar_por_codinome")?.checked,
            nivel: document.getElementById("ficha_nivel")?.value || "",
            classe1: document.getElementById("ficha_classe1")?.value || "",
            classe2: document.getElementById("ficha_classe2")?.value || "",
            cor: document.getElementById("ficha_cor")?.value || "#c9b183",
            contornoAtivo: typeof contornoLetrasAtivo !== "undefined" ? contornoLetrasAtivo : false,
            contornoCor: typeof contornoLetrasCor !== "undefined" ? contornoLetrasCor : "#ffffff",
            atributos: {
                HPR: parseInt(document.getElementById("attr_HPR")?.value, 10) || 1,
                PRX: parseInt(document.getElementById("attr_PRX")?.value, 10) || 1,
                PSI: parseInt(document.getElementById("attr_PSI")?.value, 10) || 1,
                QI:  parseInt(document.getElementById("attr_QI")?.value, 10) || 1
            },
            recursos: {
                vida: {
                    atual: parseInt(document.getElementById("recurso_vida_atual")?.value, 10) || 100,
                    max: parseInt(document.getElementById("recurso_vida_max")?.value, 10) || 100,
                    temp: parseInt(document.getElementById("recurso_vida_temp")?.value, 10) || 0
                },
                estamina: {
                    atual: parseInt(document.getElementById("recurso_estamina_atual")?.value, 10) || 80,
                    max: parseInt(document.getElementById("recurso_estamina_max")?.value, 10) || 80,
                    temp: parseInt(document.getElementById("recurso_estamina_temp")?.value, 10) || 0
                },
                mental: {
                    atual: parseInt(document.getElementById("recurso_mental_atual")?.value, 10) || 50,
                    max: parseInt(document.getElementById("recurso_mental_max")?.value, 10) || 50,
                    temp: parseInt(document.getElementById("recurso_mental_temp")?.value, 10) || 0
                },
                aura: {
                    atual: parseInt(document.getElementById("recurso_aura_atual")?.value, 10) || 30,
                    max: parseInt(document.getElementById("recurso_aura_max")?.value, 10) || 30,
                    temp: parseInt(document.getElementById("recurso_aura_temp")?.value, 10) || 0
                }
            }
        };
    }

    identidadeSecretaAtiva = true;
    aplicarDisfarceNaFicha();

    if (typeof salvarFichaAutomatico === "function") salvarFichaAutomatico();

    if (typeof mostrarStatus === "function") {
        mostrarStatus("🎭 DISFARCE ATIVADO: Sua ficha agora exibe a Identidade Secreta para a campanha!", "ok");
    }
}

function desativarDisfarceFicha() {
    if (!fichaCriadaNesteNavegador && !sessaoIdentidadeSecretaDesbloqueada) {
        if (typeof mostrarStatus === "function") {
            mostrarStatus("🔒 Em outro navegador, a Identidade Secreta não pode ser desativada sem autenticação.", "aviso");
        }
        return;
    }
    executarEfeitoTransicaoVisualDisfarce(false);
    identidadeSecretaAtiva = false;
    
    if (identidadeRealDados) {
        avatarAtual = identidadeRealDados.avatar || "";
        if (typeof aplicarAvatar === "function") aplicarAvatar();

        if (document.getElementById("ficha_identidade")) document.getElementById("ficha_identidade").value = identidadeRealDados.identidade || "";
        if (document.getElementById("ficha_nome_social")) document.getElementById("ficha_nome_social").value = identidadeRealDados.nomeSocial || "";
        if (document.getElementById("ficha_codinome")) document.getElementById("ficha_codinome").value = identidadeRealDados.codinome || "";
        if (document.getElementById("ficha_titulo")) document.getElementById("ficha_titulo").value = identidadeRealDados.titulo || "";
        
        if (document.getElementById("ficha_tem_nome_social")) document.getElementById("ficha_tem_nome_social").checked = identidadeRealDados.temNomeSocial;
        if (document.getElementById("ficha_tem_codinome")) document.getElementById("ficha_tem_codinome").checked = identidadeRealDados.temCodinome;
        if (document.getElementById("ficha_trocar_por_codinome")) document.getElementById("ficha_trocar_por_codinome").checked = identidadeRealDados.trocarPorCodinome;

        if (typeof alternarCampoNomeSocial === "function") alternarCampoNomeSocial(identidadeRealDados.temNomeSocial, false);
        if (typeof alternarCampoCodinome === "function") alternarCampoCodinome(identidadeRealDados.temCodinome, false);

        if (document.getElementById("ficha_nivel")) document.getElementById("ficha_nivel").value = identidadeRealDados.nivel || "";
        if (document.getElementById("ficha_classe1")) document.getElementById("ficha_classe1").value = identidadeRealDados.classe1 || "";
        if (document.getElementById("ficha_classe2")) document.getElementById("ficha_classe2").value = identidadeRealDados.classe2 || "";
        if (typeof atualizarOpcoesClasse === "function") atualizarOpcoesClasse();

        const corReal = identidadeRealDados.cor || "#c9b183";
        if (document.getElementById("ficha_cor")) document.getElementById("ficha_cor").value = corReal;
        if (typeof definirCorPrincipal === "function") definirCorPrincipal(corReal, false);

        const contAtivo = identidadeRealDados.contornoAtivo;
        const contCor = identidadeRealDados.contornoCor || "#ffffff";
        if (document.getElementById("ficha_contorno_cor")) document.getElementById("ficha_contorno_cor").value = contCor;
        if (typeof definirCorContorno === "function") definirCorContorno(contCor, false);
        if (typeof alternarContornoLetras === "function") alternarContornoLetras(contAtivo, false);

        if (identidadeRealDados.atributos) {
            if (document.getElementById("attr_HPR")) document.getElementById("attr_HPR").value = identidadeRealDados.atributos.HPR ?? 1;
            if (document.getElementById("attr_PRX")) document.getElementById("attr_PRX").value = identidadeRealDados.atributos.PRX ?? 1;
            if (document.getElementById("attr_PSI")) document.getElementById("attr_PSI").value = identidadeRealDados.atributos.PSI ?? 1;
            if (document.getElementById("attr_QI"))  document.getElementById("attr_QI").value  = identidadeRealDados.atributos.QI ?? 1;
            if (typeof atualizarPainel === "function") atualizarPainel();
        }

        if (identidadeRealDados.recursos) {
            const r = identidadeRealDados.recursos;
            if (r.vida) {
                if (document.getElementById("recurso_vida_atual")) document.getElementById("recurso_vida_atual").value = r.vida.atual;
                if (document.getElementById("recurso_vida_max")) document.getElementById("recurso_vida_max").value = r.vida.max;
                if (document.getElementById("recurso_vida_temp")) document.getElementById("recurso_vida_temp").value = r.vida.temp;
            }
            if (r.estamina) {
                if (document.getElementById("recurso_estamina_atual")) document.getElementById("recurso_estamina_atual").value = r.estamina.atual;
                if (document.getElementById("recurso_estamina_max")) document.getElementById("recurso_estamina_max").value = r.estamina.max;
                if (document.getElementById("recurso_estamina_temp")) document.getElementById("recurso_estamina_temp").value = r.estamina.temp;
            }
            if (r.mental) {
                if (document.getElementById("recurso_mental_atual")) document.getElementById("recurso_mental_atual").value = r.mental.atual;
                if (document.getElementById("recurso_mental_max")) document.getElementById("recurso_mental_max").value = r.mental.max;
                if (document.getElementById("recurso_mental_temp")) document.getElementById("recurso_mental_temp").value = r.mental.temp;
            }
            if (r.aura) {
                if (document.getElementById("recurso_aura_atual")) document.getElementById("recurso_aura_atual").value = r.aura.atual;
                if (document.getElementById("recurso_aura_max")) document.getElementById("recurso_aura_max").value = r.aura.max;
                if (document.getElementById("recurso_aura_temp")) document.getElementById("recurso_aura_temp").value = r.aura.temp;
            }
            if (typeof atualizarTodasBarrasRecursos === "function") atualizarTodasBarrasRecursos();
        }
    }

    if (typeof atualizarNomesPersonagem === "function") atualizarNomesPersonagem();
    atualizarBannerDisfarceUI();

    if (typeof salvarFichaAutomatico === "function") salvarFichaAutomatico();
    if (typeof sincronizarEstadoComCampanha === "function") sincronizarEstadoComCampanha();
    if (typeof renderizarMembrosModoTatico === "function") renderizarMembrosModoTatico();

    if (typeof mostrarStatus === "function") {
        mostrarStatus("👤 IDENTIDADE REAL RESTAURADA: Sua ficha voltou aos status e atributos originais.", "info");
    }
}

function aplicarDisfarceNaFicha() {
    const d = identidadeSecretaDados;
    
    avatarAtual = (d && typeof d.avatar !== "undefined") ? (d.avatar || "") : "";
    if (typeof aplicarAvatar === "function") aplicarAvatar();

    if (document.getElementById("ficha_identidade")) document.getElementById("ficha_identidade").value = d.identidade || "";
    if (document.getElementById("ficha_nome_social")) document.getElementById("ficha_nome_social").value = d.nomeSocial || "";
    if (document.getElementById("ficha_titulo")) document.getElementById("ficha_titulo").value = d.titulo || "";
    if (document.getElementById("ficha_tem_nome_social")) document.getElementById("ficha_tem_nome_social").checked = !!d.nomeSocial;
    if (typeof alternarCampoNomeSocial === "function") alternarCampoNomeSocial(!!d.nomeSocial, false);

    if (document.getElementById("ficha_nivel")) document.getElementById("ficha_nivel").value = d.nivel || "";
    if (document.getElementById("ficha_classe1")) document.getElementById("ficha_classe1").value = d.classe1 || "";
    if (document.getElementById("ficha_classe2")) document.getElementById("ficha_classe2").value = d.classe2 || "";
    if (typeof atualizarOpcoesClasse === "function") atualizarOpcoesClasse();

    if (d.cor) {
        if (document.getElementById("ficha_cor")) document.getElementById("ficha_cor").value = d.cor;
        if (typeof definirCorPrincipal === "function") definirCorPrincipal(d.cor, false);
    }

    if (d.contornoCor) {
        if (document.getElementById("ficha_contorno_cor")) document.getElementById("ficha_contorno_cor").value = d.contornoCor;
        if (typeof definirCorContorno === "function") definirCorContorno(d.contornoCor, false);
    }
    if (typeof alternarContornoLetras === "function") alternarContornoLetras(!!d.contornoAtivo, false);

    if (d.atributos) {
        if (document.getElementById("attr_HPR")) document.getElementById("attr_HPR").value = d.atributos.HPR ?? 1;
        if (document.getElementById("attr_PRX")) document.getElementById("attr_PRX").value = d.atributos.PRX ?? 1;
        if (document.getElementById("attr_PSI")) document.getElementById("attr_PSI").value = d.atributos.PSI ?? 1;
        if (document.getElementById("attr_QI"))  document.getElementById("attr_QI").value  = d.atributos.QI ?? 1;
        if (typeof atualizarPainel === "function") atualizarPainel();
    }

    if (d.recursos) {
        const r = d.recursos;
        if (r.vida) {
            if (document.getElementById("recurso_vida_atual")) document.getElementById("recurso_vida_atual").value = r.vida.atual;
            if (document.getElementById("recurso_vida_max")) document.getElementById("recurso_vida_max").value = r.vida.max;
            if (document.getElementById("recurso_vida_temp")) document.getElementById("recurso_vida_temp").value = r.vida.temp;
        }
        if (r.estamina) {
            if (document.getElementById("recurso_estamina_atual")) document.getElementById("recurso_estamina_atual").value = r.estamina.atual;
            if (document.getElementById("recurso_estamina_max")) document.getElementById("recurso_estamina_max").value = r.estamina.max;
            if (document.getElementById("recurso_estamina_temp")) document.getElementById("recurso_estamina_temp").value = r.estamina.temp;
        }
        if (r.mental) {
            if (document.getElementById("recurso_mental_atual")) document.getElementById("recurso_mental_atual").value = r.mental.atual;
            if (document.getElementById("recurso_mental_max")) document.getElementById("recurso_mental_max").value = r.mental.max;
            if (document.getElementById("recurso_mental_temp")) document.getElementById("recurso_mental_temp").value = r.mental.temp;
        }
        if (r.aura) {
            if (document.getElementById("recurso_aura_atual")) document.getElementById("recurso_aura_atual").value = r.aura.atual;
            if (document.getElementById("recurso_aura_max")) document.getElementById("recurso_aura_max").value = r.aura.max;
            if (document.getElementById("recurso_aura_temp")) document.getElementById("recurso_aura_temp").value = r.aura.temp;
        }
        if (typeof atualizarTodasBarrasRecursos === "function") atualizarTodasBarrasRecursos();
    }

    if (typeof atualizarNomesPersonagem === "function") atualizarNomesPersonagem();
    atualizarBannerDisfarceUI();

    if (typeof salvarFichaAutomatico === "function") salvarFichaAutomatico();
    if (typeof sincronizarEstadoComCampanha === "function") sincronizarEstadoComCampanha();
    if (typeof renderizarMembrosModoTatico === "function") renderizarMembrosModoTatico();
}

function carregarAvatarSecreto(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        identidadeSecretaDados.avatar = e.target.result;
        popularmodalIdentidadeSecretaInputs();
    };
    reader.readAsDataURL(file);
}

function removerAvatarSecreto() {
    identidadeSecretaDados.avatar = "";
    popularmodalIdentidadeSecretaInputs();
}

function atualizarBannerDisfarceUI() {
    const banner = document.getElementById("secao-banner-disfarce");
    if (banner) {
        banner.remove();
    }

    const legOpcoes = document.getElementById("legenda_identidade_secreta_btn");
    if (legOpcoes) {
        legOpcoes.textContent = "Identidade Secreta";
    }
}

// ==========================================
// MÓDULO: TOCADOR DE MÚSICA & TRILHA DINÂMICA (.MP3)
// ==========================================

const AUDIO_TRACKS_CHAVE = "we_are_strangers_musicas";
const ORDEM_PRIORIDADE_AUDIO = ["vidaZero", "combate", "mentalBaixo", "geral"];

const ROTULOS_SLOTS_AUDIO = {
    vidaZero: { nome: "Vida Zerada", icone: "💀", prioridade: "1° Prioridade", gatilho: "Vida = 0 HP" },
    combate: { nome: "Modo de Combate", icone: "⚔️", prioridade: "2° Prioridade", gatilho: "Aba Modo Tático ativa" },
    mentalBaixo: { nome: "Mental Baixo", icone: "👁️", prioridade: "3° Prioridade", gatilho: "Mental < 50%" },
    geral: { nome: "Música Geral", icone: "📜", prioridade: "4° Prioridade", gatilho: "Trilha padrão da ficha" }
};

let musicasPersonalizadas = {
    vidaZero: null,     // { nome, dados: dataUrl }
    combate: null,
    mentalBaixo: null,
    geral: null
};

let elementoAudioPlayer = null;
let musicaAtivaSlot = null;
let musicaPausadaPeloUsuario = false;
let musicaVolumeAtual = 0.7;
let popupMusicaFechadoManualmente = false;
let popupMusicaRecolhido = false;

let slotEmEdicao = null;
let previewAudioPlayerEdicao = null;
let audioDuracaoEdicaoTotal = 100;

function formatarTempoSegundos(seg) {
    if (isNaN(seg) || seg === null || seg === undefined || seg < 0) return "0:00";
    const totalSeg = Math.floor(seg);
    const min = Math.floor(totalSeg / 60);
    const s = totalSeg % 60;
    const sStr = s < 10 ? "0" + s : "" + s;
    const decis = Math.floor((seg - totalSeg) * 10);
    return `${min}:${sStr}.${decis}`;
}

function abrirModalEditarMusica(slot) {
    const track = musicasPersonalizadas[slot];
    if (!track) return;
    
    slotEmEdicao = slot;
    pararPreviewAudioModal();
    
    const nomeEl = document.getElementById("musica_editar_nome_faixa");
    if (nomeEl) nomeEl.textContent = track.nome || slot;

    // Instancia o player temporário de preview para obter a duração exata do arquivo
    if (previewAudioPlayerEdicao) {
        try { previewAudioPlayerEdicao.pause(); } catch(e){}
        previewAudioPlayerEdicao = null;
    }
    
    previewAudioPlayerEdicao = new Audio();
    previewAudioPlayerEdicao.src = track.dados;
    
    const inicializarValores = () => {
        const dur = previewAudioPlayerEdicao && !isNaN(previewAudioPlayerEdicao.duration) && previewAudioPlayerEdicao.duration > 0
            ? previewAudioPlayerEdicao.duration
            : 100;
        audioDuracaoEdicaoTotal = dur;

        const valInicio = typeof track.inicio === "number" ? track.inicio : 0;
        const valFim = (typeof track.fim === "number" && track.fim > valInicio && track.fim <= dur) ? track.fim : dur;

        const inputInicio = document.getElementById("musica_editar_inicio");
        const inputFim = document.getElementById("musica_editar_fim");
        if (inputInicio) inputInicio.value = valInicio;
        if (inputFim) inputFim.value = (typeof track.fim === "number" && track.fim > 0 && track.fim < dur) ? track.fim : "";

        // Ajusta max dos ranges
        const rangeInicio = document.getElementById("musica_range_inicio");
        const rangeFim = document.getElementById("musica_range_fim");
        const rangeScrubber = document.getElementById("musica_editar_scrubber_slider");

        if (rangeInicio) { rangeInicio.max = dur; rangeInicio.value = valInicio; }
        if (rangeFim) { rangeFim.max = dur; rangeFim.value = valFim; }
        if (rangeScrubber) { rangeScrubber.max = dur; rangeScrubber.value = valInicio; }

        atualizarUIModalEdicaoMusica();
    };

    previewAudioPlayerEdicao.addEventListener("loadedmetadata", inicializarValores);
    if (previewAudioPlayerEdicao.readyState >= 1) {
        inicializarValores();
    } else {
        inicializarValores();
    }

    const modal = document.getElementById("modal-editar-musica");
    if (modal) {
        modal.style.display = "flex";
        requestAnimationFrame(() => {
            modal.classList.add("aberto");
            modal.setAttribute("aria-hidden", "false");
        });
    }
}

function atualizarUIModalEdicaoMusica() {
    const durTotal = audioDuracaoEdicaoTotal || 100;

    const inputInicio = parseFloat(document.getElementById("musica_editar_inicio")?.value);
    const inputFim = parseFloat(document.getElementById("musica_editar_fim")?.value);

    let inicio = isNaN(inputInicio) || inputInicio < 0 ? 0 : inputInicio;
    let fim = isNaN(inputFim) || inputFim <= inicio || inputFim > durTotal ? durTotal : inputFim;

    if (inicio > durTotal) inicio = durTotal;

    const durLoop = Math.max(0, fim - inicio);
    const pctInicio = Math.min(100, Math.max(0, (inicio / durTotal) * 100));
    const pctFim = Math.min(100, Math.max(0, (fim / durTotal) * 100));

    // Atualiza regiões da linha do tempo visual
    const shadeLeft = document.getElementById("musica_shade_left");
    const shadeRight = document.getElementById("musica_shade_right");
    const loopRegion = document.getElementById("musica_loop_region");

    if (shadeLeft) shadeLeft.style.width = pctInicio + "%";
    if (shadeRight) shadeRight.style.width = Math.max(0, 100 - pctFim) + "%";
    if (loopRegion) {
        loopRegion.style.left = pctInicio + "%";
        loopRegion.style.width = Math.max(0, pctFim - pctInicio) + "%";
    }

    // Textos de Badges
    const durTotalTxt = document.getElementById("musica_editar_duracao_total_txt");
    const durLoopTxt = document.getElementById("musica_editar_duracao_loop_txt");
    const pctLoopNum = durTotal > 0 ? Math.round((durLoop / durTotal) * 100) : 100;

    if (durTotalTxt) durTotalTxt.textContent = formatarTempoSegundos(durTotal);
    if (durLoopTxt) durLoopTxt.textContent = `${formatarTempoSegundos(durLoop)} (${pctLoopNum}%)`;

    // Handles e Cards
    const handleInicioVal = document.getElementById("handle_inicio_val");
    const handleFimVal = document.getElementById("handle_fim_val");
    const cardInicioTxt = document.getElementById("card_inicio_time_txt");
    const cardFimTxt = document.getElementById("card_fim_time_txt");

    if (handleInicioVal) handleInicioVal.textContent = formatarTempoSegundos(inicio);
    if (handleFimVal) handleFimVal.textContent = (fim >= durTotal) ? "Final (" + formatarTempoSegundos(durTotal) + ")" : formatarTempoSegundos(fim);
    if (cardInicioTxt) cardInicioTxt.textContent = inicio.toFixed(1) + "s";
    if (cardFimTxt) cardFimTxt.textContent = (fim >= durTotal) ? "Final" : fim.toFixed(1) + "s";

    // Régua
    const reguaMeio = document.getElementById("musica_regua_meio_txt");
    const reguaFim = document.getElementById("musica_regua_fim_txt");
    if (reguaMeio) reguaMeio.textContent = formatarTempoSegundos(durTotal / 2);
    if (reguaFim) reguaFim.textContent = formatarTempoSegundos(durTotal);

    // Ranges
    const rangeInicio = document.getElementById("musica_range_inicio");
    const rangeFim = document.getElementById("musica_range_fim");
    if (rangeInicio && document.activeElement !== rangeInicio) rangeInicio.value = inicio;
    if (rangeFim && document.activeElement !== rangeFim) rangeFim.value = fim;
}

function aoMoverRangeInicio(val) {
    const num = parseFloat(val);
    const inputInicio = document.getElementById("musica_editar_inicio");
    if (inputInicio) inputInicio.value = num.toFixed(1);
    atualizarUIModalEdicaoMusica();
}

function aoMoverRangeFim(val) {
    const num = parseFloat(val);
    const inputFim = document.getElementById("musica_editar_fim");
    if (inputFim) inputFim.value = (num >= audioDuracaoEdicaoTotal) ? "" : num.toFixed(1);
    atualizarUIModalEdicaoMusica();
}

function aoDigitarInicio(val) {
    atualizarUIModalEdicaoMusica();
}

function aoDigitarFim(val) {
    atualizarUIModalEdicaoMusica();
}

function ajustarTempoInicioEdicao(delta) {
    const inputInicio = document.getElementById("musica_editar_inicio");
    if (!inputInicio) return;
    let atual = parseFloat(inputInicio.value) || 0;
    let novo = Math.max(0, atual + delta);
    inputInicio.value = novo.toFixed(1);
    atualizarUIModalEdicaoMusica();
}

function ajustarTempoFimEdicao(delta) {
    const inputFim = document.getElementById("musica_editar_fim");
    if (!inputFim) return;
    let atual = parseFloat(inputFim.value);
    if (isNaN(atual) || atual <= 0) atual = audioDuracaoEdicaoTotal;
    let novo = Math.max(0, Math.min(audioDuracaoEdicaoTotal, atual + delta));
    inputFim.value = (novo >= audioDuracaoEdicaoTotal) ? "" : novo.toFixed(1);
    atualizarUIModalEdicaoMusica();
}

function capturarTempoAtualComoInicio() {
    if (!previewAudioPlayerEdicao) return;
    const tempo = previewAudioPlayerEdicao.currentTime || 0;
    const inputInicio = document.getElementById("musica_editar_inicio");
    if (inputInicio) inputInicio.value = tempo.toFixed(1);
    atualizarUIModalEdicaoMusica();
    mostrarStatus("📍 Ponto de início ajustado para " + tempo.toFixed(1) + "s", "");
}

function capturarTempoAtualComoFim() {
    if (!previewAudioPlayerEdicao) return;
    const tempo = previewAudioPlayerEdicao.currentTime || audioDuracaoEdicaoTotal;
    const inputFim = document.getElementById("musica_editar_fim");
    if (inputFim) inputFim.value = tempo.toFixed(1);
    atualizarUIModalEdicaoMusica();
    mostrarStatus("📍 Ponto de fim ajustado para " + tempo.toFixed(1) + "s", "");
}

function resetarCortesEdicaoMusica() {
    const inputInicio = document.getElementById("musica_editar_inicio");
    const inputFim = document.getElementById("musica_editar_fim");
    if (inputInicio) inputInicio.value = "0";
    if (inputFim) inputFim.value = "";
    atualizarUIModalEdicaoMusica();
    mostrarStatus("🔄 Cortes restaurados para o tamanho total da música.", "");
}

function aoMoverScrubberEdicao(val) {
    const tempo = parseFloat(val);
    if (previewAudioPlayerEdicao) {
        previewAudioPlayerEdicao.currentTime = tempo;
    }
    atualizarPlayheadEdicaoUI(tempo);
}

function atualizarPlayheadEdicaoUI(currentTime) {
    const durTotal = audioDuracaoEdicaoTotal || 100;
    const pct = Math.min(100, Math.max(0, (currentTime / durTotal) * 100));

    const playhead = document.getElementById("musica_timeline_playhead");
    const playheadTime = document.getElementById("musica_playhead_time");
    const rangeScrubber = document.getElementById("musica_editar_scrubber_slider");

    if (playhead) playhead.style.left = pct + "%";
    if (playheadTime) playheadTime.textContent = formatarTempoSegundos(currentTime);
    if (rangeScrubber && document.activeElement !== rangeScrubber) rangeScrubber.value = currentTime;
}

function alternarPreviewAudioModal() {
    if (!previewAudioPlayerEdicao) return;
    
    const btn = document.getElementById("btn-modal-preview-playpause");
    const icone = document.getElementById("icone-preview-play");
    const texto = document.getElementById("texto-preview-play");
    const statusTxt = document.getElementById("preview_loop_status_txt");

    if (!previewAudioPlayerEdicao.paused) {
        pararPreviewAudioModal();
    } else {
        const inputInicio = parseFloat(document.getElementById("musica_editar_inicio")?.value) || 0;
        const inputFim = parseFloat(document.getElementById("musica_editar_fim")?.value);
        const fim = isNaN(inputFim) || inputFim <= inputInicio ? audioDuracaoEdicaoTotal : inputFim;

        if (previewAudioPlayerEdicao.currentTime < inputInicio || previewAudioPlayerEdicao.currentTime >= fim) {
            previewAudioPlayerEdicao.currentTime = inputInicio;
        }

        previewAudioPlayerEdicao.play().then(() => {
            if (btn) btn.classList.add("tocando");
            if (icone) icone.textContent = "⏸️";
            if (texto) texto.textContent = "Pausar Teste";
            if (statusTxt) statusTxt.textContent = "Testando trecho em loop...";

            if (!previewAudioPlayerEdicao._loopListener) {
                previewAudioPlayerEdicao._loopListener = () => {
                    if (!previewAudioPlayerEdicao) return;
                    const cur = previewAudioPlayerEdicao.currentTime;
                    const curInicio = parseFloat(document.getElementById("musica_editar_inicio")?.value) || 0;
                    const curInputFim = parseFloat(document.getElementById("musica_editar_fim")?.value);
                    const curFim = isNaN(curInputFim) || curInputFim <= curInicio ? audioDuracaoEdicaoTotal : curInputFim;

                    if (cur >= curFim) {
                        previewAudioPlayerEdicao.currentTime = curInicio;
                    }
                    atualizarPlayheadEdicaoUI(previewAudioPlayerEdicao.currentTime);
                };
                previewAudioPlayerEdicao.addEventListener("timeupdate", previewAudioPlayerEdicao._loopListener);
            }
        }).catch(() => {});
    }
}

function pararPreviewAudioModal() {
    if (previewAudioPlayerEdicao) {
        try { previewAudioPlayerEdicao.pause(); } catch(e){}
    }
    const btn = document.getElementById("btn-modal-preview-playpause");
    const icone = document.getElementById("icone-preview-play");
    const texto = document.getElementById("texto-preview-play");
    const statusTxt = document.getElementById("preview_loop_status_txt");

    if (btn) btn.classList.remove("tocando");
    if (icone) icone.textContent = "▶️";
    if (texto) texto.textContent = "Testar Loop";
    if (statusTxt) statusTxt.textContent = "Ouvir trecho cortado em loop";
}

function fecharModalEditarMusica() {
    pararPreviewAudioModal();
    if (previewAudioPlayerEdicao) {
        try { previewAudioPlayerEdicao.src = ""; } catch(e){}
        previewAudioPlayerEdicao = null;
    }
    const modal = document.getElementById("modal-editar-musica");
    if (modal) {
        modal.classList.remove("aberto");
        modal.setAttribute("aria-hidden", "true");
        setTimeout(() => { modal.style.display = "none"; }, 200);
    }
    slotEmEdicao = null;
}

function fecharModalEditarMusicaPorOverlay(event) {
    if (event.target && event.target.id === "modal-editar-musica") {
        fecharModalEditarMusica();
    }
}

function salvarEdicaoMusica() {
    if (!slotEmEdicao || !musicasPersonalizadas[slotEmEdicao]) {
        fecharModalEditarMusica();
        return;
    }
    
    const inputInicio = parseFloat(document.getElementById("musica_editar_inicio").value);
    const inputFim = parseFloat(document.getElementById("musica_editar_fim").value);
    
    let inicio = isNaN(inputInicio) || inputInicio < 0 ? 0 : inputInicio;
    let fim = isNaN(inputFim) || inputFim <= inicio ? null : inputFim;
    
    const track = musicasPersonalizadas[slotEmEdicao];
    track.inicio = inicio;
    track.fim = fim;
    
    // Salva no IndexedDB atualizando os valores de inicio e fim
    salvarMusicaIDB(slotEmEdicao, track.nome, track.raw, track.inicio, track.fim).catch(()=>{});
    
    // Se a música editada for a que está tocando no player principal:
    if (musicaAtivaSlot === slotEmEdicao && elementoAudioPlayer) {
        // PERMANENTE NO PLAYER: Força a reprodução a saltar imediatamente para o início do novo corte
        elementoAudioPlayer.currentTime = inicio;
        if (!elementoAudioPlayer.paused) {
            elementoAudioPlayer.play().catch(()=>{});
        }
        atualizarTimelineAudioUI();
    }
    
    atualizarUIModalMusica();
    fecharModalEditarMusica();
    mostrarStatus("✓ Cortes de tempo da música salvos permanentemente.", "");
}

function aplicarLimitesCortePlayer() {
    if (!elementoAudioPlayer || !musicaAtivaSlot || !musicasPersonalizadas[musicaAtivaSlot]) return;
    const track = musicasPersonalizadas[musicaAtivaSlot];
    const inicio = track.inicio || 0;
    const dur = elementoAudioPlayer.duration;
    const fim = (typeof track.fim === "number" && track.fim > inicio && (isNaN(dur) || track.fim <= dur)) ? track.fim : null;

    const cur = elementoAudioPlayer.currentTime;
    if (cur < inicio - 0.05) {
        elementoAudioPlayer.currentTime = inicio;
    } else if (fim !== null && cur >= fim - 0.05) {
        elementoAudioPlayer.currentTime = inicio;
        if (!elementoAudioPlayer.paused) {
            elementoAudioPlayer.play().catch(()=>{});
        }
    }
}

function obterAudioPlayer() {
    if (!elementoAudioPlayer) {
        elementoAudioPlayer = new Audio();
        elementoAudioPlayer.loop = true;
        elementoAudioPlayer.preload = "auto";
        try { elementoAudioPlayer.crossOrigin = "anonymous"; } catch(e){}
        elementoAudioPlayer.volume = musicaVolumeAtual;
        
        const eventosLimites = ["play", "playing", "seeking", "loadedmetadata", "canplay", "ended"];
        eventosLimites.forEach(evt => {
            elementoAudioPlayer.addEventListener(evt, () => {
                if (typeof configurarEfeitosWebAudioPlayer === "function") {
                    configurarEfeitosWebAudioPlayer();
                }
                if (typeof atualizarEfeitosMusicaEstamina === "function" && typeof estaminaEstadoAtual !== "undefined") {
                    atualizarEfeitosMusicaEstamina(estaminaEstadoAtual);
                }
                aplicarLimitesCortePlayer();
                atualizarStatusPlayerUI();
                atualizarTimelineAudioUI();
            });
        });

        elementoAudioPlayer.addEventListener("pause", () => {
            atualizarStatusPlayerUI();
            atualizarTimelineAudioUI();
        });
        
        elementoAudioPlayer.addEventListener("durationchange", () => {
            aplicarLimitesCortePlayer();
            atualizarTimelineAudioUI();
        });
        
        elementoAudioPlayer.addEventListener("timeupdate", () => {
            if (elementoAudioPlayer && !elementoAudioPlayer.paused && elementoAudioPlayer.currentTime > 0) {
                const dotModal = document.getElementById("musica-status-dot");
                const dotPopup = document.getElementById("musica-popup-dot");
                if (dotModal && !dotModal.classList.contains("tocando")) dotModal.classList.add("tocando");
                if (dotPopup && !dotPopup.classList.contains("tocando")) dotPopup.classList.add("tocando");
                
                aplicarLimitesCortePlayer();
            }
            atualizarTimelineAudioUI();
        });
        
        elementoAudioPlayer.addEventListener("error", (e) => {
            console.warn("Aviso na reprodução da trilha sonora:", e);
            atualizarStatusPlayerUI();
        });
    }
    return elementoAudioPlayer;
}

function carregarMusicasArmazenadas() {
    // 1. Tenta carregar do IndexedDB primeiro (armazenamento de alto desempenho sem travar thread)
    carregarTodasMusicasIDB().then(itens => {
        let mudou = false;
        if (itens && itens.length > 0) {
            itens.forEach(it => {
                if (it && it.slot && it.dados) {
                    let audioSrc = "";
                    if (typeof it.dados === "string") {
                        audioSrc = it.dados;
                    } else if (it.dados instanceof Blob) {
                        audioSrc = URL.createObjectURL(it.dados);
                    }
                    musicasPersonalizadas[it.slot] = {
                        nome: it.nome || "Música",
                        dados: audioSrc,
                        raw: it.dados,
                        inicio: it.inicio || 0,
                        fim: it.fim || null
                    };
                    mudou = true;
                }
            });
        }

        // 2. Fallback / Migração de localStorage legado caso exista
        try {
            const salvo = localStorage.getItem(AUDIO_TRACKS_CHAVE);
            if (salvo) {
                const parsed = JSON.parse(salvo);
                if (parsed && typeof parsed === "object") {
                    ["vidaZero", "combate", "mentalBaixo", "geral"].forEach(slot => {
                        if (parsed[slot] && parsed[slot].dados && !musicasPersonalizadas[slot]) {
                            musicasPersonalizadas[slot] = {
                                nome: parsed[slot].nome,
                                dados: parsed[slot].dados,
                                raw: parsed[slot].dados,
                                inicio: parsed[slot].inicio || 0,
                                fim: parsed[slot].fim || null
                            };
                            // Salva no IndexedDB e limpa do localStorage para desobstruir memória
                            salvarMusicaIDB(slot, parsed[slot].nome, parsed[slot].dados, parsed[slot].inicio, parsed[slot].fim).catch(()=>{});
                            mudou = true;
                        }
                    });
                }
                // Limpa o base64 pesado do localStorage para manter leve
                localStorage.removeItem(AUDIO_TRACKS_CHAVE);
            }
        } catch (e) {
            console.warn("Aviso ao verificar dados legados de áudio:", e);
        }

        if (mudou) {
            avaliarMusicaAtual();
            atualizarUIModalMusica();
            atualizarBotaoCabecalhoMusica();
        }
    }).catch(err => {
        console.warn("Aviso ao carregar músicas do IndexedDB:", err);
    });

    // Volume e preferências
    try {
        const volSalvo = localStorage.getItem("we_are_strangers_musica_volume");
        if (volSalvo !== null) {
            const parsedVol = parseFloat(volSalvo);
            if (!isNaN(parsedVol) && parsedVol >= 0 && parsedVol <= 1) {
                musicaVolumeAtual = parsedVol;
                if (elementoAudioPlayer) elementoAudioPlayer.volume = musicaVolumeAtual;
                const slider = document.getElementById("musica_volume_slider");
                if (slider) slider.value = musicaVolumeAtual;
                const rotuloVal = document.getElementById("musica_volume_valor");
                if (rotuloVal) rotuloVal.textContent = Math.round(musicaVolumeAtual * 100) + "%";
            }
        }
        const pausadoSalvo = localStorage.getItem("we_are_strangers_musica_pausado");
        if (pausadoSalvo !== null) {
            musicaPausadaPeloUsuario = pausadoSalvo === "true";
        }
        const recolhidoSalvo = localStorage.getItem("we_are_strangers_musica_recolhido");
        if (recolhidoSalvo !== null) {
            popupMusicaRecolhido = recolhidoSalvo === "true";
        }
    } catch (e) {
        console.warn("Aviso ao carregar preferências de áudio:", e);
    }
}

function salvarMusicasGlobal() {
    try {
        // Salva apenas configurações leves no localStorage (volume, status)
        localStorage.setItem("we_are_strangers_musica_volume", String(musicaVolumeAtual));
        localStorage.setItem("we_are_strangers_musica_pausado", String(musicaPausadaPeloUsuario));
        localStorage.setItem("we_are_strangers_musica_recolhido", String(popupMusicaRecolhido));
    } catch (e) {
        console.warn("Aviso ao salvar configurações de música:", e);
    }
}

function calcularSlotMusicaDesejado() {
    // 1° VIDA ZERADA: vida atual + vida temporária <= 0 (ou vida atual <= 0)
    const vidaAtualEl = document.getElementById("recurso_vida_atual");
    const vidaTempEl = document.getElementById("recurso_vida_temp");
    const vidaAtual = vidaAtualEl ? parseInt(vidaAtualEl.value, 10) : 100;
    const vidaTemp = vidaTempEl ? parseInt(vidaTempEl.value, 10) : 0;
    const vidaEfetiva = (isNaN(vidaAtual) ? 0 : vidaAtual) + (isNaN(vidaTemp) ? 0 : vidaTemp);

    if (vidaEfetiva <= 0 && musicasPersonalizadas.vidaZero) {
        return "vidaZero";
    }

    // 2° MODO DE COMBATE: aba ativa é 'tatico'
    const abaAtiva = (typeof abaPrincipalAtiva !== "undefined" ? abaPrincipalAtiva : "pericias");
    if (abaAtiva === "tatico" && musicasPersonalizadas.combate) {
        return "combate";
    }

    // 3° MENTAL BAIXO: mental < 50%
    const mentalAtualEl = document.getElementById("recurso_mental_atual");
    const mentalMaxEl = document.getElementById("recurso_mental_max");
    const mentalAtual = mentalAtualEl ? parseInt(mentalAtualEl.value, 10) : 50;
    const mentalMax = mentalMaxEl ? parseInt(mentalMaxEl.value, 10) : 50;
    if (mentalMax > 0) {
        const proporcaoMental = mentalAtual / mentalMax;
        if (proporcaoMental < 0.50 && musicasPersonalizadas.mentalBaixo) {
            return "mentalBaixo";
        }
    }

    // 4° MÚSICA GERAL: trilha base da ficha
    if (musicasPersonalizadas.geral) {
        return "geral";
    }

    return null;
}

function avaliarMusicaAtual() {
    const slotDesejado = calcularSlotMusicaDesejado();
    const player = obterAudioPlayer();

    if (!slotDesejado) {
        // Nenhuma trilha elegível configurada ou aplicável
        if (musicaAtivaSlot !== null) {
            player.pause();
            player.removeAttribute("src");
            player.load();
            musicaAtivaSlot = null;
        }
        atualizarUIModalMusica();
        atualizarBotaoCabecalhoMusica();
        atualizarStatusPlayerUI();
        return;
    }

    const track = musicasPersonalizadas[slotDesejado];
    if (!track || !track.dados) {
        if (musicaAtivaSlot !== null) {
            player.pause();
            player.removeAttribute("src");
            player.load();
            musicaAtivaSlot = null;
        }
        atualizarUIModalMusica();
        atualizarBotaoCabecalhoMusica();
        atualizarStatusPlayerUI();
        return;
    }

    if (musicaAtivaSlot !== slotDesejado) {
        musicaAtivaSlot = slotDesejado;
        player.src = track.dados;
        const inicioCut = track.inicio || 0;
        player.currentTime = inicioCut;
        player.volume = musicaVolumeAtual;

        const forcarInicioMedia = () => {
            if (musicaAtivaSlot === slotDesejado && player.currentTime < inicioCut) {
                player.currentTime = inicioCut;
            }
        };
        player.addEventListener("loadedmetadata", forcarInicioMedia, { once: true });
        player.addEventListener("canplay", forcarInicioMedia, { once: true });

        if (!musicaPausadaPeloUsuario) {
            const playPromise = player.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.log("Autoplay de áudio aguardando interação do usuário:", err);
                });
            }
        }
    } else {
        aplicarLimitesCortePlayer();
        if (!musicaPausadaPeloUsuario && player.paused) {
            const playPromise = player.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {});
            }
        }
    }

    atualizarUIModalMusica();
    atualizarBotaoCabecalhoMusica();
    atualizarStatusPlayerUI();
}

function definirVolumeMusica(val) {
    const vol = parseFloat(val);
    if (!isNaN(vol)) {
        musicaVolumeAtual = Math.max(0, Math.min(1, Math.round(vol * 100) / 100));
        if (elementoAudioPlayer) {
            if (typeof playerWebAudioConectado !== "undefined" && playerWebAudioConectado) {
                elementoAudioPlayer.volume = musicaVolumeAtual;
            } else {
                let mult = 1.0;
                if (typeof estaminaEstadoAtual !== "undefined" && typeof efeitosEstaminaHabilitados !== "undefined" && efeitosEstaminaHabilitados) {
                    if (estaminaEstadoAtual === "critica") mult = 0.20;
                    else if (estaminaEstadoAtual === "moderada") mult = 0.60;
                }
                elementoAudioPlayer.volume = musicaVolumeAtual * mult;
            }
        }
        const rotuloVal = document.getElementById("musica_volume_valor");
        if (rotuloVal) {
            rotuloVal.textContent = Math.round(musicaVolumeAtual * 100) + "%";
        }
        const rotuloPopupVal = document.getElementById("musica_popup_volume_valor");
        if (rotuloPopupVal) {
            rotuloPopupVal.textContent = Math.round(musicaVolumeAtual * 100) + "%";
        }
        const sliderModal = document.getElementById("musica_volume_slider");
        if (sliderModal && parseFloat(sliderModal.value) !== musicaVolumeAtual) {
            sliderModal.value = musicaVolumeAtual;
        }
        const sliderPopup = document.getElementById("musica_popup_volume_slider");
        if (sliderPopup && parseFloat(sliderPopup.value) !== musicaVolumeAtual) {
            sliderPopup.value = musicaVolumeAtual;
        }
        salvarMusicasGlobal();
    }
}

function alternarPlayPauseMusica() {
    const player = obterAudioPlayer();
    if (musicaPausadaPeloUsuario) {
        musicaPausadaPeloUsuario = false;
        salvarMusicasGlobal();
        avaliarMusicaAtual();
        if (player.src) {
            if (typeof obterAudioContext === "function") obterAudioContext();
            if (typeof configurarEfeitosWebAudioPlayer === "function") configurarEfeitosWebAudioPlayer();
            if (typeof atualizarEfeitosMusicaEstamina === "function" && typeof estaminaEstadoAtual !== "undefined") {
                atualizarEfeitosMusicaEstamina(estaminaEstadoAtual);
            }
            player.play().catch(e => console.log("Erro ao reproduzir áudio:", e));
        }
        mostrarStatus("▶ Trilha sonora retomada.", "");
    } else {
        musicaPausadaPeloUsuario = true;
        salvarMusicasGlobal();
        player.pause();
        mostrarStatus("⏸ Trilha sonora pausada.", "");
    }
    atualizarStatusPlayerUI();
}

function formatarTempoAudio(segundos) {
    if (isNaN(segundos) || segundos < 0 || !isFinite(segundos)) return "0:00";
    const mins = Math.floor(segundos / 60);
    const segs = Math.floor(segundos % 60);
    return `${mins}:${segs < 10 ? '0' : ''}${segs}`;
}

function ajustarTempoMusica(porcentagem) {
    const player = elementoAudioPlayer;
    if (!player || !player.duration || isNaN(player.duration) || player.duration <= 0) return;
    
    const pct = parseFloat(porcentagem);
    if (isNaN(pct)) return;

    let minTime = 0;
    let maxTime = player.duration;
    
    if (musicaAtivaSlot && musicasPersonalizadas[musicaAtivaSlot]) {
        const track = musicasPersonalizadas[musicaAtivaSlot];
        minTime = track.inicio || 0;
        if (typeof track.fim === "number" && track.fim > minTime && track.fim <= player.duration) {
            maxTime = track.fim;
        }
    }

    const interval = Math.max(0.1, maxTime - minTime);
    const novoTempo = minTime + (Math.max(0, Math.min(100, pct)) / 100) * interval;
    player.currentTime = novoTempo;
    atualizarTimelineAudioUI();
}

function atualizarTimelineAudioUI() {
    const player = elementoAudioPlayer;
    const duracaoTotal = (player && player.duration && isFinite(player.duration)) ? player.duration : 0;
    const atualReal = (player && player.currentTime && isFinite(player.currentTime)) ? player.currentTime : 0;
    
    let minTime = 0;
    let maxTime = duracaoTotal;
    
    if (musicaAtivaSlot && musicasPersonalizadas[musicaAtivaSlot]) {
        const track = musicasPersonalizadas[musicaAtivaSlot];
        minTime = track.inicio || 0;
        if (typeof track.fim === "number" && track.fim > minTime && track.fim <= duracaoTotal) {
            maxTime = track.fim;
        } else if (duracaoTotal > 0) {
            maxTime = duracaoTotal;
        }
    }
    
    const interval = Math.max(0, maxTime - minTime);
    const atualRelativo = Math.max(0, Math.min(interval, atualReal - minTime));
    const pct = interval > 0 ? (atualRelativo / interval) * 100 : 0;

    const tempoAtualStr = formatarTempoAudio(atualRelativo);
    const tempoTotalStr = formatarTempoAudio(interval);

    // Modal
    const modalCur = document.getElementById("musica_modal_tempo_atual");
    const modalTot = document.getElementById("musica_modal_tempo_total");
    const modalSlider = document.getElementById("musica_modal_timeline_slider");
    if (modalCur) modalCur.textContent = tempoAtualStr;
    if (modalTot) modalTot.textContent = tempoTotalStr;
    if (modalSlider && document.activeElement !== modalSlider) {
        modalSlider.value = pct;
        modalSlider.disabled = interval <= 0;
    }

    // Popup
    const popupCur = document.getElementById("musica_popup_tempo_atual");
    const popupTot = document.getElementById("musica_popup_tempo_total");
    const popupSlider = document.getElementById("musica_popup_timeline_slider");
    if (popupCur) popupCur.textContent = tempoAtualStr;
    if (popupTot) popupTot.textContent = tempoTotalStr;
    if (popupSlider && document.activeElement !== popupSlider) {
        popupSlider.value = pct;
        popupSlider.disabled = interval <= 0;
    }
}

function alternarRecolhimentoPopupMusica() {
    popupMusicaRecolhido = !popupMusicaRecolhido;
    salvarMusicasGlobal();
    atualizarStatusPlayerUI();
}

function fecharPopupFlutuanteMusica() {
    alternarRecolhimentoPopupMusica();
}

function abrirPopupFlutuanteMusica() {
    popupMusicaFechadoManualmente = false;
    atualizarStatusPlayerUI();
}

function atualizarStatusPlayerUI() {
    // 1. Elementos do Modal
    const dotModal = document.getElementById("musica-status-dot");
    const rotuloModal = document.getElementById("musica-status-rotulo");
    const nomeModalEl = document.getElementById("musica-status-nome");
    const iconeModalBtn = document.getElementById("icone-musica-playpause");
    const textoModalBtn = document.getElementById("texto-musica-playpause");

    // 2. Elementos do Pop-up Flutuante (Inferior Esquerdo)
    const popup = document.getElementById("musica-popup-flutuante");
    const btnRecolher = document.getElementById("btn-recolher-popup-musica");
    const dotPopup = document.getElementById("musica-popup-dot");
    const prioridadePopup = document.getElementById("musica-popup-prioridade");
    const iconePopup = document.getElementById("musica-popup-icone");
    const tituloPopup = document.getElementById("musica-popup-titulo");
    const gatilhoPopup = document.getElementById("musica-popup-gatilho");
    const iconePopupBtn = document.getElementById("icone-popup-musica-playpause");
    const textoPopupBtn = document.getElementById("texto-popup-musica-playpause");
    const sliderPopup = document.getElementById("musica_popup_volume_slider");
    const rotuloPopupVal = document.getElementById("musica_popup_volume_valor");

    const player = elementoAudioPlayer;
    const isPlaying = !!(player && !player.paused && !player.ended && !musicaPausadaPeloUsuario && musicaAtivaSlot);

    // Atualiza botões de Play/Pause em ambos
    const txtPlay = musicaPausadaPeloUsuario ? "Retomar" : "Pausar";
    const icoPlay = musicaPausadaPeloUsuario ? "▶" : "⏸";

    if (iconeModalBtn && textoModalBtn) {
        iconeModalBtn.textContent = icoPlay;
        textoModalBtn.textContent = txtPlay;
    }
    if (iconePopupBtn && textoPopupBtn) {
        iconePopupBtn.textContent = icoPlay;
        textoPopupBtn.textContent = txtPlay;
    }

    if (sliderPopup) {
        sliderPopup.value = musicaVolumeAtual;
    }
    if (rotuloPopupVal) {
        rotuloPopupVal.textContent = Math.round(musicaVolumeAtual * 100) + "%";
    }

    // Se nenhuma música estiver tocando ou configurada no slot atual
    if (!musicaAtivaSlot || !musicasPersonalizadas[musicaAtivaSlot]) {
        if (dotModal) dotModal.className = "status-dot";
        if (rotuloModal) rotuloModal.textContent = "Trilha Silenciada";
        if (nomeModalEl) nomeModalEl.textContent = "Nenhuma música tocando no momento";

        if (popup) {
            popup.classList.remove("visivel");
        }
        return;
    }

    const slotInfo = ROTULOS_SLOTS_AUDIO[musicaAtivaSlot];
    const track = musicasPersonalizadas[musicaAtivaSlot];

    // Atualização do Modal
    if (dotModal) {
        dotModal.className = isPlaying ? "status-dot tocando" : "status-dot";
    }
    if (rotuloModal) {
        if (musicaPausadaPeloUsuario) {
            rotuloModal.textContent = `Pausada (${slotInfo ? slotInfo.prioridade : ""})`;
        } else {
            rotuloModal.textContent = `Em Execução • ${slotInfo ? slotInfo.nome : ""}`;
        }
    }
    if (nomeModalEl) {
        nomeModalEl.textContent = track ? track.nome : "Sem arquivo";
    }

    // Atualização do Pop-up Flutuante Inferior Esquerdo
    if (dotPopup) {
        dotPopup.className = isPlaying ? "musica-popup-dot tocando" : "musica-popup-dot";
    }
    if (prioridadePopup) {
        prioridadePopup.textContent = musicaPausadaPeloUsuario 
            ? `PAUSADA • ${slotInfo ? slotInfo.prioridade : ""}` 
            : `TOCANDO • ${slotInfo ? slotInfo.nome : ""}`;
    }
    if (iconePopup) {
        iconePopup.textContent = slotInfo ? slotInfo.icone : "🎧";
    }
    if (tituloPopup) {
        tituloPopup.textContent = track ? track.nome : "Trilha Sonora";
        tituloPopup.title = track ? track.nome : "";
    }
    if (gatilhoPopup) {
        gatilhoPopup.textContent = slotInfo ? slotInfo.gatilho : "Loop contínuo";
    }

    if (popup) {
        if (!popupMusicaFechadoManualmente) {
            popup.classList.add("visivel");
        }
        if (popupMusicaRecolhido) {
            popup.classList.add("recolhido");
            if (btnRecolher) {
                btnRecolher.textContent = "❯";
                btnRecolher.title = "Expandir tocador de música";
            }
        } else {
            popup.classList.remove("recolhido");
            if (btnRecolher) {
                btnRecolher.textContent = "❮";
                btnRecolher.title = "Recolher tocador para a lateral";
            }
        }
    }

    atualizarTimelineAudioUI();
}

async function processarUploadMusica(slot, event) {
    const input = event.target;
    if (!input || !input.files || input.files.length === 0) return;

    const arquivo = input.files[0];
    const nome = arquivo.name;

    // Limite generoso (máx 35MB por música)
    if (arquivo.size > 35 * 1024 * 1024) {
        mostrarStatus("✗ Arquivo de áudio muito grande. Escolha um .mp3 de até 35MB.", "erro");
        input.value = "";
        return;
    }

    // Revoga URL anterior do slot se for Blob URL para liberar memória RAM instantaneamente
    if (musicasPersonalizadas[slot] && musicasPersonalizadas[slot].dados && musicasPersonalizadas[slot].dados.startsWith("blob:")) {
        try { URL.revokeObjectURL(musicasPersonalizadas[slot].dados); } catch(e){}
    }

    // Cria instantaneamente um Object URL de alta performance (tempo de execução: < 1ms, zero congelamento)
    const blobUrl = URL.createObjectURL(arquivo);
    musicasPersonalizadas[slot] = { nome, dados: blobUrl, raw: arquivo };
    musicaPausadaPeloUsuario = false;
    popupMusicaFechadoManualmente = false;

    // Atualiza imediatamente a interface e áudio sem esperar gravação
    salvarMusicasGlobal();
    marcarAlteracaoFeita();
    avaliarMusicaAtual();

    const slotInfo = ROTULOS_SLOTS_AUDIO[slot];
    mostrarStatus(`✓ Música "${nome}" definida para [${slotInfo ? slotInfo.nome : slot}]!`, "ok");
    input.value = "";

    // Salva o arquivo no IndexedDB em background assíncrono (sem bloquear UI)
    salvarMusicaIDB(slot, nome, arquivo).catch(err => {
        console.warn("Aviso ao salvar áudio no IndexedDB:", err);
    });
}

function removerMusicaSlot(slot) {
    if (musicasPersonalizadas[slot]) {
        if (musicasPersonalizadas[slot].dados && musicasPersonalizadas[slot].dados.startsWith("blob:")) {
            try { URL.revokeObjectURL(musicasPersonalizadas[slot].dados); } catch(e){}
        }
        musicasPersonalizadas[slot] = null;
        salvarMusicasGlobal();
        removerMusicaIDB(slot).catch(()=>{});
        marcarAlteracaoFeita();
        avaliarMusicaAtual();
        const slotInfo = ROTULOS_SLOTS_AUDIO[slot];
        mostrarStatus(`✓ Trilha de [${slotInfo ? slotInfo.nome : slot}] removida.`, "ok");
    }
}

function limparTodasMusicas() {
    abrirModalConfirmacao({
        titulo: "Limpar Todas as Músicas",
        icone: "🗑️",
        mensagem: "Deseja realmente remover todos os arquivos .mp3 vinculados à ficha?",
        textoBotao: "Sim, Limpar",
        aoConfirmar: () => {
            ["vidaZero", "combate", "mentalBaixo", "geral"].forEach(slot => {
                if (musicasPersonalizadas[slot] && musicasPersonalizadas[slot].dados && musicasPersonalizadas[slot].dados.startsWith("blob:")) {
                    try { URL.revokeObjectURL(musicasPersonalizadas[slot].dados); } catch(e){}
                }
            });
            musicasPersonalizadas = { vidaZero: null, combate: null, mentalBaixo: null, geral: null };
            salvarMusicasGlobal();
            limparTodasMusicasIDB().catch(()=>{});
            marcarAlteracaoFeita();
            avaliarMusicaAtual();
            mostrarStatus("✓ Todas as músicas foram removidas.", "ok");
        }
    });
}

function abrirModalMusica() {
    if (typeof fecharMenuCabecalho === "function") fecharMenuCabecalho();
    atualizarUIModalMusica();
    const modal = document.getElementById("modal-config-musica");
    if (modal) {
        modal.style.display = "flex";
        requestAnimationFrame(() => modal.classList.add("aberto"));
        modal.setAttribute("aria-hidden", "false");
    }
}

function fecharModalMusica() {
    const modal = document.getElementById("modal-config-musica");
    if (modal) {
        modal.classList.remove("aberto");
        modal.setAttribute("aria-hidden", "true");
        setTimeout(() => { modal.style.display = "none"; }, 200);
    }
}

function fecharModalMusicaPorOverlay(event) {
    if (event.target && event.target.id === "modal-config-musica") {
        fecharModalMusica();
    }
}

function atualizarUIModalMusica() {
    ORDEM_PRIORIDADE_AUDIO.forEach(slot => {
        const track = musicasPersonalizadas[slot];
        const card = document.getElementById(`slot-card-${slot}`);
        const badge = document.getElementById(`badge-status-${slot}`);
        const nomeArquivoEl = document.getElementById(`nome-arquivo-${slot}`);
        const btnRemover = document.getElementById(`btn-remover-${slot}`);
        const btnEditar = document.getElementById(`btn-editar-${slot}`);

        const isActive = (musicaAtivaSlot === slot);

        if (card) {
            if (isActive) {
                card.classList.add("ativo-no-momento");
            } else {
                card.classList.remove("ativo-no-momento");
            }
        }

        if (badge) {
            if (isActive) {
                badge.textContent = "▶ Tocando Agora";
                badge.className = "musica-slot-status em-execucao";
            } else if (track && track.nome) {
                badge.textContent = "✓ Carregado";
                badge.className = "musica-slot-status carregado";
            } else {
                badge.textContent = "Vazio";
                badge.className = "musica-slot-status";
            }
        }

        if (nomeArquivoEl) {
            if (track && track.nome) {
                let tagCorte = "";
                if (track.inicio > 0 || (typeof track.fim === "number" && track.fim > 0)) {
                    const inicioStr = formatarTempoAudio(track.inicio || 0);
                    const fimStr = (track.fim && track.fim > 0) ? formatarTempoAudio(track.fim) : "Fim";
                    tagCorte = ` <small style="color:var(--accent); font-size:11px; font-weight:normal; margin-left:4px;">✂️ (${inicioStr} - ${fimStr})</small>`;
                }
                nomeArquivoEl.innerHTML = `<span>🎵</span> <strong>${escapeHtml(track.nome)}</strong>${tagCorte}`;
            } else {
                nomeArquivoEl.innerHTML = `<span>🎧</span> <em>Nenhum arquivo .mp3 selecionado</em>`;
            }
        }

        if (btnRemover) {
            btnRemover.disabled = !track;
        }
        if (btnEditar) {
            btnEditar.disabled = !track;
            btnEditar.style.display = track ? "inline-flex" : "none";
        }
    });

    const slider = document.getElementById("musica_volume_slider");
    if (slider) {
        slider.value = musicaVolumeAtual;
    }
    const rotuloVal = document.getElementById("musica_volume_valor");
    if (rotuloVal) {
        rotuloVal.textContent = Math.round(musicaVolumeAtual * 100) + "%";
    }

    atualizarStatusPlayerUI();
    atualizarBotaoCabecalhoMusica();
}

function atualizarBotaoCabecalhoMusica() {
    const btn = document.getElementById("btn-abrir-modal-musica");
    const legenda = document.getElementById("legenda_musica_btn");
    if (!btn || !legenda) return;

    let count = 0;
    if (musicasPersonalizadas.vidaZero) count++;
    if (musicasPersonalizadas.combate) count++;
    if (musicasPersonalizadas.mentalBaixo) count++;
    if (musicasPersonalizadas.geral) count++;

    if (count > 0) {
        btn.classList.add("com-musicas");
        if (musicaAtivaSlot && !musicaPausadaPeloUsuario) {
            legenda.textContent = `Música ▶ (${count}/4)`;
        } else {
            legenda.textContent = `Música (${count}/4)`;
        }
        btn.title = `${count} trilha(s) .mp3 configurada(s). Clique para gerenciar o tocador.`;
    } else {
        btn.classList.remove("com-musicas");
        legenda.textContent = "Música";
        btn.title = "Tocador de Música com trilhas .mp3 e prioridade dinâmica";
    }
}

function obterEstadoMusicasParaSalvar() {
    return {
        vidaZero: musicasPersonalizadas.vidaZero ? { nome: musicasPersonalizadas.vidaZero.nome, inicio: musicasPersonalizadas.vidaZero.inicio, fim: musicasPersonalizadas.vidaZero.fim } : null,
        combate: musicasPersonalizadas.combate ? { nome: musicasPersonalizadas.combate.nome, inicio: musicasPersonalizadas.combate.inicio, fim: musicasPersonalizadas.combate.fim } : null,
        mentalBaixo: musicasPersonalizadas.mentalBaixo ? { nome: musicasPersonalizadas.mentalBaixo.nome, inicio: musicasPersonalizadas.mentalBaixo.inicio, fim: musicasPersonalizadas.mentalBaixo.fim } : null,
        geral: musicasPersonalizadas.geral ? { nome: musicasPersonalizadas.geral.nome, inicio: musicasPersonalizadas.geral.inicio, fim: musicasPersonalizadas.geral.fim } : null
    };
}

function aplicarMusicasDoEstado(estado) {
    if (estado && estado.musicas && typeof estado.musicas === "object") {
        ["vidaZero", "combate", "mentalBaixo", "geral"].forEach(slot => {
            const trackEstado = estado.musicas[slot];
            if (trackEstado && trackEstado.dados) {
                // Caso a ficha venha de um arquivo exportado com áudio embutido
                musicasPersonalizadas[slot] = {
                    nome: trackEstado.nome || "Música",
                    dados: trackEstado.dados,
                    raw: trackEstado.dados,
                    inicio: trackEstado.inicio || 0,
                    fim: trackEstado.fim || null
                };
                salvarMusicaIDB(slot, trackEstado.nome, trackEstado.dados, trackEstado.inicio, trackEstado.fim).catch(()=>{});
            }
        });
    }
    carregarMusicasArmazenadas();
}

function inicializarTocadorMusica() {
    carregarMusicasArmazenadas();
}

// ==========================================
// MÓDULO: MODO TÁTICO DE COMBATE
// ==========================================

const PERICIAS_COMBATE_CONFIG = [
    { nome: "Luta", grupo: "ataque", papel: "Ataque Corpo a Corpo", icone: "⚔️" },
    { nome: "Pontaria", grupo: "ataque", papel: "Tiro / À Distância", icone: "🎯" },
    { nome: "Arremesso", grupo: "ataque", papel: "Arremesso / Granadas", icone: "🪓" },
    { nome: "Reflexo", grupo: "defesa", papel: "Esquiva & Iniciativa", icone: "⚡" },
    { nome: "Rijeza", grupo: "defesa", papel: "Absorção & Bloqueio", icone: "🛡️" },
    { nome: "Atletismo", grupo: "defesa", papel: "Manobra & Corrida", icone: "🏃" },
    { nome: "Acrobacia", grupo: "defesa", papel: "Evasão Acrobática", icone: "🤸" },
    { nome: "Tática", grupo: "tatica", papel: "Iniciativa & Flanquear", icone: "🧠" },
    { nome: "Instinto", grupo: "tatica", papel: "Sentido de Perigo", icone: "👁️" },
    { nome: "Furtividade", grupo: "tatica", papel: "Emboscada / Ocultação", icone: "👤" },
    { nome: "Cirurgia", grupo: "tatica", papel: "Primeiros Socorros", icone: "🩹" },
    { nome: "Medicina", grupo: "tatica", papel: "Suporte Médico", icone: "💊" }
];

let filtroTaticoAtivo = "todas";
let buscaTaticaTexto = "";

function sincronizarModoTatico() {
    // 1. Nome do Personagem
    const nomePersonagemEl = document.getElementById("ficha_nome");
    const taticoNomeEl = document.getElementById("tatico-nome-personagem");
    if (taticoNomeEl && nomePersonagemEl) {
        taticoNomeEl.textContent = nomePersonagemEl.value.trim() || "Personagem sem nome";
    }

    // 2. Vida
    const vidaAtualEl = document.getElementById("recurso_vida_atual");
    const vidaMaxEl = document.getElementById("recurso_vida_max");
    const vidaTempEl = document.getElementById("recurso_vida_temp");

    const taticoVidaAtualEl = document.getElementById("tatico_vida_atual");
    const taticoVidaMaxEl = document.getElementById("tatico_vida_max");
    const taticoVidaTempEl = document.getElementById("tatico_vida_temp");
    const taticoVidaPctEl = document.getElementById("tatico_vida_pct");
    const taticoBarraVidaFill = document.getElementById("tatico_barra_vida_fill");
    const taticoBarraVidaTempFill = document.getElementById("tatico_barra_vida_temp_fill");

    const vAtual = vidaAtualEl ? parseInt(vidaAtualEl.value, 10) || 0 : 100;
    const vMax = vidaMaxEl ? parseInt(vidaMaxEl.value, 10) || 1 : 100;
    const vTemp = vidaTempEl ? parseInt(vidaTempEl.value, 10) || 0 : 0;

    if (taticoVidaAtualEl && document.activeElement !== taticoVidaAtualEl) taticoVidaAtualEl.value = vAtual;
    if (taticoVidaMaxEl && document.activeElement !== taticoVidaMaxEl) taticoVidaMaxEl.value = vMax;
    if (taticoVidaTempEl && document.activeElement !== taticoVidaTempEl) taticoVidaTempEl.value = vTemp;

    const propVida = Math.min(100, Math.max(0, (vAtual / vMax) * 100));
    if (taticoBarraVidaFill) taticoBarraVidaFill.style.width = propVida + "%";

    if (taticoBarraVidaTempFill) {
        if (vTemp > 0) {
            const propTemp = (vTemp / vMax) * 100;
            taticoBarraVidaTempFill.style.left = propVida + "%";
            taticoBarraVidaTempFill.style.width = Math.min(100 - propVida, propTemp) + "%";
            taticoBarraVidaTempFill.style.display = "block";
        } else {
            taticoBarraVidaTempFill.style.width = "0%";
            taticoBarraVidaTempFill.style.display = "none";
        }
    }

    if (taticoVidaPctEl) {
        const pctTotal = Math.round(((vAtual + vTemp) / vMax) * 100);
        taticoVidaPctEl.textContent = vTemp > 0 ? `${pctTotal}% (+${vTemp})` : `${Math.round(propVida)}%`;
    }
    const wrapTaticoVida = document.getElementById("wrap_tatico_vida_temp");
    if (wrapTaticoVida) {
        if (vTemp > 0) wrapTaticoVida.classList.add("tem-valor");
        else wrapTaticoVida.classList.remove("tem-valor");
    }

    // 3. Estamina
    const estAtualEl = document.getElementById("recurso_estamina_atual");
    const estMaxEl = document.getElementById("recurso_estamina_max");
    const estTempEl = document.getElementById("recurso_estamina_temp");

    const taticoEstAtualEl = document.getElementById("tatico_estamina_atual");
    const taticoEstMaxEl = document.getElementById("tatico_estamina_max");
    const taticoEstTempEl = document.getElementById("tatico_estamina_temp");
    const taticoEstPctEl = document.getElementById("tatico_estamina_pct");
    const taticoBarraEstFill = document.getElementById("tatico_barra_estamina_fill");
    const taticoBarraEstTempFill = document.getElementById("tatico_barra_estamina_temp_fill");

    const eAtual = estAtualEl ? parseInt(estAtualEl.value, 10) || 0 : 80;
    const eMax = estMaxEl ? parseInt(estMaxEl.value, 10) || 1 : 80;
    const eTemp = estTempEl ? parseInt(estTempEl.value, 10) || 0 : 0;

    if (taticoEstAtualEl && document.activeElement !== taticoEstAtualEl) taticoEstAtualEl.value = eAtual;
    if (taticoEstMaxEl && document.activeElement !== taticoEstMaxEl) taticoEstMaxEl.value = eMax;
    if (taticoEstTempEl && document.activeElement !== taticoEstTempEl) taticoEstTempEl.value = eTemp;

    const propEst = Math.min(100, Math.max(0, (eAtual / eMax) * 100));
    if (taticoBarraEstFill) taticoBarraEstFill.style.width = propEst + "%";

    if (taticoBarraEstTempFill) {
        if (eTemp > 0) {
            const propTemp = (eTemp / eMax) * 100;
            taticoBarraEstTempFill.style.left = propEst + "%";
            taticoBarraEstTempFill.style.width = Math.min(100 - propEst, propTemp) + "%";
            taticoBarraEstTempFill.style.display = "block";
        } else {
            taticoBarraEstTempFill.style.width = "0%";
            taticoBarraEstTempFill.style.display = "none";
        }
    }

    if (taticoEstPctEl) {
        const pctTotal = Math.round(((eAtual + eTemp) / eMax) * 100);
        taticoEstPctEl.textContent = eTemp > 0 ? `${pctTotal}% (+${eTemp})` : `${Math.round(propEst)}%`;
    }
    const wrapTaticoEst = document.getElementById("wrap_tatico_estamina_temp");
    if (wrapTaticoEst) {
        if (eTemp > 0) wrapTaticoEst.classList.add("tem-valor");
        else wrapTaticoEst.classList.remove("tem-valor");
    }

    // 4. Mental
    const mentalAtualEl = document.getElementById("recurso_mental_atual");
    const mentalMaxEl = document.getElementById("recurso_mental_max");
    const mentalTempEl = document.getElementById("recurso_mental_temp");

    const taticoMentalAtualEl = document.getElementById("tatico_mental_atual");
    const taticoMentalMaxEl = document.getElementById("tatico_mental_max");
    const taticoMentalTempEl = document.getElementById("tatico_mental_temp");
    const taticoMentalPctEl = document.getElementById("tatico_mental_pct");
    const taticoBarraMentalFill = document.getElementById("tatico_barra_mental_fill");
    const taticoBarraMentalTempFill = document.getElementById("tatico_barra_mental_temp_fill");

    const mAtual = mentalAtualEl ? parseInt(mentalAtualEl.value, 10) || 0 : 50;
    const mMax = mentalMaxEl ? parseInt(mentalMaxEl.value, 10) || 1 : 50;
    const mTemp = mentalTempEl ? parseInt(mentalTempEl.value, 10) || 0 : 0;

    if (taticoMentalAtualEl && document.activeElement !== taticoMentalAtualEl) taticoMentalAtualEl.value = mAtual;
    if (taticoMentalMaxEl && document.activeElement !== taticoMentalMaxEl) taticoMentalMaxEl.value = mMax;
    if (taticoMentalTempEl && document.activeElement !== taticoMentalTempEl) taticoMentalTempEl.value = mTemp;

    const propMental = Math.min(100, Math.max(0, (mAtual / mMax) * 100));
    if (taticoBarraMentalFill) taticoBarraMentalFill.style.width = propMental + "%";

    if (taticoBarraMentalTempFill) {
        if (mTemp > 0) {
            const propTemp = (mTemp / mMax) * 100;
            taticoBarraMentalTempFill.style.left = propMental + "%";
            taticoBarraMentalTempFill.style.width = Math.min(100 - propMental, propTemp) + "%";
            taticoBarraMentalTempFill.style.display = "block";
        } else {
            taticoBarraMentalTempFill.style.width = "0%";
            taticoBarraMentalTempFill.style.display = "none";
        }
    }

    if (taticoMentalPctEl) {
        const pctTotal = Math.round(((mAtual + mTemp) / mMax) * 100);
        taticoMentalPctEl.textContent = mTemp > 0 ? `${pctTotal}% (+${mTemp})` : `${Math.round(propMental)}%`;
    }
    const wrapTaticoMen = document.getElementById("wrap_tatico_mental_temp");
    if (wrapTaticoMen) {
        if (mTemp > 0) wrapTaticoMen.classList.add("tem-valor");
        else wrapTaticoMen.classList.remove("tem-valor");
    }

    // 5. Aura
    const auraAtualEl = document.getElementById("recurso_aura_atual");
    const auraMaxEl = document.getElementById("recurso_aura_max");
    const auraTempEl = document.getElementById("recurso_aura_temp");

    const taticoAuraAtualEl = document.getElementById("tatico_aura_atual");
    const taticoAuraMaxEl = document.getElementById("tatico_aura_max");
    const taticoAuraTempEl = document.getElementById("tatico_aura_temp");
    const taticoAuraPctEl = document.getElementById("tatico_aura_pct");
    const taticoBarraAuraFill = document.getElementById("tatico_barra_aura_fill");
    const taticoBarraAuraTempFill = document.getElementById("tatico_barra_aura_temp_fill");

    const aAtual = auraAtualEl ? parseInt(auraAtualEl.value, 10) || 0 : 30;
    const aMax = auraMaxEl ? parseInt(auraMaxEl.value, 10) || 1 : 30;
    const aTemp = auraTempEl ? parseInt(auraTempEl.value, 10) || 0 : 0;

    if (taticoAuraAtualEl && document.activeElement !== taticoAuraAtualEl) taticoAuraAtualEl.value = aAtual;
    if (taticoAuraMaxEl && document.activeElement !== taticoAuraMaxEl) taticoAuraMaxEl.value = aMax;
    if (taticoAuraTempEl && document.activeElement !== taticoAuraTempEl) taticoAuraTempEl.value = aTemp;

    const propAura = Math.min(100, Math.max(0, (aAtual / aMax) * 100));
    if (taticoBarraAuraFill) taticoBarraAuraFill.style.width = propAura + "%";

    if (taticoBarraAuraTempFill) {
        if (aTemp > 0) {
            const propTemp = (aTemp / aMax) * 100;
            taticoBarraAuraTempFill.style.left = propAura + "%";
            taticoBarraAuraTempFill.style.width = Math.min(100 - propAura, propTemp) + "%";
            taticoBarraAuraTempFill.style.display = "block";
        } else {
            taticoBarraAuraTempFill.style.width = "0%";
            taticoBarraAuraTempFill.style.display = "none";
        }
    }

    if (taticoAuraPctEl) {
        const pctTotal = Math.round(((aAtual + aTemp) / aMax) * 100);
        taticoAuraPctEl.textContent = aTemp > 0 ? `${pctTotal}% (+${aTemp})` : `${Math.round(propAura)}%`;
    }
    const wrapTaticoAur = document.getElementById("wrap_tatico_aura_temp");
    if (wrapTaticoAur) {
        if (aTemp > 0) wrapTaticoAur.classList.add("tem-valor");
        else wrapTaticoAur.classList.remove("tem-valor");
    }

    // 6. Badge de Status
    const statusEl = document.getElementById("tatico-status-personagem");
    if (statusEl) {
        statusEl.className = "tatico-status-badge";
        let statusId = "operacional";
        if (vAtual <= 0) {
            statusEl.classList.add("inconsciente");
            statusEl.textContent = "💀 Inconsciente / Morrendo";
            statusId = "inconsciente";
        } else if (vAtual <= vMax * 0.25) {
            statusEl.classList.add("critico");
            statusEl.textContent = "⚠️ Ferido Crítico";
            statusId = "critico";
        } else if (vAtual <= vMax * 0.5) {
            statusEl.classList.add("alerta");
            statusEl.textContent = "🩸 Ferido Grave";
            statusId = "alerta";
        } else if (mAtual <= 0) {
            statusEl.classList.add("critico");
            statusEl.textContent = "🌀 Colapso Mental";
            statusId = "critico";
        } else if (eAtual <= 10) {
            statusEl.classList.add("alerta");
            statusEl.textContent = "⚡ Exausto / Esgotado";
            statusId = "alerta";
        } else {
            statusEl.classList.add("operacional");
            statusEl.textContent = "💚 Operacional";
            statusId = "operacional";
        }

        if (typeof window._ultimoStatusVitalTatico !== "undefined" && window._ultimoStatusVitalTatico !== statusId) {
            if (typeof tocarSomStatus === "function") {
                if (statusId === "inconsciente" || statusId === "critico" || statusId === "alerta") {
                    tocarSomStatus("debuff", "ganhar", statusId);
                } else if (statusId === "operacional" && window._ultimoStatusVitalTatico !== "operacional") {
                    tocarSomStatus("buff", "ganhar", "operacional");
                }
            }
        }
        window._ultimoStatusVitalTatico = statusId;
    }

    if (typeof avaliarEstaminaCritica === "function") {
        avaliarEstaminaCritica();
    }

    if (typeof renderizarMembrosModoTatico === "function") {
        renderizarMembrosModoTatico();
    }
    if (typeof agendarSincronizacaoCampanha === "function") {
        agendarSincronizacaoCampanha();
    }
}

function ajustarRecursoTatico(chave, delta) {
    ajustarRecurso(chave, delta);
    sincronizarModoTatico();
}

function maximizarRecursoTatico(chave) {
    maximizarRecurso(chave);
    sincronizarModoTatico();
}

function ajustarInputRecursoTatico(chave) {
    const inputTatico = document.getElementById(`tatico_${chave}_atual`);
    const inputReal = document.getElementById(`recurso_${chave}_atual`);
    if (inputTatico && inputReal) {
        inputReal.value = inputTatico.value;
        atualizarBarraRecurso(chave);
        sincronizarModoTatico();
        marcarAlteracaoFeita();
    }
}

function ajustarInputMaxRecursoTatico(chave) {
    const inputTatico = document.getElementById(`tatico_${chave}_max`);
    const inputReal = document.getElementById(`recurso_${chave}_max`);
    if (inputTatico && inputReal) {
        inputReal.value = inputTatico.value;
        atualizarBarraRecurso(chave);
        sincronizarModoTatico();
        marcarAlteracaoFeita();
    }
}

function ajustarInputTempRecursoTatico(chave) {
    const inputTatico = document.getElementById(`tatico_${chave}_temp`);
    const inputReal = document.getElementById(`recurso_${chave}_temp`);
    if (inputTatico && inputReal) {
        inputReal.value = inputTatico.value;
        atualizarBarraRecurso(chave);
        sincronizarModoTatico();
        marcarAlteracaoFeita();
    }
}

function ajustarInputRecursoMeuCard(chave, valor) {
    const valNum = parseInt(valor, 10);
    const inputReal = document.getElementById(`recurso_${chave}_atual`);
    const inputTatico = document.getElementById(`tatico_${chave}_atual`);
    if (!isNaN(valNum)) {
        if (inputReal) inputReal.value = Math.max(0, valNum);
        if (inputTatico) inputTatico.value = Math.max(0, valNum);
        atualizarBarraRecurso(chave);
        marcarAlteracaoFeita();
    }
}

function ajustarInputMaxRecursoMeuCard(chave, valor) {
    const valNum = parseInt(valor, 10);
    const inputReal = document.getElementById(`recurso_${chave}_max`);
    const inputTatico = document.getElementById(`tatico_${chave}_max`);
    if (!isNaN(valNum)) {
        if (inputReal) inputReal.value = Math.max(1, valNum);
        if (inputTatico) inputTatico.value = Math.max(1, valNum);
        atualizarBarraRecurso(chave);
        marcarAlteracaoFeita();
    }
}

function ajustarInputTempRecursoMeuCard(chave, valor) {
    const valNum = parseInt(valor, 10);
    const inputReal = document.getElementById(`recurso_${chave}_temp`);
    const inputTatico = document.getElementById(`tatico_${chave}_temp`);
    if (!isNaN(valNum)) {
        const limpo = Math.max(0, valNum);
        if (inputReal) inputReal.value = limpo;
        if (inputTatico) inputTatico.value = limpo;
        atualizarBarraRecurso(chave);
        marcarAlteracaoFeita();
    }
}

function sincronizarTemaModoPlanta() {
    try {
        const cor = (typeof corPrincipalAtual !== "undefined" && corPrincipalAtual) ? corPrincipalAtual : (document.getElementById("ficha_cor")?.value || "#c9b183");
        localStorage.setItem("we_are_strangers_tema_cor", cor);
        localStorage.setItem("we_are_strangers_tema_contorno_ativo", String(typeof contornoLetrasAtivo !== "undefined" ? contornoLetrasAtivo : false));
        localStorage.setItem("we_are_strangers_tema_contorno_cor", typeof contornoLetrasCor !== "undefined" ? contornoLetrasCor : "#ffffff");
        if (window.BroadcastChannel) {
            const bc = new BroadcastChannel("we_are_strangers_theme_sync");
            bc.postMessage({ tipo: 'cor', valor: cor });
            bc.postMessage({ tipo: 'contorno_ativo', valor: typeof contornoLetrasAtivo !== "undefined" ? contornoLetrasAtivo : false });
            bc.postMessage({ tipo: 'contorno_cor', valor: typeof contornoLetrasCor !== "undefined" ? contornoLetrasCor : "#ffffff" });
            bc.close();
        }
    } catch(e) {}
}

function abrirModoPlanta() {
    sincronizarTemaModoPlanta();

    let novaJanela = null;
    let popupBloqueado = false;
    try {
        novaJanela = window.open('planta.html', '_blank');
        if (!novaJanela || novaJanela.closed || typeof novaJanela.closed === 'undefined') {
            popupBloqueado = true;
        }
    } catch(e) {
        popupBloqueado = true;
    }

    if (popupBloqueado) {
        abrirModalPlantaInApp();
    }
}

function abrirModoPlantaNovaAba() {
    sincronizarTemaModoPlanta();
    try {
        const a = document.createElement('a');
        a.href = 'planta.html';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch(e) {
        window.open('planta.html', '_blank');
    }
}

function abrirModalPlantaInApp() {
    const modal = document.getElementById("modal-planta-app");
    const iframe = document.getElementById("iframe-modo-planta");
    if (!modal) return;

    if (iframe && (!iframe.src || iframe.src === 'about:blank' || !iframe.src.includes('planta.html'))) {
        iframe.src = 'planta.html';
    }
    modal.style.display = "flex";
    requestAnimationFrame(() => {
        modal.classList.add("aberto");
        modal.setAttribute("aria-hidden", "false");
    });
}

function fecharModalPlanta() {
    const modal = document.getElementById("modal-planta-app");
    if (!modal) return;
    modal.classList.remove("aberto");
    modal.setAttribute("aria-hidden", "true");
    setTimeout(() => {
        if (!modal.classList.contains("aberto")) {
            modal.style.display = "none";
        }
    }, 200);
}

function fecharModalPlantaPorOverlay(event) {
    if (event.target && event.target.id === "modal-planta-app") {
        fecharModalPlanta();
    }
}

function recuperarFolegoCombate() {
    const estAtualEl = document.getElementById("recurso_estamina_atual");
    const estMaxEl = document.getElementById("recurso_estamina_max");
    const vidaAtualEl = document.getElementById("recurso_vida_atual");
    const vidaMaxEl = document.getElementById("recurso_vida_max");

    if (estAtualEl && estMaxEl) {
        const eMax = parseInt(estMaxEl.value, 10) || 80;
        let eAtual = parseInt(estAtualEl.value, 10) || 0;
        estAtualEl.value = Math.min(eMax, eAtual + 15);
        atualizarBarraRecurso('estamina');
    }
    if (vidaAtualEl && vidaMaxEl) {
        const vMax = parseInt(vidaMaxEl.value, 10) || 100;
        let vAtual = parseInt(vidaAtualEl.value, 10) || 0;
        vidaAtualEl.value = Math.min(vMax, vAtual + 5);
        atualizarBarraRecurso('vida');
    }
    sincronizarModoTatico();
    marcarAlteracaoFeita();
    if (typeof tocarSomStatus === "function") {
        tocarSomStatus("recuperacao", "ganhar", "folego", 20);
    } else if (typeof reproduzirSomCliqueSuave === "function") {
        reproduzirSomCliqueSuave();
    }
    mostrarStatus("💨 Fôlego rápido recuperado: +15 Estamina e +5 Vida!", "ok");
}

function restaurarCombateCompleto() {
    maximizarRecurso('vida');
    maximizarRecurso('mental');
    maximizarRecurso('estamina');
    maximizarRecurso('aura');
    sincronizarModoTatico();
    marcarAlteracaoFeita();
    if (typeof tocarSomStatus === "function") {
        tocarSomStatus("restaurar_tudo", "ganhar");
    } else if (typeof reproduzirSomCliqueSuave === "function") {
        reproduzirSomCliqueSuave();
    }
    mostrarStatus("✓ Recursos vitais restaurados ao máximo!", "ok");
}

function rolarIniciativaCombate() {
    const temReflexo = encontrarPericia("Reflexo");
    const periciaIniciativa = temReflexo ? "Reflexo" : "Tática";
    executarRolagemTatica(periciaIniciativa);
}

function filtrarPericiasTaticas(grupo) {
    filtroTaticoAtivo = grupo;
    document.querySelectorAll(".btn-tatico-filtro").forEach(b => b.classList.remove("ativo"));
    const btn = document.getElementById("filtro-tatico-" + grupo);
    if (btn) btn.classList.add("ativo");
    renderizarPericiasTaticas();
}

function filtrarPericiasTaticasPorTexto(val) {
    buscaTaticaTexto = (val || "").trim().toLowerCase();
    renderizarPericiasTaticas();
}

function renderizarPericiasTaticas() {
    const grid = document.getElementById("tatico-skills-grid");
    if (!grid) return;

    const filtradas = PERICIAS_COMBATE_CONFIG.filter(cfg => {
        if (filtroTaticoAtivo !== "todas" && cfg.grupo !== filtroTaticoAtivo) return false;
        if (buscaTaticaTexto) {
            const matchNome = cfg.nome.toLowerCase().includes(buscaTaticaTexto);
            const matchPapel = cfg.papel.toLowerCase().includes(buscaTaticaTexto);
            if (!matchNome && !matchPapel) return false;
        }
        return true;
    });

    if (filtradas.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; padding: 24px; text-align: center; color: var(--ink-dim);">Nenhuma perícia de combate encontrada para este filtro.</div>`;
        return;
    }

    let html = "";
    filtradas.forEach(cfg => {
        const pericia = encontrarPericia(cfg.nome);
        let formulaStr = "—";
        let attrStr = "";

        if (pericia) {
            const principal = obterAtributoPrincipal(pericia);
            const dadosBase = valorAtributo(principal);
            const modDados = dadosBonusDe(pericia.nome);
            const qtdDados = Math.max(0, dadosBase + modDados);
            const atributosAux = obterAtributosAuxiliares(pericia);
            const somaAtributos = atributosAux.reduce((total, attr) => total + valorAtributo(attr), 0);
            const puros = pontosPurosDe(pericia.nome);
            const bonusPts = pontosBonusDe(pericia.nome);
            const relacionados = calcularRelacionados(pericia);
            const pontosTotais = puros + bonusPts + relacionados;
            const bonusFixo = somaAtributos + pontosTotais;

            formulaStr = `${qtdDados}D6 ${bonusFixo >= 0 ? "+" : ""}${bonusFixo}`;
            attrStr = `${principal}${atributosAux.length > 0 ? ` + ${atributosAux.join("/")}` : ""}`;
        }

        html += `
            <div class="tatico-skill-card ${cfg.grupo}" id="tatico-card-${idSeguro(cfg.nome)}">
                <div class="tatico-skill-header">
                    <div class="tatico-skill-nome-wrap">
                        <span class="tatico-skill-ico">${cfg.icone}</span>
                        <span class="tatico-skill-nome">${escapeHTML(cfg.nome)}</span>
                    </div>
                    <span class="tatico-skill-tag">${escapeHTML(cfg.papel)}</span>
                </div>
                <div class="tatico-skill-detalhes">
                    <span class="tatico-skill-formula" title="Fórmula de Combate: Dados + Bônus Fixo">${formulaStr}</span>
                    <span class="tatico-skill-attr" title="Atributos Utilizados">${escapeHTML(attrStr)}</span>
                </div>
                <button type="button" class="btn-tatico-rolar" onclick="executarRolagemTatica('${escapeHTML(cfg.nome)}')" title="Rolar ${escapeHTML(cfg.nome)} em combate">
                    <span>🎲</span> Rolar ${escapeHTML(cfg.nome)}
                </button>
            </div>
        `;
    });

    grid.innerHTML = html;
}

function executarRolagemTatica(nomePericia) {
    const rollInfo = rolar(nomePericia);
    if (!rollInfo) return;

    const box = document.getElementById("tatico-resultado-box");
    if (box) {
        box.classList.remove("rolou");
        void box.offsetWidth;
        box.classList.add("rolou");

        const cfg = PERICIAS_COMBATE_CONFIG.find(c => c.nome === nomePericia) || { icone: "🎲", papel: "Combate" };
        const horario = rollInfo.itemHistorico ? rollInfo.itemHistorico.horario : new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const dadosStr = rollInfo.dados.join(" + ");
        const somaDadosStr = rollInfo.somaDados;

        box.innerHTML = `
            <div class="tatico-res-conteudo">
                <div class="tatico-res-topo">
                    <div class="tatico-res-pericia">
                        <span>${cfg.icone}</span>
                        <strong>${escapeHTML(nomePericia)}</strong>
                        <span class="tatico-skill-tag">${escapeHTML(cfg.papel)}</span>
                    </div>
                    <span class="tatico-res-horario">${horario}</span>
                </div>
                <div class="resultado-painel ${rollInfo.faixa.tipo}" style="margin: 4px 0 10px 0;">
                    ${typeof montarGalhosInvasores === "function" ? montarGalhosInvasores(rollInfo.faixa.tipo) : ""}
                    <div class="resultado-painel-topo">
                        <span class="resultado-painel-linha"></span>
                        <span class="resultado-painel-titulo">DESFECHO TÁTICO DE COMBATE</span>
                        <span class="resultado-painel-linha"></span>
                    </div>
                    <div class="resultado-painel-valor">${rollInfo.resultadoFinal}</div>
                    <div class="resultado-painel-selo">
                        ${rollInfo.seloDificuldade}
                    </div>
                </div>
                <div class="tatico-res-detalhes-grid">
                    <div class="tatico-res-item">
                        <span class="tatico-res-item-rotulo">Dados (${rollInfo.principal}):</span>
                        <span class="tatico-res-item-valor">${rollInfo.quantidadeDados}D6 → [${dadosStr}] = ${somaDadosStr}</span>
                    </div>
                    ${rollInfo.temAux ? `
                    <div class="tatico-res-item">
                        <span class="tatico-res-item-rotulo">Atributos Auxiliares:</span>
                        <span class="tatico-res-item-valor">+${rollInfo.somaAtributos} (${rollInfo.atributosAux.join(", ")})</span>
                    </div>` : ""}
                    <div class="tatico-res-item">
                        <span class="tatico-res-item-rotulo">Pontos de Perícia:</span>
                        <span class="tatico-res-item-valor">+${rollInfo.totalPontos} (P:${rollInfo.puros} B:${rollInfo.bonusPts} R:${rollInfo.relacionados})</span>
                    </div>
                    <div class="tatico-res-item">
                        <span class="tatico-res-item-rotulo">Cálculo Geral:</span>
                        <span class="tatico-res-item-valor">${somaDadosStr} + ${rollInfo.somaAtributos} + ${rollInfo.totalPontos} = <strong>${rollInfo.resultadoFinal}</strong></span>
                    </div>
                </div>
            </div>
        `;
    }

    mostrarStatus(`⚔️ Modo Tático: Rolou ${nomePericia}! [Total: ${rollInfo.resultadoFinal}]`, "ok");
}

const LISTA_CONDICOES_TATICAS = [
    { id: 'cobertura', nome: 'Em Cobertura', icone: '🛡️', tipo: 'buff', desc: '+Defesa / Cobertura contra ataques à distância' },
    { id: 'mirando', nome: 'Mirando', icone: '🎯', tipo: 'buff', desc: '+Precisão e foco para o próximo ataque' },
    { id: 'esquiva', nome: 'Foco Evasivo', icone: '💨', tipo: 'buff', desc: '+Reflexo e mobilidade de esquiva' },
    { id: 'ofensiva', nome: 'Postura Ofensiva', icone: '⚔️', tipo: 'buff', desc: '+Dano e agressividade em combate corporal' },
    { id: 'furtivo', nome: 'Furtivo / Oculto', icone: '👁️', tipo: 'buff', desc: 'Invisível ou nas sombras (Vantagem de surpresa)' },
    { id: 'guarda', nome: 'Guarda Alta', icone: '🥋', tipo: 'buff', desc: 'Postura defensiva focada em bloqueio (+2 Redução)' },
    { id: 'sangrando', nome: 'Sangrando', icone: '🩸', tipo: 'debuff-dano', desc: 'Perde vida progressivamente a cada rodada (-1 PV)' },
    { id: 'caido', nome: 'Caído', icone: '⚠️', tipo: 'debuff', desc: 'Desvantagem em testes, vulnerável a ataques' },
    { id: 'exausto', nome: 'Exausto', icone: '⚡', tipo: 'debuff', desc: 'Custo de Estamina dobrado / Ações lentas' },
    { id: 'atordoado', nome: 'Atordoado', icone: '🌀', tipo: 'debuff', desc: 'Incapaz de realizar ações no turno atual' },
    { id: 'envenenado', nome: 'Envenenado', icone: '🧪', tipo: 'debuff-dano', desc: 'Toxina no organismo reduzindo atributos e vigor' },
    { id: 'queimando', nome: 'Em Chamas', icone: '🔥', tipo: 'debuff-dano', desc: 'Dano ígneo contínuo por rodada' },
    { id: 'congelado', nome: 'Congelando', icone: '❄️', tipo: 'debuff', desc: 'Movimento e reflexos drasticamente reduzidos' },
    { id: 'imobilizado', nome: 'Imobilizado', icone: '⛓️', tipo: 'debuff', desc: 'Preso ou agarrado (Deslocamento 0)' }
];

// ============================================================
// GERENCIADOR DE CONDIÇÕES & POSTURAS DE COMBATE TÁTICO
// ============================================================
function obterMeuIdCampanha() {
    try {
        let id = localStorage.getItem('we_are_strangers_player_uuid');
        if (!id) {
            id = 'ply_' + Math.random().toString(36).substring(2, 11);
            localStorage.setItem('we_are_strangers_player_uuid', id);
        }
        return id;
    } catch(e) {
        return 'ply_local';
    }
}

let condicoesTaticasAtivas = new Set();
let membroAlvoCondicoesModal = null;
let filtroCategoriaCondicoesAtiva = 'todas';

function obterMetadadosCondicao(idOuNome) {
    if (!idOuNome) return { id: 'custom', nome: 'Condição', icone: '⚡', tipo: 'buff', desc: 'Efeito ativo' };
    const limpo = String(idOuNome).toLowerCase().trim();
    const encontrada = LISTA_CONDICOES_TATICAS.find(c => c.id === limpo || c.nome.toLowerCase() === limpo);
    if (encontrada) return encontrada;
    return {
        id: limpo,
        nome: idOuNome,
        icone: '⚡',
        tipo: 'buff',
        desc: 'Condição personalizada ativa'
    };
}

function alternarCondicaoRapida(condId) {
    if (condicoesTaticasAtivas.has(condId)) {
        condicoesTaticasAtivas.delete(condId);
        if (typeof tocarSomStatus === "function") {
            const ehNegativo = ["caido", "sangrando", "exausto", "atordoado", "envenenado", "queimando", "congelado", "imobilizado"].includes(condId);
            tocarSomStatus(ehNegativo ? "debuff" : "buff", "curar", condId);
        }
    } else {
        condicoesTaticasAtivas.add(condId);
        if (typeof tocarSomStatus === "function") {
            const ehNegativo = ["caido", "sangrando", "exausto", "atordoado", "envenenado", "queimando", "congelado", "imobilizado"].includes(condId);
            tocarSomStatus(ehNegativo ? "debuff" : "buff", "ganhar", condId);
        }
    }
    
    // Sincronizar botões legados se existirem
    const btns = document.querySelectorAll(".tatico-cond-chip");
    btns.forEach(b => {
        const onclickAttr = b.getAttribute("onclick") || "";
        if (onclickAttr.includes(`'${condId}'`)) {
            b.classList.toggle("ativo", condicoesTaticasAtivas.has(condId));
        }
    });

    salvarCondicoesStorage();
    if (typeof agendarSincronizacaoCampanha === "function") {
        agendarSincronizacaoCampanha();
    }
    if (typeof renderizarMembrosModoTatico === "function") {
        renderizarMembrosModoTatico();
    }
}

function toggleCondicaoTatica(btn, id) {
    if (!id) return;
    alternarCondicaoRapida(id);
    const ativo = condicoesTaticasAtivas.has(id);
    const meta = obterMetadadosCondicao(id);
    mostrarStatus(`${ativo ? 'Postura ativada' : 'Postura desativada'}: ${meta.nome}`, ativo ? "ok" : "");
}

function salvarCondicoesStorage() {
    try {
        localStorage.setItem('we_are_strangers_condicoes_taticas', JSON.stringify(Array.from(condicoesTaticasAtivas)));
    } catch(e) {}
}

function carregarCondicoesStorage() {
    try {
        const raw = localStorage.getItem('we_are_strangers_condicoes_taticas');
        if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
                condicoesTaticasAtivas = new Set(arr);
            }
        }
    } catch(e) {}
}
carregarCondicoesStorage();

function removerCondicaoMembro(membroId, condId) {
    const meuId = obterMeuIdCampanha();
    const ehMeu = (!membroId || membroId === meuId || !salaCampanhaAtiva || !Array.isArray(salaCampanhaAtiva.membros) || !salaCampanhaAtiva.membros.some(x => x.id === membroId));
    if (ehMeu) {
        alternarCondicaoRapida(condId);
    } else if (isMestreCampanha && salaCampanhaAtiva && Array.isArray(salaCampanhaAtiva.membros)) {
        const m = salaCampanhaAtiva.membros.find(x => x.id === membroId);
        if (m && Array.isArray(m.condicoes)) {
            m.condicoes = m.condicoes.filter(c => c !== condId);
            if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
                socketCampanha.send(JSON.stringify({
                    tipo: 'comando_mestre_atualizar_membro',
                    alvoId: membroId,
                    dados: { condicoes: m.condicoes }
                }));
            }
            if (typeof renderizarMembrosModoTatico === "function") {
                renderizarMembrosModoTatico();
            }
        }
    } else {
        alternarCondicaoRapida(condId);
    }
}

function abrirModalSeletorCondicoes(membroId) {
    const meuId = obterMeuIdCampanha();
    membroAlvoCondicoesModal = membroId || meuId;
    const modal = document.getElementById("modal-seletor-condicoes");
    if (!modal) return;
    
    modal.style.display = "flex";
    modal.classList.add("aberto");
    modal.setAttribute("aria-hidden", "false");
    
    filtroCategoriaCondicoesAtiva = 'todas';
    const inpBusca = document.getElementById("input_busca_condicoes");
    if (inpBusca) inpBusca.value = "";
    
    atualizarTabsFiltroCondicoes();
    renderizarGridModalCondicoes();
}

function fecharModalSeletorCondicoes() {
    const modal = document.getElementById("modal-seletor-condicoes");
    if (!modal) return;
    modal.style.display = "none";
    modal.classList.remove("aberto");
    modal.setAttribute("aria-hidden", "true");
    membroAlvoCondicoesModal = null;
}

function fecharModalSeletorCondicoesPorOverlay(event) {
    if (event.target && event.target.id === "modal-seletor-condicoes") {
        fecharModalSeletorCondicoes();
    }
}

function alternarFiltroTabCondicoes(cat) {
    filtroCategoriaCondicoesAtiva = cat;
    atualizarTabsFiltroCondicoes();
    renderizarGridModalCondicoes();
}

function atualizarTabsFiltroCondicoes() {
    const tabs = [
        { id: 'filtro_cond_tab_todas', cat: 'todas' },
        { id: 'filtro_cond_tab_buff', cat: 'buff' },
        { id: 'filtro_cond_tab_debuff', cat: 'debuff' },
        { id: 'filtro_cond_tab_dano', cat: 'debuff-dano' }
    ];
    tabs.forEach(t => {
        const el = document.getElementById(t.id);
        if (el) el.classList.toggle("ativo", filtroCategoriaCondicoesAtiva === t.cat);
    });
}

function filtrarCondicoesModal() {
    renderizarGridModalCondicoes();
}

function renderizarGridModalCondicoes() {
    const container = document.getElementById("modal-condicoes-grid-container");
    if (!container) return;

    const meuId = obterMeuIdCampanha();
    const ehMeu = (!membroAlvoCondicoesModal || membroAlvoCondicoesModal === meuId || !salaCampanhaAtiva || !Array.isArray(salaCampanhaAtiva.membros) || !salaCampanhaAtiva.membros.some(x => x.id === membroAlvoCondicoesModal));
    let condicoesAtuais = [];

    if (ehMeu) {
        condicoesAtuais = Array.from(condicoesTaticasAtivas);
    } else if (salaCampanhaAtiva && Array.isArray(salaCampanhaAtiva.membros)) {
        const m = salaCampanhaAtiva.membros.find(x => x.id === membroAlvoCondicoesModal);
        condicoesAtuais = (m && Array.isArray(m.condicoes)) ? m.condicoes : [];
    }

    const busca = (document.getElementById("input_busca_condicoes")?.value || "").toLowerCase().trim();

    let lista = LISTA_CONDICOES_TATICAS.filter(c => {
        if (filtroCategoriaCondicoesAtiva !== 'todas' && c.tipo !== filtroCategoriaCondicoesAtiva) {
            return false;
        }
        if (busca) {
            return c.nome.toLowerCase().includes(busca) || c.desc.toLowerCase().includes(busca);
        }
        return true;
    });

    container.innerHTML = lista.map(c => {
        const ativa = condicoesAtuais.includes(c.id);
        return `
            <div class="modal-condicao-card ${c.tipo} ${ativa ? 'ativa' : ''}" onclick="toggleCondicaoPeloModal('${c.id}')">
                <div class="modal-condicao-card-info">
                    <div class="modal-condicao-card-titulo">
                        <span>${c.icone}</span>
                        <span>${escapeHTML(c.nome)}</span>
                    </div>
                    <div class="modal-condicao-card-desc">${escapeHTML(c.desc)}</div>
                </div>
                <span class="modal-condicao-card-status">${ativa ? '✓ ATIVO' : '+ ATIVAR'}</span>
            </div>
        `;
    }).join('');
}

function toggleCondicaoPeloModal(condId) {
    const meuId = obterMeuIdCampanha();
    const ehMeu = (!membroAlvoCondicoesModal || membroAlvoCondicoesModal === meuId || !salaCampanhaAtiva || !Array.isArray(salaCampanhaAtiva.membros) || !salaCampanhaAtiva.membros.some(x => x.id === membroAlvoCondicoesModal));

    if (ehMeu) {
        alternarCondicaoRapida(condId);
    } else if (isMestreCampanha && salaCampanhaAtiva && Array.isArray(salaCampanhaAtiva.membros)) {
        const m = salaCampanhaAtiva.membros.find(x => x.id === membroAlvoCondicoesModal);
        if (m) {
            if (!Array.isArray(m.condicoes)) m.condicoes = [];
            if (m.condicoes.includes(condId)) {
                m.condicoes = m.condicoes.filter(c => c !== condId);
            } else {
                m.condicoes.push(condId);
            }
            if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
                socketCampanha.send(JSON.stringify({
                    tipo: 'comando_mestre_atualizar_membro',
                    alvoId: membroAlvoCondicoesModal,
                    dados: { condicoes: m.condicoes }
                }));
            }
            if (typeof renderizarMembrosModoTatico === "function") {
                renderizarMembrosModoTatico();
            }
        }
    } else {
        alternarCondicaoRapida(condId);
    }
    renderizarGridModalCondicoes();
}

function adicionarCondicaoPersonalizadaModal() {
    const inp = document.getElementById("input_nova_condicao_custom");
    const sel = document.getElementById("select_nova_condicao_tipo");
    if (!inp || !inp.value.trim()) return;

    const nome = inp.value.trim();
    const tipo = sel ? sel.value : 'buff';
    const id = 'custom_' + nome.toLowerCase().replace(/[^a-z0-9]/g, '_');

    if (!LISTA_CONDICOES_TATICAS.some(c => c.id === id)) {
        LISTA_CONDICOES_TATICAS.push({
            id: id,
            nome: nome,
            icone: tipo === 'buff' ? '🛡️' : (tipo === 'debuff-dano' ? '🩸' : '⚠️'),
            tipo: tipo,
            desc: 'Condição personalizada criada'
        });
    }

    inp.value = "";
    toggleCondicaoPeloModal(id);
    renderizarGridModalCondicoes();
}

function atualizarModoTatico() {
    sincronizarModoTatico();
    renderizarPericiasTaticas();
    if (typeof renderizarMembrosModoTatico === "function") {
        renderizarMembrosModoTatico();
    }
}

// ============================================================
// MÓDULO DE CAMPANHAS & MULTIPLAYER EM TEMPO REAL (WEBSOCKETS + REST FALLBACK)
// ============================================================
let socketCampanha = null;
let salaCampanhaAtiva = null;
let statusConexaoCampanha = 'offline';
let filtroFeedCampanhaAtivo = 'todos';
let reconectarCampanhaTimeout = null;
let tentativaReconexaoCampanha = 0;
let termoBuscaEquipeCampanha = '';
let subabaCampanhaAtiva = 'membros';
let isMestreCampanha = false;
let timeoutDebounceDiario = null;
let alertaMestreTimer = null;
let membrosTaticoExpandidos = new Set();
let timeoutSyncCampanha = null;
let timerHeartbeatCampanha = null;
let ultimoHeartbeatCampanha = Date.now();
let timerPollingFallbackCampanha = null;
let isConectandoCampanha = false;

function agendarSincronizacaoCampanha() {
    if (!socketCampanha || socketCampanha.readyState !== WebSocket.OPEN || !salaCampanhaAtiva) return;
    clearTimeout(timeoutSyncCampanha);
    timeoutSyncCampanha = setTimeout(() => {
        sincronizarEstadoComCampanha();
    }, 200);
}

function alternarExpandirTaticoMembro(membroId) {
    if (membrosTaticoExpandidos.has(membroId)) {
        membrosTaticoExpandidos.delete(membroId);
    } else {
        membrosTaticoExpandidos.add(membroId);
    }
    renderizarMembrosModoTatico();
}

function obterDadosJogadorLocal() {
    const infoNome = (typeof obterNomeExibicaoPersonagem === "function") ? obterNomeExibicaoPersonagem() : null;
    const nomePersonagem = (infoNome ? infoNome.completo : (document.getElementById("nome_personagem")?.value || document.getElementById("ficha_nome")?.value || "")).trim() || "Personagem Sem Nome";
    const nomeJogador = (document.getElementById("nome_jogador")?.value || "").trim() || "Jogador";
    const avatarImg = document.getElementById("ficha_avatar_img");
    const avatarSrc = (typeof avatarAtual !== "undefined" && avatarAtual) ? avatarAtual : ((avatarImg && avatarImg.src && !avatarImg.src.endsWith('/')) ? avatarImg.src : "");

    const classe1 = (document.getElementById("ficha_classe1")?.value || "").trim();
    const classe2 = (document.getElementById("ficha_classe2")?.value || "").trim();
    const nivel = (document.getElementById("ficha_nivel")?.value || "").trim();
    const corTema = (document.getElementById("ficha_cor")?.value || "#c9b183").trim();

    const vidaAtual = parseInt(document.getElementById("recurso_vida_atual")?.value || document.getElementById("pontos_vida")?.value, 10) ?? 100;
    const vidaMax = parseInt(document.getElementById("recurso_vida_max")?.value || document.getElementById("pontos_vida_max")?.value, 10) || 100;
    const vidaTemp = parseInt(document.getElementById("recurso_vida_temp")?.value, 10) || 0;

    const estaminaAtual = parseInt(document.getElementById("recurso_estamina_atual")?.value, 10) ?? 80;
    const estaminaMax = parseInt(document.getElementById("recurso_estamina_max")?.value, 10) || 80;
    const estaminaTemp = parseInt(document.getElementById("recurso_estamina_temp")?.value, 10) || 0;

    const mentalAtual = parseInt(document.getElementById("recurso_mental_atual")?.value || document.getElementById("pontos_sanidade")?.value, 10) ?? 50;
    const mentalMax = parseInt(document.getElementById("recurso_mental_max")?.value || document.getElementById("pontos_sanidade_max")?.value, 10) || 50;
    const mentalTemp = parseInt(document.getElementById("recurso_mental_temp")?.value, 10) || 0;

    const auraAtual = parseInt(document.getElementById("recurso_aura_atual")?.value, 10) ?? 30;
    const auraMax = parseInt(document.getElementById("recurso_aura_max")?.value, 10) || 30;
    const auraTemp = parseInt(document.getElementById("recurso_aura_temp")?.value, 10) || 0;

    const atributos = {
        HPR: parseInt(document.getElementById("attr_HPR")?.value, 10) || 1,
        PRX: parseInt(document.getElementById("attr_PRX")?.value, 10) || 1,
        PSI: parseInt(document.getElementById("attr_PSI")?.value, 10) || 1,
        QI: parseInt(document.getElementById("attr_QI")?.value, 10) || 1
    };

    // Calcular Perícias com mais Pontos Puros investidos
    const listaPericiasTotal = [...(typeof pericias !== 'undefined' ? pericias : []), ...(typeof personalizadas !== 'undefined' ? personalizadas : [])];
    const periciasProcessadas = listaPericiasTotal.map(p => {
        const id = typeof idSeguro === 'function' ? idSeguro(p.nome) : p.nome.replace(/\s+/g, '_');
        const puros = typeof pontosPuros !== 'undefined' && pontosPuros[p.nome] !== undefined 
            ? (parseInt(pontosPuros[p.nome], 10) || 0) 
            : (parseInt(document.getElementById("pp_" + id)?.value || document.getElementById("pp_" + p.nome)?.value, 10) || 0);
        
        const bonus = typeof pontosBonus !== 'undefined' && pontosBonus[p.nome] !== undefined 
            ? String(pontosBonus[p.nome]) 
            : (document.getElementById("pb_" + id)?.value || document.getElementById("pb_" + p.nome)?.value || "0");
        
        const totEl = document.getElementById("tot_" + id) || document.getElementById("tot_" + p.nome);
        const total = totEl ? (parseInt(totEl.textContent, 10) || 0) : puros;
        
        const attrPrinc = Array.isArray(p.atributos) ? p.atributos[0] : (p.atributo || "HPR");
        return {
            nome: p.nome,
            atributo: attrPrinc,
            puros: puros,
            bonus: bonus,
            total: total
        };
    });

    // Ordenar de forma decrescente pelos Pontos Puros (PP)
    periciasProcessadas.sort((a, b) => b.puros - a.puros);
    let periciasTop = periciasProcessadas.filter(p => p.puros > 0).slice(0, 8);
    if (periciasTop.length === 0 && periciasProcessadas.length > 0) {
        periciasTop = periciasProcessadas.slice(0, 4);
    }

    const conqIndividuais = [];
    const conqSecretas = [];
    const conqEquipe = [];

    const todas = [...CONQUISTAS_OFICIAIS, ...conquistasCampanha];
    todas.forEach(c => {
        if (conquistasDesbloqueadas.has(c.id)) {
            if (c.nivel2 === "equipe") {
                conqEquipe.push(c.id);
            } else {
                conqIndividuais.push(c.id);
            }
        }
    });

    CONQUISTAS_SECRETAS.forEach(c => {
        if (conquistasDesbloqueadas.has(c.id)) {
            conqSecretas.push(c.id);
        }
    });

    let playerId = "";
    try {
        playerId = localStorage.getItem('we_are_strangers_player_uuid') || "";
        if (!playerId) {
            playerId = 'ply_' + Math.random().toString(36).substring(2, 11);
            localStorage.setItem('we_are_strangers_player_uuid', playerId);
        }
    } catch(e) {
        playerId = 'ply_' + Date.now();
    }

    const infoNomes = (typeof obterNomeExibicaoPersonagem === "function") ? obterNomeExibicaoPersonagem() : null;

    return {
        id: playerId,
        nomePersonagem,
        nomeJogador,
        avatar: avatarSrc,
        isMestre: isMestreCampanha,
        classe1,
        classe2,
        nivel,
        corTema,
        vidaAtual,
        vidaMax,
        vidaTemp,
        estaminaAtual,
        estaminaMax,
        estaminaTemp,
        mentalAtual,
        mentalMax,
        mentalTemp,
        auraAtual,
        auraMax,
        auraTemp,
        sanidadeAtual: mentalAtual,
        sanidadeMax: mentalMax,
        recursoAtual: estaminaAtual,
        recursoMax: estaminaMax,
        atributos,
        periciasTop,
        conquistasIndividuais: conqIndividuais,
        conquistasSecretas: conqSecretas,
        conquistasEquipe: conqEquipe,
        trocarPorCodinome: infoNomes ? infoNomes.trocarPorCodinome : false,
        identidadeReal: infoNomes ? infoNomes.identidade : (document.getElementById("ficha_identidade")?.value || "").trim(),
        codinomeOriginal: infoNomes ? infoNomes.codinome : (document.getElementById("ficha_codinome")?.value || "").trim(),
        condicoes: Array.from(condicoesTaticasAtivas),
        reveladoPara: Array.from(identidadesReveladasLocais)
    };
}

let identidadesReveladasLocais = new Set();
let identidadesReveladasRecebidas = {};

function carregarIdentidadesReveladasStorage() {
    try {
        const raw = localStorage.getItem('we_are_strangers_identidades_reveladas');
        if (raw) {
            identidadesReveladasRecebidas = JSON.parse(raw) || {};
        }
        const rawLocais = localStorage.getItem('we_are_strangers_identidades_reveladas_locais');
        if (rawLocais) {
            const arr = JSON.parse(rawLocais) || [];
            identidadesReveladasLocais = new Set(arr);
        }
    } catch(e) {}
}

function salvarIdentidadesReveladasStorage() {
    try {
        localStorage.setItem('we_are_strangers_identidades_reveladas', JSON.stringify(identidadesReveladasRecebidas));
        localStorage.setItem('we_are_strangers_identidades_reveladas_locais', JSON.stringify(Array.from(identidadesReveladasLocais)));
    } catch(e) {}
}

carregarIdentidadesReveladasStorage();

let fichaCriadaNesteNavegador = true;
let fichaSenhaSegredo = "";
let fichaDesbloqueadaSessao = true;

function verificarSabeNomeVerdadeiro() {
    if (fichaCriadaNesteNavegador) return true;
    if (identidadesReveladasRecebidas && Object.keys(identidadesReveladasRecebidas).length > 0) {
        return true;
    }
    return false;
}

function atualizarTravaSenhaSegredoUI() {
    const sabeNome = verificarSabeNomeVerdadeiro();
    const lblTemCodinome = document.querySelector('label[for="ficha_tem_codinome"]');
    const blocoCodinome = document.getElementById("bloco_codinome");
    const wrapTrocar = document.getElementById("wrap_toggle_trocar_codinome");
    const btnSenha = document.getElementById("btn_config_senha_segredo");
    const containerTrava = document.getElementById("trava_senha_segredo_container");

    const chkCodi = document.getElementById("ficha_tem_codinome");
    const chkTrocar = document.getElementById("ficha_trocar_por_codinome");
    const emDisfarce = !!(chkCodi?.checked && chkTrocar?.checked);

    if (!sabeNome) {
        if (lblTemCodinome) lblTemCodinome.style.setProperty("display", "none", "important");
        if (blocoCodinome) blocoCodinome.style.setProperty("display", "none", "important");
        if (wrapTrocar) wrapTrocar.style.setProperty("display", "none", "important");
        if (btnSenha) btnSenha.style.display = "none";
        if (containerTrava) containerTrava.style.display = "none";
        return;
    }

    if (lblTemCodinome) lblTemCodinome.style.setProperty("display", "none", "important");
    if (btnSenha) btnSenha.style.setProperty("display", "none", "important");
    if (wrapTrocar) wrapTrocar.style.setProperty("display", "none", "important");

    if (emDisfarce && fichaSenhaSegredo && !fichaDesbloqueadaSessao) {
        if (blocoCodinome) blocoCodinome.style.setProperty("display", "none", "important");
        if (containerTrava) {
            containerTrava.style.display = "block";
            containerTrava.innerHTML = `
                <div style="background:var(--bg-inset); padding:10px 14px; border-radius:6px; border:1px solid #8e44ad; margin-top:6px; font-family:var(--font-corpo);">
                    <div style="font-weight:bold; color:#e0aaff; font-size:12px; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                        🔒 CODINOME & IDENTIDADE SECRETA PROTEGIDOS POR SENHA
                    </div>
                    <div style="font-size:11px; color:var(--ink-dim); margin-bottom:8px;">
                        Esta ficha está sob disfarce. Insira a senha criada pelo jogador para destravar e revelar a Identidade Secreta:
                    </div>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <input type="password" id="input_senha_segredo_destravar" placeholder="Digite a senha..." style="height:28px; font-size:12px; padding:0 8px; flex:1; background:var(--bg-card); color:var(--ink); border:1px solid var(--border);" onkeydown="if(event.key==='Enter') destravarSegredoComSenha()">
                        <button type="button" class="btn-secundario" style="height:28px; font-size:11px; padding:0 12px; border-color:#8e44ad; background:rgba(142,68,173,0.25); color:#e0aaff;" onclick="destravarSegredoComSenha()">
                            🔓 Destravar
                        </button>
                    </div>
                </div>
            `;
        }
        return;
    }

    if (containerTrava) containerTrava.style.display = "none";
}

function destravarSegredoComSenha() {
    const input = document.getElementById("input_senha_segredo_destravar");
    const digitada = input ? input.value.trim() : "";
    if (digitada && digitada === fichaSenhaSegredo) {
        fichaDesbloqueadaSessao = true;
        if (typeof mostrarStatus === "function") mostrarStatus("🔓 Identidade Secreta destravada com sucesso!", "ok");
        atualizarTravaSenhaSegredoUI();
        if (typeof atualizarNomesPersonagem === "function") atualizarNomesPersonagem();
    } else {
        if (typeof mostrarStatus === "function") mostrarStatus("✗ Senha incorreta! A Identidade Secreta permanece protegida.", "erro");
    }
}

function configurarSenhaSegredo() {
    const atualInfo = fichaSenhaSegredo ? ` (Já possui senha registrada)` : '';
    const nova = prompt(`🔒 Digite uma senha para proteger a Identidade Secreta em disfarce${atualInfo}:`, fichaSenhaSegredo || "1234");
    if (nova !== null) {
        fichaSenhaSegredo = nova.trim();
        fichaDesbloqueadaSessao = true;
        if (typeof mostrarStatus === "function") {
            if (fichaSenhaSegredo) {
                mostrarStatus("🔒 Senha da Identidade Secreta definida com sucesso!", "ok");
            } else {
                mostrarStatus("🔓 Senha removida.", "info");
            }
        }
        atualizarTravaSenhaSegredoUI();
        if (typeof atualizarNomesPersonagem === "function") atualizarNomesPersonagem();
    }
}

function aoTrocarIdentidadePorCodinomeCheckbox(checked) {
    if (checked && !fichaSenhaSegredo) {
        configurarSenhaSegredo();
    }
    atualizarNomesPersonagem();
}

function alternarRevelarIdentidadeParaMembro(destinatarioId, nomeDestinatario) {
    if (!destinatarioId) return;
    const jaRevelado = identidadesReveladasLocais.has(destinatarioId);
    const info = (typeof obterNomeExibicaoPersonagem === "function") ? obterNomeExibicaoPersonagem() : {};
    const meuId = localStorage.getItem('we_are_strangers_player_uuid');

    if (jaRevelado) {
        identidadesReveladasLocais.delete(destinatarioId);
        if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
            socketCampanha.send(JSON.stringify({
                type: 'revogar_identidade_secreta',
                destinatarioId: destinatarioId,
                remetenteId: meuId
            }));
        }
        mostrarStatus(`🔒 Sua verdadeira identidade voltou a ser OCULTA de ${nomeDestinatario || 'este aliado'}.`, "aviso");
    } else {
        identidadesReveladasLocais.add(destinatarioId);
        if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
            socketCampanha.send(JSON.stringify({
                type: 'revelar_identidade_secreta',
                destinatarioId: destinatarioId,
                remetenteId: meuId,
                identidadeReal: info.identidade || document.getElementById("ficha_identidade")?.value || 'Identidade Secreta',
                codinome: info.codinome || document.getElementById("ficha_codinome")?.value || 'Codinome'
            }));
        }
        mostrarStatus(`🎭 REVELAÇÃO: Sua verdadeira identidade (${info.identidade || 'Nome Real'}) foi revelada em segredo para ${nomeDestinatario || 'este aliado'}!`, "ok");
    }

    salvarIdentidadesReveladasStorage();
    if (typeof sincronizarEstadoComCampanha === "function") sincronizarEstadoComCampanha();
    if (typeof renderizarMembrosModoTatico === "function") renderizarMembrosModoTatico();
    if (typeof renderizarMembrosCampanha === "function") renderizarMembrosCampanha();
    if (typeof atualizarPainelRevelacoesFicha === "function") atualizarPainelRevelacoesFicha();
}

function alternarDisfarceCodinomeModoTatico() {
    const chkTrocar = document.getElementById("ficha_trocar_por_codinome");
    const chkCodi = document.getElementById("ficha_tem_codinome");
    const inputCodi = document.getElementById("ficha_codinome");

    const info = (typeof obterNomeExibicaoPersonagem === "function") ? obterNomeExibicaoPersonagem() : {};
    let estaDisfarcado = info.trocarPorCodinome && info.codinome;

    if (!estaDisfarcado) {
        let codiAtual = (inputCodi ? inputCodi.value : "").trim();
        if (!codiAtual) {
            const resp = prompt("Digite seu Codinome de Operação para usar como disfarce no Modo Tático:", "Agente X");
            if (!resp || !resp.trim()) {
                if (typeof mostrarStatus === "function") mostrarStatus("⚠️ É necessário informar um Codinome para ativar a troca de identidade.", "aviso");
                return;
            }
            codiAtual = resp.trim();
            if (inputCodi) inputCodi.value = codiAtual;
        }

        if (chkCodi) chkCodi.checked = true;
        if (typeof alternarCampoCodinome === "function") alternarCampoCodinome(true, false);
        if (chkTrocar) chkTrocar.checked = true;

        if (typeof mostrarStatus === "function") mostrarStatus(`🎭 TROCA DE IDENTIDADE: Seu Codinome "${codiAtual}" agora é sua identidade no Modo Tático!`, "ok");
    } else {
        if (chkTrocar) chkTrocar.checked = false;
        if (typeof mostrarStatus === "function") mostrarStatus(`👤 IDENTIDADE RESTAURADA: Você voltou a usar sua Identidade real.`, "info");
    }

    if (typeof atualizarNomesPersonagem === "function") atualizarNomesPersonagem();
    if (typeof sincronizarEstadoComCampanha === "function") sincronizarEstadoComCampanha();
    if (typeof renderizarMembrosModoTatico === "function") renderizarMembrosModoTatico();
    if (typeof renderizarMembrosCampanha === "function") renderizarMembrosCampanha();
    if (typeof atualizarPainelRevelacoesFicha === "function") atualizarPainelRevelacoesFicha();
}

function atualizarPainelRevelacoesFicha() {
    const el = document.getElementById("painel_revelacoes_segredo");
    if (!el) return;
    const info = (typeof obterNomeExibicaoPersonagem === "function") ? obterNomeExibicaoPersonagem() : {};
    
    if (!info.trocarPorCodinome || !info.codinome || !salaCampanhaAtiva || !salaCampanhaAtiva.membros || salaCampanhaAtiva.membros.length <= 1) {
        el.innerHTML = "";
        return;
    }

    const meuId = localStorage.getItem('we_are_strangers_player_uuid');
    const outrosMembros = (salaCampanhaAtiva.membros || []).filter(m => m.id !== meuId);

    if (outrosMembros.length === 0) {
        el.innerHTML = "";
        return;
    }

    let html = `
        <div style="background:var(--bg-inset); padding:10px; border-radius:6px; border:1px solid rgba(155, 89, 182, 0.3); margin-top:8px;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                <span style="font-weight:bold; color:#9b59b6; font-size:12px;">🎭 Controle de Segredo de Identidade:</span>
                <span style="font-size:10.5px; color:var(--ink-dim);">Revelado para ${identidadesReveladasLocais.size}/${outrosMembros.length} aliados</span>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
    `;

    outrosMembros.forEach(m => {
        const jaRev = identidadesReveladasLocais.has(m.id);
        const nomeM = m.nomePersonagem || "Aliado";
        html += `
            <button type="button" class="btn-secundario" style="height:26px; font-size:10.5px; padding:0 8px; margin:0; ${jaRev ? 'border-color:#8e44ad; background:rgba(142,68,173,0.15); color:#e0aaff;' : ''}" onclick="alternarRevelarIdentidadeParaMembro('${m.id}', '${escapeHTML(nomeM)}')" title="${jaRev ? 'Clique para esconder sua verdadeira identidade de ' + escapeHTML(nomeM) : 'Clique para revelar sua verdadeira identidade em segredo para ' + escapeHTML(nomeM)}">
                <span>${jaRev ? '👁️ ' + escapeHTML(nomeM) + ' (Revelado)' : '🔒 ' + escapeHTML(nomeM) + ' (Oculto)'}</span>
            </button>
        `;
    });

    html += `
            </div>
        </div>
    `;
    el.innerHTML = html;
}

function renderizarMembrosModoTatico() {
    const grid = document.getElementById("tatico-equipe-grid");
    const meta = document.getElementById("tatico-equipe-meta");
    if (!grid) return;

    const meuId = localStorage.getItem('we_are_strangers_player_uuid');
    const conectado = !!(salaCampanhaAtiva && salaCampanhaAtiva.codigo && socketCampanha && socketCampanha.readyState === WebSocket.OPEN);

    const secaoTatico = document.getElementById("secao-tatico");
    if (secaoTatico) {
        if (conectado) {
            secaoTatico.classList.add("em-sala-ativa");
        } else {
            secaoTatico.classList.remove("em-sala-ativa");
        }
    }

    if (meta) {
        if (conectado) {
            const totalOnline = salaCampanhaAtiva.membrosOnline || (salaCampanhaAtiva.membros || []).filter(m => m.online).length || 1;
            meta.innerHTML = `
                <span class="tatico-equipe-status-badge online" title="Sincronização em tempo real ativa na sala ${escapeHTML(salaCampanhaAtiva.codigo)}">
                    <span class="campanha-dot-pulse"></span>
                    <span>Sala: ${escapeHTML(salaCampanhaAtiva.codigo)} • ${totalOnline} Online</span>
                </span>
            `;
        } else {
            meta.innerHTML = `
                <span class="tatico-equipe-status-badge offline" title="Campanha desconectada">
                    <span>○ Campanha Desconectada</span>
                </span>
            `;
        }
    }

    // Preservar foco e estado dos inputs durante atualizações
    const activeEl = document.activeElement;
    const activeId = (activeEl && grid.contains(activeEl)) ? activeEl.id : null;
    let selStart = 0;
    let selEnd = 0;
    const deltaValuesPreserved = {};
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        try {
            selStart = activeEl.selectionStart;
            selEnd = activeEl.selectionEnd;
        } catch (e) {}
    }
    ['vida', 'estamina', 'mental', 'aura'].forEach(k => {
        const dEl = document.getElementById(`tatico_card_delta_${k}`);
        if (dEl && dEl.value) {
            deltaValuesPreserved[k] = dEl.value;
        }
    });

    let membrosParaRenderizar = [];
    if (conectado && Array.isArray(salaCampanhaAtiva.membros) && salaCampanhaAtiva.membros.length > 0) {
        membrosParaRenderizar = salaCampanhaAtiva.membros;
    } else {
        const localData = obterDadosJogadorLocal();
        localData.online = true;
        membrosParaRenderizar = [localData];
    }

    grid.innerHTML = "";

    if (!conectado) {
        const avisoDesconectado = document.createElement("div");
        avisoDesconectado.className = "tatico-desconectado-box";
        avisoDesconectado.innerHTML = `
            <div style="font-size:16px;">🏰 <strong>Status do Grupo Multiplayer (Desconectado)</strong></div>
            <div style="font-size:12.5px; color:var(--ink-dim); max-width:650px; line-height:1.5;">
                Conecte-se a uma sala na aba <strong>Campanhas</strong> para ver os status vitais, classes, atributos e perícias de todos os seus aliados em tempo real durante a sessão tática de combate.
            </div>
            <button type="button" class="btn-primario" style="height:32px; font-size:12px; padding:0 14px; margin-top:2px;" onclick="alternarAba('campanhas')">
                <span>⚔️ Entrar ou Criar Campanha</span>
            </button>
        `;
        grid.appendChild(avisoDesconectado);
    }

    membrosParaRenderizar.forEach(m => {
        const card = document.createElement("div");
        const ehMeu = (m.id === meuId);
        const aberto = membrosTaticoExpandidos.has(m.id);

        const pvAtual = m.vidaAtual ?? 100;
        const pvMax = m.vidaMax || 100;
        const pvTemp = m.vidaTemp || 0;
        const escalaPv = Math.max(pvMax, pvAtual + pvTemp);
        const pctPv = Math.max(0, Math.min(100, Math.round((pvAtual / escalaPv) * 100)));
        const pctPvTemp = pvTemp > 0 ? Math.max(0, Math.min(100 - pctPv, Math.round((pvTemp / escalaPv) * 100))) : 0;

        const estAtual = m.estaminaAtual ?? 80;
        const estMax = m.estaminaMax || 80;
        const estTemp = m.estaminaTemp || 0;
        const escalaEst = Math.max(estMax, estAtual + estTemp);
        const pctEst = Math.max(0, Math.min(100, Math.round((estAtual / escalaEst) * 100)));
        const pctEstTemp = estTemp > 0 ? Math.max(0, Math.min(100 - pctEst, Math.round((estTemp / escalaEst) * 100))) : 0;

        const menAtual = m.mentalAtual ?? 50;
        const menMax = m.mentalMax || 50;
        const menTemp = m.mentalTemp || 0;
        const escalaMen = Math.max(menMax, menAtual + menTemp);
        const pctMen = Math.max(0, Math.min(100, Math.round((menAtual / escalaMen) * 100)));
        const pctMenTemp = menTemp > 0 ? Math.max(0, Math.min(100 - pctMen, Math.round((menTemp / escalaMen) * 100))) : 0;

        const aurAtual = m.auraAtual ?? 30;
        const aurMax = m.auraMax || 30;
        const aurTemp = m.auraTemp || 0;
        const escalaAur = Math.max(aurMax, aurAtual + aurTemp);
        const pctAur = Math.max(0, Math.min(100, Math.round((aurAtual / escalaAur) * 100)));
        const pctAurTemp = aurTemp > 0 ? Math.max(0, Math.min(100 - pctAur, Math.round((aurTemp / escalaAur) * 100))) : 0;

        // Determinar status vital e destaque em vermelho (card pulsante + barra em alerta)
        let statusBadgeHtml = "";
        let ehVidaBaixa = false;
        let ehInconsciente = false;

        if (pvAtual <= 0) {
            ehInconsciente = true;
            statusBadgeHtml = `<span class="tatico-membro-status-tag" style="color:#ff3333;">💀 Inconsciente</span>`;
        } else if (pvAtual <= Math.ceil(pvMax * 0.25)) {
            ehVidaBaixa = true;
            statusBadgeHtml = `<span class="tatico-membro-status-tag" style="color:#e74c3c;">⚠️ Ferido Crítico</span>`;
        } else if (pvAtual <= Math.ceil(pvMax * 0.5)) {
            ehVidaBaixa = true;
            statusBadgeHtml = `<span class="tatico-membro-status-tag" style="color:#e67e22;">🩸 Ferido Grave</span>`;
        } else if (menAtual <= 0) {
            statusBadgeHtml = `<span class="tatico-membro-status-tag" style="color:#9b59b6;">🌀 Colapso Mental</span>`;
        } else if (estAtual <= 10) {
            statusBadgeHtml = `<span class="tatico-membro-status-tag" style="color:#f39c12;">⚡ Exausto</span>`;
        } else {
            statusBadgeHtml = `<span class="tatico-membro-status-tag" style="color:#2ecc71;">💚 Operacional</span>`;
        }

        let classesCard = "tatico-membro-card";
        if (ehMeu) classesCard += " eh-voce";
        if (ehInconsciente) classesCard += " tatico-card-inconsciente";
        else if (ehVidaBaixa) classesCard += " tatico-card-vida-baixa";

        card.className = classesCard;

        let avatarHtml = "👤";
        if (m.avatar && (m.avatar.startsWith("data:image") || m.avatar.startsWith("http") || m.avatar.startsWith("blob:") || m.avatar.startsWith("/") || m.avatar.length > 50)) {
            avatarHtml = `<img src="${m.avatar}" alt="${escapeHTML(m.nomePersonagem || 'Avatar')}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;
        } else if (m.corTema) {
            avatarHtml = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:${m.corTema}20; color:${m.corTema}; font-weight:bold; font-size:26px; border-radius:8px; font-family:'MirageFinal',serif;">${(m.nomePersonagem || "P").charAt(0).toUpperCase()}</div>`;
        } else {
            avatarHtml = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:rgba(201,177,131,0.15); color:var(--accent); font-weight:bold; font-size:26px; border-radius:8px; font-family:'MirageFinal',serif;">${(m.nomePersonagem || "P").charAt(0).toUpperCase()}</div>`;
        }

        const classesTexto = [m.classe1, m.classe2].filter(Boolean).join(" / ") || "Sem Classe Definida";
        const nivelTexto = m.nivel ? `• Nv. ${m.nivel}` : "";
        const jogadorTexto = m.nomeJogador ? `(${m.nomeJogador})` : "";

        const infoLocal = (typeof obterNomeExibicaoPersonagem === "function") ? obterNomeExibicaoPersonagem() : {};
        let nomeExibicaoHtml = "";
        let badgeDisfarceHtml = "";

        if (ehMeu) {
            nomeExibicaoHtml = escapeHTML(infoLocal.completo || m.nomePersonagem || "Sem Nome");
            if (infoLocal.trocarPorCodinome && infoLocal.codinome) {
                badgeDisfarceHtml = `<span class="tatico-tag-pilula disfarce" style="background:#8e44ad; color:#fff;" title="Você está disfarçado usando seu Codinome como Identidade pública.">🎭 DISFARÇADO</span>`;
            }
        } else {
            const revRecebida = identidadesReveladasRecebidas[m.id];
            const meRevelou = !!revRecebida || (Array.isArray(m.reveladoPara) && m.reveladoPara.includes(meuId));

            if (m.trocarPorCodinome) {
                if (meRevelou) {
                    const identReal = m.identidadeReal || (revRecebida ? revRecebida.identidadeReal : "Identidade Secreta");
                    const codiOrig = m.codinomeOriginal || m.nomePersonagem || (revRecebida ? revRecebida.codinome : "Codinome");
                    nomeExibicaoHtml = `<strong style="color:var(--ink);">${escapeHTML(identReal)}</strong>`;
                    badgeDisfarceHtml = `<span class="tatico-tag-pilula revelado" style="background:linear-gradient(135deg, #8e44ad, #2980b9); color:#fff; border:1px solid rgba(255,255,255,0.25);" title="Este personagem está usando um nome falso (${codiOrig}), mas revelou em segredo sua identidade real (${identReal}) para você!">🎭 NOME FALSO (${escapeHTML(codiOrig)})</span>`;
                } else {
                    nomeExibicaoHtml = escapeHTML(m.nomePersonagem || "Sem Nome");
                }
            } else {
                nomeExibicaoHtml = escapeHTML(m.nomePersonagem || "Sem Nome");
                if (meRevelou || revRecebida) {
                    badgeDisfarceHtml = `<span class="tatico-tag-pilula nome-real" style="background:#27ae60; color:#fff;" title="Este personagem está usando seu nome verdadeiro.">✓ NOME VERDADEIRO</span>`;
                }
            }
        }

        const jaReveladoParaMembro = identidadesReveladasLocais.has(m.id);
        const btnRevelarIdentidadeHtml = (!ehMeu && infoLocal.trocarPorCodinome && infoLocal.codinome) ? `
            <button type="button" class="btn-tatico-acao-rapida" style="${jaReveladoParaMembro ? 'border-color:#8e44ad; background:rgba(142,68,173,0.15); color:#e0aaff;' : ''}" onclick="alternarRevelarIdentidadeParaMembro('${m.id}', '${escapeHTML(m.nomePersonagem || 'Aliado')}')" title="${jaReveladoParaMembro ? 'Esconder sua verdadeira identidade deste jogador' : 'Revelar sua verdadeira identidade em segredo para este jogador'}">
                <span>${jaReveladoParaMembro ? '🔒 Ocultar' : '🎭 Revelar'}</span>
            </button>
        ` : '';

        let btnTrocarCodinomeMeuCardHtml = '';
        if (ehMeu) {
            const estaDisfarcadoMeuCard = !!identidadeSecretaAtiva;
            btnTrocarCodinomeMeuCardHtml = `
                <button type="button" class="btn-tatico-acao-rapida ${estaDisfarcadoMeuCard ? 'disfarcado' : ''}" onclick="alternarIdentidadeSecretaComSenha()" title="${estaDisfarcadoMeuCard ? 'Clique para desativar o disfarce e restaurar a Identidade Verdadeira (Exige Senha)' : 'Clique para alternar para a Identidade Falsa / Disfarce (Exige Senha)'}">
                    <span>${estaDisfarcadoMeuCard ? '🎭 Disfarce ON' : '🎭 Alternar Falsa'}</span>
                </button>
            `;
        }

        // Atributos
        const attrs = m.atributos || { HPR: 1, PRX: 1, PSI: 1, QI: 1 };

        // Perícias com Pontos Puros
        const periciasTop = Array.isArray(m.periciasTop) ? m.periciasTop : [];

        let periciasTopHtml = "";
        if (periciasTop.length > 0) {
            periciasTopHtml = periciasTop.map(p => {
                return `
                    <div class="tatico-top-skill-item">
                        <div class="tatico-top-skill-nome" title="${escapeHTML(p.nome)}">
                            ${escapeHTML(p.nome)} ${p.atributo ? `<small style="color:var(--ink-dim); font-size:9.5px;">[${p.atributo}]</small>` : ""}
                        </div>
                        <div class="tatico-top-skill-meta">
                            <span class="tatico-skill-pure-badge" title="Pontos Puros Investidos">+${p.puros || 0} PP</span>
                            <span class="tatico-skill-tot-badge" title="Total Calculado">Tot: ${p.total || p.puros || 0}</span>
                        </div>
                    </div>
                `;
            }).join("");
        } else {
            periciasTopHtml = `<div style="grid-column: 1 / -1; font-size:11.5px; color:var(--ink-dim); font-style:italic; padding:4px 0;">Nenhum Ponto Puro investido nesta ficha ainda.</div>`;
        }

        let vitaisHtml = "";
        if (ehMeu) {
            const pctPvTot = Math.round(((pvAtual + pvTemp) / pvMax) * 100);
            const pctEstTot = Math.round(((estAtual + estTemp) / estMax) * 100);
            const pctMenTot = Math.round(((menAtual + menTemp) / menMax) * 100);
            const pctAurTot = Math.round(((aurAtual + aurTemp) / aurMax) * 100);

            vitaisHtml = `
                <div class="tatico-membro-vitais meu-card-vitais">
                    <!-- Vida (PV) -->
                    <div class="tatico-membro-vital-linha-editavel vida-principal">
                        <div class="tatico-membro-vital-edit-topo">
                            <span class="tatico-membro-vital-lbl">❤ PV (Vida)</span>
                            <div class="tatico-membro-valores-controles">
                                <div class="tatico-card-inputs-wrap">
                                    <input type="number" id="tatico_card_inp_vida_atual" value="${pvAtual}" min="0" onchange="ajustarInputRecursoMeuCard('vida', this.value)" title="Vida Atual">
                                    <span style="color:var(--ink-faint); font-weight:bold; font-size:11px;">/</span>
                                    <input type="number" id="tatico_card_inp_vida_max" value="${pvMax}" min="1" onchange="ajustarInputMaxRecursoMeuCard('vida', this.value)" title="Vida Máxima">
                                </div>
                                <div class="tatico-card-temp-wrap ${pvTemp > 0 ? 'tem-valor' : ''}" id="wrap_tatico_card_vida_temp" title="Pontos de Vida Temporários">
                                    <span class="tatico-temp-sinal">+</span>
                                    <input type="number" id="tatico_card_inp_vida_temp" value="${pvTemp}" min="0" onchange="ajustarInputTempRecursoMeuCard('vida', this.value)" placeholder="0">
                                    <button type="button" class="tatico-temp-zerar" onclick="zerarRecursoTemporario('vida')" title="Zerar Vida Temporária (0)">✕</button>
                                </div>
                                <span class="tatico-card-pct-badge" id="tatico_card_vida_pct">${pvTemp > 0 ? `${pctPvTot}% (+${pvTemp})` : `${Math.round(pctPv)}%`}</span>
                            </div>
                        </div>
                        <div class="tatico-membro-vital-track" style="height:8px; border-radius:4px;">
                            <div class="tatico-membro-vital-fill pv ${ehVidaBaixa || ehInconsciente ? 'tatico-barra-vida-critica' : ''}" style="width: ${pctPv}%;"></div>
                            ${pctPvTemp > 0 ? `<div class="tatico-membro-vital-fill-temp vida" style="left: ${pctPv}%; width: ${pctPvTemp}%;"></div>` : ''}
                        </div>
                        <div class="tatico-membro-delta-row">
                            <div class="recurso-delta-box tatico-card-delta-box">
                                <span class="recurso-delta-sinal">±</span>
                                <input type="text" id="tatico_card_delta_vida" class="recurso-delta-input" placeholder="Ex: -10 ou +5 (Enter)" onkeydown="if(event.key==='Enter') aplicarAjusteDigitado('vida', this)">
                                <button type="button" class="btn-recurso-delta-enter" onclick="aplicarAjusteDigitado('vida', document.getElementById('tatico_card_delta_vida'))" title="Aplicar dano ou cura">↵</button>
                            </div>
                            <button type="button" class="tatico-card-btn-max" onclick="maximizarRecurso('vida')" title="Restaurar Vida ao Máximo">MAX</button>
                        </div>
                    </div>

                    <!-- Estamina -->
                    <div class="tatico-membro-vital-linha-editavel estamina-linha">
                        <div class="tatico-membro-vital-edit-topo">
                            <span class="tatico-membro-vital-lbl">⚡ EST (Estamina)</span>
                            <div class="tatico-membro-valores-controles">
                                <div class="tatico-card-inputs-wrap">
                                    <input type="number" id="tatico_card_inp_estamina_atual" value="${estAtual}" min="0" onchange="ajustarInputRecursoMeuCard('estamina', this.value)" title="Estamina Atual">
                                    <span style="color:var(--ink-faint); font-weight:bold; font-size:11px;">/</span>
                                    <input type="number" id="tatico_card_inp_estamina_max" value="${estMax}" min="1" onchange="ajustarInputMaxRecursoMeuCard('estamina', this.value)" title="Estamina Máxima">
                                </div>
                                <div class="tatico-card-temp-wrap ${estTemp > 0 ? 'tem-valor' : ''}" id="wrap_tatico_card_estamina_temp" title="Estamina Temporária">
                                    <span class="tatico-temp-sinal">+</span>
                                    <input type="number" id="tatico_card_inp_estamina_temp" value="${estTemp}" min="0" onchange="ajustarInputTempRecursoMeuCard('estamina', this.value)" placeholder="0">
                                    <button type="button" class="tatico-temp-zerar" onclick="zerarRecursoTemporario('estamina')" title="Zerar Estamina Temporária (0)">✕</button>
                                </div>
                                <span class="tatico-card-pct-badge" id="tatico_card_estamina_pct">${estTemp > 0 ? `${pctEstTot}% (+${estTemp})` : `${Math.round(pctEst)}%`}</span>
                            </div>
                        </div>
                        <div class="tatico-membro-vital-track" style="height:6px; border-radius:3px;">
                            <div class="tatico-membro-vital-fill est" style="width: ${pctEst}%;"></div>
                            ${pctEstTemp > 0 ? `<div class="tatico-membro-vital-fill-temp estamina" style="left: ${pctEst}%; width: ${pctEstTemp}%;"></div>` : ''}
                        </div>
                        <div class="tatico-membro-delta-row">
                            <div class="recurso-delta-box tatico-card-delta-box">
                                <span class="recurso-delta-sinal">±</span>
                                <input type="text" id="tatico_card_delta_estamina" class="recurso-delta-input" placeholder="Ex: -5 ou +10 (Enter)" onkeydown="if(event.key==='Enter') aplicarAjusteDigitado('estamina', this)">
                                <button type="button" class="btn-recurso-delta-enter" onclick="aplicarAjusteDigitado('estamina', document.getElementById('tatico_card_delta_estamina'))" title="Gastar ou recuperar estamina">↵</button>
                            </div>
                            <button type="button" class="tatico-card-btn-max" onclick="maximizarRecurso('estamina')" title="Restaurar Estamina ao Máximo">MAX</button>
                        </div>
                    </div>

                    <!-- Mental -->
                    <div class="tatico-membro-vital-linha-editavel mental-linha">
                        <div class="tatico-membro-vital-edit-topo">
                            <span class="tatico-membro-vital-lbl">Ψ MEN (Mental)</span>
                            <div class="tatico-membro-valores-controles">
                                <div class="tatico-card-inputs-wrap">
                                    <input type="number" id="tatico_card_inp_mental_atual" value="${menAtual}" min="0" onchange="ajustarInputRecursoMeuCard('mental', this.value)" title="Mental Atual">
                                    <span style="color:var(--ink-faint); font-weight:bold; font-size:11px;">/</span>
                                    <input type="number" id="tatico_card_inp_mental_max" value="${menMax}" min="1" onchange="ajustarInputMaxRecursoMeuCard('mental', this.value)" title="Mental Máximo">
                                </div>
                                <div class="tatico-card-temp-wrap ${menTemp > 0 ? 'tem-valor' : ''}" id="wrap_tatico_card_mental_temp" title="Sanidade/Mental Temporário">
                                    <span class="tatico-temp-sinal">+</span>
                                    <input type="number" id="tatico_card_inp_mental_temp" value="${menTemp}" min="0" onchange="ajustarInputTempRecursoMeuCard('mental', this.value)" placeholder="0">
                                    <button type="button" class="tatico-temp-zerar" onclick="zerarRecursoTemporario('mental')" title="Zerar Mental Temporário (0)">✕</button>
                                </div>
                                <span class="tatico-card-pct-badge" id="tatico_card_mental_pct">${menTemp > 0 ? `${pctMenTot}% (+${menTemp})` : `${Math.round(pctMen)}%`}</span>
                            </div>
                        </div>
                        <div class="tatico-membro-vital-track" style="height:6px; border-radius:3px;">
                            <div class="tatico-membro-vital-fill men" style="width: ${pctMen}%;"></div>
                            ${pctMenTemp > 0 ? `<div class="tatico-membro-vital-fill-temp mental" style="left: ${pctMen}%; width: ${pctMenTemp}%;"></div>` : ''}
                        </div>
                        <div class="tatico-membro-delta-row">
                            <div class="recurso-delta-box tatico-card-delta-box">
                                <span class="recurso-delta-sinal">±</span>
                                <input type="text" id="tatico_card_delta_mental" class="recurso-delta-input" placeholder="Ex: -5 ou +5 (Enter)" onkeydown="if(event.key==='Enter') aplicarAjusteDigitado('mental', this)">
                                <button type="button" class="btn-recurso-delta-enter" onclick="aplicarAjusteDigitado('mental', document.getElementById('tatico_card_delta_mental'))" title="Ajustar mental">↵</button>
                            </div>
                            <button type="button" class="tatico-card-btn-max" onclick="maximizarRecurso('mental')" title="Restaurar Sanidade/Mental ao Máximo">MAX</button>
                        </div>
                    </div>

                    <!-- Aura -->
                    <div class="tatico-membro-vital-linha-editavel aura-linha">
                        <div class="tatico-membro-vital-edit-topo">
                            <span class="tatico-membro-vital-lbl">✧ AUR (Aura)</span>
                            <div class="tatico-membro-valores-controles">
                                <div class="tatico-card-inputs-wrap">
                                    <input type="number" id="tatico_card_inp_aura_atual" value="${aurAtual}" min="0" onchange="ajustarInputRecursoMeuCard('aura', this.value)" title="Aura Atual">
                                    <span style="color:var(--ink-faint); font-weight:bold; font-size:11px;">/</span>
                                    <input type="number" id="tatico_card_inp_aura_max" value="${aurMax}" min="1" onchange="ajustarInputMaxRecursoMeuCard('aura', this.value)" title="Aura Máxima">
                                </div>
                                <div class="tatico-card-temp-wrap ${aurTemp > 0 ? 'tem-valor' : ''}" id="wrap_tatico_card_aura_temp" title="Aura Temporária / Escudo">
                                    <span class="tatico-temp-sinal">+</span>
                                    <input type="number" id="tatico_card_inp_aura_temp" value="${aurTemp}" min="0" onchange="ajustarInputTempRecursoMeuCard('aura', this.value)" placeholder="0">
                                    <button type="button" class="tatico-temp-zerar" onclick="zerarRecursoTemporario('aura')" title="Zerar Aura Temporária (0)">✕</button>
                                </div>
                                <span class="tatico-card-pct-badge" id="tatico_card_aura_pct">${aurTemp > 0 ? `${pctAurTot}% (+${aurTemp})` : `${Math.round(pctAur)}%`}</span>
                            </div>
                        </div>
                        <div class="tatico-membro-vital-track" style="height:6px; border-radius:3px;">
                            <div class="tatico-membro-vital-fill aur" style="width: ${pctAur}%; ${m.corTema ? `background: linear-gradient(90deg, ${m.corTema}, ${m.corTema}dd);` : ''}"></div>
                            ${pctAurTemp > 0 ? `<div class="tatico-membro-vital-fill-temp aura" style="left: ${pctAur}%; width: ${pctAurTemp}%;"></div>` : ''}
                        </div>
                        <div class="tatico-membro-delta-row">
                            <div class="recurso-delta-box tatico-card-delta-box">
                                <span class="recurso-delta-sinal">±</span>
                                <input type="text" id="tatico_card_delta_aura" class="recurso-delta-input" placeholder="Ex: -5 ou +10 (Enter)" onkeydown="if(event.key==='Enter') aplicarAjusteDigitado('aura', this)">
                                <button type="button" class="btn-recurso-delta-enter" onclick="aplicarAjusteDigitado('aura', document.getElementById('tatico_card_delta_aura'))" title="Ajustar aura">↵</button>
                            </div>
                            <button type="button" class="tatico-card-btn-max" onclick="maximizarRecurso('aura')" title="Restaurar Aura ao Máximo">MAX</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            vitaisHtml = `
                <div class="tatico-membro-vitais">
                    <!-- Vida (Barra em destaque) -->
                    <div class="tatico-membro-vital-linha vida-principal" title="Vida / PV: ${pvAtual}/${pvMax}${pvTemp > 0 ? ` (+${pvTemp} Temp)` : ''}">
                        <span class="tatico-membro-vital-lbl">❤ PV</span>
                        <div class="tatico-membro-vital-track">
                            <div class="tatico-membro-vital-fill pv ${ehVidaBaixa || ehInconsciente ? 'tatico-barra-vida-critica' : ''}" style="width: ${pctPv}%;"></div>
                            ${pctPvTemp > 0 ? `<div class="tatico-membro-vital-fill-temp vida" style="left: ${pctPv}%; width: ${pctPvTemp}%;"></div>` : ''}
                        </div>
                        <div class="tatico-membro-vital-val-box">
                            <span class="tatico-membro-vital-val" style="${ehVidaBaixa || ehInconsciente ? 'color:#ff4d4d; font-weight:bold;' : ''}">${pvAtual}/${pvMax}</span>
                            ${pvTemp > 0 ? `<span class="tatico-membro-temp-tag vida" title="Pontos Temporários: +${pvTemp}">+${pvTemp}</span>` : ''}
                        </div>
                    </div>

                    <!-- Recursos Secundários -->
                    <div class="tatico-membro-sec-vitais">
                        <!-- Estamina -->
                        <div class="tatico-membro-vital-linha estamina-linha" title="Estamina: ${estAtual}/${estMax}${estTemp > 0 ? ` (+${estTemp} Temp)` : ''}">
                            <span class="tatico-membro-vital-lbl">⚡ EST</span>
                            <div class="tatico-membro-vital-track">
                                <div class="tatico-membro-vital-fill est" style="width: ${pctEst}%;"></div>
                                ${pctEstTemp > 0 ? `<div class="tatico-membro-vital-fill-temp estamina" style="left: ${pctEst}%; width: ${pctEstTemp}%;"></div>` : ''}
                            </div>
                            <div class="tatico-membro-vital-val-box">
                                <span class="tatico-membro-vital-val">${estAtual}/${estMax}</span>
                                ${estTemp > 0 ? `<span class="tatico-membro-temp-tag estamina" title="Pontos Temporários: +${estTemp}">+${estTemp}</span>` : ''}
                            </div>
                        </div>
                        <!-- Mental -->
                        <div class="tatico-membro-vital-linha mental-linha" title="Mental / Sanidade: ${menAtual}/${menMax}${menTemp > 0 ? ` (+${menTemp} Temp)` : ''}">
                            <span class="tatico-membro-vital-lbl">Ψ MEN</span>
                            <div class="tatico-membro-vital-track">
                                <div class="tatico-membro-vital-fill men" style="width: ${pctMen}%;"></div>
                                ${pctMenTemp > 0 ? `<div class="tatico-membro-vital-fill-temp mental" style="left: ${pctMen}%; width: ${pctMenTemp}%;"></div>` : ''}
                            </div>
                            <div class="tatico-membro-vital-val-box">
                                <span class="tatico-membro-vital-val">${menAtual}/${menMax}</span>
                                ${menTemp > 0 ? `<span class="tatico-membro-temp-tag mental" title="Pontos Temporários: +${menTemp}">+${menTemp}</span>` : ''}
                            </div>
                        </div>
                        <!-- Aura -->
                        <div class="tatico-membro-vital-linha aura-linha" title="Aura: ${aurAtual}/${aurMax}${aurTemp > 0 ? ` (+${aurTemp} Temp)` : ''}">
                            <span class="tatico-membro-vital-lbl">✧ AUR</span>
                            <div class="tatico-membro-vital-track">
                                <div class="tatico-membro-vital-fill aur" style="width: ${pctAur}%; ${m.corTema ? `background: linear-gradient(90deg, ${m.corTema}, ${m.corTema}dd);` : ''}"></div>
                                ${pctAurTemp > 0 ? `<div class="tatico-membro-vital-fill-temp aura" style="left: ${pctAur}%; width: ${pctAurTemp}%;"></div>` : ''}
                            </div>
                            <div class="tatico-membro-vital-val-box">
                                <span class="tatico-membro-vital-val">${aurAtual}/${aurMax}</span>
                                ${aurTemp > 0 ? `<span class="tatico-membro-temp-tag aura" title="Pontos Temporários: +${aurTemp}">+${aurTemp}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        const condicoesMembro = ehMeu 
            ? Array.from(condicoesTaticasAtivas) 
            : (Array.isArray(m.condicoes) ? m.condicoes : []);

        const condicoesHtml = `
            <div class="tatico-membro-condicoes-bloco" id="tatico_cond_bloco_${m.id}">
                <div class="tatico-membro-condicoes-topo">
                    <div class="tatico-membro-condicoes-titulo">
                        <span class="tatico-membro-condicoes-label">Condições</span>
                    </div>
                </div>
                
                <div class="tatico-membro-condicoes-lista ${condicoesMembro.length === 0 ? 'vazio' : ''}">
                    ${condicoesMembro.length > 0 ? `
                        ${condicoesMembro.map(cId => {
                            const meta = obterMetadadosCondicao(cId);
                            const tooltipTxt = `【${meta.nome}】\n${meta.desc}${(ehMeu || isMestreCampanha) ? '\n(Clique para remover)' : ''}`;
                            return `
                                <div class="tatico-cond-ico-badge ${meta.tipo}" 
                                     title="${escapeHTML(tooltipTxt)}" 
                                     onclick="${(ehMeu || isMestreCampanha) ? `removerCondicaoMembro('${m.id}', '${meta.id}')` : `abrirModalSeletorCondicoes('${m.id}')`}"
                                     role="button"
                                     tabindex="0">
                                    <span>${meta.icone}</span>
                                </div>
                            `;
                        }).join('')}
                        ${(ehMeu || isMestreCampanha) ? `
                            <div class="tatico-cond-add-tile" 
                                 onclick="abrirModalSeletorCondicoes('${m.id}')" 
                                 title="Adicionar condição ou postura" 
                                 role="button" 
                                 tabindex="0">
                                <span>+</span>
                            </div>
                        ` : ''}
                    ` : `
                        <div class="tatico-condicoes-vazio-msg">
                            <span>Nenhuma aflição ativa</span>
                            ${(ehMeu || isMestreCampanha) ? `<button type="button" class="btn-tatico-vazio-add" onclick="abrirModalSeletorCondicoes('${m.id}')">+ Condição</button>` : ''}
                        </div>
                    `}
                </div>
            </div>
        `;

        card.innerHTML = `
            <div class="tatico-membro-hero-body">
                <!-- Coluna Esquerda: Retrato Heroico Destacado + Organizador de Condições -->
                <div class="tatico-membro-portrait-col">
                    <div class="tatico-membro-avatar-wrap">
                        <div class="tatico-membro-avatar" style="${m.corTema ? `border-color: ${m.corTema};` : ''}">${avatarHtml}</div>
                        <span class="tatico-avatar-online-dot ${m.online !== false ? 'online' : 'offline'}" title="${m.online !== false ? 'Conectado' : 'Ausente'}"></span>
                    </div>
                    <div class="tatico-membro-status-box">
                        ${statusBadgeHtml}
                    </div>
                    ${condicoesHtml}
                </div>

                <!-- Coluna Direita: Informações, Badges e Medidores Vitais -->
                <div class="tatico-membro-main-col">
                    <div class="tatico-membro-header-row">
                        <div class="tatico-membro-nome-group">
                            <span class="tatico-membro-nome" title="${escapeHTML(m.nomePersonagem || 'Personagem')}">
                                ${nomeExibicaoHtml}
                            </span>
                            <div class="tatico-membro-tags">
                                ${m.isMestre ? `<span class="tatico-tag-pilula mestre">MESTRE</span>` : ""}
                                ${ehMeu ? `<span class="tatico-tag-pilula voce">VOCÊ</span>` : ""}
                                ${badgeDisfarceHtml}
                            </div>
                        </div>
                        <div class="tatico-membro-acoes-topo">
                            ${btnTrocarCodinomeMeuCardHtml}
                            ${btnRevelarIdentidadeHtml}
                        </div>
                    </div>

                    <div class="tatico-membro-meta-row">
                        <span class="tatico-membro-classes">${escapeHTML(classesTexto)} ${nivelTexto}</span>
                        ${jogadorTexto ? `<span class="tatico-membro-jogador-tag">${escapeHTML(jogadorTexto)}</span>` : ''}
                    </div>

                    <!-- Monitoramento dos 4 Recursos Vitais -->
                    ${vitaisHtml}
                </div>
            </div>

            <!-- Botão de Expansão de Atributos & Perícias -->
            <button type="button" class="btn-expandir-tatico-membro" onclick="alternarExpandirTaticoMembro('${m.id}')" aria-expanded="${aberto}">
                <span>📊 ${aberto ? 'Ocultar Atributos & Melhores Perícias' : 'Ver Atributos & Melhores Perícias'}</span>
                <span style="font-size:12px; font-weight:bold; transition:transform 0.2s ease; ${aberto ? 'transform:rotate(180deg);' : ''}">⌄</span>
            </button>

            <!-- Seção Expansível -->
            <div class="tatico-membro-expandido ${aberto ? 'aberto' : ''}" id="tatico-exp-${m.id}">
                <!-- Atributos Base -->
                <div>
                    <div class="tatico-membro-pericias-titulo">
                        <span>📊 Atributos Base:</span>
                    </div>
                    <div class="tatico-membro-attrs-grid" style="margin-top:4px;">
                        <div class="tatico-attr-pill">
                            <span class="tatico-attr-pill-lbl">HPR</span>
                            <span class="tatico-attr-pill-val">${attrs.HPR ?? 1}</span>
                        </div>
                        <div class="tatico-attr-pill">
                            <span class="tatico-attr-pill-lbl">PRX</span>
                            <span class="tatico-attr-pill-val">${attrs.PRX ?? 1}</span>
                        </div>
                        <div class="tatico-attr-pill">
                            <span class="tatico-attr-pill-lbl">PSI</span>
                            <span class="tatico-attr-pill-val">${attrs.PSI ?? 1}</span>
                        </div>
                        <div class="tatico-attr-pill">
                            <span class="tatico-attr-pill-lbl">QI</span>
                            <span class="tatico-attr-pill-val">${attrs.QI ?? 1}</span>
                        </div>
                    </div>
                </div>

                <!-- Perícias com Pontos Puros -->
                <div class="tatico-membro-pericias-wrap">
                    <div class="tatico-membro-pericias-titulo">
                        <span>🎯 Perícias Principais (Pontos Puros):</span>
                    </div>
                    <div class="tatico-top-skills-grid">
                        ${periciasTopHtml}
                    </div>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });

    // Restaurar valores nos inputs delta se estavam sendo digitados
    ['vida', 'estamina', 'mental', 'aura'].forEach(k => {
        if (deltaValuesPreserved[k]) {
            const dEl = document.getElementById(`tatico_card_delta_${k}`);
            if (dEl) dEl.value = deltaValuesPreserved[k];
        }
    });

    // Restaurar foco e seleção do elemento ativo
    if (activeId) {
        const restoredEl = document.getElementById(activeId);
        if (restoredEl) {
            restoredEl.focus();
            try {
                restoredEl.setSelectionRange(selStart, selEnd);
            } catch (e) {}
        }
    }
}

function alternarPapelMestreCampanha() {
    const meuId = localStorage.getItem('we_are_strangers_player_uuid');
    let mestreAutorizado = false;
    
    if (salaCampanhaAtiva) {
        if (salaCampanhaAtiva.criadorId === meuId) {
            mestreAutorizado = true;
        } else if (Array.isArray(salaCampanhaAtiva.membros)) {
            const meuMembro = salaCampanhaAtiva.membros.find(m => m.id === meuId);
            if (meuMembro && meuMembro.isMestre) {
                mestreAutorizado = true;
            }
        }
    } else {
        mestreAutorizado = true;
    }

    if (!isMestreCampanha && !mestreAutorizado) {
        mostrarStatus("🔒 Apenas o Criador da sala ou um Mestre pode conceder acesso de Mestre.", "aviso");
        return;
    }

    isMestreCampanha = !isMestreCampanha;
    const lbl = document.getElementById("lbl-papel-mestre");
    const btnMestreTab = document.getElementById("btn-subtab-mestre");
    if (lbl) lbl.textContent = isMestreCampanha ? "Mestre / Narrador" : "Jogador";
    if (btnMestreTab) btnMestreTab.style.display = isMestreCampanha ? "flex" : "none";
    
    if (isMestreCampanha) {
        mostrarStatus("🎭 Modo Narrador/Mestre ativado na campanha.", "ok");
        popularSelectConquistasEquipeMestre();
    } else {
        mostrarStatus("🎭 Modo Jogador ativado.", "info");
        if (subabaCampanhaAtiva === 'mestre') {
            alternarSubabaCampanha('membros');
        }
    }
    if (typeof atualizarBloqueioAbasNavegadorUI === "function") {
        atualizarBloqueioAbasNavegadorUI();
    }
    sincronizarEstadoComCampanha();
}

function alternarSubabaCampanha(subaba) {
    subabaCampanhaAtiva = subaba;
    const abas = ['membros', 'equipe', 'mural', 'diario', 'mestre'];
    abas.forEach(nome => {
        const btn = document.getElementById(`btn-subtab-${nome}`);
        const view = document.getElementById(`subview-campanha-${nome}`);
        if (btn) {
            if (nome === subaba) btn.classList.add("ativa");
            else btn.classList.remove("ativa");
        }
        if (view) {
            view.style.display = (nome === subaba) ? "block" : "none";
        }
    });
    if (subaba === 'mural') {
        atualizarContadorAntiSpamChat();
        setTimeout(() => {
            const feed = document.getElementById("campanha-feed-lista");
            if (feed) feed.scrollTop = feed.scrollHeight;
        }, 50);
    }
}

function atualizarBadgeStatusCampanha(status, codigo = "") {
    statusConexaoCampanha = status;
    const badgeNav = document.getElementById("tab-badge-campanhas-status");
    const statusPill = document.getElementById("campanha-status-badge");
    const displayCod = document.getElementById("campanha-codigo-display");
    const headerAcoes = document.getElementById("campanha-header-acoes-conectado");
    const painelDesconectado = document.getElementById("campanha-painel-desconectado");
    const painelConectado = document.getElementById("campanha-painel-conectado");

    if (status === 'conectado') {
        if (badgeNav) {
            badgeNav.textContent = "ON";
            badgeNav.title = `Conectado à Campanha: ${codigo}`;
            badgeNav.style.background = "rgba(46, 204, 113, 0.2)";
            badgeNav.style.color = "#2ecc71";
            badgeNav.style.borderColor = "rgba(46, 204, 113, 0.4)";
        }
        if (statusPill) {
            statusPill.className = "campanha-status-pill online";
            statusPill.innerHTML = `<span class="campanha-dot-pulse"></span> Conectado (${codigo})`;
        }
        if (displayCod) {
            displayCod.textContent = codigo;
        }
        if (headerAcoes) headerAcoes.style.display = "flex";
        if (painelDesconectado) painelDesconectado.style.display = "none";
        if (painelConectado) painelConectado.style.display = "flex";
    } else if (status === 'conectando') {
        if (badgeNav) {
            badgeNav.textContent = "...";
            badgeNav.title = "Conectando à campanha...";
            badgeNav.style.background = "rgba(241, 196, 15, 0.15)";
            badgeNav.style.color = "#f39c12";
            badgeNav.style.borderColor = "rgba(241, 196, 15, 0.35)";
        }
        if (statusPill) {
            statusPill.className = "campanha-status-pill";
            statusPill.style.background = "rgba(241, 196, 15, 0.15)";
            statusPill.style.color = "#f39c12";
            statusPill.innerHTML = `<span>⏳</span> Conectando...`;
        }
    } else {
        if (badgeNav) {
            badgeNav.textContent = "OFF";
            badgeNav.title = "Campanha Desconectada";
            badgeNav.style.background = "";
            badgeNav.style.color = "";
            badgeNav.style.borderColor = "";
        }
        if (statusPill) {
            statusPill.className = "campanha-status-pill offline";
            statusPill.innerHTML = `<span>●</span> Desconectado`;
        }
        if (headerAcoes) headerAcoes.style.display = "none";
        if (painelDesconectado) painelDesconectado.style.display = "grid";
        if (painelConectado) painelConectado.style.display = "none";
    }
}

let canalBroadcastCampanha = null;

function inicializarCanalBroadcastCampanha(codigo) {
    if (canalBroadcastCampanha) {
        try { canalBroadcastCampanha.close(); } catch(e) {}
        canalBroadcastCampanha = null;
    }
    if (typeof BroadcastChannel !== 'undefined' && codigo) {
        try {
            canalBroadcastCampanha = new BroadcastChannel('we_are_strangers_campanha_' + codigo);
            canalBroadcastCampanha.onmessage = (event) => {
                if (event && event.data) {
                    processarMensagemCampanha(event.data);
                }
            };
        } catch(e) {}
    }
}

function transmitirParaCanalLocal(msg) {
    if (canalBroadcastCampanha) {
        try {
            canalBroadcastCampanha.postMessage(msg);
        } catch(e) {}
    }
    try {
        if (msg && msg.sala && msg.sala.codigo) {
            localStorage.setItem('was_campanha_sync_' + msg.sala.codigo, JSON.stringify({ msg, t: Date.now() }));
        }
    } catch(e) {}
}

function garantirSalaLocal(codigo, nomeCampanha = "") {
    if (!codigo) return null;
    const cod = String(codigo).trim().toUpperCase();
    const dadosJogador = obterDadosJogadorLocal();

    if (!salaCampanhaAtiva || salaCampanhaAtiva.codigo !== cod) {
        salaCampanhaAtiva = {
            codigo: cod,
            nome: nomeCampanha || `Campanha ${cod}`,
            criadorId: dadosJogador.id,
            criadorNome: dadosJogador.nomeJogador || dadosJogador.nomePersonagem,
            criadoEm: Date.now(),
            totalMembros: 1,
            membrosOnline: 1,
            membros: [dadosJogador],
            conquistasEquipe: Array.from(conquistasDesbloqueadas).filter(id => {
                const c = [...CONQUISTAS_OFICIAIS, ...conquistasCampanha].find(item => item.id === id);
                return c && c.nivel2 === 'equipe';
            }),
            diarioSessao: '',
            historico: [{
                id: 'evt_' + Date.now(),
                tipo: 'membro_conectou',
                texto: `${dadosJogador.nomePersonagem} (${dadosJogador.nomeJogador}) ingressou na campanha.`,
                autor: dadosJogador.nomePersonagem,
                data: Date.now()
            }]
        };
    } else {
        const idx = (salaCampanhaAtiva.membros || []).findIndex(m => m.id === dadosJogador.id);
        if (idx >= 0) {
            salaCampanhaAtiva.membros[idx] = Object.assign({}, salaCampanhaAtiva.membros[idx], dadosJogador);
        } else {
            salaCampanhaAtiva.membros = salaCampanhaAtiva.membros || [];
            salaCampanhaAtiva.membros.push(dadosJogador);
        }
    }

    try { localStorage.setItem('we_are_strangers_campanha_codigo', cod); } catch(e) {}
    inicializarCanalBroadcastCampanha(cod);
    atualizarBadgeStatusCampanha('conectado', cod);
    renderizarPainelCampanha();
    atualizarSeletoresMembros();
    if (typeof atualizarBloqueioAbasNavegadorUI === "function") {
        atualizarBloqueioAbasNavegadorUI();
    }
    return salaCampanhaAtiva;
}

function iniciarPollingFallbackCampanha(codigo) {
    if (!codigo) return;
    const cod = String(codigo).trim().toUpperCase();
    if (timerPollingFallbackCampanha) clearInterval(timerPollingFallbackCampanha);

    const executarSyncHTTP = () => {
        if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
            clearInterval(timerPollingFallbackCampanha);
            timerPollingFallbackCampanha = null;
            return;
        }
        const dadosJogador = obterDadosJogadorLocal();
        fetch(`/api/campanhas/${encodeURIComponent(cod)}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jogador: dadosJogador })
        })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            if (data && data.sala) {
                salaCampanhaAtiva = data.sala;
                atualizarBadgeStatusCampanha('conectado', salaCampanhaAtiva.codigo);
                renderizarPainelCampanha();
                atualizarSeletoresMembros();
            }
        })
        .catch(() => {});
    };

    executarSyncHTTP();
    timerPollingFallbackCampanha = setInterval(executarSyncHTTP, 3500);
}

function conectarWebSocketCampanha(codigo, nomeCampanha = "") {
    if (!codigo) return;
    const cod = String(codigo).trim().toUpperCase();

    // 1. Garante entrada instantânea no lado do cliente
    garantirSalaLocal(cod, nomeCampanha);

    // 2. Dispara requisição HTTP de entrada em paralelo para sincronização imediata
    const dadosJogador = obterDadosJogadorLocal();
    fetch(`/api/campanhas/${encodeURIComponent(cod)}/entrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jogador: dadosJogador, nomeCampanha: nomeCampanha || `Campanha ${cod}` })
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
        if (data && data.sala) {
            processarMensagemCampanha(data);
        }
    })
    .catch(() => {
        iniciarPollingFallbackCampanha(cod);
    });

    if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
        if (salaCampanhaAtiva && salaCampanhaAtiva.codigo === cod) {
            return;
        }
        try { socketCampanha.close(); } catch(e) {}
    }

    if (timerHeartbeatCampanha) {
        clearInterval(timerHeartbeatCampanha);
        timerHeartbeatCampanha = null;
    }

    let host = window.location.host;
    if (!host || host === "" || window.location.protocol === 'file:') {
        host = 'localhost:3000';
    }

    const protocol = (window.location.protocol === 'https:') ? 'wss://' : 'ws://';
    const wsUrl = protocol + host;

    try {
        socketCampanha = new WebSocket(wsUrl);

        socketCampanha.onopen = () => {
            tentativaReconexaoCampanha = 0;
            if (timerPollingFallbackCampanha) {
                clearInterval(timerPollingFallbackCampanha);
                timerPollingFallbackCampanha = null;
            }

            const dadosJogadorAtual = obterDadosJogadorLocal();
            socketCampanha.send(JSON.stringify({
                type: 'criar_ou_entrar_sala',
                codigo: cod,
                nomeCampanha: nomeCampanha || `Campanha ${cod}`,
                jogador: dadosJogadorAtual
            }));

            // Inicia heartbeat ping/pong constante para impedir timeout em qualquer proxy ou dispositivo remoto
            timerHeartbeatCampanha = setInterval(() => {
                if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
                    try {
                        socketCampanha.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                    } catch(e) {}
                }
            }, 15000);
        };

        socketCampanha.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                ultimoHeartbeatCampanha = Date.now();
                processarMensagemCampanha(msg);
            } catch(e) {
                console.error("Erro ao processar mensagem do WebSocket:", e);
            }
        };

        socketCampanha.onclose = () => {
            if (timerHeartbeatCampanha) {
                clearInterval(timerHeartbeatCampanha);
                timerHeartbeatCampanha = null;
            }

            const codCampanha = (salaCampanhaAtiva && salaCampanhaAtiva.codigo) ? salaCampanhaAtiva.codigo : cod;
            if (codCampanha) {
                iniciarPollingFallbackCampanha(codCampanha);
                tentativaReconexaoCampanha++;
                const delay = Math.min(1000 * Math.pow(1.3, Math.min(tentativaReconexaoCampanha, 8)), 5000);
                
                clearTimeout(reconectarCampanhaTimeout);
                reconectarCampanhaTimeout = setTimeout(() => {
                    const codAtual = (salaCampanhaAtiva && salaCampanhaAtiva.codigo) || codCampanha;
                    if (codAtual) {
                        conectarWebSocketCampanha(codAtual, salaCampanhaAtiva ? salaCampanhaAtiva.nome : "");
                    }
                }, delay);
            }
        };

        socketCampanha.onerror = (err) => {
            console.warn("WebSocket status / reconnecting...", err);
            const codCampanha = (salaCampanhaAtiva && salaCampanhaAtiva.codigo) ? salaCampanhaAtiva.codigo : cod;
            if (codCampanha) {
                iniciarPollingFallbackCampanha(codCampanha);
            }
        };

    } catch(err) {
        console.warn("Erro ao iniciar WebSocket da Campanha, ativando fallback HTTP:", err);
        iniciarPollingFallbackCampanha(cod);
    }
}

function processarMensagemCampanha(msg) {
    const { type } = msg;

    if (type === 'pong') {
        return;
    }

    if (type === 'server_ping') {
        if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
            try {
                socketCampanha.send(JSON.stringify({ type: 'client_pong', timestamp: Date.now() }));
            } catch(e) {}
        }
        return;
    }

    if (type === 'sala_conectada') {
        salaCampanhaAtiva = msg.sala;
        atualizarBadgeStatusCampanha('conectado', salaCampanhaAtiva.codigo);
        try {
            localStorage.setItem('we_are_strangers_campanha_codigo', salaCampanhaAtiva.codigo);
        } catch(e) {}

        if (Array.isArray(msg.conquistasEquipeParaSincronizar)) {
            let houveNova = false;
            msg.conquistasEquipeParaSincronizar.forEach(cId => {
                if (!conquistasDesbloqueadas.has(cId)) {
                    conquistasDesbloqueadas.add(cId);
                    houveNova = true;
                }
            });
            if (houveNova) {
                if (typeof salvarFichaAutomatico === "function") salvarFichaAutomatico();
                renderizarListaConquistas();
            }
        }

        if (salaCampanhaAtiva && salaCampanhaAtiva.diarioSessao) {
            const txtDiario = document.getElementById("campanha-diario-texto");
            if (txtDiario && document.activeElement !== txtDiario) {
                txtDiario.value = salaCampanhaAtiva.diarioSessao;
            }
        }

        renderizarPainelCampanha();
        atualizarSeletoresMembros();
        if (typeof atualizarBloqueioAbasNavegadorUI === "function") {
            atualizarBloqueioAbasNavegadorUI();
        }

    } else if (type === 'sala_atualizada') {
        salaCampanhaAtiva = msg.sala;
        if (salaCampanhaAtiva && salaCampanhaAtiva.diarioSessao) {
            const txtDiario = document.getElementById("campanha-diario-texto");
            if (txtDiario && document.activeElement !== txtDiario) {
                txtDiario.value = salaCampanhaAtiva.diarioSessao;
            }
        }
        renderizarPainelCampanha();
        atualizarSeletoresMembros();

    } else if (type === 'membro_entrou') {
        salaCampanhaAtiva = msg.sala;
        renderizarPainelCampanha();
        atualizarSeletoresMembros();
        if (msg.membro) {
            mostrarStatus(`👋 ${msg.membro.nomePersonagem} conectou-se à campanha.`, "ok");
        }

    } else if (type === 'conquista_equipe_recebida' || type === 'desbloquear_conquista_equipe') {
        const c = msg.conquista || (msg.evento && msg.evento.conquista);
        const autor = msg.desbloqueadoPor || (msg.evento && msg.evento.desbloqueadoPor) || "Um membro da equipe";
        if (msg.sala) salaCampanhaAtiva = msg.sala;

        if (c && c.id) {
            const eraNova = !conquistasDesbloqueadas.has(c.id);
            conquistasDesbloqueadas.add(c.id);

            if (eraNova) {
                if (typeof salvarFichaAutomatico === "function") salvarFichaAutomatico();
                renderizarListaConquistas();
            }

            exibirToastConquistaEquipe(c, autor);
            if (typeof somAtivado !== "undefined" && somAtivado) {
                tocarSom("vitoria");
            }
        }
        renderizarPainelCampanha();
        renderizarFeedCampanha();

    } else if (type === 'conquista_membro_notificada' || type === 'notificar_conquista_individual_ou_secreta') {
        if (msg.sala) salaCampanhaAtiva = msg.sala;
        renderizarPainelCampanha();
        renderizarFeedCampanha();

        const c = msg.conquista || (msg.evento && msg.evento.conquista) || {};
        const jogador = msg.jogadorNome || (msg.evento && msg.evento.desbloqueadoPor) || (msg.evento && msg.evento.autor) || "Um membro da mesa";
        const ehSecreta = (msg.tipoConquista === 'secreta' || (msg.evento && msg.evento.tipo === 'conquista_secreta') || c.nivel1 === 'secretas');

        exibirToastConquistaIndividual(c, jogador, ehSecreta);

        if (typeof somAtivado !== "undefined" && somAtivado) {
            tocarSom("vitoria");
        }

    } else if (type === 'rolagem_recebida' || type === 'transmitir_rolagem') {
        if (msg.sala) salaCampanhaAtiva = msg.sala;
        renderizarFeedCampanha();

        const ev = msg.evento || msg;
        const rol = msg.rolagem || ev.rolagem || {};
        const jogador = msg.jogadorNome || ev.jogador || ev.autor || "Um membro da mesa";

        exibirToastRolagemCampanha(rol, jogador);

        if (typeof somAtivado !== "undefined" && somAtivado) {
            tocarSom("dado");
        }

    } else if (type === 'item_transferido_recebido') {
        const { item, remetente, sala } = msg;
        if (sala) salaCampanhaAtiva = sala;
        if (item) {
            const padraoComp = (inventarioCompartimentos && inventarioCompartimentos.length > 0) ? inventarioCompartimentos[0].id : "comp_bolsos";
            inventarioItens.push({
                id: item.id || ('item_' + Date.now().toString(36)),
                nome: item.nome || 'Item Desconhecido',
                tipo: item.categoria || item.tipo || 'outro',
                qtd: parseInt(item.qtd, 10) || 1,
                peso: parseFloat(item.peso) || 0,
                espaco: parseInt(item.espaco, 10) || 1,
                desc: item.desc || '',
                compartimentoId: padraoComp
            });
            if (typeof salvarFichaAutomatico === "function") salvarFichaAutomatico();
            if (typeof atualizarInventarioUI === "function") atualizarInventarioUI();
            exibirToastItemRecebido(item, remetente);
        }
        renderizarPainelCampanha();

    } else if (type === 'alerta_mestre_recebido') {
        const { alerta, autor, sala } = msg;
        if (sala) salaCampanhaAtiva = sala;
        exibirAlertaMestreNaTela(alerta, autor);
        renderizarFeedCampanha();

    } else if (type === 'sussurro_recebido' || type === 'enviar_sussurro') {
        if (msg.sala) salaCampanhaAtiva = msg.sala;
        renderizarFeedCampanha();

        const ev = msg.evento || msg;
        const remetente = msg.remetente || ev.remetente || "Aliado";
        const destinatario = msg.destinatario || ev.destinatario || "Você";
        const texto = msg.texto || ev.texto || "";

        exibirToastSussurroCampanha(remetente, destinatario, texto);

        mostrarStatus(`🤫 Sussurro de ${remetente}: ${texto}`, "aviso");
        if (typeof somAtivado !== "undefined" && somAtivado) {
            tocarSom("clique");
        }

    } else if (type === 'diario_atualizado') {
        if (msg.sala) salaCampanhaAtiva = msg.sala;
        const txtDiario = document.getElementById("campanha-diario-texto");
        if (txtDiario && document.activeElement !== txtDiario) {
            txtDiario.value = msg.texto || "";
        }

    } else if (type === 'revelar_identidade_secreta_recebido') {
        const { remetenteId, identidadeReal, codinome } = msg;
        if (remetenteId) {
            identidadesReveladasRecebidas[remetenteId] = {
                identidadeReal: identidadeReal || "Identidade Real",
                codinome: codinome || "Codinome",
                timestamp: Date.now()
            };
            salvarIdentidadesReveladasStorage();
            if (typeof renderizarMembrosModoTatico === "function") renderizarMembrosModoTatico();
            if (typeof renderizarMembrosCampanha === "function") renderizarMembrosCampanha();
            mostrarStatus(`🎭 REVELAÇÃO SECRETA: O agente "${codinome || 'Aliado'}" revelou a você em segredo que sua verdadeira identidade é "${identidadeReal}"!`, "ok");
        }

    } else if (type === 'revogar_identidade_secreta_recebido') {
        const { remetenteId } = msg;
        if (remetenteId) {
            delete identidadesReveladasRecebidas[remetenteId];
            salvarIdentidadesReveladasStorage();
            if (typeof renderizarMembrosModoTatico === "function") renderizarMembrosModoTatico();
            if (typeof renderizarMembrosCampanha === "function") renderizarMembrosCampanha();
            mostrarStatus(`🔒 Um aliado ocultou novamente sua verdadeira identidade de você.`, "aviso");
        }

    } else if (type === 'mensagem_chat_recebida') {
        if (msg.sala) salaCampanhaAtiva = msg.sala;
        renderizarFeedCampanha();
        if (typeof somAtivado !== "undefined" && somAtivado) {
            tocarSom("clique");
        }

    } else if (type === 'saiu_sala') {
        salaCampanhaAtiva = null;
        try { localStorage.removeItem('we_are_strangers_campanha_codigo'); } catch(e) {}
        atualizarBadgeStatusCampanha('offline');
        renderizarPainelCampanha();
        mostrarStatus("Você saiu da sala de campanha.", "aviso");

    } else if (type === 'erro' || type === 'erro_spam') {
        mostrarStatus(`✗ ${msg.mensagem || "Erro na campanha."}`, "erro");
    }
}

function gerarCodigoAleatorioCampanha() {
    const prefixos = ['STRANGERS', 'HORROR', 'SQUAD', 'SPEC', 'CAMP', 'NOITE', 'MESA'];
    const p = prefixos[Math.floor(Math.random() * prefixos.length)];
    const n = Math.floor(1000 + Math.random() * 9000);
    const cod = `${p}-${n}`;
    const input = document.getElementById("campanha_input_codigo_sugerido");
    if (input) input.value = cod;
    return cod;
}

function criarNovaSalaCampanha() {
    const nome = (document.getElementById("campanha_input_nome_criar")?.value || "").trim();
    let cod = (document.getElementById("campanha_input_codigo_sugerido")?.value || "").trim().toUpperCase();
    if (!cod) {
        cod = gerarCodigoAleatorioCampanha();
    }
    conectarWebSocketCampanha(cod, nome || `Campanha ${cod}`);
}

function entrarSalaCampanhaPeloInput() {
    const cod = (document.getElementById("campanha_input_codigo_entrar")?.value || "").trim().toUpperCase();
    if (!cod) {
        mostrarStatus("Por favor, digite o código da campanha.", "erro");
        return;
    }
    conectarWebSocketCampanha(cod);
}

function sairSalaCampanha() {
    if (timerPollingFallbackCampanha) {
        clearInterval(timerPollingFallbackCampanha);
        timerPollingFallbackCampanha = null;
    }
    if (timerHeartbeatCampanha) {
        clearInterval(timerHeartbeatCampanha);
        timerHeartbeatCampanha = null;
    }
    clearTimeout(reconectarCampanhaTimeout);

    if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
        try {
            socketCampanha.send(JSON.stringify({ type: 'sair_sala' }));
        } catch(e) {}
    }
    if (canalBroadcastCampanha) {
        try { canalBroadcastCampanha.close(); } catch(e) {}
        canalBroadcastCampanha = null;
    }
    salaCampanhaAtiva = null;
    try { localStorage.removeItem('we_are_strangers_campanha_codigo'); } catch(e) {}
    atualizarBadgeStatusCampanha('offline');
    renderizarPainelCampanha();
    if (typeof atualizarBloqueioAbasNavegadorUI === "function") {
        atualizarBloqueioAbasNavegadorUI();
    }
}

function copiarCodigoCampanha() {
    if (!salaCampanhaAtiva || !salaCampanhaAtiva.codigo) return;
    const cod = salaCampanhaAtiva.codigo;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cod).then(() => {
            mostrarStatus(`📋 Código ${cod} copiado para a área de transferência!`, "ok");
        }).catch(() => {
            prompt("Copie o código da campanha:", cod);
        });
    } else {
        prompt("Copie o código da campanha:", cod);
    }
}

function sincronizarEstadoComCampanha() {
    if (!salaCampanhaAtiva) return;
    const dadosJogador = obterDadosJogadorLocal();

    if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
        try {
            socketCampanha.send(JSON.stringify({
                type: 'atualizar_meu_estado',
                jogador: dadosJogador
            }));
            return;
        } catch(e) {}
    }

    transmitirParaCanalLocal({
        type: 'atualizar_meu_estado',
        jogador: dadosJogador
    });

    // Se o WebSocket estiver temporariamente reconectando, sincroniza via HTTP REST fallback
    if (salaCampanhaAtiva.codigo) {
        fetch(`/api/campanhas/${encodeURIComponent(salaCampanhaAtiva.codigo)}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jogador: dadosJogador })
        })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            if (data && data.sala) {
                salaCampanhaAtiva = data.sala;
                renderizarPainelCampanha();
            }
        })
        .catch(() => {});
    }
}

function transmitirRolagemParaCampanha(itemHistorico) {
    if (!salaCampanhaAtiva) return;
    const nomePersonagem = (document.getElementById("nome_personagem")?.value || "").trim() || "Personagem";
    const payloadRolagem = {
        type: 'transmitir_rolagem',
        rolagem: {
            pericia: itemHistorico.pericia,
            resultadoFinal: itemHistorico.resultadoFinal,
            faixaNome: itemHistorico.faixaNome,
            faixaTipo: itemHistorico.faixaTipo,
            dados: itemHistorico.dados,
            somaDados: itemHistorico.somaDados,
            quantidadeDados: itemHistorico.quantidadeDados,
            principal: itemHistorico.principal,
            somaAtributos: itemHistorico.somaAtributos,
            totalPontos: itemHistorico.totalPontos
        },
        jogadorNome: nomePersonagem
    };

    if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
        socketCampanha.send(JSON.stringify(payloadRolagem));
    } else {
        fetch(`/api/campanhas/${encodeURIComponent(salaCampanhaAtiva.codigo)}/rolagem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rolagem: payloadRolagem.rolagem, jogadorNome: nomePersonagem })
        }).catch(() => {});
    }
    transmitirParaCanalLocal(payloadRolagem);
}

function transmitirDesbloqueioEquipeCampanha(conquista) {
    if (!salaCampanhaAtiva) return;
    const nomePersonagem = (document.getElementById("nome_personagem")?.value || "").trim() || "Personagem";
    const payloadConq = {
        type: 'desbloquear_conquista_equipe',
        conquista: {
            id: conquista.id,
            titulo: conquista.titulo,
            pontos: conquista.pontos,
            desc: conquista.desc,
            icone: conquista.icone || '👥'
        },
        desbloqueadoPor: nomePersonagem
    };

    if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
        socketCampanha.send(JSON.stringify(payloadConq));
    } else {
        fetch(`/api/campanhas/${encodeURIComponent(salaCampanhaAtiva.codigo)}/conquista-equipe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conquista: payloadConq.conquista, desbloqueadoPor: nomePersonagem })
        }).catch(() => {});
    }
    transmitirParaCanalLocal(payloadConq);
}

function transmitirConquistaIndividualCampanha(conquista) {
    if (!salaCampanhaAtiva) return;
    const nomePersonagem = (document.getElementById("nome_personagem")?.value || "").trim() || "Personagem";
    const payload = {
        type: 'notificar_conquista_individual_ou_secreta',
        conquista: {
            id: conquista.id,
            titulo: conquista.titulo,
            pontos: conquista.pontos,
            desc: conquista.desc,
            icone: conquista.icone || '👤'
        },
        tipoConquista: 'individual',
        jogadorNome: nomePersonagem
    };

    if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
        socketCampanha.send(JSON.stringify(payload));
    }
    transmitirParaCanalLocal(payload);
}

function transmitirConquistaSecretaCampanha(conquista) {
    if (!salaCampanhaAtiva) return;
    const nomePersonagem = (document.getElementById("nome_personagem")?.value || "").trim() || "Personagem";
    const payload = {
        type: 'notificar_conquista_individual_ou_secreta',
        conquista: {
            id: conquista.id,
            titulo: conquista.titulo,
            pontos: conquista.pontos,
            desc: conquista.desc,
            icone: conquista.icone || '🔮'
        },
        tipoConquista: 'secreta',
        jogadorNome: nomePersonagem
    };

    if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
        socketCampanha.send(JSON.stringify(payload));
    }
    transmitirParaCanalLocal(payload);
}

const LIMITE_MAX_MSGS_2_MIN = 6;
const JANELA_MSGS_2_MIN_MS = 120000;
let historicoEnviosChatCampanha = [];
let timerAntiSpamChat = null;

function obterContagemAntiSpamChat() {
    const agora = Date.now();
    historicoEnviosChatCampanha = historicoEnviosChatCampanha.filter(t => (agora - t) < JANELA_MSGS_2_MIN_MS);
    return historicoEnviosChatCampanha;
}

function atualizarContadorAntiSpamChat() {
    const lista = obterContagemAntiSpamChat();
    const agora = Date.now();
    const restantes = Math.max(0, LIMITE_MAX_MSGS_2_MIN - lista.length);
    const contadorEl = document.getElementById("campanha-chat-contador-info");
    const input = document.getElementById("campanha-chat-input");
    const btnEnviar = document.getElementById("btn-enviar-chat-campanha");

    if (restantes > 0) {
        if (contadorEl) {
            contadorEl.style.color = "var(--ink)";
            contadorEl.textContent = `Disponível: ${restantes}/${LIMITE_MAX_MSGS_2_MIN}`;
        }
        if (input) input.classList.remove("spam-bloqueado");
        if (btnEnviar) btnEnviar.disabled = false;
        if (timerAntiSpamChat && lista.length === 0) {
            clearInterval(timerAntiSpamChat);
            timerAntiSpamChat = null;
        }
    } else {
        const maisAntigo = lista[0];
        const tempoRestanteSeg = Math.max(1, Math.ceil((maisAntigo + JANELA_MSGS_2_MIN_MS - agora) / 1000));
        if (contadorEl) {
            contadorEl.style.color = "#e74c3c";
            contadorEl.textContent = `⏳ Aguarde ${tempoRestanteSeg}s (0/${LIMITE_MAX_MSGS_2_MIN})`;
        }
        if (input) input.classList.add("spam-bloqueado");
    }
}

function enviarMensagemChatCampanha() {
    const input = document.getElementById("campanha-chat-input");
    const destSelect = document.getElementById("campanha-chat-destinatario");
    if (!input) return;
    const texto = input.value.trim();
    if (!texto) return;
    if (!salaCampanhaAtiva) {
        mostrarStatus("Você não está conectado a nenhuma sala de campanha.", "erro");
        return;
    }

    const listaRecente = obterContagemAntiSpamChat();
    const agora = Date.now();
    if (listaRecente.length >= LIMITE_MAX_MSGS_2_MIN) {
        const tempoRestanteSeg = Math.max(1, Math.ceil((listaRecente[0] + JANELA_MSGS_2_MIN_MS - agora) / 1000));
        mostrarStatus(`⏳ Limite anti-spam: máximo de ${LIMITE_MAX_MSGS_2_MIN} mensagens a cada 2 minutos. Aguarde ${tempoRestanteSeg}s para enviar novamente.`, "aviso");
        atualizarContadorAntiSpamChat();
        if (!timerAntiSpamChat) {
            timerAntiSpamChat = setInterval(atualizarContadorAntiSpamChat, 1000);
        }
        return;
    }

    const nomePersonagem = (document.getElementById("nome_personagem")?.value || "").trim() || "Personagem";
    const destinatarioId = destSelect ? destSelect.value : 'todos';

    if (destinatarioId && destinatarioId !== 'todos') {
        if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
            socketCampanha.send(JSON.stringify({
                type: 'enviar_sussurro',
                destinatarioId: destinatarioId,
                texto: texto,
                remetente: nomePersonagem
            }));
        }
    } else {
        if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
            socketCampanha.send(JSON.stringify({
                type: 'enviar_mensagem_chat',
                texto: texto,
                autor: nomePersonagem
            }));
        } else {
            fetch(`/api/campanhas/${encodeURIComponent(salaCampanhaAtiva.codigo)}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texto, autor: nomePersonagem })
            }).catch(() => {});
        }
    }
    historicoEnviosChatCampanha.push(agora);
    input.value = "";
    atualizarContadorAntiSpamChat();
    if (!timerAntiSpamChat) {
        timerAntiSpamChat = setInterval(atualizarContadorAntiSpamChat, 1000);
    }
}

function salvarDiarioSessaoCampanha() {
    if (!salaCampanhaAtiva) return;
    const texto = (document.getElementById("campanha-diario-texto")?.value || "").trim();
    const nomePersonagem = (document.getElementById("nome_personagem")?.value || "").trim() || "Personagem";
    if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
        socketCampanha.send(JSON.stringify({
            type: 'atualizar_diario_sessao',
            texto: texto,
            autor: nomePersonagem
        }));
    } else {
        fetch(`/api/campanhas/${encodeURIComponent(salaCampanhaAtiva.codigo)}/diario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto, autor: nomePersonagem })
        }).catch(() => {});
    }
    mostrarStatus("💾 Diário de bordo sincronizado com a mesa!", "ok");
}

function dispararAlertaMestre() {
    if (!salaCampanhaAtiva) return;
    const titulo = (document.getElementById("gm_alerta_titulo")?.value || "").trim() || "⚠️ ALERTA DO MESTRE";
    const msg = (document.getElementById("gm_alerta_msg")?.value || "").trim();
    const nivel = document.getElementById("gm_alerta_nivel")?.value || "perigo";
    if (!msg) {
        mostrarStatus("Digite a mensagem do alerta.", "erro");
        return;
    }
    const nomePersonagem = (document.getElementById("nome_personagem")?.value || "").trim() || "Mestre";
    if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN) {
        socketCampanha.send(JSON.stringify({
            type: 'alerta_mestre',
            alerta: { titulo, msg, nivel },
            autor: nomePersonagem
        }));
    } else {
        fetch(`/api/campanhas/${encodeURIComponent(salaCampanhaAtiva.codigo)}/alerta`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alerta: { titulo, msg, nivel }, autor: nomePersonagem })
        }).catch(() => {});
    }
    document.getElementById("gm_alerta_msg").value = "";
    mostrarStatus("⚡ Alerta narrativo disparado na tela de todos!", "ok");
}

function popularSelectConquistasEquipeMestre() {
    const sel = document.getElementById("gm_conquista_equipe_select");
    if (!sel) return;
    const todasEquipe = [...CONQUISTAS_OFICIAIS, ...conquistasCampanha].filter(c => c.nivel2 === 'equipe');
    sel.innerHTML = todasEquipe.map(c => `<option value="${c.id}">${c.icone || '🤝'} ${c.titulo} (+${c.pontos || 0} pts)</option>`).join("");
}

function concederConquistaEquipePeloMestre() {
    const sel = document.getElementById("gm_conquista_equipe_select");
    if (!sel) return;
    const cId = sel.value;
    if (!cId) return;
    alternarDesbloqueioConquista(cId);
    mostrarStatus("🏆 Feito coletivo concedido e sincronizado com o grupo!", "ok");
}

function abrirModalTransferirItem() {
    const modal = document.getElementById("modal-transferir-item");
    if (!modal) return;
    const selItem = document.getElementById("select-item-transferir");
    const selDest = document.getElementById("select-destinatario-transferir");
    if (!selItem || !selDest) return;

    if (!Array.isArray(inventarioItens) || inventarioItens.length === 0) {
        mostrarStatus("Seu inventário está vazio no momento.", "aviso");
        return;
    }

    selItem.innerHTML = inventarioItens.map((item, idx) => `<option value="${idx}">${item.nome} (Qtd: ${item.qtd || 1})</option>`).join("");

    const membros = salaCampanhaAtiva?.membros || [];
    const meuId = localStorage.getItem('we_are_strangers_player_uuid');
    const outros = membros.filter(m => m.id !== meuId);

    if (outros.length === 0) {
        mostrarStatus("Nenhum outro jogador conectado na campanha para receber itens.", "aviso");
        return;
    }

    selDest.innerHTML = outros.map(m => `<option value="${m.id}">${m.nomePersonagem || "Sem Nome"} (${m.nomeJogador || "Jogador"})</option>`).join("");

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
}

function fecharModalTransferirItem() {
    const modal = document.getElementById("modal-transferir-item");
    if (!modal) return;
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
}

function fecharModalTransferirItemPorOverlay(e) {
    if (e.target && e.target.id === "modal-transferir-item") {
        fecharModalTransferirItem();
    }
}

function executarTransferenciaItem() {
    const selItem = document.getElementById("select-item-transferir");
    const selDest = document.getElementById("select-destinatario-transferir");
    if (!selItem || !selDest) return;

    const itemIdx = parseInt(selItem.value, 10);
    const destId = selDest.value;

    if (isNaN(itemIdx) || itemIdx < 0 || itemIdx >= inventarioItens.length) return;
    const itemAEnviar = inventarioItens[itemIdx];

    // Remove 1 unidade do item ou remove o item inteiro
    if (itemAEnviar.qtd && itemAEnviar.qtd > 1) {
        itemAEnviar.qtd -= 1;
    } else {
        inventarioItens.splice(itemIdx, 1);
    }

    if (typeof salvarFichaAutomatico === "function") salvarFichaAutomatico();
    if (typeof atualizarInventarioUI === "function") atualizarInventarioUI();

    const nomePersonagem = (document.getElementById("nome_personagem")?.value || "").trim() || "Personagem";

    if (socketCampanha && socketCampanha.readyState === WebSocket.OPEN && salaCampanhaAtiva) {
        socketCampanha.send(JSON.stringify({
            type: 'transferir_item',
            destinatarioId: destId,
            item: {
                id: itemAEnviar.id,
                nome: itemAEnviar.nome,
                categoria: itemAEnviar.tipo || itemAEnviar.categoria || "outro",
                peso: itemAEnviar.peso,
                desc: itemAEnviar.desc,
                qtd: 1
            },
            remetente: nomePersonagem
        }));
    } else if (salaCampanhaAtiva) {
        fetch(`/api/campanhas/${encodeURIComponent(salaCampanhaAtiva.codigo)}/transferir-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                destinatarioId: destId,
                item: itemAEnviar,
                remetenteNome: nomePersonagem
            })
        }).catch(() => {});
    }

    fecharModalTransferirItem();
    mostrarStatus(`📦 Item "${itemAEnviar.nome}" enviado com sucesso!`, "ok");
}

function exibirToastItemRecebido(item, remetente) {
    const toast = document.getElementById("toast-item-recebido");
    if (!toast) return;
    const nomeEl = document.getElementById("toast-item-recebido-nome");
    const remEl = document.getElementById("toast-item-recebido-remetente");
    if (nomeEl) nomeEl.textContent = item.nome || "Item";
    if (remEl) remEl.textContent = `Entregue por ${remetente || "um membro da equipe"} e adicionado à sua mochila!`;
    toast.classList.add("visivel");
    setTimeout(() => { toast.classList.remove("visivel"); }, 5000);
}

function exibirAlertaMestreNaTela(alerta, autor) {
    const toast = document.getElementById("toast-alerta-mestre");
    if (!toast) return;
    const titEl = document.getElementById("toast-alerta-mestre-titulo");
    const msgEl = document.getElementById("toast-alerta-mestre-msg");
    const icoEl = document.getElementById("toast-alerta-mestre-icone");

    if (titEl) titEl.textContent = alerta.titulo || "⚠️ AVISO DO MESTRE";
    if (msgEl) msgEl.textContent = `${alerta.msg || ""} (Narrado por: ${autor || "Mestre"})`;
    if (icoEl) {
        if (alerta.nivel === 'perigo') icoEl.textContent = "⚔️";
        else if (alerta.nivel === 'sucesso') icoEl.textContent = "✨";
        else icoEl.textContent = "📢";
    }

    toast.classList.add("visivel");
    clearTimeout(alertaMestreTimer);
    alertaMestreTimer = setTimeout(() => {
        toast.classList.remove("visivel");
    }, 7000);
}

function fecharAlertaMestre() {
    const toast = document.getElementById("toast-alerta-mestre");
    if (toast) toast.classList.remove("visivel");
}

function exportarRelatorioCampanha() {
    if (!salaCampanhaAtiva) return;
    const nome = salaCampanhaAtiva.nome || "Campanha";
    const codigo = salaCampanhaAtiva.codigo || "STRANGERS";
    const data = new Date().toLocaleDateString("pt-BR");
    const membros = salaCampanhaAtiva.membros || [];
    const conquistasEquipeIds = salaCampanhaAtiva.conquistasEquipe || [];
    const todasEquipe = [...CONQUISTAS_OFICIAIS, ...conquistasCampanha].filter(c => c.nivel2 === 'equipe');

    let rel = `# 🏰 RELATÓRIO DA SESSÃO: ${nome.toUpperCase()}\n`;
    rel += `Código da Sala: ${codigo} | Data: ${data}\n\n`;
    rel += `## 👥 MEMBROS DA MESA & ESTADO VITAL\n`;
    membros.forEach(m => {
        rel += `- **${m.nomePersonagem || "Personagem"}** (${m.nomeJogador || "Jogador"}): PV ${m.vidaAtual || 0}/${m.vidaMax || 0} | Sanidade ${m.sanidadeAtual || 0}/${m.sanidadeMax || 0} | Recurso ${m.recursoAtual || 0}/${m.recursoMax || 0}\n`;
    });

    rel += `\n## 🤝 FEITOS DE EQUIPE DESBLOQUEADOS (${conquistasEquipeIds.length})\n`;
    conquistasEquipeIds.forEach(id => {
        const c = todasEquipe.find(item => item.id === id);
        if (c) rel += `- [x] ${c.titulo} (+${c.pontos || 0} pts): ${c.desc || ""}\n`;
    });

    rel += `\n## 📖 DIÁRIO DE BORDO DA SESSÃO\n`;
    rel += `${salaCampanhaAtiva.diarioSessao || "Nenhuma anotação registrada."}\n`;

    const blob = new Blob([rel], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Relatorio_Campanha_${codigo}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarStatus("📥 Relatório da sessão exportado com sucesso!", "ok");
}

// ==========================================
// GERADOR NATIVO DE QR CODE (ISO/IEC 18004 COMPATÍVEL)
// ==========================================
const QRCodeLib = (function() {
    const QRMode = { NUMBER: 1, ALPHA_NUM: 2, BYTE: 4, KANJI: 8 };
    const QRErrorCorrectLevel = { L: 1, M: 0, Q: 3, H: 2 };

    const QRMath = {
        glog: function(n) {
            if (n < 1) throw new Error("glog(" + n + ")");
            return QRMath.LOG_TABLE[n];
        },
        gexp: function(n) {
            while (n < 0) n += 255;
            while (n >= 256) n -= 255;
            return QRMath.EXP_TABLE[n];
        },
        EXP_TABLE: new Array(256),
        LOG_TABLE: new Array(256)
    };
    for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
    for (let i = 8; i < 256; i++) QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
    for (let i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

    function QRPolynomial(num, shift) {
        if (num.length === undefined) throw new Error(num.length + "/" + shift);
        let offset = 0;
        while (offset < num.length && num[offset] === 0) offset++;
        this.num = new Array(num.length - offset + shift);
        for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
        for (let i = num.length - offset; i < this.num.length; i++) this.num[i] = 0;
    }
    QRPolynomial.prototype = {
        get: function(index) { return this.num[index]; },
        getLength: function() { return this.num.length; },
        multiply: function(e) {
            const num = new Array(this.getLength() + e.getLength() - 1);
            for (let i = 0; i < num.length; i++) num[i] = 0;
            for (let i = 0; i < this.getLength(); i++) {
                for (let j = 0; j < e.getLength(); j++) {
                    num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
                }
            }
            return new QRPolynomial(num, 0);
        },
        mod: function(e) {
            if (this.getLength() - e.getLength() < 0) return this;
            const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
            const num = new Array(this.getLength());
            for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
            for (let i = 0; i < e.getLength(); i++) {
                num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
            }
            return new QRPolynomial(num, 0).mod(e);
        }
    };

    const RS_BLOCK_TABLE = [
        [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
        [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
        [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
        [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
        [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
        [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
        [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
        [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
        [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
        [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16],
        [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13],
        [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15],
        [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12],
        [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13]
    ];

    function QRRSBlock(totalCount, dataCount) {
        this.totalCount = totalCount;
        this.dataCount = dataCount;
    }
    QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel) {
        const rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
        if (!rsBlock) throw new Error("bad rs block @ " + typeNumber + "/" + errorCorrectLevel);
        const length = rsBlock.length / 3;
        const list = [];
        for (let i = 0; i < length; i++) {
            const count = rsBlock[i * 3 + 0];
            const totalCount = rsBlock[i * 3 + 1];
            const dataCount = rsBlock[i * 3 + 2];
            for (let j = 0; j < count; j++) {
                list.push(new QRRSBlock(totalCount, dataCount));
            }
        }
        return list;
    };
    QRRSBlock.getRsBlockTable = function(typeNumber, errorCorrectLevel) {
        switch (errorCorrectLevel) {
            case QRErrorCorrectLevel.L: return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
            case QRErrorCorrectLevel.M: return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
            case QRErrorCorrectLevel.Q: return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
            case QRErrorCorrectLevel.H: return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
            default: return undefined;
        }
    };

    function QRBitBuffer() {
        this.buffer = [];
        this.length = 0;
    }
    QRBitBuffer.prototype = {
        get: function(index) {
            const bufIndex = Math.floor(index / 8);
            return ((this.buffer[bufIndex] >>> (7 - index % 8)) & 1) === 1;
        },
        put: function(num, length) {
            for (let i = 0; i < length; i++) {
                this.putBit(((num >>> (length - i - 1)) & 1) === 1);
            }
        },
        getLengthInBits: function() { return this.length; },
        putBit: function(bit) {
            const bufIndex = Math.floor(this.length / 8);
            if (this.buffer.length <= bufIndex) this.buffer.push(0);
            if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
            this.length++;
        }
    };

    function QRCode(typeNumber, errorCorrectLevel) {
        this.typeNumber = typeNumber;
        this.errorCorrectLevel = errorCorrectLevel;
        this.modules = null;
        this.moduleCount = 0;
        this.dataCache = null;
        this.dataList = [];
    }
    QRCode.prototype = {
        addData: function(data) {
            this.dataList.push(data);
            this.dataCache = null;
        },
        isDark: function(row, col) {
            if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) return false;
            return !!this.modules[row][col];
        },
        getModuleCount: function() { return this.moduleCount; },
        make: function() {
            if (this.typeNumber < 1) {
                let typeNumber = 1;
                for (typeNumber = 1; typeNumber <= 14; typeNumber++) {
                    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);
                    const buffer = new QRBitBuffer();
                    let totalDataCount = 0;
                    for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
                    for (let i = 0; i < this.dataList.length; i++) {
                        const data = this.dataList[i];
                        buffer.put(QRMode.BYTE, 4);
                        buffer.put(data.length, typeNumber < 10 ? 8 : 16);
                        for (let j = 0; j < data.length; j++) buffer.put(data.charCodeAt(j), 8);
                    }
                    if (buffer.getLengthInBits() <= totalDataCount * 8) break;
                }
                this.typeNumber = Math.min(14, typeNumber);
            }
            this.makeImpl(false, this.getBestMaskPattern());
        },
        makeImpl: function(test, maskPattern) {
            this.moduleCount = this.typeNumber * 4 + 17;
            this.modules = new Array(this.moduleCount);
            for (let row = 0; row < this.moduleCount; row++) {
                this.modules[row] = new Array(this.moduleCount);
                for (let col = 0; col < this.moduleCount; col++) {
                    this.modules[row][col] = null;
                }
            }
            this.setupPositionProbePattern(0, 0);
            this.setupPositionProbePattern(this.moduleCount - 7, 0);
            this.setupPositionProbePattern(0, this.moduleCount - 7);
            this.setupPositionAdjustPattern();
            this.setupTimingPattern();
            this.setupTypeInfo(test, maskPattern);
            if (this.typeNumber >= 7) this.setupTypeNumber(test);
            if (this.dataCache == null) {
                this.dataCache = QRCode.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
            }
            this.mapData(this.dataCache, maskPattern);
        },
        setupPositionProbePattern: function(row, col) {
            for (let r = -1; r <= 7; r++) {
                if (row + r <= -1 || this.moduleCount <= row + r) continue;
                for (let c = -1; c <= 7; c++) {
                    if (col + c <= -1 || this.moduleCount <= col + c) continue;
                    if ((0 <= r && r <= 6 && (c === 0 || c === 6)) || (0 <= c && c <= 6 && (r === 0 || r === 6)) || (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
                        this.modules[row + r][col + c] = true;
                    } else {
                        this.modules[row + r][col + c] = false;
                    }
                }
            }
        },
        getBestMaskPattern: function() {
            let minLostPoint = 0;
            let pattern = 0;
            for (let i = 0; i < 8; i++) {
                this.makeImpl(true, i);
                const lostPoint = QRCode.getLostPoint(this);
                if (i === 0 || minLostPoint > lostPoint) {
                    minLostPoint = lostPoint;
                    pattern = i;
                }
            }
            return pattern;
        },
        setupTimingPattern: function() {
            for (let r = 8; r < this.moduleCount - 8; r++) {
                if (this.modules[r][6] !== null) continue;
                this.modules[r][6] = (r % 2 === 0);
            }
            for (let c = 8; c < this.moduleCount - 8; c++) {
                if (this.modules[6][c] !== null) continue;
                this.modules[6][c] = (c % 2 === 0);
            }
        },
        setupPositionAdjustPattern: function() {
            const pos = QRCode.getPatternPosition(this.typeNumber);
            for (let i = 0; i < pos.length; i++) {
                for (let j = 0; j < pos.length; j++) {
                    const row = pos[i];
                    const col = pos[j];
                    if (this.modules[row][col] !== null) continue;
                    for (let r = -2; r <= 2; r++) {
                        for (let c = -2; c <= 2; c++) {
                            if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
                                this.modules[row + r][col + c] = true;
                            } else {
                                this.modules[row + r][col + c] = false;
                            }
                        }
                    }
                }
            }
        },
        setupTypeInfo: function(test, maskPattern) {
            const data = (this.errorCorrectLevel << 3) | maskPattern;
            const bits = QRCode.getBCHTypeInfo(data);
            for (let i = 0; i < 15; i++) {
                const mod = (!test && ((bits >> i) & 1) === 1);
                if (i < 6) this.modules[i][8] = mod;
                else if (i < 8) this.modules[i + 1][8] = mod;
                else this.modules[this.moduleCount - 15 + i][8] = mod;
                if (i < 8) this.modules[8][this.moduleCount - i - 1] = mod;
                else if (i < 9) this.modules[8][15 - i - 1 + 1] = mod;
                else this.modules[8][15 - i - 1] = mod;
            }
            this.modules[this.moduleCount - 8][8] = !test;
        },
        setupTypeNumber: function(test) {
            const bits = QRCode.getBCHTypeNumber(this.typeNumber);
            for (let i = 0; i < 18; i++) {
                const mod = (!test && ((bits >> i) & 1) === 1);
                this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
                this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
            }
        },
        mapData: function(data, maskPattern) {
            let inc = -1;
            let row = this.moduleCount - 1;
            let bitIndex = 7;
            let byteIndex = 0;
            const mask = QRCode.getMask(maskPattern);
            for (let col = this.moduleCount - 1; col > 0; col -= 2) {
                if (col === 6) col--;
                while (true) {
                    for (let c = 0; c < 2; c++) {
                        if (this.modules[row][col - c] === null) {
                            let dark = false;
                            if (byteIndex < data.length) {
                                dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
                            }
                            if (mask(row, col - c)) dark = !dark;
                            this.modules[row][col - c] = dark;
                            bitIndex--;
                            if (bitIndex === -1) {
                                byteIndex++;
                                bitIndex = 7;
                            }
                        }
                    }
                    row += inc;
                    if (row < 0 || this.moduleCount <= row) {
                        row -= inc;
                        inc = -inc;
                        break;
                    }
                }
            }
        }
    };

    QRCode.createData = function(typeNumber, errorCorrectLevel, dataList) {
        const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
        const buffer = new QRBitBuffer();
        for (let i = 0; i < dataList.length; i++) {
            const data = dataList[i];
            buffer.put(QRMode.BYTE, 4);
            buffer.put(data.length, typeNumber < 10 ? 8 : 16);
            for (let j = 0; j < data.length; j++) buffer.put(data.charCodeAt(j), 8);
        }
        let totalDataCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
        if (buffer.getLengthInBits() > totalDataCount * 8) throw new Error("Overflow de bits QR (" + buffer.getLengthInBits() + ">" + (totalDataCount * 8) + ")");
        if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) buffer.put(0, 4);
        while (buffer.getLengthInBits() % 8 !== 0) buffer.putBit(false);
        while (true) {
            if (buffer.getLengthInBits() >= totalDataCount * 8) break;
            buffer.put(0xEC, 8);
            if (buffer.getLengthInBits() >= totalDataCount * 8) break;
            buffer.put(0x11, 8);
        }
        return QRCode.createBytes(buffer, rsBlocks);
    };

    QRCode.createBytes = function(buffer, rsBlocks) {
        let offset = 0;
        let maxDcCount = 0;
        let maxEcCount = 0;
        const dcdata = new Array(rsBlocks.length);
        const ecdata = new Array(rsBlocks.length);
        for (let r = 0; r < rsBlocks.length; r++) {
            const dcCount = rsBlocks[r].dataCount;
            const ecCount = rsBlocks[r].totalCount - dcCount;
            maxDcCount = Math.max(maxDcCount, dcCount);
            maxEcCount = Math.max(maxEcCount, ecCount);
            dcdata[r] = new Array(dcCount);
            for (let i = 0; i < dcdata[r].length; i++) dcdata[r][i] = 0xff & buffer.buffer[i + offset];
            offset += dcCount;
            const rsPoly = QRCode.getErrorCorrectPolynomial(ecCount);
            const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
            const modPoly = rawPoly.mod(rsPoly);
            ecdata[r] = new Array(rsPoly.getLength() - 1);
            for (let i = 0; i < ecdata[r].length; i++) {
                const modIndex = i + modPoly.getLength() - ecdata[r].length;
                ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
            }
        }
        let totalCodeCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) totalCodeCount += rsBlocks[i].totalCount;
        const data = new Array(totalCodeCount);
        let index = 0;
        for (let i = 0; i < maxDcCount; i++) {
            for (let r = 0; r < rsBlocks.length; r++) {
                if (i < dcdata[r].length) data[index++] = dcdata[r][i];
            }
        }
        for (let i = 0; i < maxEcCount; i++) {
            for (let r = 0; r < rsBlocks.length; r++) {
                if (i < ecdata[r].length) data[index++] = ecdata[r][i];
            }
        }
        return data;
    };

    QRCode.getErrorCorrectPolynomial = function(errorCorrectLength) {
        let a = new QRPolynomial([1], 0);
        for (let i = 0; i < errorCorrectLength; i++) {
            a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
        }
        return a;
    };

    QRCode.getMask = function(maskPattern) {
        switch (maskPattern) {
            case 0: return function(i, j) { return (i + j) % 2 === 0; };
            case 1: return function(i, j) { return i % 2 === 0; };
            case 2: return function(i, j) { return j % 3 === 0; };
            case 3: return function(i, j) { return (i + j) % 3 === 0; };
            case 4: return function(i, j) { return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0; };
            case 5: return function(i, j) { return (i * j) % 2 + (i * j) % 3 === 0; };
            case 6: return function(i, j) { return ((i * j) % 2 + (i * j) % 3) % 2 === 0; };
            case 7: return function(i, j) { return ((i * j) % 3 + (i + j) % 2) % 2 === 0; };
            default: throw new Error("bad maskPattern:" + maskPattern);
        }
    };

    QRCode.getPatternPosition = function(typeNumber) {
        const PATTERN_POSITION_TABLE = [
            [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
            [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54],
            [6, 32, 58], [6, 34, 62], [6, 26, 46, 66]
        ];
        return PATTERN_POSITION_TABLE[typeNumber - 1] || [];
    };

    QRCode.getBCHTypeInfo = function(data) {
        let d = data << 10;
        while (QRCode.getBCHDigit(d) - QRCode.getBCHDigit(1335) >= 0) {
            d ^= (1335 << (QRCode.getBCHDigit(d) - QRCode.getBCHDigit(1335)));
        }
        return ((data << 10) | d) ^ 21522;
    };

    QRCode.getBCHTypeNumber = function(data) {
        let d = data << 12;
        while (QRCode.getBCHDigit(d) - QRCode.getBCHDigit(7973) >= 0) {
            d ^= (7973 << (QRCode.getBCHDigit(d) - QRCode.getBCHDigit(7973)));
        }
        return (data << 12) | d;
    };

    QRCode.getBCHDigit = function(data) {
        let digit = 0;
        while (data !== 0) {
            digit++;
            data >>>= 1;
        }
        return digit;
    };

    QRCode.getLostPoint = function(qrCode) {
        const moduleCount = qrCode.getModuleCount();
        let lostPoint = 0;
        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                let sameCount = 0;
                const dark = qrCode.isDark(row, col);
                for (let r = -1; r <= 1; r++) {
                    if (row + r < 0 || moduleCount <= row + r) continue;
                    for (let c = -1; c <= 1; c++) {
                        if (col + c < 0 || moduleCount <= col + c) continue;
                        if (r === 0 && c === 0) continue;
                        if (dark === qrCode.isDark(row + r, col + c)) sameCount++;
                    }
                }
                if (sameCount > 5) lostPoint += (3 + sameCount - 5);
            }
        }
        return lostPoint;
    };

    return {
        gerarSVG: function(texto, tamanho = 200) {
            try {
                const qr = new QRCode(0, QRErrorCorrectLevel.M);
                qr.addData(texto);
                qr.make();
                const count = qr.getModuleCount();
                const margin = 3;
                const total = count + margin * 2;
                const cellSize = (tamanho / total).toFixed(3);
                
                let rects = '';
                for (let r = 0; r < count; r++) {
                    for (let c = 0; c < count; c++) {
                        if (qr.isDark(r, c)) {
                            const x = ((c + margin) * cellSize).toFixed(2);
                            const y = ((r + margin) * cellSize).toFixed(2);
                            rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#000000" shape-rendering="crispEdges"/>`;
                        }
                    }
                }
                return `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 ${tamanho} ${tamanho}" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff; border-radius:4px; display:block; margin:0 auto;"><rect width="${tamanho}" height="${tamanho}" fill="#ffffff"/>${rects}</svg>`;
            } catch(e) {
                console.error("Erro na geração de QR Code nativo:", e);
                return null;
            }
        }
    };
})();

function obterUrlEntradaCampanha(codigo) {
    const cod = codigo || (salaCampanhaAtiva && salaCampanhaAtiva.codigo) || "";
    let base = window.location.href.split('?')[0].split('#')[0];
    if (!base || base.startsWith('about:') || base.startsWith('blob:')) {
        base = 'https://ais-pre-dwen5kqcrdsml2yvfrdbe6-207260996794.us-west2.run.app/';
    }
    return `${base}?codigo=${encodeURIComponent(cod)}#campanhas`;
}

function copiarLinkEntradaCampanha() {
    if (!salaCampanhaAtiva || !salaCampanhaAtiva.codigo) return;
    const url = obterUrlEntradaCampanha(salaCampanhaAtiva.codigo);
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            mostrarStatus("🔗 Link de entrada rápida copiado com sucesso!", "ok");
        }).catch(() => {
            prompt("Copie o link direto da campanha:", url);
        });
    } else {
        prompt("Copie o link direto da campanha:", url);
    }
}

function abrirModalQRCodeCampanha() {
    const modal = document.getElementById("modal-qrcode-campanha");
    if (!modal || !salaCampanhaAtiva) return;
    const cod = salaCampanhaAtiva.codigo;
    const txtCod = document.getElementById("qrcode-codigo-txt");
    const container = document.getElementById("qrcode-canvas-container");
    const urlPreview = document.getElementById("qrcode-url-preview");

    if (txtCod) txtCod.textContent = cod;
    
    const urlEntrada = obterUrlEntradaCampanha(cod);
    if (urlPreview) {
        urlPreview.textContent = urlEntrada;
    }

    if (container) {
        const svgReal = QRCodeLib.gerarSVG(urlEntrada, 200);
        if (svgReal) {
            container.innerHTML = svgReal;
        } else {
            // Fallback de alta fidelidade
            container.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlEntrada)}" alt="QR Code Campanha ${cod}" style="width:200px; height:200px; display:block; border-radius:4px;" />`;
        }
    }

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
}

function fecharModalQRCodeCampanha() {
    const modal = document.getElementById("modal-qrcode-campanha");
    if (!modal) return;
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
}

function fecharModalQRCodeCampanhaPorOverlay(e) {
    if (e.target && e.target.id === "modal-qrcode-campanha") {
        fecharModalQRCodeCampanha();
    }
}

function atualizarSeletoresMembros() {
    const destSelect = document.getElementById("campanha-chat-destinatario");
    if (!destSelect) return;
    const membros = salaCampanhaAtiva?.membros || [];
    const meuId = localStorage.getItem('we_are_strangers_player_uuid');
    const valorAtual = destSelect.value;

    let html = `<option value="todos">📢 Todos (Público)</option>`;
    membros.forEach(m => {
        if (m.id !== meuId) {
            html += `<option value="${m.id}">🤫 Sussurrar para ${m.nomePersonagem || "Jogador"}</option>`;
        }
    });
    destSelect.innerHTML = html;
    if (valorAtual) destSelect.value = valorAtual;
}

let timersToastConquista = [];
let animacaoToastConquistaConcluida = false;

function tocarSomBip8Bit(frequencia = 440) {
    if (typeof somAtivado !== "undefined" && !somAtivado) return;
    if (typeof obterAudioContext !== "function") return;
    const ctx = obterAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(frequencia, t);
    gain.gain.setValueAtTime(0.035, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.028);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.03);
}

function limparTimersToastConquista() {
    if (Array.isArray(timersToastConquista)) {
        timersToastConquista.forEach(t => clearTimeout(t));
    }
    timersToastConquista = [];
}

function exibirToastMesa({
    tipo = 'equipe',
    icone = '🏆',
    subtitulo = '',
    titulo = '',
    desc = '',
    duracao = 6500
} = {}) {
    const toast = document.getElementById("toast-conquista-equipe");
    if (!toast) return;

    limparTimersToastConquista();
    animacaoToastConquistaConcluida = false;

    // Remove todas as classes de tipo prévias e adiciona a nova
    toast.classList.remove("tipo-rolagem", "tipo-sussurro", "tipo-individual", "tipo-secreta", "tipo-equipe", "toast-modo-harmonico");
    
    // Conquistas mantêm o estilo 8-Bit Pixel Art retro.
    // Notificações gerais de mesa (rolagens, sussurros, chat, alertas) usam o novo Design Harmônico do site afetado pela Cor Tema.
    const tiposConquista8Bit = ["equipe", "individual", "secreta"];
    if (!tiposConquista8Bit.includes(tipo)) {
        toast.classList.add("toast-modo-harmonico");
    }
    toast.classList.add(`tipo-${tipo}`);

    const iconeEl = document.getElementById("toast-conquista-icone");
    const subEl = document.getElementById("toast-conquista-sub");
    const titEl = document.getElementById("toast-conquista-titulo");
    const descEl = document.getElementById("toast-conquista-desc");

    const textoTitulo = String(titulo || "");
    const textoDesc = String(desc || "");

    if (iconeEl) iconeEl.textContent = icone || '🏆';
    if (subEl) subEl.textContent = subtitulo || '';
    if (titEl) titEl.innerHTML = '<span class="toast-conquista-cursor"></span>';
    if (descEl) descEl.innerHTML = '';

    toast.classList.add("visivel");

    function finalizarImediato() {
        if (animacaoToastConquistaConcluida) return;
        animacaoToastConquistaConcluida = true;
        limparTimersToastConquista();
        if (titEl) titEl.textContent = textoTitulo;
        if (descEl) descEl.textContent = textoDesc;
        agendarFechamentoToast(4500);
    }

    toast.onclick = function() {
        if (!animacaoToastConquistaConcluida) {
            finalizarImediato();
        } else {
            toast.classList.remove("visivel");
        }
    };

    function agendarFechamentoToast(ms = duracao) {
        const timer = setTimeout(() => {
            toast.classList.remove("visivel");
        }, ms);
        timersToastConquista.push(timer);
    }

    // Digitação Gradual Letra por Letra (8-Bit Typewriter)
    let indexTit = 0;
    function digitarTitulo() {
        if (animacaoToastConquistaConcluida) return;
        indexTit++;
        const char = textoTitulo[indexTit - 1];
        if (titEl) {
            titEl.innerHTML = escapeHTML(textoTitulo.slice(0, indexTit)) + '<span class="toast-conquista-cursor"></span>';
        }
        if (char && /[a-zA-Z0-9À-ÿ]/.test(char) && indexTit % 2 === 0) {
            tocarSomBip8Bit(330 + (indexTit % 4) * 35);
        }

        if (indexTit < textoTitulo.length) {
            const timer = setTimeout(digitarTitulo, 22);
            timersToastConquista.push(timer);
        } else {
            if (titEl) titEl.textContent = textoTitulo;
            if (textoDesc) {
                const timerDesc = setTimeout(iniciarDigitacaoDescricao, 150);
                timersToastConquista.push(timerDesc);
            } else {
                animacaoToastConquistaConcluida = true;
                agendarFechamentoToast(duracao);
            }
        }
    }

    let indexDesc = 0;
    function iniciarDigitacaoDescricao() {
        if (animacaoToastConquistaConcluida) return;
        if (descEl) descEl.innerHTML = '<span class="toast-conquista-cursor"></span>';

        function passoDesc() {
            if (animacaoToastConquistaConcluida) return;
            indexDesc++;
            const char = textoDesc[indexDesc - 1];
            if (descEl) {
                descEl.innerHTML = escapeHTML(textoDesc.slice(0, indexDesc)) + '<span class="toast-conquista-cursor"></span>';
            }
            if (char && /[a-zA-Z0-9À-ÿ]/.test(char) && indexDesc % 3 === 0) {
                tocarSomBip8Bit(220 + (indexDesc % 3) * 25);
            }

            if (indexDesc < textoDesc.length) {
                let delay = 18;
                if ([".", "!", "?"].includes(char)) delay = 90;
                const timer = setTimeout(passoDesc, delay);
                timersToastConquista.push(timer);
            } else {
                if (descEl) descEl.textContent = textoDesc;
                animacaoToastConquistaConcluida = true;
                agendarFechamentoToast(duracao);
            }
        }

        passoDesc();
    }

    const tInicial = setTimeout(digitarTitulo, 80);
    timersToastConquista.push(tInicial);
}

function exibirToastRolagemCampanha(rolagem, jogadorNome) {
    const jogador = jogadorNome || "Um membro da mesa";
    const nomeTeste = rolagem?.pericia || rolagem?.nome || "Rolagem de Teste";
    const total = rolagem?.resultadoFinal !== undefined ? rolagem.resultadoFinal : (rolagem?.total !== undefined ? rolagem.total : (rolagem?.resultado !== undefined ? rolagem.resultado : "?"));
    const faixa = rolagem?.faixaNome || rolagem?.faixaTipo || "";
    
    let detalhe = "";
    if (Array.isArray(rolagem?.dados) && rolagem.dados.length > 0) {
        detalhe = `Dados: [${rolagem.dados.join(', ')}] = ${rolagem.somaDados || 0}${rolagem.somaAtributos ? ` | Mod: +${rolagem.somaAtributos}` : ''}`;
    }
    if (faixa) {
        detalhe = `${faixa}${detalhe ? ` • ${detalhe}` : ''}`;
    }

    exibirToastMesa({
        tipo: 'rolagem',
        icone: '🎲',
        subtitulo: '🎲 ROLAGEM DE DADOS NA MESA',
        titulo: `${jogador} • ${nomeTeste}: ${total}`,
        desc: detalhe || 'Resultado do teste transmitido em tempo real para a campanha.',
        duracao: 6000
    });
}

function exibirToastSussurroCampanha(remetente, destinatario, texto) {
    const rem = remetente || "Aliado";
    const dest = destinatario || "Você";
    const txt = (texto || "").trim();

    exibirToastMesa({
        tipo: 'sussurro',
        icone: '🤫',
        subtitulo: '🤫 SUSSURRO PRIVADO RECEBIDO',
        titulo: `De ${rem} para ${dest}`,
        desc: txt ? `"${txt}"` : 'Mensagem confidencial recebida na mesa.',
        duracao: 6500
    });
}

function exibirToastConquistaIndividual(conquista, jogadorNome, ehSecreta = false) {
    const jogador = jogadorNome || "Um membro da mesa";
    const c = conquista || {};
    const pts = c.pontos ? ` (+${c.pontos} pts)` : '';
    const tit = (c.titulo || "Conquista") + pts;
    const descBase = c.desc || "";

    if (ehSecreta || c.nivel1 === 'secretas') {
        exibirToastMesa({
            tipo: 'secreta',
            icone: c.icone || '🔮',
            subtitulo: '🔮 CONQUISTA SECRETA DESBLOQUEADA!',
            titulo: `${tit}`,
            desc: `Desbloqueada por ${jogador}! ${descBase ? `• ${descBase}` : ''}`,
            duracao: 7000
        });
    } else {
        exibirToastMesa({
            tipo: 'individual',
            icone: c.icone || '🌟',
            subtitulo: '🌟 CONQUISTA INDIVIDUAL DESBLOQUEADA!',
            titulo: `${tit}`,
            desc: `Desbloqueada por ${jogador}! ${descBase ? `• ${descBase}` : ''}`,
            duracao: 7000
        });
    }
}

function exibirToastConquistaEquipe(conquista, desbloqueadoPor) {
    const c = conquista || {};
    const autor = desbloqueadoPor || "Um membro da equipe";
    const pts = c.pontos ? ` (+${c.pontos} pts)` : '';
    const tit = (c.titulo || "Feito de Equipe") + pts;
    const descBase = c.desc || "";

    exibirToastMesa({
        tipo: 'equipe',
        icone: c.icone || '🤝',
        subtitulo: '🤝 FEITO DE EQUIPE DESBLOQUEADO!',
        titulo: `${tit}`,
        desc: `Desbloqueado por ${autor} para todos do grupo! ${descBase ? `• ${descBase}` : ''}`,
        duracao: 7500
    });
}

function exibirToastConquista(conquista, subTextoPersonalizado = "", autor = "") {
    if (!conquista) return;
    if (conquista.nivel2 === "equipe") {
        exibirToastConquistaEquipe(conquista, autor);
    } else if (conquista.nivel1 === "secretas") {
        exibirToastConquistaIndividual(conquista, autor || "Você", true);
    } else {
        exibirToastConquistaIndividual(conquista, autor || "Você", false);
    }
}

function filtrarFeedCampanha(tipo) {
    filtroFeedCampanhaAtivo = tipo;
    ['todos', 'rolagem', 'equipe', 'individual', 'chat'].forEach(t => {
        const btn = document.getElementById(`btn-feed-filtro-${t}`);
        if (btn) {
            if (t === tipo) {
                btn.classList.add('ativa');
            } else {
                btn.classList.remove('ativa');
            }
        }
    });
    renderizarFeedCampanha();
}

function filtrarConquistasEquipeCampanha(termo) {
    termoBuscaEquipeCampanha = (termo || '').toLowerCase().trim();
    renderizarConquistasEquipeCampanha();
}

function renderizarPainelCampanha() {
    const nomePersonagem = (document.getElementById("nome_personagem")?.value || "").trim() || "Personagem";
    const nomeJogador = (document.getElementById("nome_jogador")?.value || "").trim() || "Jogador";

    const prevChar = document.getElementById("campanha_preview_nome_personagem");
    const prevJog = document.getElementById("campanha_preview_nome_jogador");
    if (prevChar) prevChar.textContent = nomePersonagem;
    if (prevJog) prevJog.textContent = nomeJogador;

    if (!salaCampanhaAtiva) {
        atualizarBadgeStatusCampanha('offline');
        return;
    }

    atualizarBadgeStatusCampanha('conectado', salaCampanhaAtiva.codigo);

    // 1. Estatísticas do Cabeçalho
    const statMembros = document.getElementById("campanha-stat-membros");
    const statEquipe = document.getElementById("campanha-stat-equipe-conq");
    const statPontos = document.getElementById("campanha-stat-pontos-totais");

    const membros = salaCampanhaAtiva.membros || [];
    const conquistasEquipeIds = salaCampanhaAtiva.conquistasEquipe || [];

    if (statMembros) statMembros.textContent = `${salaCampanhaAtiva.membrosOnline || membros.length}`;
    if (statEquipe) statEquipe.textContent = `${conquistasEquipeIds.length}`;

    // Calcula pontuação total somada de todos os membros e de equipe
    let pontosTotalGrupo = 0;
    const todosFeitosEquipe = [...CONQUISTAS_OFICIAIS, ...conquistasCampanha].filter(c => c.nivel2 === 'equipe');
    conquistasEquipeIds.forEach(eqId => {
        const c = todosFeitosEquipe.find(item => item.id === eqId);
        if (c) pontosTotalGrupo += (c.pontos || 0);
    });

    membros.forEach(m => {
        (m.conquistasIndividuais || []).forEach(indId => {
            const c = [...CONQUISTAS_OFICIAIS, ...conquistasCampanha].find(item => item.id === indId);
            if (c) pontosTotalGrupo += (c.pontos || 0);
        });
        (m.conquistasSecretas || []).forEach(secId => {
            const c = CONQUISTAS_SECRETAS.find(item => item.id === secId);
            if (c) pontosTotalGrupo += (c.pontos || 0);
        });
    });

    if (statPontos) statPontos.textContent = `${pontosTotalGrupo} pts`;

    // 2. Renderizar Membros da Equipe
    renderizarMembrosCampanha();
    if (typeof renderizarMembrosModoTatico === "function") {
        renderizarMembrosModoTatico();
    }

    // 3. Renderizar Conquistas de Equipe
    renderizarConquistasEquipeCampanha();

    // 4. Renderizar Feed de Histórico
    renderizarFeedCampanha();
}

function renderizarMembrosCampanha() {
    const grid = document.getElementById("campanha-membros-grid");
    if (!grid || !salaCampanhaAtiva) return;
    grid.innerHTML = "";

    const membros = salaCampanhaAtiva.membros || [];
    const meuId = localStorage.getItem('we_are_strangers_player_uuid');

    membros.forEach(m => {
        const card = document.createElement("div");
        card.className = "campanha-membro-card";
        const ehMeu = (m.id === meuId);

        let avatarHtml = "👤";
        if (m.avatar && (m.avatar.startsWith("data:image") || m.avatar.startsWith("http") || m.avatar.startsWith("blob:") || m.avatar.startsWith("/") || m.avatar.length > 50)) {
            avatarHtml = `<img src="${m.avatar}" alt="${m.nomePersonagem}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else if (m.corTema) {
            avatarHtml = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:${m.corTema}20; color:${m.corTema}; font-weight:bold; font-size:16px; border-radius:50%; font-family:'MirageFinal',serif;">${(m.nomePersonagem || "P").charAt(0).toUpperCase()}</div>`;
        }

        const qtdIndiv = (m.conquistasIndividuais || []).length;

        let totalPtsMembro = 0;
        (m.conquistasIndividuais || []).forEach(cId => {
            const c = [...CONQUISTAS_OFICIAIS, ...conquistasCampanha].find(item => item.id === cId);
            if (c) totalPtsMembro += (c.pontos || 0);
        });
        (m.conquistasSecretas || []).forEach(sId => {
            const c = CONQUISTAS_SECRETAS.find(item => item.id === sId);
            if (c) totalPtsMembro += (c.pontos || 0);
        });

        // Cálculo de barras vitais
        const pvAtual = m.vidaAtual ?? 10;
        const pvMax = m.vidaMax || 10;
        const pctPv = Math.max(0, Math.min(100, Math.round((pvAtual / pvMax) * 100)));

        const sanAtual = m.sanidadeAtual ?? 10;
        const sanMax = m.sanidadeMax || 10;
        const pctSan = Math.max(0, Math.min(100, Math.round((sanAtual / sanMax) * 100)));

        const recAtual = m.recursoAtual ?? 5;
        const recMax = m.recursoMax || 5;
        const pctRec = Math.max(0, Math.min(100, Math.round((recAtual / recMax) * 100)));

        card.innerHTML = `
            <div class="campanha-membro-topo" style="position:relative; padding-right:34px;">
                <div class="campanha-membro-avatar">${avatarHtml}</div>
                <div class="campanha-membro-dados">
                    <div class="campanha-membro-nome">
                        ${m.nomePersonagem || "Sem Nome"}
                        ${m.isMestre ? `<span style="font-size:10px; background:#e74c3c; color:#fff; padding:1px 5px; border-radius:3px; font-weight:normal;">MESTRE</span>` : ""}
                        ${ehMeu ? `<span style="font-size:10px; background:var(--accent); color:#fff; padding:1px 5px; border-radius:3px; font-weight:normal;">VOCÊ</span>` : ""}
                    </div>
                    <div class="campanha-membro-sub">${m.nomeJogador || "Jogador"} • ${m.online ? '<span style="color:#2ecc71;">● Conectado</span>' : '<span style="color:var(--ink-dim);">○ Ausente</span>'}</div>
                </div>
                <button type="button" class="btn-secundario" style="position:absolute; top:0; right:0; width:30px; height:30px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:6px; font-size:14px; margin:0;" onclick="abrirConfiguracoesMembroCampanha('${m.id || ''}')" title="Configurações do Jogador">
                    <span>⚙️</span>
                </button>
            </div>

            <!-- Monitoramento Vital em Tempo Real -->
            <div class="campanha-vital-wrap">
                <div class="campanha-vital-row" title="Pontos de Vida">
                    <span class="campanha-vital-lbl">PV</span>
                    <div class="campanha-vital-bar-bg">
                        <div class="campanha-vital-bar-fill pv" style="width: ${pctPv}%;"></div>
                    </div>
                    <span class="campanha-vital-val">${pvAtual}/${pvMax}</span>
                </div>
                <div class="campanha-vital-row" title="Pontos de Sanidade">
                    <span class="campanha-vital-lbl">SAN</span>
                    <div class="campanha-vital-bar-bg">
                        <div class="campanha-vital-bar-fill san" style="width: ${pctSan}%;"></div>
                    </div>
                    <span class="campanha-vital-val">${sanAtual}/${sanMax}</span>
                </div>
                <div class="campanha-vital-row" title="Estamina / Recursos">
                    <span class="campanha-vital-lbl">REC</span>
                    <div class="campanha-vital-bar-bg">
                        <div class="campanha-vital-bar-fill rec" style="width: ${pctRec}%;"></div>
                    </div>
                    <span class="campanha-vital-val">${recAtual}/${recMax}</span>
                </div>
            </div>

            <div class="campanha-membro-stats">
                <span class="campanha-membro-badge" title="Feitos Individuais Desbloqueados">👤 ${qtdIndiv} Feitos</span>
                <span class="campanha-membro-badge" style="background:rgba(212,175,55,0.12); color:#d4af37; border-color:rgba(212,175,55,0.3);" title="Pontuação">⭐ ${totalPtsMembro} pts</span>
            </div>

            <div style="display:flex; gap:6px; margin-top:4px;">
                <button type="button" class="btn-secundario" style="flex:1; height:32px; font-size:11.5px; margin:0; padding:0 6px;" onclick="abrirModalDetalhesMembroPorId('${m.id}')">
                    <span>👁️ Feitos</span>
                </button>
                ${!ehMeu ? `
                <button type="button" class="btn-secundario" style="height:32px; font-size:11.5px; margin:0; padding:0 8px;" onclick="focarSussurroMembro('${m.id}')" title="Enviar sussurro direto para este jogador">
                    <span>🤫</span>
                </button>
                ` : ''}
            </div>
        `;
        grid.appendChild(card);
    });
}

function focarSussurroMembro(destId) {
    alternarSubabaCampanha('mural');
    const destSelect = document.getElementById("campanha-chat-destinatario");
    const input = document.getElementById("campanha-chat-input");
    if (destSelect) destSelect.value = destId;
    if (input) input.focus();
}

function renderizarConquistasEquipeCampanha() {
    const grid = document.getElementById("campanha-equipe-grid");
    if (!grid || !salaCampanhaAtiva) return;
    grid.innerHTML = "";

    const todasEquipe = [...CONQUISTAS_OFICIAIS, ...conquistasCampanha].filter(c => c.nivel2 === 'equipe');
    const desbloqueadasIds = salaCampanhaAtiva.conquistasEquipe || [];

    const filtradas = todasEquipe.filter(c => {
        if (!termoBuscaEquipeCampanha) return true;
        return c.titulo.toLowerCase().includes(termoBuscaEquipeCampanha) ||
               (c.desc && c.desc.toLowerCase().includes(termoBuscaEquipeCampanha));
    });

    if (filtradas.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:24px; color:var(--ink-dim); font-size:13px;">Nenhuma conquista de equipe encontrada com o termo buscado.</div>`;
        return;
    }

    filtradas.forEach(c => {
        const desbloqueada = desbloqueadasIds.includes(c.id) || conquistasDesbloqueadas.has(c.id);
        const card = document.createElement("div");
        card.className = `campanha-equipe-card ${desbloqueada ? 'desbloqueada' : ''}`;

        card.innerHTML = `
            <div class="campanha-equipe-card-topo">
                <div class="campanha-equipe-icone">${c.icone || '🤝'}</div>
                <div class="campanha-equipe-card-info">
                    <div class="campanha-equipe-titulo">
                        <span>${c.titulo}</span>
                        <span class="conq-card-pontos">+${c.pontos || 0} pts</span>
                    </div>
                    <div class="campanha-equipe-desc">${c.desc || ""}</div>
                </div>
            </div>
            <div class="campanha-equipe-rodape">
                <span class="campanha-status-pill ${desbloqueada ? 'online' : 'offline'}">
                    ${desbloqueada ? '✓ Desbloqueada para a Equipe' : '🔒 Bloqueada'}
                </span>
                ${!desbloqueada ? `
                    <button type="button" class="btn-primario" style="height:28px; padding:0 10px; font-size:11px; margin:0;" onclick='alternarDesbloqueioConquista("${c.id}")'>
                        <span>⚔️ Desbloquear Feito Coletivo</span>
                    </button>
                ` : `
                    <span style="font-size:11px; color:#2ecc71; font-weight:bold;">Sincronizada em todas as fichas</span>
                `}
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderizarFeedCampanha() {
    const listaEl = document.getElementById("campanha-feed-lista");
    if (!listaEl || !salaCampanhaAtiva) return;
    listaEl.innerHTML = "";

    const historico = salaCampanhaAtiva.historico || [];
    const filtrados = historico.filter(item => {
        if (filtroFeedCampanhaAtivo === 'todos') return true;
        if (filtroFeedCampanhaAtivo === 'rolagem') return item.tipo === 'rolagem_dado';
        if (filtroFeedCampanhaAtivo === 'equipe') return item.tipo === 'conquista_equipe';
        if (filtroFeedCampanhaAtivo === 'individual') return item.tipo === 'conquista_individual';
        if (filtroFeedCampanhaAtivo === 'secreta') return item.tipo === 'conquista_secreta';
        if (filtroFeedCampanhaAtivo === 'chat') return item.tipo === 'chat' || item.tipo === 'sussurro';
        return true;
    });

    if (filtrados.length === 0) {
        listaEl.innerHTML = `
            <div class="campanha-feed-empty">
                <div class="campanha-feed-empty-icon">📜</div>
                <div class="campanha-feed-empty-title">Nenhum evento registrado nesta categoria</div>
                <div class="campanha-feed-empty-desc">Role dados na Ficha ou Modo Tático, desbloqueie conquistas com o grupo ou envie mensagens pelo chat para interagir com a mesa em tempo real.</div>
            </div>
        `;
        return;
    }

    filtrados.forEach(item => {
        const row = document.createElement("div");
        row.className = `campanha-feed-item ${item.tipo || ''}`;

        let iconeHtml = "📜";
        let textoHtml = "";

        // Encontra informações do autor/jogador para exibir avatar quando disponível
        const autorNome = item.jogador || item.autor || item.remetente || item.desbloqueadoPor || "";
        const membroRef = (salaCampanhaAtiva?.membros || []).find(m => 
            (m.nomePersonagem && autorNome && m.nomePersonagem.toLowerCase() === autorNome.toLowerCase()) ||
            (m.nomeJogador && autorNome && m.nomeJogador.toLowerCase() === autorNome.toLowerCase())
        );

        if (item.tipo === 'rolagem_dado') {
            const r = item.rolagem || {};
            const dadosStr = Array.isArray(r.dados) ? `[${r.dados.join(', ')}]` : '';
            iconeHtml = "🎲";
            textoHtml = `<strong>${item.jogador || "Jogador"}</strong> rolou <strong>${r.pericia || "Teste"}</strong>: ${r.quantidadeDados || 0}D6 ${dadosStr} → Total <strong>${r.resultadoFinal || 0}</strong> <span style="font-size:11px; font-weight:bold; color:var(--accent);">(${r.faixaNome || ""})</span>`;
        } else if (item.tipo === 'conquista_equipe') {
            const conqIcone = item.conquista?.icone || "🤝";
            iconeHtml = `<span title="Conquista de Equipe: ${item.conquista?.titulo || ''}">${conqIcone}</span>`;
            const autorTxt = item.desbloqueadoPor || item.jogador || "Equipe";
            textoHtml = `<strong>${autorTxt}</strong> desbloqueou a conquista de equipe <strong>"${item.conquista?.titulo || "Feito Coletivo"}"</strong> (+${item.conquista?.pontos || 0} pts) para todos os membros!`;
        } else if (item.tipo === 'conquista_secreta') {
            const conqIcone = item.conquista?.icone || "🔮";
            iconeHtml = `<span title="Segredo Oculto: ${item.conquista?.titulo || ''}">${conqIcone}</span>`;
            const autorTxt = item.desbloqueadoPor || item.jogador || "Um membro";
            textoHtml = `<strong>${autorTxt}</strong> desvendou o segredo oculto <strong>"${item.conquista?.titulo || "Segredo"}"</strong> (+${item.conquista?.pontos || 0} pts)!`;
        } else if (item.tipo === 'conquista_individual') {
            const conqIcone = item.conquista?.icone || "🏆";
            iconeHtml = `<span title="Conquista: ${item.conquista?.titulo || ''}">${conqIcone}</span>`;
            const autorTxt = item.desbloqueadoPor || item.jogador || "Um membro";
            textoHtml = `<strong>${autorTxt}</strong> conquistou <strong>"${item.conquista?.titulo || "Feito"}"</strong> (+${item.conquista?.pontos || 0} pts).`;
        } else if (item.tipo === 'transferencia_item') {
            iconeHtml = "📦";
            textoHtml = `<strong>${item.remetente || "Um membro"}</strong> entregou o item <strong>"${item.item?.nome || item.itemNome || "Item"}"</strong> para <strong>${item.destinatario || "outro jogador"}</strong>.`;
        } else if (item.tipo === 'alerta_mestre') {
            iconeHtml = "🚨";
            textoHtml = `<strong>[MESTRE ${item.autor || item.mestre || ""}]:</strong> <span style="color:#e74c3c; font-weight:bold;">${item.alerta?.titulo || item.titulo || "ALERTA"}</span> — ${item.alerta?.msg || item.mensagem || ""}`;
        } else if (item.tipo === 'sussurro') {
            if (membroRef && membroRef.avatar && membroRef.avatar.startsWith("data:image")) {
                iconeHtml = `<img src="${membroRef.avatar}" alt="${autorNome}" class="campanha-feed-avatar-mini" title="Sussurro de ${autorNome}">`;
            } else {
                iconeHtml = "🤫";
            }
            textoHtml = `<span style="color:#9b59b6; font-weight:bold;">[SUSSURRO]</span> <strong>${item.remetente || "Alguém"}</strong> → <strong>${item.destinatario || "Você"}</strong>: ${item.texto || ""}`;
        } else if (item.tipo === 'chat' || item.tipo === 'mensagem_chat') {
            if (membroRef && membroRef.avatar && membroRef.avatar.startsWith("data:image")) {
                iconeHtml = `<img src="${membroRef.avatar}" alt="${autorNome}" class="campanha-feed-avatar-mini" title="${autorNome}">`;
            } else if (membroRef?.isMestre) {
                iconeHtml = "🎭";
            } else {
                iconeHtml = "💬";
            }
            textoHtml = `<strong>${item.autor || "Membro"}:</strong> ${item.texto || ""}`;
        } else if (item.tipo === 'entrada' || item.tipo === 'membro_conectou') {
            if (membroRef && membroRef.avatar && membroRef.avatar.startsWith("data:image")) {
                iconeHtml = `<img src="${membroRef.avatar}" alt="${autorNome}" class="campanha-feed-avatar-mini" title="${autorNome}">`;
            } else {
                iconeHtml = "👋";
            }
            textoHtml = `<strong>${item.jogador || item.autor || "Novo membro"}</strong> conectou sua ficha à campanha.`;
        } else if (item.tipo === 'membro_saiu') {
            iconeHtml = "🚪";
            textoHtml = item.texto || `Um membro saiu da sala.`;
        } else {
            iconeHtml = "✨";
            textoHtml = item.texto || "";
        }

        row.innerHTML = `
            <div class="campanha-feed-icon">${iconeHtml}</div>
            <div class="campanha-feed-content">
                <div class="campanha-feed-texto">${textoHtml}</div>
                <div class="campanha-feed-time">${item.hora || (item.data ? new Date(item.data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}</div>
            </div>
        `;
        listaEl.appendChild(row);
    });
}

function abrirModalDetalhesMembroPorId(membroId) {
    if (!membroId) return;
    let membro = null;
    if (typeof salaCampanhaAtiva !== "undefined" && salaCampanhaAtiva && Array.isArray(salaCampanhaAtiva.membros)) {
        membro = salaCampanhaAtiva.membros.find(x => x.id === membroId);
    }
    if (!membro) {
        const meuId = localStorage.getItem('we_are_strangers_player_uuid');
        if (membroId === meuId && typeof obterDadosJogadorLocal === "function") {
            membro = obterDadosJogadorLocal();
        }
    }
    if (membro) {
        abrirModalDetalhesMembro(membro);
    } else {
        mostrarStatus("Não foi possível carregar os dados deste membro.", "aviso");
    }
}

function abrirModalDetalhesMembro(membro) {
    if (typeof membro === "string") {
        return abrirModalDetalhesMembroPorId(membro);
    }
    const modal = document.getElementById("modal-membro-campanha");
    if (!modal || !membro) return;

    const titEl = document.getElementById("modal-membro-titulo");
    const subEl = document.getElementById("modal-membro-jogador-sub");
    const avatarBox = document.getElementById("modal-membro-avatar-box");
    const corpoEl = document.getElementById("modal-membro-corpo");

    if (titEl) titEl.textContent = membro.nomePersonagem || "Personagem Sem Nome";
    if (subEl) subEl.textContent = `Jogador: ${membro.nomeJogador || "Jogador"} • ${membro.online ? 'Conectado Agora' : 'Ausente'}`;

    if (avatarBox) {
        if (membro.avatar && membro.avatar.startsWith("data:image")) {
            avatarBox.innerHTML = `<img src="${membro.avatar}" alt="${membro.nomePersonagem}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else {
            avatarBox.innerHTML = `<span id="modal-membro-avatar-txt">👤</span>`;
        }
    }

    if (corpoEl) {
        const indIds = membro.conquistasIndividuais || [];
        const conqIndivs = indIds.map(id => [...CONQUISTAS_OFICIAIS, ...conquistasCampanha].find(c => c.id === id)).filter(Boolean);

        let html = `
            <div style="display:flex; gap:16px; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--line-soft);">
                <div><strong>Feitos Individuais:</strong> ${conqIndivs.length}</div>
            </div>
        `;

        // Seção Individuais
        html += `<h4 style="margin:0 0 10px 0; font-size:14px; color:var(--ink); font-family:'MirageFinal', serif;">👤 Feitos Individuais (${conqIndivs.length})</h4>`;
        if (conqIndivs.length === 0) {
            html += `<p style="font-size:12px; color:var(--ink-dim); margin-bottom:16px;">Nenhum feito individual registrado ainda.</p>`;
        } else {
            html += `<div style="display:flex; flex-direction:column; gap:8px;">`;
            conqIndivs.forEach(c => {
                html += `
                    <div style="background:var(--bg-inset); padding:10px; border-radius:6px; border:1px solid var(--line-soft); display:flex; align-items:center; gap:10px;">
                        <span style="font-size:18px;">${c.icone || '👤'}</span>
                        <div style="flex:1;">
                            <div style="font-size:13px; font-weight:bold; color:var(--ink);">${c.titulo} <span style="font-size:11px; color:#d4af37; font-weight:normal;">(+${c.pontos || 0} pts)</span></div>
                            <div style="font-size:11.5px; color:var(--ink-dim);">${c.desc || ""}</div>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        corpoEl.innerHTML = html;
    }

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
}

function fecharModalMembroCampanha() {
    const modal = document.getElementById("modal-membro-campanha");
    if (!modal) return;
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
}

function fecharModalMembroCampanhaPorOverlay(e) {
    if (e.target && e.target.id === "modal-membro-campanha") {
        fecharModalMembroCampanha();
    }
}

function abrirConfiguracoesMembroCampanha(membroId) {
    const modal = document.getElementById("modal-config-membro-campanha");
    const meuId = localStorage.getItem('we_are_strangers_player_uuid');
    if (!membroId) membroId = meuId;
    if (!modal) return;

    let membro = null;
    if (typeof salaCampanhaAtiva !== "undefined" && salaCampanhaAtiva && Array.isArray(salaCampanhaAtiva.membros)) {
        membro = salaCampanhaAtiva.membros.find(x => x.id === membroId);
    }
    if ((!membro || membro.id === meuId || membroId === meuId) && typeof obterDadosJogadorLocal === "function") {
        const dadosLocais = obterDadosJogadorLocal();
        if (dadosLocais) {
            membro = Object.assign({}, membro || {}, dadosLocais);
        }
    }
    if (!membro) {
        mostrarStatus("Não foi possível carregar os dados deste membro.", "aviso");
        return;
    }

    const titEl = document.getElementById("modal-config-membro-titulo");
    const subEl = document.getElementById("modal-config-membro-sub");
    const avatarBox = document.getElementById("modal-config-avatar-box");
    const corpoEl = document.getElementById("modal-config-membro-corpo");

    const ehMeu = (membro.id === meuId || membroId === meuId);
    const souCriadorOriginal = (salaCampanhaAtiva && salaCampanhaAtiva.criadorId === meuId);
    const souMestre = isMestreCampanha || souCriadorOriginal;
    const ehCriadorDoAlvo = (salaCampanhaAtiva && salaCampanhaAtiva.criadorId === membro.id);

    if (titEl) titEl.textContent = membro.nomePersonagem || "Configurações de Jogador";
    if (subEl) subEl.textContent = `Jogador: ${membro.nomeJogador || "Você"} • ${membro.isMestre ? 'Mestre' : 'Jogador'}`;

    if (avatarBox) {
        if (membro.avatar && membro.avatar.startsWith("data:image")) {
            avatarBox.innerHTML = `<img src="${membro.avatar}" alt="${membro.nomePersonagem}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else {
            avatarBox.innerHTML = `<span id="modal-config-avatar-txt">👤</span>`;
        }
    }

    if (corpoEl) {
        let html = `
            <button type="button" class="btn-destaque" style="width:100%; height:40px; font-size:13.5px; margin:0; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="visualizarFichaMembroCampanha('${membro.id || meuId}')">
                <span>📄</span> VER FICHA
            </button>
            <button type="button" class="btn-secundario" style="width:100%; height:38px; font-size:13px; margin:0; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="fecharModalConfigMembro(); abrirModalDetalhesMembroPorId('${membro.id || meuId}');">
                <span>👁️</span> ${ehMeu ? 'Ver Meus Feitos e Conquistas' : 'Ver Feitos e Conquistas'}
            </button>
        `;

        if (ehMeu) {
            html += `
                <button type="button" class="btn-secundario" style="width:100%; height:38px; font-size:13px; margin:0; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="fecharModalConfigMembro(); abrirModalIdentidadeSecreta();">
                    <span>🎭</span> Configurações do Disfarce
                </button>
            `;
            if (souCriadorOriginal || isMestreCampanha) {
                html += `
                    <div style="margin-top:6px; padding-top:10px; border-top:1px solid var(--line-soft);">
                        <button type="button" class="btn-secundario" style="width:100%; height:38px; font-size:13px; margin:0; display:flex; align-items:center; justify-content:center; gap:8px; border-color:var(--accent); color:var(--accent);" onclick="fecharModalConfigMembro(); alternarPapelMestreCampanha();">
                            <span>👑</span> Alternar Modo ${isMestreCampanha ? 'Jogador' : 'Mestre / Narrador'}
                        </button>
                    </div>
                `;
            }
        } else {
            html += `
                <button type="button" class="btn-secundario" style="width:100%; height:38px; font-size:13px; margin:0; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="fecharModalConfigMembro(); focarSussurroMembro('${membro.id}');">
                    <span>🤫</span> Enviar Sussurro Direto
                </button>
            `;

            if (souMestre && !ehCriadorDoAlvo) {
                if (membro.isMestre) {
                    html += `
                        <div style="margin-top:6px; padding-top:10px; border-top:1px solid var(--line-soft);">
                            <button type="button" class="btn-secundario" style="width:100%; height:38px; font-size:13px; margin:0; display:flex; align-items:center; justify-content:center; gap:8px; border-color:#e74c3c; color:#e74c3c;" onclick="alterarPapelMembroCampanha('${membro.id}', false)">
                                <span>👤</span> Remover Papel de Mestre
                            </button>
                        </div>
                    `;
                } else {
                    html += `
                        <div style="margin-top:6px; padding-top:10px; border-top:1px solid var(--line-soft);">
                            <button type="button" class="btn-secundario" style="width:100%; height:38px; font-size:13px; margin:0; display:flex; align-items:center; justify-content:center; gap:8px; border-color:var(--accent); color:var(--accent);" onclick="alterarPapelMembroCampanha('${membro.id}', true)">
                                <span>🎭</span> Conceder Papel de Mestre
                            </button>
                        </div>
                    `;
                }
            }
        }

        corpoEl.innerHTML = html;
    }

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
}

function fecharModalConfigMembro() {
    const modal = document.getElementById("modal-config-membro-campanha");
    if (!modal) return;
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
}

function fecharModalConfigMembroPorOverlay(e) {
    if (e.target && e.target.id === "modal-config-membro-campanha") {
        fecharModalConfigMembro();
    }
}

function alterarPapelMembroCampanha(alvoId, novoIsMestre) {
    fecharModalConfigMembro();
    if (!socketCampanha || socketCampanha.readyState !== WebSocket.OPEN || !salaCampanhaAtiva) {
        mostrarStatus("Sem conexão com o servidor da campanha.", "erro");
        return;
    }
    socketCampanha.send(JSON.stringify({
        type: 'alterar_papel_membro',
        alvoId: alvoId,
        novoIsMestre: novoIsMestre
    }));
    mostrarStatus(novoIsMestre ? "🎭 Papel de Mestre concedido ao jogador!" : "👤 Papel de Mestre revogado.", "ok");
}

function visualizarFichaMembroCampanha(membroId) {
    fecharModalConfigMembro();
    const modal = document.getElementById("modal-visualizar-ficha-membro");
    if (!modal) return;

    let membro = null;
    if (typeof salaCampanhaAtiva !== "undefined" && salaCampanhaAtiva && Array.isArray(salaCampanhaAtiva.membros)) {
        membro = salaCampanhaAtiva.membros.find(x => x.id === membroId);
    }
    const meuId = localStorage.getItem('we_are_strangers_player_uuid');
    if (!membro && membroId === meuId && typeof obterDadosJogadorLocal === "function") {
        membro = obterDadosJogadorLocal();
    }
    if (!membro) {
        mostrarStatus("Não foi possível encontrar a ficha deste jogador.", "aviso");
        return;
    }

    const souMestre = isMestreCampanha || (salaCampanhaAtiva && salaCampanhaAtiva.criadorId === meuId);
    const ehMeu = (membro.id === meuId);

    const estaDisfarcado = !!membro.trocarPorCodinome;
    const revelarReal = souMestre || ehMeu || !estaDisfarcado;

    const nomeExibido = revelarReal 
        ? (membro.nomePersonagem || "Agente Sem Nome") 
        : (membro.codinomeOriginal || "Identidade Desconhecida / Disfarce");

    const subExibido = (membro.classe1 || membro.classe2) 
        ? `${membro.classe1 || ''} ${membro.classe2 ? '/ ' + membro.classe2 : ''} • Nível ${membro.nivel || 1}`
        : `Agente • Jogador: ${membro.nomeJogador || 'Conectado'}`;

    const titEl = document.getElementById("modal-vis-ficha-titulo");
    const subEl = document.getElementById("modal-vis-ficha-sub");
    const corpoEl = document.getElementById("modal-vis-ficha-corpo");

    if (titEl) titEl.textContent = nomeExibido;
    if (subEl) subEl.textContent = subExibido;

    if (corpoEl) {
        let avatarHtml = "👤";
        if (membro.avatar && membro.avatar.startsWith("data:image")) {
            avatarHtml = `<img src="${membro.avatar}" alt="${nomeExibido}" style="width:70px; height:70px; object-fit:cover; border-radius:50%; border:2px solid var(--accent);">`;
        } else {
            avatarHtml = `<div style="width:70px; height:70px; border-radius:50%; background:var(--bg-inset); display:flex; align-items:center; justify-content:center; font-size:32px; border:2px solid var(--accent);">👤</div>`;
        }

        const pvAtual = membro.vidaAtual ?? 10;
        const pvMax = membro.vidaMax || 10;
        const sanAtual = membro.sanidadeAtual ?? 10;
        const sanMax = membro.sanidadeMax || 10;
        const recAtual = membro.recursoAtual ?? 5;
        const recMax = membro.recursoMax || 5;

        const attrs = membro.atributos || { HPR: 1, PRX: 1, PSI: 1, QI: 1 };

        let statusBanner = '';
        if (estaDisfarcado && souMestre && !ehMeu) {
            statusBanner = `<div style="background:rgba(231,76,60,0.12); border:1px solid #e74c3c; border-radius:6px; padding:10px 14px; font-size:12px; color:#e74c3c; display:flex; align-items:center; gap:8px;">
                <span>🎭</span> <strong>VISÃO DE MESTRE:</strong> Este agente está em Modo Disfarce para os outros jogadores. Exibindo identidade real de "${membro.identidadeReal || membro.nomePersonagem}".
            </div>`;
        } else if (estaDisfarcado && !souMestre && !ehMeu) {
            statusBanner = `<div style="background:rgba(52,152,219,0.12); border:1px solid #3498db; border-radius:6px; padding:10px 14px; font-size:12px; color:#3498db; display:flex; align-items:center; gap:8px;">
                <span>🔒</span> <strong>DISFARCE ATIVO:</strong> Exibindo a identidade pública e disfarce do agente.
            </div>`;
        }

        let html = `
            ${statusBanner}
            <div style="display:flex; align-items:center; gap:16px; background:var(--bg-card); padding:14px; border-radius:8px; border:1px solid var(--line);">
                ${avatarHtml}
                <div style="flex:1;">
                    <div style="font-size:18px; font-weight:bold; color:var(--ink); font-family:'MirageFinal', serif;">${nomeExibido}</div>
                    <div style="font-size:12.5px; color:var(--ink-dim); margin-top:2px;">Jogador: ${membro.nomeJogador || "Jogador"}</div>
                    <div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap;">
                        ${membro.isMestre ? '<span style="font-size:10px; background:#e74c3c; color:#fff; padding:2px 6px; border-radius:3px;">MESTRE</span>' : '<span style="font-size:10px; background:var(--bg-inset); color:var(--ink); padding:2px 6px; border-radius:3px; border:1px solid var(--line);">JOGADOR</span>'}
                        ${membro.classe1 ? `<span style="font-size:10px; background:var(--accent); color:#fff; padding:2px 6px; border-radius:3px;">${membro.classe1}</span>` : ''}
                        ${membro.nivel ? `<span style="font-size:10px; background:var(--bg-inset); color:var(--ink); padding:2px 6px; border-radius:3px; border:1px solid var(--line);">Nível ${membro.nivel}</span>` : ''}
                    </div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:10px;">
                <div style="background:var(--bg-card); border:1px solid var(--line); border-radius:6px; padding:10px; text-align:center;">
                    <span style="font-size:11px; color:var(--ink-dim); font-weight:bold; display:block;">PONTOS DE VIDA</span>
                    <span style="font-size:16px; font-weight:bold; color:#e74c3c;">❤️ ${pvAtual} / ${pvMax}</span>
                </div>
                <div style="background:var(--bg-card); border:1px solid var(--line); border-radius:6px; padding:10px; text-align:center;">
                    <span style="font-size:11px; color:var(--ink-dim); font-weight:bold; display:block;">SANIDADE</span>
                    <span style="font-size:16px; font-weight:bold; color:#9b59b6;">🧠 ${sanAtual} / ${sanMax}</span>
                </div>
                <div style="background:var(--bg-card); border:1px solid var(--line); border-radius:6px; padding:10px; text-align:center;">
                    <span style="font-size:11px; color:var(--ink-dim); font-weight:bold; display:block;">ESTAMINA / REC</span>
                    <span style="font-size:16px; font-weight:bold; color:#2ecc71;">⚡ ${recAtual} / ${recMax}</span>
                </div>
            </div>

            <div style="background:var(--bg-card); border:1px solid var(--line); border-radius:8px; padding:12px;">
                <div style="font-size:13px; font-weight:bold; color:var(--ink); margin-bottom:8px; font-family:'MirageFinal', serif; display:flex; align-items:center; gap:6px;">
                    <span>📊</span> Atributos Principais
                </div>
                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; text-align:center;">
                    <div style="background:var(--bg-inset); padding:8px; border-radius:6px; border:1px solid var(--line-soft);">
                        <div style="font-size:10.5px; color:var(--ink-dim);">HPR</div>
                        <div style="font-size:16px; font-weight:bold; color:var(--ink);">${attrs.HPR || 1}</div>
                    </div>
                    <div style="background:var(--bg-inset); padding:8px; border-radius:6px; border:1px solid var(--line-soft);">
                        <div style="font-size:10.5px; color:var(--ink-dim);">PRX</div>
                        <div style="font-size:16px; font-weight:bold; color:var(--ink);">${attrs.PRX || 1}</div>
                    </div>
                    <div style="background:var(--bg-inset); padding:8px; border-radius:6px; border:1px solid var(--line-soft);">
                        <div style="font-size:10.5px; color:var(--ink-dim);">PSI</div>
                        <div style="font-size:16px; font-weight:bold; color:var(--ink);">${attrs.PSI || 1}</div>
                    </div>
                    <div style="background:var(--bg-inset); padding:8px; border-radius:6px; border:1px solid var(--line-soft);">
                        <div style="font-size:10.5px; color:var(--ink-dim);">QI</div>
                        <div style="font-size:16px; font-weight:bold; color:var(--ink);">${attrs.QI || 1}</div>
                    </div>
                </div>
            </div>
        `;

        if (Array.isArray(membro.periciasTop) && membro.periciasTop.length > 0) {
            html += `
                <div style="background:var(--bg-card); border:1px solid var(--line); border-radius:8px; padding:12px;">
                    <div style="font-size:13px; font-weight:bold; color:var(--ink); margin-bottom:6px; font-family:'MirageFinal', serif;">
                        🎯 Principais Perícias
                    </div>
                    <div style="display:flex; flex-wrap:wrap; gap:6px;">
                        ${membro.periciasTop.map(p => `<span style="font-size:11.5px; background:var(--bg-inset); color:var(--ink); padding:3px 8px; border-radius:4px; border:1px solid var(--line-soft);">${p}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        corpoEl.innerHTML = html;
    }

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
}

function fecharModalVisualizarFicha() {
    const modal = document.getElementById("modal-visualizar-ficha-membro");
    if (!modal) return;
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
}

function fecharModalVisualizarFichaPorOverlay(e) {
    if (e.target && e.target.id === "modal-visualizar-ficha-membro") {
        fecharModalVisualizarFicha();
    }
}

function inicializarCampanhasMultiplayer() {
    gerarCodigoAleatorioCampanha();

    // 1. Checa parâmetros de URL para entrada instantânea via QR Code / Link compartilhado
    try {
        const urlParams = new URLSearchParams(window.location.search);
        let codigoUrl = urlParams.get('codigo') || urlParams.get('campanha') || urlParams.get('sala');
        
        if (!codigoUrl && window.location.hash) {
            const rawHash = window.location.hash.replace(/^#/, '');
            if (rawHash.includes('=')) {
                const hashParams = new URLSearchParams(rawHash.replace(/^campanhas[?&]/, ''));
                codigoUrl = hashParams.get('codigo') || hashParams.get('campanha') || hashParams.get('sala');
            }
        }

        if (codigoUrl) {
            codigoUrl = codigoUrl.trim().toUpperCase();
            const inputCod = document.getElementById("campanha_input_codigo_entrar");
            if (inputCod) inputCod.value = codigoUrl;

            // Alterna para a aba de Campanhas
            if (typeof alternarAba === "function") {
                alternarAba('campanhas', false);
            }

            // Conecta diretamente à sala da campanha indicada no QR Code
            setTimeout(() => {
                conectarWebSocketCampanha(codigoUrl);
                if (typeof mostrarStatus === "function") {
                    mostrarStatus(`📱 Conectando à sala ${codigoUrl} via QR Code/Link...`, "ok");
                }
            }, 250);
            return;
        }
    } catch(e) {
        console.error("Erro ao verificar parâmetro de campanha na URL:", e);
    }

    // 2. Auto-reconectar se o jogador já possuía uma sala de campanha salva
    try {
        const codigoSalvo = localStorage.getItem('we_are_strangers_campanha_codigo');
        if (codigoSalvo) {
            conectarWebSocketCampanha(codigoSalvo);
        }
    } catch(e) {}

    // Escuta mudanças nos inputs da ficha para atualizar em tempo real na campanha
    const camposSync = [
        "nome_personagem", "nome_jogador",
        "pontos_vida", "pontos_vida_max",
        "pontos_sanidade", "pontos_sanidade_max",
        "pontos_recurso", "pontos_recurso_max"
    ];
    camposSync.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", () => {
                sincronizarEstadoComCampanha();
            });
            el.addEventListener("change", () => {
                sincronizarEstadoComCampanha();
            });
        }
    });

    // Auto-save no diário colaborativo (debounce 1.5s)
    const txtDiario = document.getElementById("campanha-diario-texto");
    if (txtDiario) {
        txtDiario.addEventListener("input", () => {
            clearTimeout(timeoutDebounceDiario);
            timeoutDebounceDiario = setTimeout(() => {
                salvarDiarioSessaoCampanha();
            }, 1500);
        });
    }

    // Ouvintes de ciclo de vida do dispositivo / navegador para reconectar instantaneamente ao acordar tela ou voltar rede
    window.addEventListener('online', () => {
        const cod = (salaCampanhaAtiva && salaCampanhaAtiva.codigo) || localStorage.getItem('we_are_strangers_campanha_codigo');
        if (cod && (!socketCampanha || socketCampanha.readyState !== WebSocket.OPEN)) {
            conectarWebSocketCampanha(cod);
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const cod = (salaCampanhaAtiva && salaCampanhaAtiva.codigo) || localStorage.getItem('we_are_strangers_campanha_codigo');
            if (cod && (!socketCampanha || socketCampanha.readyState !== WebSocket.OPEN)) {
                conectarWebSocketCampanha(cod);
            }
        }
    });

    window.addEventListener('focus', () => {
        const cod = (salaCampanhaAtiva && salaCampanhaAtiva.codigo) || localStorage.getItem('we_are_strangers_campanha_codigo');
        if (cod && (!socketCampanha || socketCampanha.readyState !== WebSocket.OPEN)) {
            conectarWebSocketCampanha(cod);
        }
    });

    window.addEventListener('storage', (event) => {
        if (!event.key || !salaCampanhaAtiva) return;
        if (event.key === 'was_campanha_sync_' + salaCampanhaAtiva.codigo && event.newValue) {
            try {
                const data = JSON.parse(event.newValue);
                if (data && data.msg) {
                    processarMensagemCampanha(data.msg);
                }
            } catch(e) {}
        }
    });
}

criarPainel();
instalarListenersAtributos();
instalarListenersRastreamentoAlteracoes();
atualizarOpcoesClasse();
aplicarAvatar();
if (typeof renderizarBadgePremioYudi === "function") {
    renderizarBadgePremioYudi();
}
atualizarTodasBarrasRecursos();
inicializarStorage();
inicializarAbasCategorias();
atualizarBotoesSom();
inicializarHistoricoRolagens();
inicializarModoTema();
inicializarTipografias();
inicializarTocadorMusica();
inicializarAtalhosTeclado();
inicializarInventario();
verificarConquistasSecretasArmazenadas();
if (typeof atualizarTooltipLogoRodape === "function") {
    atualizarTooltipLogoRodape();
}
renderizarListaConquistas();
if (typeof atualizarNomesPersonagem === "function") {
    atualizarNomesPersonagem(false);
}
atualizarModoTatico();
inicializarCampanhasMultiplayer();
const inputFichaNome = document.getElementById("ficha_nome");
if (inputFichaNome) {
    inputFichaNome.addEventListener("input", sincronizarModoTatico);
}
inicializarHashRouterAbas();

try {
    const corTemaSalva = localStorage.getItem("we_are_strangers_tema_cor");
    if (corTemaSalva) {
        definirCorPrincipal(corTemaSalva, false, false);
    } else {
        const corInicialEl = document.getElementById("ficha_cor");
        if (corInicialEl) {
            definirCorPrincipal(corInicialEl.value, false, true);
        }
    }
    const contornoSalvo = localStorage.getItem("we_are_strangers_tema_contorno_ativo");
    if (contornoSalvo !== null) {
        alternarContornoLetras(contornoSalvo === "true", false, false);
    }
    const contornoCorSalva = localStorage.getItem("we_are_strangers_tema_contorno_cor");
    if (contornoCorSalva) {
        definirCorContorno(contornoCorSalva, false, false);
    }
} catch(e) {}

// Desbloqueia AudioContext e trilha sonora na primeira interação do usuário (conformidade com políticas de autoplay)
document.addEventListener("click", function desbloquearAudio() {
    if (somAtivado && !audioCtx) {
        obterAudioContext();
    }
    if (typeof avaliarEstaminaCritica === "function") {
        avaliarEstaminaCritica();
    }
    if (elementoAudioPlayer && elementoAudioPlayer.src && elementoAudioPlayer.paused && !musicaPausadaPeloUsuario) {
        elementoAudioPlayer.play().catch(() => {});
    }
}, { once: true });

if (typeof atualizarBotaoEfeitosEstaminaUI === "function") {
    atualizarBotaoEfeitosEstaminaUI();
}
if (typeof avaliarEstaminaCritica === "function") {
    avaliarEstaminaCritica();
}
