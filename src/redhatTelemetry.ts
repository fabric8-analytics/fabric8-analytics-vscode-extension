import { getTelemetryService, TelemetryEvent, TelemetryService } from "@redhat-developer/vscode-redhat-telemetry";

export async function record(event: TelemetryEvent) {
  const telemetryService: TelemetryService = await getTelemetryService("redhat.fabric8-analytics")
  telemetryService.send(event);
}
export async function startUp() {
  const telemetryService: TelemetryService = await getTelemetryService("redhat.fabric8-analytics")
  telemetryService.sendStartupEvent();
}
export async function shutDown() {
  const telemetryService: TelemetryService = await getTelemetryService("redhat.fabric8-analytics")
  telemetryService.sendShutdownEvent();
}
