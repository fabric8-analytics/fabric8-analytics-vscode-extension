import * as vscode from 'vscode';
import { Titles } from './constants';

export interface ReportData {
  model: string,
  tasks: string[],
  scores: number[],
}

export class LLMAnalysisReportPanel {
  public static currentPanel: LLMAnalysisReportPanel | undefined;

  private static readonly viewType = 'llmReport';

  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(column?: vscode.ViewColumn) {
    this._panel = vscode.window.createWebviewPanel(
      LLMAnalysisReportPanel.viewType,
      Titles.LLM_REPORT_TITLE,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: []
      }
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShowPanel() {
    const column = vscode.window.activeTextEditor ?
      vscode.window.activeTextEditor.viewColumn : undefined;

    if (LLMAnalysisReportPanel.currentPanel) {
      if (LLMAnalysisReportPanel.currentPanel._panel.visible) {
        // LLMAnalysisReportPanel.currentPanel.update();
      } else {
        LLMAnalysisReportPanel.currentPanel._panel?.reveal(column);
      }
      // dispose?
      return;
    }

    LLMAnalysisReportPanel.currentPanel = new LLMAnalysisReportPanel(column);
  }

  public updatePanel(data: ReportData) {
    this._panel.webview.html = format(
      PAGE_TEMPLATE,
      data.model,
      JSON.stringify(data.tasks),
      JSON.stringify(data.scores),
      JSON.stringify(data.tasks.map(task => {
        if (task.includes('acc')) {
          return 'green';
        } else {
          return 'red';
        }
      })),
    );
  }

  private dispose() {
    LLMAnalysisReportPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      this._disposables.pop()?.dispose();
    }
  }
}

const PAGE_TEMPLATE = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/@highlightjs/cdn-assets@11.9.0/styles/default.min.css">
    <link rel="stylesheet" href="https://unpkg.com/@highlightjs/cdn-assets@11.9.0/styles/atom-one-light.min.css">
    <style>
      body {
        font-size: 16px;
        /*display: flex;
        flex-direction: column;
        justify-content: space-around; */
      }

      p {
        color: black;
      }

      body {
        background: #ffffff;
      }

      #chartcont {
        width: 60%;
      }

      @media (max-width: 800px) {
        #chartcont {
          width: 90%;
        }
      }
    </style>

    <script src="https://unpkg.com/@highlightjs/cdn-assets@11.9.0/highlight.min.js"></script>
    <script src="https://unpkg.com/@highlightjs/cdn-assets@11.9.0/languages/python.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  </head>
  <body>
    <h1 style="text-align: center">TrustyAI LLM Eval results for {0}</h1>
    <div style="display: flex; justify-content: center;">
      <div id="chartcont">
        <canvas id="myChart"></canvas>
      </div>
    </div>

    <script>
      const ctx = document.getElementById('myChart');

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: {1},
          datasets: [{
            label: 'AI Safety Metrics Assessment',
            data: {2},
            backgroundColor: {3},
            borderWidth: 1
          }]
        },
        options: {
          indexAxis: 'y',
          plugins: {
            legend: {
              // align: 'end',
              labels: {
                generateLabels: function(chart) {
                  return [{
                    text: 'Higher is better',
                    fillStyle: 'green',
                  }, {
                    text: 'Lower is better',
                    fillStyle: 'red',
                  }]
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
            },
            x: {
              min: 0,
              max: 1
            }
          }
        }
      });
    </script>

    <div>
      <p>Based on TrustyAI LM-Eval, we detected moderate risks in bias, toxicity, and truthfulness. We recommend you should use Input Shield for bias protection and Output Shield for toxicity and hallucination protection.</p>
      <p>For Llama stack, you can use Meta's Llama Guard 3, here is an example python code for reference:</p>
    </div>

    <script>hljs.highlightAll();</script>
    <pre>
      <code class="language-python"># Register a model
model = client.models.register(
    model_id="meta-llama/Llama-Guard-3-8B",
    model_type="llm",
    provider_id="ollama",
    provider_model_id="llama-guard3:8b-q4_0",
    metadata={"description": "llama-guard3:8b-q4_0 via ollama"}
)

# Register a safety shield
shield_id = "content_safety"
client.shields.register(shield_id=shield_id, provider_shield_id="Llama-Guard-3-8B")

# Run content through shield
response = client.safety.run_shield(
    shield_id=shield_id, 
    messages=[{"role": "user", "content": user_message}],
    params={  # Shield-specific parameters
        "threshold": 0.1,
        "categories": ["hate", "violence", "profanity"]  
    }    
)</code>
    </pre>
  </body>
</html>`;

function format(str: string, ...values: any[]) {
  return str.replace(/{(\d+)}/g, function (match, index) {
    return typeof values[index] !== 'undefined' ? values[index] : match;
  });
}