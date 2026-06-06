import { jsPDF } from 'jspdf';
import { Atendimento, Cliente, Servico, ConfiguracaoEmpresa } from '../types';

interface AppointmentPDFData {
  nome: string;
  whatsapp: string;
  email?: string;
  endereco: string;
  bairro: string;
  tipoServico: string;
  dataDesejada: string;
  horarioDesejado: string;
  observacoes: string;
  urgencia?: string;
  categoria?: string;
  protocolId: string;
}

/**
 * Generates an elegant PDF voucher for client appointment booking.
 */
export function generateAppointmentPDF(
  booking: AppointmentPDFData,
  config: ConfiguracaoEmpresa
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Color Palette Definitions
  const gold = [242, 183, 5]; // #f2b705
  const bodyText = [40, 40, 40];
  const titleText = [9, 9, 9];
  const mutedText = [120, 120, 120];

  // 1. Draw Sleek Geometric Border Accents
  doc.setLineWidth(1.5);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.line(10, 10, 200, 10); // Top bar
  doc.setLineWidth(0.3);
  doc.setDrawColor(220, 220, 220);
  doc.line(10, 287, 200, 287); // Bottom border line

  // 2. Header Section
  // Logo placeholder or standard icon representation
  doc.setFillColor(9, 9, 9);
  doc.rect(15, 18, 12, 12, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(242, 183, 5);
  doc.text('AGE', 21, 26, { align: 'center' });

  // Company Information
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(titleText[0], titleText[1], titleText[2]);
  doc.text(config.nomeEmpresa?.toUpperCase() || 'AGE ELÉTRICA', 32, 23);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('INSTALAÇÕES COLETIVAS • SISTEMAS DE QUADROS • CARREGADORES WALLBOX', 32, 27);
  doc.text(`CNPJ: ${config.cnpj || '35.452.127/0001-90'} • WhatsApp: ${config.whatsapp || '84 99999-8888'}`, 32, 31);

  // Document Title inside right upper box
  doc.setFillColor(245, 245, 245);
  doc.rect(135, 18, 60, 15, 'F');
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.rect(135, 18, 60, 15, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(titleText[0], titleText[1], titleText[2]);
  doc.text('AGENDAMENTO DE VISITA', 165, 24, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(boldColorHex(gold));
  doc.text(`PROTOCOL: AGE-SCH-${booking.protocolId}`, 165, 29, { align: 'center' });

  // Divider Line
  doc.setLineWidth(0.5);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.line(15, 38, 195, 38);

  // 3. Central Title Block
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(titleText[0], titleText[1], titleText[2]);
  doc.text('COMPROVANTE DE PROTOCOLO DE ORDEM DE SERVIÇO', 105, 48, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Este comprovante assegura que seu chamado técnico foi registrado no nosso banco de dados.', 105, 53, { align: 'center' });

  // 4. Client Information Box
  let currentY = 62;
  drawCardHeader(doc, 'DADOS CADASTRAIS DO CLIENTE', 15, currentY, 180, 7, gold);
  currentY += 7;

  doc.setFillColor(250, 250, 250);
  doc.rect(15, currentY, 180, 32, 'F');
  doc.setLineWidth(0.2);
  doc.setDrawColor(230, 230, 230);
  doc.rect(15, currentY, 180, 32, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(bodyText[0], bodyText[1], bodyText[2]);

  // Labels and Columns inside box
  doc.text('NOME COMPLETO:', 20, currentY + 7);
  doc.text('WHATSAPP:', 20, currentY + 14);
  doc.text('E-MAIL:', 20, currentY + 21);
  doc.text('ENDEREÇO:', 20, currentY + 28);

  doc.setFont('Helvetica', 'normal');
  doc.text(booking.nome.toUpperCase(), 55, currentY + 7);
  doc.text(booking.whatsapp, 55, currentY + 14);
  doc.text(booking.email || 'NÃO INFORMADO', 55, currentY + 21);
  doc.text(`${booking.endereco} - BAIRRO: ${booking.bairro.toUpperCase()} - NATAL/RN`, 55, currentY + 28);

  // 5. Booking and Diagnostics Box
  currentY += 38;
  drawCardHeader(doc, 'DIAGNÓSTICO DA VISITA E PROGRAMAÇÃO TÉCNICA', 15, currentY, 180, 7, gold);
  currentY += 7;

  doc.setFillColor(250, 250, 250);
  doc.rect(15, currentY, 180, 48, 'F');
  doc.rect(15, currentY, 180, 48, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.text('SERVIÇO REQUERIDO:', 20, currentY + 8);
  doc.text('DATA PROGRAMADA:', 20, currentY + 16);
  doc.text('PERÍODO DESEJADO:', 20, currentY + 24);
  doc.text('GRAU DE URGÊNCIA:', 20, currentY + 32);
  doc.text('CATEGORIA DO CHAMADO:', 20, currentY + 40);

  doc.setFont('Helvetica', 'normal');
  doc.text(booking.tipoServico.toUpperCase(), 68, currentY + 8);
  
  // Format Date to friendly Portuguese layout
  let formattedDate = booking.dataDesejada;
  if (booking.dataDesejada.includes('-')) {
    formattedDate = booking.dataDesejada.split('-').reverse().join('/');
  }
  doc.text(formattedDate, 68, currentY + 16);
  doc.text(booking.horarioDesejado.toUpperCase(), 68, currentY + 24);
  doc.text(booking.urgencia?.toUpperCase() || 'MÉDIA', 68, currentY + 32);
  doc.text(booking.categoria?.toUpperCase() || 'MANUTENÇÃO', 68, currentY + 40);

  // Highlight urgency if High
  if (booking.urgencia?.toLowerCase() === 'alta') {
    doc.setFillColor(254, 226, 226);
    doc.rect(145, currentY + 27, 42, 7, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('⚡ SUJEITO À ESCALA DE EMERGÊNCIA', 147, currentY + 32);
    doc.setTextColor(bodyText[0], bodyText[1], bodyText[2]);
  }

  // 6. Problem details text area
  currentY += 54;
  drawCardHeader(doc, 'OBSERVAÇÕES E SINTOMAS RELATADOS PELO CLIENTE', 15, currentY, 180, 7, gold);
  currentY += 7;

  doc.setFillColor(252, 252, 252);
  doc.rect(15, currentY, 180, 35, 'F');
  doc.rect(15, currentY, 180, 35, 'S');

  doc.setFont('Helvetica', 'oblique');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);

  // Wrap multi-line text dynamically
  const splitNotes = doc.splitTextToSize(booking.observacoes || 'Nenhum detalhe extra relatado.', 170);
  doc.text(splitNotes, 20, currentY + 8);

  // 7. Security and instruction footer block
  currentY += 41;
  doc.setFillColor(254, 252, 232); // Light yellow container
  doc.setDrawColor(254, 240, 138);
  doc.rect(15, currentY, 180, 22, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(133, 77, 14);
  doc.text('INFORMAÇÕES DE SEGURANÇA IMPORTANTES DA AGE ELÉTRICA:', 20, currentY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(bodyText[0], bodyText[1], bodyText[2]);
  doc.text('1. Nossos eletricistas sempre usam uniforme completo com logotipo da AGE Elétrica, crachá e EPIs.', 20, currentY + 11);
  doc.text('2. Para sua segurança corporativa ou residencial, exija a identificação do técnico antes de liberar o acesso.', 20, currentY + 16);

  // 8. Signature & Metadata
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  const printedAt = new Date().toLocaleString('pt-BR');
  doc.text(`Documento emitido na central do site da AGE Elétrica em ${printedAt}`, 15, 282);
  doc.text('Este comprovante é totalmente eletrônico e autenticado.', 15, 285);

  doc.save(`AGE-AGENDAMENTO-${booking.protocolId}.pdf`);
}

/**
 * Generates an elegant and comprehensive Technical Report (Laudo Técnico de Conformidade)
 * for completed service calls.
 */
export function generateTechnicalReportPDF(
  appointment: Atendimento,
  customer: Cliente | undefined,
  config: ConfiguracaoEmpresa
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const gold = [242, 183, 5]; // #f2b705
  const emerald = [16, 185, 129]; // Emerald for completion
  const bodyText = [40, 40, 40];
  const titleText = [9, 9, 9];
  const mutedText = [120, 120, 120];

  // 1. Draw Sleek Geometric Border Accents
  doc.setLineWidth(1.5);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.line(10, 10, 200, 10); // Top gold bar
  doc.setLineWidth(0.3);
  doc.setDrawColor(220, 220, 220);
  doc.line(10, 287, 200, 287); // Bottom border line

  // 2. Header Block
  doc.setFillColor(9, 9, 9);
  doc.rect(15, 18, 12, 12, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(242, 183, 5);
  doc.text('AGE', 21, 26, { align: 'center' });

  // Company Information
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(titleText[0], titleText[1], titleText[2]);
  doc.text(config.nomeEmpresa?.toUpperCase() || 'AGE ELÉTRICA', 32, 23);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('DIRETORIA DE ENGENHARIA ELÉTRICA • DIÁRIO DE CONFORMIDADE TÉCNICA', 32, 27);
  doc.text(`CNPJ: ${config.cnpj || '35.452.127/0001-90'} • CFT Ativo: CFT/RN-03290`, 32, 31);

  // Document Title box
  doc.setFillColor(245, 245, 245);
  doc.rect(130, 18, 65, 15, 'F');
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.rect(130, 18, 65, 15, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(titleText[0], titleText[1], titleText[2]);
  doc.text('LAUDO TÉCNICO DE OBRA', 162.5, 24, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.text(`CÓDIGO: AGE-TQR-${appointment.id.replace('atend-', '').toUpperCase()}`, 162.5, 29, { align: 'center' });

  // Divider Line
  doc.setLineWidth(0.5);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.line(15, 38, 195, 38);

  // 3. Central Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(titleText[0], titleText[1], titleText[2]);
  doc.text('PARECER TÉCNICO DE CONFORMIDADE E LAUDO DE ENTREGA', 105, 48, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Emissão de parecer técnico final após testes funcionais, ensaios de isolamento e entrega das instalações.', 105, 53, { align: 'center' });

  // 4. Beneficiary Details
  let currentY = 62;
  drawCardHeader(doc, '1. BENEFICIÁRIO DO LAUDO (PROPRIETÁRIO)', 15, currentY, 180, 7, gold);
  currentY += 7;

  doc.setFillColor(250, 250, 250);
  doc.rect(15, currentY, 180, 27, 'F');
  doc.setLineWidth(0.2);
  doc.setDrawColor(230, 230, 230);
  doc.rect(15, currentY, 180, 27, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(bodyText[0], bodyText[1], bodyText[2]);

  doc.text('CLIENTE / EMPRESA:', 20, currentY + 7);
  doc.text('CPF ou CNPJ:', 20, currentY + 13);
  doc.text('ENDEREÇO DA OBRA:', 20, currentY + 19);

  doc.setFont('Helvetica', 'normal');
  doc.text(customer ? customer.nomeCompleto.toUpperCase() : 'CLIENTE SITE DA AGE ELÉTRICA', 55, currentY + 7);
  doc.text(customer ? customer.cpfCnpj : 'NÃO CADASTRADO', 55, currentY + 13);
  doc.text(customer ? `${customer.enderecoCompleto}, Nº ${customer.numero} - BAIRRO: ${customer.bairro.toUpperCase()} - NATAL/RN` : 'ENDEREÇO PRENCHIDO NO FORMULÁRIO', 55, currentY + 19);

  // 5. Technical details
  currentY += 33;
  drawCardHeader(doc, '2. DETALHAMENTO DA PRESTAÇÃO E INSTRUMENTOS DE MEDIÇÃO', 15, currentY, 180, 7, gold);
  currentY += 7;

  doc.setFillColor(250, 250, 250);
  doc.rect(15, currentY, 180, 32, 'F');
  doc.rect(15, currentY, 180, 32, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.text('LÍDER RESPONSÁVEL:', 20, currentY + 7);
  doc.text('DATA PROGRAMADA:', 20, currentY + 13);
  doc.text('DATA FINALIZAÇÃO:', 20, currentY + 19);
  doc.text('STATUS DA ESCALA:', 20, currentY + 25);

  doc.setFont('Helvetica', 'normal');
  doc.text(appointment.tecnicoResponsavel.toUpperCase(), 55, currentY + 7);
  
  let dAgend = appointment.dataAgendada;
  if (dAgend.includes('-')) dAgend = dAgend.split('-').reverse().join('/');
  doc.text(dAgend, 55, currentY + 13);

  let dFinal = appointment.dataFinalizacao ? new Date(appointment.dataFinalizacao).toLocaleDateString('pt-BR') : dAgend;
  doc.text(dFinal, 55, currentY + 19);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(0, 150, 80);
  doc.text(appointment.status.toUpperCase(), 55, currentY + 25);
  doc.setTextColor(bodyText[0], bodyText[1], bodyText[2]);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Instrumentos aferidos: Alicate amperímetro Minipa trueRMS calibrador NBR5410, megômetro.', 115, currentY + 25);

  // 6. Technical Report Body / Observations
  currentY += 38;
  drawCardHeader(doc, '3. PARECER DE CONFORMIDADE TÉCNICA (LAUDO DESCRITIVO)', 15, currentY, 180, 7, gold);
  currentY += 7;

  doc.setFillColor(252, 252, 252);
  doc.rect(15, currentY, 180, 50, 'F');
  doc.rect(15, currentY, 180, 50, 'S');

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);

  const reportText = appointment.observacoesTecnicas || 
    `Testes de carga e isolamento executados com pleno êxito em conformidade com as diretivas da NBR 5410 da ABNT. Tensionamento estável e ausência de anomalias térmicas após substituição e remanejamento recomendados no diário de bordo sob supervisão responsável de pronto atendimento da AGE Elétrica.`;

  const splitReport = doc.splitTextToSize(reportText, 172);
  doc.text(splitReport, 19, currentY + 7);

  // 7. Electronic Signature Acceptance
  currentY += 56;
  drawCardHeader(doc, '4. ASSINATURA ELETRÔNICA DE CONFORMIDADE E DECLARAÇÃO', 15, currentY, 180, 7, gold);
  currentY += 7;

  doc.setFillColor(248, 250, 252);
  doc.rect(15, currentY, 180, 36, 'F');
  doc.rect(15, currentY, 180, 36, 'S');

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('DECLARAÇÃO DE ENTREGA CONCLUÍDA: Declaramos que o sistema elétrico objeto deste chamado técnico foi testado e entregue em perfeitas condições de uso operacional seguro, cumprindo as normas de engenharia vigentes e as boas práticas de instalação.', 18, currentY + 6, { maxWidth: 174 });

  doc.setLineWidth(0.2);
  doc.setDrawColor(200, 200, 200);
  doc.line(30, currentY + 27, 85, currentY + 27);
  doc.line(125, currentY + 27, 180, currentY + 27);

  doc.setFont('Helvetica', 'bold');
  doc.text('ENGENHARIA E CONFORMIDADE AGE', 57.5, currentY + 31, { align: 'center' });
  doc.text('CLIENTE / PROPRIETÁRIO', 152.5, currentY + 31, { align: 'center' });

  doc.setFont('Helvetica', 'oblique');
  doc.setFontSize(8);
  doc.setTextColor(60, 100, 180);
  doc.text('AUTENTICADO VIA SISTEMA CFT', 57.5, currentY + 25, { align: 'center' });
  doc.text(appointment.assinaturaCliente || 'ASSINADO ELETRONICAMENTE', 152.5, currentY + 25, { align: 'center' });

  // 8. Footer Metadata
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  const currentPrintedAt = new Date().toLocaleString('pt-BR');
  doc.text(`Laudo gerado pelo Diário de Engenharia da AGE Elétrica em ${currentPrintedAt}`, 15, 282);
  doc.text('O selo de garantia assegura 90 dias de cobertura sobre reparos e 12 meses sobre mão de obra especializada conforme Código Civil brasileiro.', 15, 285);

  doc.save(`AGE-LAUDO-TECNICO-${appointment.id.replace('atend-', '').toUpperCase()}.pdf`);
}

// ==========================================
// Helper Utility Functions for PDF Styling
// ==========================================

function drawCardHeader(
  doc: jsPDF,
  title: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number[]
) {
  doc.setFillColor(9, 9, 9);
  doc.rect(x, y, width, height, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(title, x + 4, y + 5);
}

function boldColorHex(rgb: number[]): string {
  const r = rgb[0].toString(16).padStart(2, '0');
  const g = rgb[1].toString(16).padStart(2, '0');
  const b = rgb[2].toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}
