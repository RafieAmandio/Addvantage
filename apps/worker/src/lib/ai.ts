import OpenAI from "openai";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
import { config } from "./config";

export interface ChatRequest {
  model?: string;
  temperature?: number;
  system: string;
  user: string;
  jsonSchema?: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
}

export interface VisionRequest {
  imageBase64: string;
  mediaType: string;
  prompt: string;
}

export abstract class AIProvider {
  protected client: OpenAI;

  constructor(
    protected apiKey: string,
    baseURL: string,
  ) {
    this.client = new OpenAI({ apiKey, baseURL });
  }

  abstract get supportsJsonSchema(): boolean;
  protected get defaultTemperature(): number | undefined {
    return 0.4;
  }

  async chat(req: ChatRequest): Promise<string> {
    const params: ChatCompletionCreateParamsNonStreaming = {
      model: req.model ?? config.LLM_MODEL,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.user },
      ],
    };

    const temp = req.temperature ?? this.defaultTemperature;
    if (temp !== undefined) params.temperature = temp;

    if (req.jsonSchema && this.supportsJsonSchema) {
      params.response_format = {
        type: "json_schema",
        json_schema: req.jsonSchema,
      };
    }

    const res = await this.client.chat.completions.create(params);
    const text = res.choices[0]?.message?.content;
    if (!text) throw new Error("ai: empty response");
    return text;
  }

  async vision(req: VisionRequest): Promise<string> {
    const res = await this.client.chat.completions.create({
      model: config.LLM_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${req.mediaType};base64,${req.imageBase64}`,
              },
            },
            { type: "text", text: req.prompt },
          ],
        },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim();
    if (!text) throw new Error("vision: empty response");
    return text;
  }
}

class OpenAIProvider extends AIProvider {
  get supportsJsonSchema() {
    return true;
  }
}

class OpenLimitsProvider extends AIProvider {
  get supportsJsonSchema() {
    return false;
  }

  override async vision(req: VisionRequest): Promise<string> {
    const baseURL = config.LLM_BASE_URL ?? "https://openlimits.app";
    const res = await fetch(`${baseURL}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.LLM_MODEL,
        max_tokens: 1024,
        stream: false,
        thinking: { type: "disabled" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: req.mediaType, data: req.imageBase64 },
              },
              { type: "text", text: req.prompt },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`vision API ${res.status}: ${err.slice(0, 200)}`);
    }

    const raw = await res.text();
    if (raw.startsWith("{")) {
      const json = JSON.parse(raw) as { content?: Array<{ type: string; text?: string }> };
      return json.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
    }

    const chunks: string[] = [];
    for (const line of raw.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        const evt = JSON.parse(line.slice(6));
        if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
          chunks.push(evt.delta.text);
        }
      } catch {}
    }
    const text = chunks.join("").trim();
    if (!text) throw new Error("vision: empty response");
    return text;
  }
}

class MoonshotProvider extends AIProvider {
  get supportsJsonSchema() {
    return true;
  }

  protected override get defaultTemperature(): number | undefined {
    return undefined;
  }
}

const PROVIDERS: Record<string, (apiKey: string) => AIProvider> = {
  openai: (key) => new OpenAIProvider(key, "https://api.openai.com/v1"),
  openlimits: (key) => new OpenLimitsProvider(key, "https://openlimits.app/v1"),
  moonshot: (key) => new MoonshotProvider(key, "https://api.moonshot.ai/v1"),
};

let instance: AIProvider | null = null;

export function ai(): AIProvider {
  if (instance) return instance;
  if (!config.LLM_API_KEY) {
    throw new Error("LLM_API_KEY is not set — required for the AI pipeline");
  }
  const factory = PROVIDERS[config.LLM_PROVIDER];
  if (!factory) throw new Error(`Unknown LLM provider: ${config.LLM_PROVIDER}`);

  if (config.LLM_BASE_URL) {
    instance = new OpenAIProvider(config.LLM_API_KEY, config.LLM_BASE_URL);
  } else {
    instance = factory(config.LLM_API_KEY);
  }
  return instance;
}
