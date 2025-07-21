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

  private getRecommendedGuardrails(allMetrics: any[], apiGuardrails: any[]): any[] {
    // Collect all guardrail IDs from metrics that have high or moderate impact
    const recommendedGuardrailIds = new Set<number>();
    
    allMetrics.forEach(m => {
      if (m.impactLevel === 'high' || m.impactLevel === 'moderate') {
        if (m.metric.guardrails) {
          m.metric.guardrails.forEach((id: number) => recommendedGuardrailIds.add(id));
        }
      }
    });

    // Filter API guardrails to only include recommended ones
    return apiGuardrails.filter(guardrail => 
      recommendedGuardrailIds.has(guardrail.id)
    ).map(guardrail => ({
      id: guardrail.id,
      name: guardrail.name,
      type: guardrail.scope === 'both' ? 'input_output' : guardrail.scope,
      description: guardrail.description,
      instructions: guardrail.instructions,
      categories: guardrail.metadata_keys || [],
      externalReferences: guardrail.external_refrences || []
    }));
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

    const recommendedGuardrails = this.getRecommendedGuardrails(allMetrics, resp.guardrails);

    // Create task-to-guardrail and guardrail-to-task mappings
    const taskToGuardrails = new Map<string, number[]>();
    const guardrailToTasks = new Map<number, string[]>();

    resp.tasks.forEach(task => {
      const guardrailIds = new Set<number>();
      task.metrics.forEach(metric => {
        if (metric.guardrails) {
          metric.guardrails.forEach(id => guardrailIds.add(id));
        }
      });
      
      const guardrailArray = Array.from(guardrailIds);
      taskToGuardrails.set(task.name, guardrailArray);
      
      guardrailArray.forEach(id => {
        if (!guardrailToTasks.has(id)) {
          guardrailToTasks.set(id, []);
        }
        guardrailToTasks.get(id)!.push(task.name);
      });
    });

    // Add cross-references to guardrails
    const enrichedGuardrails = recommendedGuardrails.map(guardrail => ({
      ...guardrail,
      improvedTasks: guardrailToTasks.get(guardrail.id) || []
    }));

    // Add guardrail info to tasks
    const enrichedTasks = resp.tasks.map(task => ({
      name: task.name,
      desc: task.description,
      tags: task.tags?.join(', ') || '',
      relatedGuardrails: (taskToGuardrails.get(task.name) || [])
        .filter(id => recommendedGuardrails.some(g => g.id === id))
        .map(id => {
          const guardrail = resp.guardrails.find(g => g.id === id);
          return guardrail ? { id: guardrail.id, name: guardrail.name } : null;
        })
        .filter(Boolean)
    }));

    const renderedHtml = render(readFileSync(path.resolve(__dirname, 'llmAnalysisReport.html')).toString(), {
      modelName: resp.config.model_name,
      labels: JSON.stringify(allMetrics.map(m => m.label)),
      data: JSON.stringify(allMetrics.map(m => m.metric.score)),
      colors: JSON.stringify(allMetrics.map(m => this.getImpactColor(m.impactLevel))),
      impactLevels: JSON.stringify(allMetrics.map(m => m.impactLevel)),
      tasks: enrichedTasks,
      contextData: {
        modelSource: resp.config.model_source,
        modelRevision: resp.config.model_revision_sha.replace('sha256:', '').substring(0, 8),
        dtype: resp.config.dtype,
        batchSize: resp.config.batch_size,
        transformersVersion: resp.config.transformers_version,
        lmEvalVersion: resp.config.lm_eval_version,
      },
      guardrails: enrichedGuardrails
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