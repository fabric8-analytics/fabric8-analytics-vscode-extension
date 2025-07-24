/* eslint-disable @typescript-eslint/naming-convention */
export interface ListModelCardResponse {
    id: string,
    name: string,
    model_name: string,
    metrics: {
        task: string,
        metric: string,
        score: number,
        assessment: string,
    }[]
}

export interface ModelCardResponse {
    id: string,
    name: string,
    source: string,
    config: {
        model_name: string,
        model_source: string,
        model_revision: string,
        model_revision_sha: string,
        dtype: string,
        batch_size: string,
        batch_sizes: number[],
        lm_eval_version: string,
        transformers_version: string,
    },
    tasks: {
        name: string,
        description: string,
        metrics: {
            name: string,
            categories: string[],
            higher_is_better: boolean,
            score: number,
            thresholds: {
                name: string,
                category: number,
                interpretation: string,
                upper: number,
                lower: number,
            }[],
            guardrails: number[]
        }[],
        tags: string[]
    }[],
    guardrails: {
        id: number,
        name: string,
        description: string,
        metadata_keys: string[],
        scope: 'input' | 'output' | 'both',
        external_references: string[],
        instructions: string,
    }[]
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function llmAnalysis(models: string[]): Promise<ListModelCardResponse[] | undefined> {
    const reqBody = JSON.stringify({
        queries: models.map(model => {
            return {
                model_name: model
            };
        })
    });

    const resp = await fetch(`https://exhort.stage.devshift.net/api/v4/model-cards/`, {
        method: 'POST',
        body: reqBody,
    });
    if (!resp.ok) {
        return undefined;
    }

    return resp.json() as Promise<ListModelCardResponse[]>;
}

export async function llmAnalysisDetails(modelID: string): Promise<ModelCardResponse | undefined> {
    const resp = await fetch(`https://exhort.stage.devshift.net/api/v4/model-cards/${modelID}`);
    if (!resp.ok) {
        return undefined;
    }
    return resp.json() as Promise<ModelCardResponse>;
}