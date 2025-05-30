module.exports = {
  types: [
    { type: 'feat', section: 'enhancement', hidden: false },
    { type: 'fix', section: 'fixes', hidden: false },
    { type: 'docs', section: 'documentation', hidden: false },
    { type: 'style', section: 'style', hidden: false },
    { type: 'refactor', section: 'refactor', hidden: false },
    { type: 'perf', section: 'performance', hidden: false },
    { type: 'test', section: 'tests', hidden: false },
    { type: 'chore', section: 'chore', hidden: false }
  ],
  commitUrlFormat: 'https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/commit/{{hash}}',
  compareUrlFormat: 'https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/compare/{{previousTag}}...{{currentTag}}',
  issueUrlFormat: 'https://github.com/fabric8-analytics/fabric8-analytics-vscode-extension/issues/{{id}}',
  userUrlFormat: 'https://github.com/{{user}}'
}; 