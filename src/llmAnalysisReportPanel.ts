import * as vscode from 'vscode';
import { Titles } from './constants';
import { llmAnalysisDetails, ModelCardResponse } from './llmAnalysis';
import { readFileSync } from 'fs';
import * as path from 'path';
import { render } from 'mustache';

interface EnrichedGuardrail {
  id: number;
  name: string;
  type: string;
  description: string;
  instructions: string;
  categories: string[];
  externalReferences: string[];
  improvedMetrics: Array<{ taskName: string, metricName: string }>;
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

  private getRecommendedGuardrails(tasks: ModelCardResponse['tasks'], apiGuardrails: ModelCardResponse['guardrails']): EnrichedGuardrail[] {
    // Collect all guardrail IDs from metrics that have high or moderate impact
    const recommendedGuardrailIds = new Set<number>();

    tasks.forEach(task => {
      task.metrics.forEach(metric => {
        const impactLevel = this.getImpactLevel(metric);
        if (impactLevel === 'high' || impactLevel === 'moderate') {
          if (metric.guardrails) {
            metric.guardrails.forEach((id: number) => recommendedGuardrailIds.add(id));
          }
        }
      });
    });

    // Create guardrail-to-metrics mapping for cross-references
    const guardrailToMetrics = new Map<number, Array<{ taskName: string, metricName: string }>>();

    tasks.forEach(task => {
      task.metrics.forEach(metric => {
        if (metric.guardrails) {
          metric.guardrails.forEach(id => {
            if (!guardrailToMetrics.has(id)) {
              guardrailToMetrics.set(id, []);
            }
            guardrailToMetrics.get(id)!.push({
              taskName: task.name,
              metricName: metric.name
            });
          });
        }
      });
    });

    // Filter API guardrails to only include recommended ones
    return apiGuardrails.filter(guardrail =>
      recommendedGuardrailIds.has(guardrail.id)
    ).map((guardrail): EnrichedGuardrail => ({
      id: guardrail.id,
      name: guardrail.name,
      type: guardrail.scope === 'both' ? 'input_output' : guardrail.scope,
      description: guardrail.description,
      instructions: guardrail.instructions,
      categories: guardrail.metadata_keys || [],
      externalReferences: guardrail.external_references || [],
      improvedMetrics: guardrailToMetrics.get(guardrail.id) || []
    }));
  }

  public async updatePanel(modelID: string) {
    const resp = await llmAnalysisDetails(modelID);
    if (!resp) {
      console.error('no detailed response?');
      return;
    }

    // Collect all metrics with their impact levels
    const allMetrics = resp.tasks.flatMap(task =>
      task.metrics.map(metric => ({
        task,
        metric,
        label: `${task.name}: ${metric.name}`,
        impactLevel: this.getImpactLevel(metric),
      }))
    );

    // Sort by required metrics first, then by impact level
    allMetrics.sort((a, b) => {
      const impactOrder: { [key: string]: number } = { 'high': 0, 'moderate': 1, 'low': 2, 'unknown': 3 };
      return impactOrder[a.impactLevel] - impactOrder[b.impactLevel];
    });

    const recommendedGuardrails = this.getRecommendedGuardrails(resp.tasks, resp.guardrails);

    // Create metric-to-guardrail and guardrail-to-metric mappings
    const metricToGuardrails = new Map<string, number[]>();
    const guardrailToMetrics = new Map<number, Array<{ taskName: string, metricName: string }>>();

    resp.tasks.forEach(task => {
      task.metrics.forEach(metric => {
        const metricKey = `${task.name}:${metric.name}`;
        if (metric.guardrails) {
          metricToGuardrails.set(metricKey, metric.guardrails);

          metric.guardrails.forEach(id => {
            if (!guardrailToMetrics.has(id)) {
              guardrailToMetrics.set(id, []);
            }
            guardrailToMetrics.get(id)!.push({
              taskName: task.name,
              metricName: metric.name
            });
          });
        }
      });
    });

    // Add cross-references to guardrails
    const enrichedGuardrails = recommendedGuardrails.map(guardrail => ({
      ...guardrail,
      improvedMetrics: guardrailToMetrics.get(guardrail.id) || []
    }));

    // Add guardrail info to tasks and metrics
    const enrichedTasks = resp.tasks.map(task => ({
      // key needs to be not `name` as mustache doesn't let us reference parent scope explicitly
      taskName: task.name,
      desc: task.description,
      tags: task.tags?.join(', ') || '',
      metrics: task.metrics.map(metric => {
        const metricKey = `${task.name}:${metric.name}`;
        const relatedGuardrailIds = metricToGuardrails.get(metricKey) || [];

        return {
          name: metric.name,
          score: metric.score,
          categories: metric.categories,
          higherIsBetter: metric.higher_is_better,
          impactLevel: this.getImpactLevel(metric),
          relatedGuardrails: relatedGuardrailIds
            .filter(id => recommendedGuardrails.some(g => g.id === id))
            .map(id => {
              const guardrail = resp.guardrails.find(g => g.id === id);
              return guardrail ? { id: guardrail.id, name: guardrail.name } : null;
            })
            .filter(Boolean)
        };
      })
    }));

    const renderedHtml = render(readFileSync(path.resolve(__dirname, 'llmAnalysisReport.hbs')).toString(), {
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