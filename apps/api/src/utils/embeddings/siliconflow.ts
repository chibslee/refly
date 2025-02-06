import { Embeddings } from '@langchain/core/embeddings';

export interface SiliconFlowEmbeddingsConfig {
  modelName: string;
  batchSize: number;
  maxRetries: number;
  dimensions: number;
  apiKey: string;
}

const defaultConfig: Partial<SiliconFlowEmbeddingsConfig> = {
  modelName: 'Pro/BAAI/bge-m3',
  batchSize: 32,
  maxRetries: 3,
  dimensions: 1024,
};

export class SiliconFlowEmbeddings extends Embeddings {
  private config: SiliconFlowEmbeddingsConfig;

  constructor(config: SiliconFlowEmbeddingsConfig) {
    super(config);
    this.config = { ...defaultConfig, ...config };
  }

  private async fetch_minibatch(input: string[]) {
    // 将输入数组分成每组8个元素的批次
    const batchSize = 8;
    const batches = [];
    for (let i = 0; i < input.length; i += batchSize) {
      batches.push(input.slice(i, i + batchSize));
    }

    // 存储所有批次的结果
    let results = { data: [] };

    // 依次处理每个批次
    for (const batch of batches) {
      const payload = {
        model: this.config.modelName,
        task: 'retrieval.passage',
        dimensions: this.config.dimensions,
        late_chunking: false,
        input: batch,
      };

      const response = await fetch('https://api.siliconflow.cn/v1/embeddings', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status !== 200) {
        throw new Error(
          `call embeddings failed: ${response.status} ${response.statusText} ${response.text}`,
        );
      }

      const data = await response.json();
      if (results.data.length === 0) {
        results = data;
      } else {
        results.data = results.data.concat(data.data);
        results.usage.prompt_tokens += data.usage.prompt_tokens;
        results.usage.completion_tokens += data.usage.completion_tokens;
        results.usage.total_tokens += data.usage.total_tokens;
      }
    }

    return results;
  }

  private async fetch_one(input: string[]) {
    const payload = {
      model: this.config.modelName,
      task: 'retrieval.passage',
      dimensions: this.config.dimensions,
      late_chunking: false,
      input,
    };

    const response = await fetch('https://api.siliconflow.cn/v1/embeddings', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status !== 200) {
      throw new Error(
        `call embeddings failed: ${response.status} ${response.statusText} ${response.text}`,
      );
    }

    const data = await response.json();

    return data;
  }
  //   fetch = fetch_minibatch;

  async embedDocuments(documents: string[]): Promise<number[][]> {
    const body = await this.fetch_minibatch(documents);
    return body.data.map((point: { embedding: number[] }) => point.embedding);
  }

  async embedQuery(query: string): Promise<number[]> {
    const body = await this.fetch_minibatch([query]);
    if (body.data.length === 0) {
      throw new Error('No embedding returned');
    }
    return body.data[0].embedding;
  }
}
