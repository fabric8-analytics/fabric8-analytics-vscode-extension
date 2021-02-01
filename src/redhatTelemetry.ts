import { getTelemetryService, TelemetryService } from "@redhat-developer/vscode-redhat-telemetry";

export async function record(event) {
    
    let telemetryService: TelemetryService = await getTelemetryService("redhat.fabric8-analytics")
    
      telemetryService.send(event);
  }
