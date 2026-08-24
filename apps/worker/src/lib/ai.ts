import OpenAI from "openai";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
import { config, type LLMProvider } from "./config";

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

interface ProviderOpts {
  jsonSchema: boolean;
  temperature?: number;
}

export abstract class AIProvider {
  protected client: OpenAI;
  protected baseURL: string;

  constructor(
    protected apiKey: string,
    baseURL: string,
  ) {
    this.baseURL = baseURL;
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

    this.applyExtraParams(params);

    const res = await this.client.chat.completions.create(params);
    const msg = res.choices[0]?.message;
    const text = msg?.content
      || (msg as unknown as Record<string, string>)?.reasoning_content
      || null;
    if (!text) throw new Error("ai: empty response");
    return text;
  }

  protected applyExtraParams(_params: ChatCompletionCreateParamsNonStreaming): void {}

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

class StandardProvider extends AIProvider {
  constructor(
    apiKey: string,
    baseURL: string,
    private opts: ProviderOpts,
  ) {
    super(apiKey, baseURL);
  }

  get supportsJsonSchema() {
    return this.opts.jsonSchema;
  }

  protected override get defaultTemperature(): number | undefined {
    return this.opts.temperature;
  }
}

class MoonshotProvider extends StandardProvider {
  protected override applyExtraParams(params: ChatCompletionCreateParamsNonStreaming): void {
    // kimi-k2.6 is a reasoning model that puts output in reasoning_content
    // and returns empty content unless thinking is explicitly disabled.
    (params as unknown as Record<string, unknown>).thinking = { type: "disabled" };
  }
}

class OpenLimitsProvider extends AIProvider {
  get supportsJsonSchema() {
    return false;
  }

  override async vision(req: VisionRequest): Promise<string> {
    const messagesURL = this.baseURL.replace(/\/v1\/?$/, "") + "/v1/messages";
    const res = await fetch(messagesURL, {
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
    let text: string | undefined;

    if (raw.startsWith("{")) {
      const json = JSON.parse(raw) as { content?: Array<{ type: string; text?: string }> };
      text = json.content?.find((c) => c.type === "text")?.text?.trim();
    } else {
      // OpenLimits sometimes ignores stream:false and returns SSE
      const chunks: string[] = [];
      for (const line of raw.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
          const evt = JSON.parse(line.slice(6));
          if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
            chunks.push(evt.delta.text);
          }
        } catch {
          // skip malformed SSE line
        }
      }
      text = chunks.join("").trim();
    }

    if (!text) throw new Error("vision: empty response");
    return text;
  }
}

const PROVIDERS: Record<LLMProvider, (apiKey: string, baseURL?: string) => AIProvider> = {
  openai: (key, url) =>
    new StandardProvider(key, url ?? "https://api.openai.com/v1", { jsonSchema: true }),
  openlimits: (key, url) =>
    new OpenLimitsProvider(key, url ?? "https://openlimits.app/v1"),
  moonshot: (key, url) =>
    new MoonshotProvider(key, url ?? "https://api.moonshot.ai/v1", { jsonSchema: true, temperature: undefined }),
};

let instance: AIProvider | null = null;

export function ai(): AIProvider {
  if (instance) return instance;
  if (!config.LLM_API_KEY) {
    throw new Error("LLM_API_KEY is not set — required for the AI pipeline");
  }
  const factory = PROVIDERS[config.LLM_PROVIDER];
  instance = factory(config.LLM_API_KEY, config.LLM_BASE_URL);
  return instance;
}
