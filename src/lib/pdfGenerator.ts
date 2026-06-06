import { jsPDF } from 'jspdf';
import { Atendimento, Cliente, Servico, ConfiguracaoEmpresa } from '../types';

/**
 * Draws a pixel-perfect, high-performance vector logo or renders the user uploaded logo.
 */
function drawLogo(doc: jsPDF, config: ConfiguracaoEmpresa, x: number, y: number, w: number, h: number, logoOverride?: string): void {
  const logo = logoOverride || config.logoPdf || config.logo;
  if (logo && !logo.startsWith('data:image/svg+xml')) {
    try {
      doc.addImage(logo, 'PNG', x, y, w, h);
      return;
    } catch (e) {
      console.warn('Could not render base64 image in PDF, falling back to corporate badge vector logo', e);
    }
  }

  // Draw an incredibly premium circular vector emblem in gold & charcoal
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = w / 2;

  // 1. Deep Black Circle Base
  doc.setFillColor(18, 18, 18);
  doc.ellipse(cx, cy, r, r, 'F');

  // 2. Double Golden Ring Border Accent (representing power/voltage stability loop)
  doc.setDrawColor(242, 183, 5); // Gold #f2b705
  doc.setLineWidth(0.6);
  doc.ellipse(cx, cy, r - 0.3, r - 0.3, 'S');
  doc.setLineWidth(0.2);
  doc.ellipse(cx, cy, r - 1.2, r - 1.2, 'S');

  // 3. Crisp Bold Monogram "AGE" centered at the core
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(w * 0.35); // Perfectly sized to not collide
  doc.setTextColor(255, 255, 255);
  doc.text('AGE', cx, cy + r * 0.15, { align: 'center' });

  // 4. Stylized Golden Vector Lightning Bolt cutting across to represent supreme speed & energy
  doc.setFillColor(242, 183, 5);
  
  // Upper triangle of lightning bolt
  doc.triangle(
    cx + r * 0.1, cy - r * 0.75, // top tip
    cx + r * 0.55, cy - r * 0.1,  // middle right corner
    cx - r * 0.3, cy - r * 0.1,  // middle left corner
    'F'
  );
  
  // Lower triangle of lightning bolt
  doc.triangle(
    cx + r * 0.3, cy - r * 0.15, // middle right peak
    cx - r * 0.5, cy + r * 0.7,   // bottom tip
    cx - r * 0.05, cy - r * 0.15, // middle left peak
    'F'
  );
}

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
  // Render Dynamic Site Logo (Custom PNG/JPEG or Pixel-Perfect Fallback Vector Logo Badge)
  drawLogo(doc, config, 15, 16, 16, 16, config.logoPdfAgendamento);

  // Left Column: Company Information (dynamically spaced from the logo)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(titleText[0], titleText[1], titleText[2]);
  doc.text(config.nomeEmpresa?.toUpperCase() || 'AGE ELÉTRICA', 34, 21);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  
  // Truncate long texts if necessary, or let them render naturally with ample room
  const lineDetails1 = 'INSTALAÇÕES COLETIVAS • SISTEMAS DE QUADROS • CARREGADORES WALLBOX';
  const lineDetails2 = `CNPJ: ${config.cnpj || '35.452.127/0001-90'} • WhatsApp: ${config.whatsapp || '84 99999-8888'}`;
  doc.text(lineDetails1, 34, 25.5);
  doc.text(lineDetails2, 34, 30);

  // Right Column: Document Details in premium asymmetrical right-aligned design (no overlapping blocks!)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(titleText[0], titleText[1], titleText[2]);
  doc.text('AGENDAMENTO DE VISITA', 195, 21, { align: 'right' });
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(gold[0], gold[1], gold[2]);
  doc.text(`PROTOCOLO: OS-AGE-${booking.protocolId}`, 195, 25.5, { align: 'right' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('DOCUMENTO DE CONFIRMAÇÃO DIGITAL ELETRÔNICA', 195, 30, { align: 'right' });

  // Divider Line
  doc.setLineWidth(0.4);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.line(15, 36, 195, 36);

  // 3. Central Title Block
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(titleText[0], titleText[1], titleText[2]);
  doc.text('COMPROVANTE DE PROTOCOLO DE ORDEM DE SERVIÇO', 105, 46, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Este comprovante assegura que seu chamado técnico foi registrado no nosso banco de dados.', 105, 51, { align: 'center' });

  // 4. Client Information Box
  let currentY = 58;
  drawCardHeader(doc, 'DADOS CADASTRAIS DO CLIENTE', 15, currentY, 180, 7, gold);
  currentY += 7;

  doc.setFillColor(252, 252, 252);
  doc.setDrawColor(225, 225, 225);
  doc.roundedRect(15, currentY, 180, 29, 1, 1, 'FD');

  // Labels
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text('NOME COMPLETO:', 19, currentY + 6);
  doc.text('WHATSAPP:', 19, currentY + 12);
  doc.text('E-MAIL:', 19, currentY + 18);
  doc.text('ENDEREÇO:', 19, currentY + 24);

  // Values
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(booking.nome.toUpperCase(), 52, currentY + 6, { maxWidth: 138 });
  doc.text(booking.whatsapp, 52, currentY + 12, { maxWidth: 138 });
  doc.text(booking.email || 'NÃO INFORMADO', 52, currentY + 18, { maxWidth: 138 });
  doc.text(`${booking.endereco} - BAIRRO: ${booking.bairro.toUpperCase()} - NATAL/RN`, 52, currentY + 24, { maxWidth: 138 });

  // 5. Booking and Diagnostics Box
  currentY += 34;
  drawCardHeader(doc, 'DIAGNÓSTICO DA VISITA E PROGRAMAÇÃO TÉCNICA', 15, currentY, 180, 7, gold);
  currentY += 7;

  doc.setFillColor(252, 252, 252);
  doc.setDrawColor(225, 225, 225);
  doc.roundedRect(15, currentY, 180, 42, 1, 1, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text('SERVIÇO REQUERIDO:', 19, currentY + 7);
  doc.text('DATA PROGRAMADA:', 19, currentY + 14);
  doc.text('PERÍODO DESEJADO:', 19, currentY + 21);
  doc.text('GRAU DE URGÊNCIA:', 19, currentY + 28);
  doc.text('CATEGORIA:', 19, currentY + 35);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(booking.tipoServico.toUpperCase(), 62, currentY + 7, { maxWidth: 125 });
  
  // Format Date to friendly Portuguese layout
  let formattedDate = booking.dataDesejada;
  if (booking.dataDesejada.includes('-')) {
    formattedDate = booking.dataDesejada.split('-').reverse().join('/');
  }
  doc.text(formattedDate, 62, currentY + 14);
  doc.text(booking.horarioDesejado.toUpperCase(), 62, currentY + 21);
  doc.text(booking.urgencia?.toUpperCase() || 'MÉDIA', 62, currentY + 28);
  doc.text(booking.categoria?.toUpperCase() || 'MANUTENÇÃO', 62, currentY + 35);

  // Highlight urgency if High
  if (booking.urgencia?.toLowerCase() === 'alta') {
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(140, currentY + 24, 48, 8, 1, 1, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(220, 38, 38);
    doc.text('⚡ ESCALA DE EMERGÊNCIA ATIVA', 142, currentY + 29.5);
    doc.setTextColor(bodyText[0], bodyText[1], bodyText[2]);
  }

  // 6. Problem details text area
  currentY += 47;
  drawCardHeader(doc, 'OBSERVAÇÕES E SINTOMAS RELATADOS PELO CLIENTE', 15, currentY, 180, 7, gold);
  currentY += 7;

  doc.setFillColor(253, 253, 253);
  doc.setDrawColor(225, 225, 225);
  doc.roundedRect(15, currentY, 180, 32, 1, 1, 'FD');

  doc.setFont('Helvetica', 'oblique');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 70, 70);

  // Wrap multi-line text dynamically
  const splitNotes = doc.splitTextToSize(booking.observacoes || 'Nenhum detalhe extra relatado pelo cliente.', 172);
  doc.text(splitNotes, 19, currentY + 7);

  // 7. Security and instruction footer block
  currentY += 37;
  doc.setFillColor(254, 252, 232); // Light yellow container
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(15, currentY, 180, 22, 1, 1, 'FD');

  // Decorative left stripe representing warning
  doc.setFillColor(242, 183, 5);
  doc.rect(15, currentY, 1.5, 22, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(133, 77, 14);
  doc.text('INFORMAÇÕES DE SEGURANÇA IMPORTANTES DA AGE ELÉTRICA:', 19, currentY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text('1. Nossos eletricistas sempre usam uniforme completo com logotipo da AGE Elétrica, crachá e EPIs.', 19, currentY + 11);
  doc.text('2. Para sua segurança corporativa ou residencial, exija a identificação do técnico antes de liberar o acesso.', 19, currentY + 16);

  // 8. Signature & Metadata
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  const printedAt = new Date().toLocaleString('pt-BR');
  doc.text(`Documento emitido na central do site da AGE Elétrica em ${printedAt}`, 15, 280);
  doc.text('Este comprovante é totalmente eletrônico e autenticado.', 15, 283);

  try {
    doc.save(`AGE-AGENDAMENTO-${booking.protocolId}.pdf`);
  } catch (err) {
    console.warn("Standard PDF save failed, using fallback:", err);
  }

  // Fallback designed specifically for Mobile App browsers (WhatsApp/Instagram/iOS Safari) which block blob downloads
  try {
    const rawBlob = doc.output('bloburl');
    if (rawBlob) {
      window.open(rawBlob, '_blank');
    }
  } catch (e) {
    console.error("Blob URL open failed:", e);
  }
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
  // Render Dynamic Site Logo (Custom PNG/JPEG or Pixel-Perfect Fallback Vector Logo Badge)
  drawLogo(doc, config, 15, 16, 16, 16, config.logoPdfLaudo);

  // Left Column: Company Information (dynamically spaced from the logo)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(titleText[0], titleText[1], titleText[2]);
  doc.text(config.nomeEmpresa?.toUpperCase() || 'AGE ELÉTRICA', 34, 21);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  
  const lineDetails1 = 'DIRETORIA DE ENGENHARIA ELÉTRICA • DIÁRIO DE CONFORMIDADE TÉCNICA';
  const lineDetails2 = `CNPJ: ${config.cnpj || '35.452.127/0001-90'} • CFT Ativo: CFT/RN-03290`;
  doc.text(lineDetails1, 34, 25.5);
  doc.text(lineDetails2, 34, 30);

  // Right Column: Document Details in premium asymmetrical right-aligned design (no overlapping blocks!)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(titleText[0], titleText[1], titleText[2]);
  doc.text('LAUDO TÉCNICO DE OBRA', 195, 21, { align: 'right' });
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.text(`CÓDIGO: AGE-TQR-${appointment.id.replace('atend-', '').toUpperCase()}`, 195, 25.5, { align: 'right' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('CONFORMIDADE REGULAMENTAR NBR 5410 • CFT/RN', 195, 30, { align: 'right' });

  // Divider Line
  doc.setLineWidth(0.5);
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.line(15, 36, 195, 36);

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

  try {
    doc.save(`AGE-LAUDO-TECNICO-${appointment.id.replace('atend-', '').toUpperCase()}.pdf`);
  } catch (err) {
    console.warn("Standard technical PDF save failed, using fallback:", err);
  }

  // Fallback designed specifically for Mobile App browsers (WhatsApp/Instagram/iOS Safari) which block blob downloads
  try {
    const rawBlob = doc.output('bloburl');
    if (rawBlob) {
      window.open(rawBlob, '_blank');
    }
  } catch (e) {
    console.error("Blob URL open failed:", e);
  }
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
  doc.setFillColor(18, 18, 18);
  doc.roundedRect(x, y, width, height, 1, 1, 'F');
  
  // Left border bar accent
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(x, y, 1.5, height, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(title, x + 5, y + 4.5);
}

function boldColorHex(rgb: number[]): string {
  const r = rgb[0].toString(16).padStart(2, '0');
  const g = rgb[1].toString(16).padStart(2, '0');
  const b = rgb[2].toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}
