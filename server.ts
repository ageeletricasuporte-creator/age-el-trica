import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import express from "express";
import nodemailer from "nodemailer";
import path from "path";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up server-side Gemini client lazily to avoid error at boot if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("A chave GEMINI_API_KEY não está configurada no ambiente.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

app.use(express.json());

// Enable native CORS middleware to support integrations in external sites (e.g., Vercel, GitHub Pages)
app.use((req, res, next) => {
  // Allow all origins to seamlessly support the custom domain ageeletrica.com and vercel previews
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// API: AI Assistant Q&A
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "O campo 'messages' é obrigatório e deve ser um array." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `Você é o Assistente de Inteligência Artificial da AGE Elétrica, uma prestadora de serviços elétricos em Natal/RN de excelência.
Seus valores fundamentais: agilidade estrita, segurança corporativa inegociável, transparência em orçamentos, integridade de conduta e excelente tratamento técnico ao cliente.

COMPORTAMENTO DA INTELIGÊNCIA ARTIFICIAL:
1. Cumprimentar o cliente de forma profissional, altamente amigável, acolhedora e prestativa.
2. Responder dúvidas gerais sobre serviços elétricos oferecidos pela AGE Elétrica (reparos, instalações, manutenção, automação, iluminação, tomadas, disjuntores, câmeras, chuveiros, energia solar e CFTV).
3. Orientar e conduzir o cliente com educação a solicitar orçamento ou agendamento de visita técnica diretamente pelas abas e formulários existentes no site.
4. Quando necessário (perguntas sobre valores exatos, serviços muito fora de padrão, contato humano), oferecer orações amigáveis indicando que o cliente pode falar diretamente com nossos especialistas pelo botão do WhatsApp disponível na tela de chat.
5. NÃO inventar valores ou preços de serviços técnicos de forma alguma! Se perguntado sobre valores, explique polidamente que o valor depende de uma avaliação técnica ou que ele pode realizar uma simulação/solicitação de orçamento preenchendo o formulário no site ou consultando via WhatsApp.
6. NÃO confirmar execução ou agendamento de serviços diretamente no chat de conversação. Instrua que a confirmação é feita após enviar o formulário do site ou fechar via WhatsApp.
7. Sempre preferir direcionar o cliente para o formulário do próprio site na aba de "Agendamento" / "Contato", ou para o botão de WhatsApp, quando o assunto central envolver orçamentos, contratações, solicitações e visitas técnicas.

CRÍTICO - REGRAS DE FORMATAÇÃO DO TEXTO:
- NUNCA utilize caracteres de formatação Markdown ou símbolos especiais na sua resposta.
- NÃO utilize de forma alguma asteriscos (* ou **) para negrito, itálico ou listas.
- NÃO utilize de forma alguma hashtags ou cerquilhas (# ou ##) para cabeçalhos.
- NÃO use hífens como marcadores de tópicos.
- Use apenas texto puro, parágrafos bem espaçados, quebras de linhas normais e tópicos enumerados de forma simples (ex: "1.", "2.") ou emojis discretos para organizar suas respostas.
- O corpo do texto deve ser limpo, fluído e de fácil leitura para o cliente final.`;

    // Normalize, merge consecutive messages, and filter message list so it strictly alternates roles for Gemini.
    const contents: any[] = [];
    for (const m of messages) {
      if (!m.text || !m.text.trim()) continue;
      
      const role = m.sender === "user" ? "user" : "model";
      const text = m.text;

      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        // Safe collapse consecutive same-role messages with visual spacing
        contents[contents.length - 1].parts[0].text += "\n" + text;
      } else {
        contents.push({
          role,
          parts: [{ text }],
        });
      }
    }

    // Gemini API expects the chat history structure to start specifically with a 'user' turn.
    // If the conversation starts with a bot/model welcome message, we drop that leading model message.
    while (contents.length > 0 && contents[0].role !== "user") {
      contents.shift();
    }

    // Guard if history has become empty
    if (contents.length === 0) {
      return res.json({ 
        text: "Olá! Sou o Assistente de Inteligência Artificial da AGE Elétrica. Como posso ajudar você hoje com seus serviços elétricos, automação residencial ou agendamento de orçamento?" 
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    let botResponseText = response.text || "";
    
    // Strict programmatic sanitization to strip any accidental Markdown tags or backticks
    botResponseText = botResponseText.replace(/[*#`_\-]/g, "");

    res.json({ text: botResponseText.trim() });
  } catch (error: any) {
    console.error("Erro no chat com IA:", error);
    res.status(500).json({ error: "Falha ao processar solicitação de IA.", details: error.message });
  }
});

// API: AI classifier for lead qualification
app.post("/api/classify", async (req, res) => {
  try {
    const { description, availableServices } = req.body;
    if (!description) {
      return res.status(400).json({ error: "A descrição do problema elétrico é obrigatória." });
    }

    const ai = getGeminiClient();

    let serviceListText = "";
    if (availableServices && Array.isArray(availableServices) && availableServices.length > 0) {
      serviceListText = `Você DEVE obrigatoriamente associar o problema recebido a um dos seguintes serviços cadastrados da nossa lista abaixo (retorne exatamente o nome correspondente no campo 'tipoServico'):\n` + 
        availableServices.map((s: any) => `- Nome: "${s.nomeServico}", Categoria: "${s.categoria}"`).join("\n") + 
        `\nSe nenhum se encaixar razoavelmente, escolha "Outro" no campo 'tipoServico' e escolha a categoria que melhor se relaciona ao problema.`;
    }

    const systemInstruction = `Analise a descrição de um problema ou demanda elétrica enviado por um cliente do site da AGE Elétrica e classifique a demanda extraindo:
1. Especialidade ou tipo de serviço estimado. ${serviceListText || "Associe a um destes típicos de mercado: 'Instalação de Chuveiro', 'Troca de fiação', 'Manutenção de Disjuntores / Quadro', 'Instalação de Tomada / Interruptor', 'Instalação de Wallbox / Carregador Veicular', 'Automação Residencial (Alexa/Sonoff)', 'Instalação de Câmeras CFTV', 'Instalação de DPS / DR', 'Iluminação Externa / Interna', ou 'Outros Reparos Elétricos'."}
2. Grau de urgência estimado: 'Baixa', 'Média' ou 'Alta' (Marque como 'Alta' se houver indicação de cheiro de queimado/fumaça, faíscas, queda total de fases, disjuntor desarmando sem parar, chuveiro queimando fiação, ou risco de choques. Marque como 'Média' para reparos funcionais porém não perigosos no momento. Marque como 'Baixa' para novas instalações planejadas, estética ou melhorias).
3. Categoria geral do serviço correspondente (Ex: 'Residencial', 'Reparo', 'Manutenção', 'Segurança', 'Recarga veicular', 'Climatização', 'Automação'). Escolha exatamente a categoria que está atrelada ao serviço recomendado.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Descrição do cliente: "${description}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tipoServico: {
              type: Type.STRING,
              description: "Nome da especialidade selecionada da lista ou 'Outro'",
            },
            urgencia: {
              type: Type.STRING,
              description: "Grau de urgência estimado: 'Baixa', 'Média' ou 'Alta'",
            },
            categoria: {
              type: Type.STRING,
              description: "Categoria geral do serviço atrelada ao serviço selecionado",
            },
          },
          required: ["tipoServico", "urgencia", "categoria"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Erro na classificação com IA:", error);
    res.status(500).json({ error: "Falha ao qualificar problema elétrico com IA.", details: error.message });
  }
});

// API: Send secure email via SMTP using Nodemailer
app.post("/api/send-email", async (req, res) => {
  try {
    const {
      nome,
      whatsapp,
      email,
      bairro,
      endereco,
      tipoServico,
      dataDesejada,
      horarioDesejado,
      observacoes,
    } = req.body;

    if (!nome || !whatsapp) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes (Nome, WhatsApp)." });
    }

    // SMTP setup
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const formattedWhatsapp = whatsapp.replace(/\D/g, "");

    const htmlContent = `
      <div style="background-color: #0c0c0c; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; padding: 40px 30px; border-radius: 16px; border-top: 6px solid #f2b705; max-width: 600px; margin: 40px auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f2b705; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">AGE ELÉTRICA</h1>
          <span style="color: #666; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; background: #222; padding: 6px 12px; border-radius: 20px; border: 1px solid #333;">NOVO AGENDAMENTO SITE</span>
        </div>
        
        <p style="color: #bbb; font-size: 14px; text-align: center; line-height: 1.6; margin-bottom: 30px;">
          Um cliente enviou uma nova solicitação de agendamento de serviço técnico através do formulário do site.
        </p>
        
        <div style="background-color: #141414; padding: 25px; border-radius: 12px; border: 1px solid #222; margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #262626;">
              <td style="padding: 12px 0; color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; width: 160px;">Cliente</td>
              <td style="padding: 12px 0; color: #ffffff; font-size: 14px; font-weight: bold;">${nome.toUpperCase()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #262626;">
              <td style="padding: 12px 0; color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">WhatsApp</td>
              <td style="padding: 12px 0; color: #f2b705; font-size: 14px; font-weight: bold; font-family: monospace;">${whatsapp}</td>
            </tr>
            <tr style="border-bottom: 1px solid #262626;">
              <td style="padding: 12px 0; color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">E-mail</td>
              <td style="padding: 12px 0; color: #ffffff; font-size: 14px;">${email || "Não informado"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #262626;">
              <td style="padding: 12px 0; color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Bairro</td>
              <td style="padding: 12px 0; color: #ffffff; font-size: 14px;">${bairro || "Não informado"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #262626;">
              <td style="padding: 12px 0; color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Endereço & Ref.</td>
              <td style="padding: 12px 0; color: #ffffff; font-size: 14px;">${endereco || "Não informado"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #262626;">
              <td style="padding: 12px 0; color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Serviço Técnico</td>
              <td style="padding: 12px 0; color: #f2b705; font-size: 14px; font-weight: bold;">${tipoServico || "Serviço Elétrico Geral"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #262626;">
              <td style="padding: 12px 0; color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Data Solicitada</td>
              <td style="padding: 12px 0; color: #ffffff; font-size: 14px;">${dataDesejada || "Não informada"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #262626;">
              <td style="padding: 12px 0; color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Horário Pretendido</td>
              <td style="padding: 12px 0; color: #ffffff; font-size: 14px;">${horarioDesejado || "Qualquer Horário (Indiferente)"}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #888; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; vertical-align: top;">Observações</td>
              <td style="padding: 12px 0; color: #dfdfdf; font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${observacoes || "Nenhuma observação informada."}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center;">
          <a href="https://wa.me/55${formattedWhatsapp}" style="background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(16,185,129,0.25); text-transform: uppercase; letter-spacing: 1px;">
            💬 Abrir Conversa no WhatsApp
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #222; color: #444; font-size: 11px;">
          Este e-mail foi gerado automaticamente pelo site <a href="https://ageeletrica.com" style="color: #666; text-decoration: underline;">ageeletrica.com</a>
        </div>
      </div>
    `;

    console.log("=== NOVO AGENDAMENTO (Simulação de Envio de E-mail) ===");
    console.log("Cliente:", nome);
    console.log("Serviço:", tipoServico);
    console.log("WhatsApp:", whatsapp);
    console.log("Mensagem HTML montada.");

    if (user && pass) {
      const transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: port === 465,
        auth: {
          user: user,
          pass: pass,
        },
      });

      const info = await transporter.sendMail({
        from: `AGE Elétrica Site <${user}>`,
        to: "ageeletricasuporte@gmail.com",
        subject: "Novo agendamento pelo site da AGE Elétrica",
        html: htmlContent,
      });

      console.log("E-mail enviado sucesso via SMTP! ID:", info.messageId);
      return res.json({ success: true, messageId: info.messageId });
    } else {
      console.warn("ALERTA: Credenciais SMTP SMTP_USER e SMTP_PASS não foram definidas no ambiente. O envio foi simulado no console.");
      return res.json({
        success: true,
        warning: "SMTP credentials missing - simulated email dispatch inside server logs",
      });
    }
  } catch (error: any) {
    console.error("Erro no envio do e-mail de agendamento:", error);
    res.status(500).json({ error: "Falha ao disparar e-mail de agendamento.", details: error.message });
  }
});

// Configure Vite integration for SPA / App building
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
