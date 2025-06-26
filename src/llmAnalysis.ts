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
