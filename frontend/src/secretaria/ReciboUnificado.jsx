import React, { forwardRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import './ReciboUnificado.css';
import logo from "../assets/logo.png";



const ReciboUnificado = forwardRef((props, ref) => {
  const {
    configRecibo: configContext,
    obterConfigReciboDaEscola,
    CONFIG_RECIBO_PADRAO,
    user,
    escolas,
  } = useAuth();

  const {
    tipo = 'pagamento',
    dados = {},
    aluno = {},
    referencia = '',
    data,
    valor = 0,
    valorBase,
    multa = 0,
    formaPagamento = 'Dinheiro',
    funcionario = 'Sistema',
    status = 'Confirmado',
    servico = '',
    anoLectivo = '',
    observacoes = '',
    escolaId: escolaIdProp = null, // ✅ Opcional: usado pelo Super Admin para preview
  } = props;

  // ============================================================
  // ✅ OBTER CONFIG DO RECIBO DA ESCOLA CORRETA
  // ============================================================
  const configRecibo = useMemo(() => {
    // Prioridade 1: escolaId passado via props (Super Admin preview)
    if (escolaIdProp) {
      return obterConfigReciboDaEscola(escolaIdProp);
    }

    // Prioridade 2: Escola do aluno (garante que o recibo usa a escola do aluno)
    if (aluno?.escolaId) {
      return obterConfigReciboDaEscola(aluno.escolaId);
    }

    // Prioridade 3: Escola do utilizador atual
    if (user?.escolaId) {
      return obterConfigReciboDaEscola(user.escolaId);
    }

    // Prioridade 4: Config do contexto (fallback)
    if (configContext) {
      return configContext;
    }

    // Prioridade 5: Config padrão
    return CONFIG_RECIBO_PADRAO || {};
  }, [escolaIdProp, aluno?.escolaId, user?.escolaId, obterConfigReciboDaEscola, configContext, CONFIG_RECIBO_PADRAO, escolas]);

  const cfg = configRecibo || {};
  if (!aluno) return null;

  const dataAtual = data || new Date().toISOString().split('T')[0];
  // Evita o desvio de fuso horário: "YYYY-MM-DD" sozinho é interpretado como UTC,
  // o que atrasava/adiantava a hora exibida. Forçamos meia-noite local.
  const dataAtualLocal = /^\d{4}-\d{2}-\d{2}$/.test(dataAtual)
    ? new Date(`${dataAtual}T00:00:00`)
    : new Date(dataAtual);
  const referenciaFormatada =
    referencia || `RC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  // ✅ Calcular valor base se não fornecido
  const valorBaseFinal = valorBase !== undefined && valorBase !== null
    ? Number(valorBase)
    : Number(valor) - Number(multa || 0);

  const multaFinal = Number(multa) || 0;
  const anoLectivoFinal = anoLectivo || aluno.anoLectivo || '—';

  // ==================== TÍTULOS ====================
  const getSubtitulo = () => {
    switch (tipo) {
      case 'matricula':
        return cfg.subtituloMatricula || 'TAXA DE MATRÍCULA';
      case 'confirmacao':
        return cfg.subtituloConfirmacao || 'TAXA DE CONFIRMAÇÃO';
      case 'pagamento':
      default:
        if (dados?.tipo === 'Propina' || servico === 'Propina') {
          return cfg.subtituloPropina || 'PROPINAS';
        }
        return cfg.subtituloPagamento || 'PAGAMENTO DE SERVIÇOS';
    }
  };

  const getServico = () => {
    if (servico) return servico;
    switch (tipo) {
      case 'matricula': return 'TAXA DE MATRÍCULA';
      case 'confirmacao': return 'TAXA DE CONFIRMAÇÃO';
      case 'pagamento': return 'MENSALIDADE';
      default: return 'PAGAMENTO';
    }
  };

  // ==================== VALOR POR EXTENSO ====================
  const numeroParaExtenso = (num) => {
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const dezenas = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const especiais = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezasseis', 'dezassete', 'dezoito', 'dezanove'];
    const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    const n = Math.floor(Number(num) || 0);
    if (n === 0) return 'zero';
    if (n === 100) return 'cem';

    let resultado = '';
    const milhares = Math.floor(n / 1000);
    const resto = n % 1000;

    if (milhares > 0) {
      resultado += milhares === 1 ? 'mil' : `${numeroParaExtenso(milhares)} mil`;
      if (resto > 0) resultado += ' e ';
    }

    if (resto > 0) {
      const c = Math.floor(resto / 100);
      const d = Math.floor((resto % 100) / 10);
      const u = resto % 10;

      if (c > 0) {
        resultado += centenas[c];
        if (d > 0 || u > 0) resultado += ' e ';
      }

      if (d === 1) resultado += especiais[u];
      else if (d > 1) {
        resultado += dezenas[d];
        if (u > 0) resultado += ` e ${unidades[u]}`;
      } else if (u > 0) resultado += unidades[u];
    }

    return resultado;
  };

  const valorExtenso = `${numeroParaExtenso(valor)} kwanzas`;

  // ==================== MESES REFERÊNCIA ====================
  const mesesRef = dados?.mesesSelecionados?.length > 0
    ? dados.mesesSelecionados.join(', ').toUpperCase()
    : (dados?.mesReferencia ? String(dados.mesReferencia).toUpperCase() : '—');

  // ==================== RENDER DE UMA VIA ====================
  const renderVia = (textoVia) => (
    <div className="recibo-paper">
      {/* CABEÇALHO */}
      <div className="recibo-paper-header">
        <div className="recibo-paper-header-left">
          {/* ✅ LOGO — sempre a imagem importada */}
          <div className="recibo-paper-logo">
            <img src={logo} alt="Logo" />
          </div>
          <div className="recibo-paper-inst">
            <h3>{cfg.nomeInstituicao || 'NOME DA INSTITUIÇÃO'}</h3>
            {cfg.subtituloInstituicao && <h4>{cfg.subtituloInstituicao}</h4>}
            <p><strong>ENDEREÇO:</strong> Luanda, Camama-Angola</p>
            <p><strong>TEL:</strong> 926 802 579 / 956 605 148</p>
            <p><strong>E-MAIL:</strong> {cfg.email || '—'}</p>
          </div>
        </div>
        <div className="recibo-paper-header-right">
          <div className="recibo-paper-titulo">
            <span className="recibo-paper-titulo-label">
              {cfg.tituloPrincipal || 'RECIBO DE PAGAMENTO'}
            </span>
            <span className="recibo-paper-titulo-sub">{getSubtitulo()}</span>
          </div>
          <div className="recibo-paper-via-badge">{textoVia}</div>
        </div>
      </div>

      {/* CORPO - CAIXAS SUPERIORES */}
      <div className="recibo-paper-top-grid">
        {/* Caixa Esquerda - Dados do Pagamento */}
        <div className="recibo-paper-box">
          <p><strong>REFERÊNCIA:</strong> {referenciaFormatada}</p>
          <p><strong>DATA DE PAGAMENTO:</strong> {dataAtualLocal.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
          <p><strong>FORMA DE PAGAMENTO:</strong> {formaPagamento}</p>
          <p><strong>DATA OPERAÇÃO:</strong> {dataAtualLocal.toLocaleDateString('pt-AO')}</p>
          <p><strong>CONTA:</strong> {dados?.conta || '—'}</p>
          <p><strong>COMPROVATIVO:</strong> {dados?.comprovativo || referenciaFormatada}</p>
          <p><strong>ANO LECTIVO:</strong> {anoLectivoFinal}</p>
          <p><strong>RESPONSÁVEL:</strong> {funcionario}</p>
          <p><strong>TEL.:</strong> {dados?.telResponsavel || '—'}</p>
        </div>

        {/* Caixa Direita - Nº Recibo + Beneficiário */}
        <div className="recibo-paper-box">
          <div className="recibo-paper-recibo-no">
            <span>Recibo Nº</span>
            <strong>{referenciaFormatada}</strong>
          </div>
          <div className="recibo-paper-beneficiario">
            <p><strong>BENEFICIÁRIO:</strong> {(aluno.nome || '').toUpperCase()}</p>
            <p><strong>ID:</strong> {aluno.codigo || aluno.id || '—'}</p>
            <p><strong>CURSO/CICLO:</strong> {aluno.classe || '—'}</p>
            <p><strong>TURMA:</strong> {aluno.turma || '—'} {aluno.turno && `- ${aluno.turno}`}</p>
            <p><strong>ANO LECTIVO:</strong> {anoLectivoFinal}</p>
          </div>
        </div>
      </div>

      {/* TABELA DE SERVIÇOS COM MULTA */}
      <table className="recibo-paper-tabela-servicos">
        <thead>
          <tr>
            <th>SERVIÇO</th>
            <th>VALOR BASE</th>
            <th>MULTA</th>
            <th>DESCONTO</th>
            <th>TOTAL</th>
            <th>TAX</th>
            <th>MÊS REF.</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{getServico()}</td>
            <td>{valorBaseFinal.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
            <td>
              {multaFinal > 0
                ? multaFinal.toLocaleString('pt-PT', { minimumFractionDigits: 2 })
                : '0,00'}
            </td>
            <td>0,00</td>
            <td>{Number(valor).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
            <td>0</td>
            <td>{mesesRef}</td>
          </tr>
        </tbody>
      </table>

      {/* BLOCO INFERIOR - IMPOSTOS + TOTAIS */}
      <div className="recibo-paper-bottom-grid">
        {/* RESUMO IMPOSTOS */}
        <div className="recibo-paper-impostos">
          <div className="recibo-paper-impostos-titulo">RESUMO IMPOSTOS</div>
          <table>
            <thead>
              <tr>
                <th>IMPOSTO</th>
                <th>CÓD.</th>
                <th>%</th>
                <th>INCIDÊNCIA</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="4"><strong>TOTAL IMPOSTOS</strong></td>
                <td>0,00</td>
              </tr>
              <tr>
                <td colSpan="5" className="recibo-paper-impostos-info">
                  IVA - Regime de Exclusão
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TOTAIS GERAIS COM MULTA */}
        <div className="recibo-paper-totais">
          <div className="recibo-paper-total-row">
            <span>TOTAL LINHAS:</span>
            <strong>{valorBaseFinal.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} Kz</strong>
          </div>
          <div className="recibo-paper-total-row">
            <span>TOTAL DESCONTO:</span>
            <strong>0,00 Kz</strong>
          </div>
          <div className="recibo-paper-total-row">
            <span>MULTA:</span>
            <strong>{multaFinal.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} Kz</strong>
          </div>
          <div className="recibo-paper-total-row">
            <span>TOTAL IMPOSTOS:</span>
            <strong>0,00</strong>
          </div>
          <div className="recibo-paper-total-row destaque">
            <span>TOTAL A PAGAR:</span>
            <strong>{Number(valor).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} Kz</strong>
          </div>
          <div className="recibo-paper-total-row">
            <span>ENTREGOU:</span>
            <strong>{Number(valor).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} Kz</strong>
          </div>
          <div className="recibo-paper-total-row">
            <span>TROCO:</span>
            <strong>0,00 Kz</strong>
          </div>
          <div className="recibo-paper-total-row">
            <span>SALDO CONTA:</span>
            <strong>0,00 Kz</strong>
          </div>
        </div>
      </div>

      {/* COORDENADAS BANCÁRIAS */}
      {cfg.mostrarBancos && cfg.bancos?.length > 0 && (
        <div className="recibo-paper-bancos">
          <div className="recibo-paper-bancos-titulo">NOSSAS COORDENADAS BANCÁRIAS</div>
          <table>
            <thead>
              <tr>
                <th>BANCO</th>
                <th>CONTA</th>
                <th>SWIFT / IBAN</th>
                <th>MOEDA</th>
              </tr>
            </thead>
            <tbody>
              {cfg.bancos.map((b, i) => (
                <tr key={i}>
                  <td>{b.banco}</td>
                  <td>{b.conta}</td>
                  <td>{b.iban}</td>
                  <td>{b.moeda}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VALOR POR EXTENSO */}
      <div className="recibo-paper-extenso">
        <span>Recebemos o valor de:</span>
        <em>{valorExtenso}</em>
      </div>

      {/* ASSINATURAS */}
      <div className="recibo-paper-assinaturas">
        <div className="recibo-paper-assinatura">
          {/* <div className="recibo-paper-carimbo">{cfg.sigla || 'ESCOLA'}</div> */}
          <div className="recibo-paper-assinatura-linha"></div>
          <p><strong>{cfg.cargoResponsavel || 'SECRETARIA'}</strong></p>
        </div>
      </div>

      {/* RODAPÉ LEGAL */}
      <div className="recibo-paper-rodape">
        <p>{cfg.textoLegal || 'Emitido por programa validado nº /AGT'}</p>
        {cfg.rodapeRecibo && <p>{cfg.rodapeRecibo}</p>}
      </div>
    </div>
  );

  return (
    <div ref={ref} className="recibo-horizontal-wrapper">
      <div className="recibo-horizontal-container">
        {renderVia(cfg.textoViaCopia || 'DUPLICADO - 2ª VIA')}
        {renderVia(cfg.textoViaOriginal || 'ORIGINAL - 1ª VIA')}
      </div>
    </div>
  );
});

ReciboUnificado.displayName = 'ReciboUnificado';

export default ReciboUnificado;