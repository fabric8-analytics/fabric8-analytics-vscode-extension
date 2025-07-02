/* eslint-disable @typescript-eslint/naming-convention */
interface ListModelCardResponse {
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

interface ModelCardResponse {
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
        }[],
        tags: string[]
    }[]
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function llmAnalysis(models: string[]): Promise<ListModelCardResponse[] | undefined> {
    /* const reqBody = JSON.stringify({
        queries: models.map(model => {
            return {
                model_name: model
            };
        })
    });

    const resp = await fetch(`https://exhort-rhda-poc.apps.tpav2demo.tssc-rh.com/api/v4/model-cards/`, {
        body: reqBody,
    }); 
    
    return resp.json() as Promise<ListModelCardResponse[]>;
    */

    const resp = await fetch('https://raw.githubusercontent.com/trustification/exhort/11a5eb10e339139b7443a930507c7216e760cf37/examples/responses/query-response.json');
    if (!resp.ok) {
        return undefined;
    }

    return (await (resp.json()) as ListModelCardResponse[]).filter(modelcard => {
        return models.includes(modelcard.model_name);
    });
}

export async function llmAnalysisDetails(model: string): Promise<ModelCardResponse | undefined> {
    if (model === 'microsoft/phi-2') {
        const resp = await fetch('https://raw.githubusercontent.com/trustification/exhort/11a5eb10e339139b7443a930507c7216e760cf37/examples/responses/phi-2.json');
        if (!resp.ok) {
            return undefined;
        }

        return resp.json() as Promise<ModelCardResponse>;
    } else if (model === 'meta-llama/Llama-3.1-8B-Instruct') {
        const resp = await fetch('https://raw.githubusercontent.com/trustification/exhort/11a5eb10e339139b7443a930507c7216e760cf37/examples/responses/llama-3.1-8B-Instruct.json');
        if (!resp.ok) {
            return undefined;
        }

        return resp.json() as Promise<ModelCardResponse>;
    } else { return undefined; }
}