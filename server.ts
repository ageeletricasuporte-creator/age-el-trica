import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import express from "express";
import nodemailer from "nodemailer";
import path from "path";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

app.use(express.json());

// API: AI Assistant Q&A
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "O campo 'messages' é obrigatório e deve ser um array." });
    }

    const systemInstruction = `Você é o Assistente de Inteligência Artificial da AGE Elétrica, uma prestadora de serviços elétricos em Natal/RN de excelência.
Seus valores fundamentais: agilidade estrita, segurança corporativa inegociável, transparência em orçamentos, integridade de conduta e excelente tratamento técnico ao cliente.
Você atende clientes de forma moderna, amigável e profissional.
Seu tom de voz deve ser acolhedor, altamente profissional e prestativo.
As cores da identidade visual da AGE Elétrica são fundo escuro, amarelo dourado e branco. Use detalhes verdes apenas quando falar sobre energia limpa (solar / fotovoltaica), carregador de veículo elétrico / wallbox, ou contato de WhatsApp.
Você deve responder dúvidas sobre:
1. Instalação elétrica residencial, comercial e industrial.
2. Instalação e substituição de chuveiros elétricos.
3. Substituição e instalação de novas tomadas e interruptores.
4. Disjuntores e quadros de distribuição de energia (QDG/QDC).
5. Automação residencial utilizando dispositivos inteligentes como Sonoff, Tuya e Alexa.
6. Instalação de sistemas de câmeras de segurança (CFTV) e vídeo-porteiros.
7. Dispositivos de Proteção contra Surtos (DPS) e disjuntores diferenciais residuais (DR).
8. Projetos de iluminação interna, externa, decorativa e técnica.
9. Instalação de Carregadores de Carro Elétrico (Wallbox) e painéis de energia solar (energia limpa).
10. Auxiliar com cadastro de orçamento e agendamento de serviços elétricos no site.

Responda sempre em português. Se o cliente demonstrar interesse em agendar um serviço ou solicitar um orçamento, incentive-o amigavelmente a preencher o formulário na aba de "Agendamento" / "Contato", ou informe que ele pode falar direto com nosso WhatsApp Central. Evite respostas extremamente longas, prefira formatação organizada com tópicos limpos.`;

    const contents = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Erro no chat com IA:", error);
    res.status(500).json({ error: "Falha ao processar solicitação de IA.", details: error.message });
  }
});

// API: AI classifier for lead qualification
app.post("/api/classify", async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: "A descrição do problema elétrico é obrigatória." });
    }

    const systemInstruction = `Analise a descrição de um problema ou demanda elétrica enviado por um cliente do site da AGE Elétrica e classifique a demanda extraindo:
1. Especialidade ou tipo de serviço estimado com base nos problemas típicos: 'Instalação de Chuveiro', 'Troca de fiação', 'Manutenção de Disjuntores / Quadro', 'Instalação de Tomada / Interruptor', 'Instalação de Wallbox / Carregador Veicular', 'Automação Residencial (Alexa/Sonoff)', 'Instalação de Câmeras CFTV', 'Instalação de DPS / DR', 'Iluminação Externa / Interna', ou 'Outros Reparos Elétricos'.
2. Grau de urgência estimado: 'Baixa', 'Média' ou 'Alta' (Marque como 'Alta' se houver indicação de cheiro de queimado/fumaça, faíscas, queda total de fases, disjuntor desarmando sem parar, chuveiro queimando fiação, ou risco de choques. Marque como 'Média' para reparos funcionais porém não perigosos no momento. Marque como 'Baixa' para novas instalações planejadas, estética ou melhorias).
3. Categoria geral: 'Instalações', 'Manutenção', 'Automação', 'CFTV / Segurança', 'Chuveiro', 'Carregador Elétrico'.`;

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
              description: "Especialidade ou tipo de serviço estimado",
            },
            urgencia: {
              type: Type.STRING,
              description: "Grau de urgência estimado: 'Baixa', 'Média' ou 'Alta'",
            },
            categoria: {
              type: Type.STRING,
              description: "Categoria geral do serviço",
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
