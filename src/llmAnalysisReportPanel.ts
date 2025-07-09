import * as vscode from 'vscode';
import { Titles } from './constants';
import { llmAnalysisDetails } from './llmAnalysis';
import { readFileSync } from 'fs';
import * as path from 'path';
import { render } from 'mustache';

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

  private getImpactLevel(metric: any): string {
    if (!metric.thresholds || metric.thresholds.length === 0) {
      return 'unknown';
    }

    const score = metric.score;
    for (const threshold of metric.thresholds) {
      if (score >= threshold.lower && score <= threshold.upper) {
        // Map threshold categories to impact levels
        if (threshold.category <= 2) {
          return 'low';
        }
        if (threshold.category <= 4) {
          return 'moderate';
        }
        return 'high';
      }
    }
    return 'unknown';
  }

  private getImpactColor(impactLevel: string): string {
    switch (impactLevel) {
      case 'low': return '#4CAF50';      // Green
      case 'moderate': return '#FF9800';  // Orange
      case 'high': return '#F44336';      // Red
      default: return '#9E9E9E';          // Gray
    }
  }

  private isRequiredMetric(taskName: string, metricName: string): boolean {
    const requiredMetrics = [
      'truthfulqa_mc1',
      'toxigen',
      'winogender',
      'crows_pairs',
      'bbq',
      'sycophancy',
      'mmlu_harmful',
      'ethics',
      'safety_prompts'
    ];

    const taskMetric = `${taskName.toLowerCase()}_${metricName.toLowerCase()}`;
    return requiredMetrics.some(required =>
      taskMetric.includes(required) || taskName.toLowerCase().includes(required)
    );
  }

  private getRecommendedGuardrails(allMetrics: any[]): any[] {
    const riskCategories = new Set<string>();

    // Analyze metrics to determine risk areas
    allMetrics.forEach(m => {
      if (m.impactLevel === 'high' || m.impactLevel === 'moderate') {
        const taskName = m.task.name.toLowerCase();
        if (taskName.includes('toxigen') || taskName.includes('toxic')) {
          riskCategories.add('toxicity');
        }
        if (taskName.includes('bias') || taskName.includes('winogender') || taskName.includes('bbq') || taskName.includes('crows')) {
          riskCategories.add('bias');
        }
        if (taskName.includes('truthful') || taskName.includes('hallucination')) {
          riskCategories.add('truthfulness');
        }
        if (taskName.includes('harmful') || taskName.includes('safety')) {
          riskCategories.add('harmful_content');
        }
        if (taskName.includes('ethics')) {
          riskCategories.add('ethics');
        }
      }
    });

    const guardrails = [
      {
        name: 'Llama Guard 3',
        type: 'input_output',
        categories: ['toxicity', 'bias', 'harmful_content', 'ethics'],
        description: 'Meta\'s comprehensive safety classifier that can filter both input prompts and output responses for various safety categories including hate speech, violence, and harmful content.',
        benefits: ['Real-time filtering', 'Comprehensive safety categories', 'High accuracy', 'Easy integration'],
        codeExample: `# Install: pip install transformers torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

# Load Llama Guard 3
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-Guard-3-8B")
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-Guard-3-8B",
    torch_dtype=torch.float16,
    device_map="auto"
)

def check_safety(text, is_user_input=True):
    role = "User" if is_user_input else "Assistant"
    chat = [{"role": role, "content": text}]
    
    input_ids = tokenizer.apply_chat_template(chat, return_tensors="pt")
    
    with torch.no_grad():
        output = model.generate(
            input_ids,
            max_new_tokens=100,
            pad_token_id=tokenizer.eos_token_id
        )
    
    response = tokenizer.decode(output[0][len(input_ids[0]):], skip_special_tokens=True)
    return "unsafe" not in response.lower()

# Example usage
user_input = "How do I make a bomb?"
is_safe = check_safety(user_input, is_user_input=True)
print(f"Input is safe: {is_safe}")`
      },
      {
        name: 'Perspective API',
        type: 'input_output',
        categories: ['toxicity', 'bias'],
        description: 'Google\'s toxicity detection API that provides real-time scoring for toxic comments, with support for multiple languages and toxicity types.',
        benefits: ['Fast API responses', 'Multiple toxicity attributes', 'Language support', 'Production-ready'],
        codeExample: `# Install: pip install google-api-python-client
from googleapiclient import discovery
import json

class PerspectiveAPI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.client = discovery.build(
            "commentanalyzer",
            "v1alpha1",
            developerKey=api_key,
            discoveryServiceUrl="https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1",
            static_discovery=False,
        )
    
    def analyze_comment(self, text, threshold=0.7):
        analyze_request = {
            'comment': {'text': text},
            'requestedAttributes': {
                'TOXICITY': {},
                'SEVERE_TOXICITY': {},
                'IDENTITY_ATTACK': {},
                'INSULT': {},
                'PROFANITY': {},
                'THREAT': {}
            }
        }
        
        response = self.client.comments().analyze(body=analyze_request).execute()
        
        scores = {}
        for attribute, data in response['attributeScores'].items():
            scores[attribute] = data['summaryScore']['value']
        
        # Check if any score exceeds threshold
        is_safe = all(score < threshold for score in scores.values())
        return is_safe, scores

# Example usage
# Get API key from: https://developers.perspectiveapi.com/s/
perspective = PerspectiveAPI("YOUR_API_KEY")
is_safe, scores = perspective.analyze_comment("You are stupid!")
print(f"Content is safe: {is_safe}")
print(f"Toxicity scores: {scores}")`
      },
      {
        name: 'Detoxify',
        type: 'output',
        categories: ['toxicity'],
        description: 'A Python library built on transformers for detecting toxic language in text. Works offline without API calls.',
        benefits: ['Offline processing', 'No API costs', 'Fast inference', 'Easy to use'],
        codeExample: `# Install: pip install detoxify
from detoxify import Detoxify

class DetoxifyFilter:
    def __init__(self, threshold=0.7):
        self.model = Detoxify('original')
        self.threshold = threshold
    
    def is_safe(self, text):
        results = self.model.predict(text)
        
        # Check multiple toxicity categories
        toxic_scores = [
            results.get('toxicity', 0),
            results.get('severe_toxicity', 0),
            results.get('obscene', 0),
            results.get('threat', 0),
            results.get('insult', 0),
            results.get('identity_attack', 0)
        ]
        
        max_score = max(toxic_scores)
        return max_score < self.threshold, results
    
    def filter_response(self, text):
        is_safe, scores = self.is_safe(text)
        if not is_safe:
            return "I cannot provide that response as it may contain inappropriate content."
        return text

# Example usage
detoxify_filter = DetoxifyFilter(threshold=0.7)
response = "This is a normal response."
filtered_response = detoxify_filter.filter_response(response)
print(filtered_response)`
      },
      {
        name: 'Azure Content Safety',
        type: 'input_output',
        categories: ['toxicity', 'bias', 'harmful_content'],
        description: 'Microsoft\'s cloud-based content moderation service with enterprise-grade safety filtering and customizable policies.',
        benefits: ['Enterprise reliability', 'Custom policies', 'Multiple content types', 'Detailed categories'],
        codeExample: `# Install: pip install azure-ai-contentsafety
from azure.ai.contentsafety import ContentSafetyClient
from azure.core.credentials import AzureKeyCredential
from azure.ai.contentsafety.models import AnalyzeTextOptions

class AzureContentSafety:
    def __init__(self, endpoint, key):
        self.client = ContentSafetyClient(endpoint, AzureKeyCredential(key))
    
    def analyze_text(self, text, threshold=4):
        # Azure uses severity levels 0-7 (0=safe, 7=high risk)
        request = AnalyzeTextOptions(text=text)
        
        try:
            response = self.client.analyze_text(request)
            
            # Check categories: Hate, SelfHarm, Sexual, Violence
            results = {}
            max_severity = 0
            
            for result in response.categoriesAnalysis:
                category = result.category
                severity = result.severity
                results[category] = severity
                max_severity = max(max_severity, severity)
            
            is_safe = max_severity < threshold
            return is_safe, results
            
        except Exception as e:
            print(f"Analysis failed: {e}")
            return False, {}
    
    def filter_content(self, text):
        is_safe, analysis = self.analyze_text(text)
        if not is_safe:
            return "Content blocked due to safety policy violations."
        return text

# Example usage
# Get credentials from Azure Portal
azure_safety = AzureContentSafety(
    endpoint="https://your-resource.cognitiveservices.azure.com/",
    key="your-api-key"
)

text = "Example text to analyze"
is_safe, results = azure_safety.analyze_text(text)
print(f"Content is safe: {is_safe}")
print(f"Analysis results: {results}")`
      }
    ];

    // Filter guardrails based on detected risk categories
    return guardrails.filter(guardrail =>
      guardrail.categories.some(category => riskCategories.has(category))
    );
  }

  public async updatePanel(modelID: string) {
    const resp = await llmAnalysisDetails(modelID);
    if (!resp) {
      console.error('no detailed response?');
      return;
    }

    const filter = (obj: { name: string }): boolean => {
      return obj.name === 'acc' || obj.name.startsWith('pct_');
    };

    // Collect all metrics with their impact levels
    const allMetrics = resp.tasks.flatMap(task =>
      task.metrics.filter(filter).map(metric => ({
        task,
        metric,
        label: `${task.name}: ${metric.name}`,
        impactLevel: this.getImpactLevel(metric),
        isRequired: this.isRequiredMetric(task.name, metric.name)
      }))
    );

    // Sort by required metrics first, then by impact level
    allMetrics.sort((a, b) => {
      if (a.isRequired !== b.isRequired) {
        return a.isRequired ? -1 : 1;
      }
      const impactOrder: { [key: string]: number } = { 'high': 0, 'moderate': 1, 'low': 2, 'unknown': 3 };
      return impactOrder[a.impactLevel] - impactOrder[b.impactLevel];
    });

    const recommendedGuardrails = this.getRecommendedGuardrails(allMetrics);

    const renderedHtml = render(readFileSync(path.resolve(__dirname, 'llmAnalysisReport.html')).toString(), {
      modelName: resp.config.model_name,
      labels: JSON.stringify(allMetrics.map(m => m.label)),
      data: JSON.stringify(allMetrics.map(m => m.metric.score)),
      colors: JSON.stringify(allMetrics.map(m => this.getImpactColor(m.impactLevel))),
      impactLevels: JSON.stringify(allMetrics.map(m => m.impactLevel)),
      tasks: resp.tasks.map(task => ({
        name: task.name,
        desc: task.description,
        tags: task.tags?.join(', ') || ''
      })),
      contextData: {
        modelSource: resp.config.model_source,
        modelRevision: resp.config.model_revision_sha.replace('sha256:', '').substring(0, 8),
        dtype: resp.config.dtype,
        batchSize: resp.config.batch_size,
        transformersVersion: resp.config.transformers_version,
        lmEvalVersion: resp.config.lm_eval_version,
      },
      guardrails: recommendedGuardrails
    });
    this._panel.webview.html = renderedHtml;
  }

  private dispose() {
    LLMAnalysisReportPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      this._disposables.pop()?.dispose();
    }
  }
}