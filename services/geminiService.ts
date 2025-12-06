import { GoogleGenAI, Type } from "@google/genai";
import { KanbanColumn, IshikawaData, Task } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to clean JSON string if Markdown code blocks are present
const cleanJsonString = (str: string): string => {
  return str.replace(/```json\n?|\n?```/g, '').trim();
};

export const generateKanbanBoard = async (projectTitle: string, projectContext: string): Promise<KanbanColumn[]> => {
  if (!apiKey) {
    console.error("No API Key provided");
    return [];
  }

  const prompt = `
    Crie uma estrutura de quadro Kanban para um projeto intitulado "${projectTitle}".
    Contexto: ${projectContext}
    
    Retorne um array JSON de colunas. Cada coluna tem um 'id' (string), 'title' (string) e 'tasks' (array de objetos com 'id' e 'content').
    As colunas devem ser tipicamente "A Fazer", "Em Progresso", "Concluído", mas adapte se necessário.
    Crie pelo menos 3-4 tarefas realistas por coluna com base no contexto.
    Responda em Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    content: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as KanbanColumn[];
  } catch (error) {
    console.error("Error generating Kanban:", error);
    return [];
  }
};

export const generateIshikawaData = async (problem: string): Promise<IshikawaData | null> => {
  if (!apiKey) return null;

  const prompt = `
    Crie um conjunto de dados de diagrama de Ishikawa (Espinha de Peixe) para o problema/efeito: "${problem}".
    Retorne um objeto JSON com:
    - "effect": string (o problema)
    - "categories": array de objetos, cada um tendo "name" (nome da categoria como Métodos, Máquinas, Pessoas, etc.) e "causes" (array de strings).
    Forneça causas detalhadas e lógicas.
    Responda em Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            effect: { type: Type.STRING },
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  causes: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as IshikawaData;
  } catch (error) {
    console.error("Error generating Ishikawa:", error);
    return null;
  }
};

export const generateScrumBacklog = async (projectTitle: string, projectContext: string): Promise<Task[]> => {
  if (!apiKey) return [];

  const prompt = `
    Crie um Backlog de Produto com Histórias de Usuário para um projeto intitulado "${projectTitle}".
    Contexto: ${projectContext}
    
    Retorne um array JSON de objetos. Cada objeto deve ter:
    - 'id' (string)
    - 'content' (string, ex: "Como usuário, eu quero...")
    - 'priority' (string: "High", "Medium" ou "Low")
    - 'storyPoints' (inteiro, sequência de fibonacci como 1, 2, 3, 5, 8)
    
    Gere cerca de 5-8 itens.
    Responda em Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        content: { type: Type.STRING },
                        priority: { type: Type.STRING },
                        storyPoints: { type: Type.INTEGER }
                    }
                }
            }
        }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as Task[];
  } catch (error) {
      console.error("Error generating Backlog:", error);
      return [];
  }
};