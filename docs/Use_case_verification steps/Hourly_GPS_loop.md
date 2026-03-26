Phase 1: Generate a NW, then generate next day's FW → verify wake_inheritance fields contain specific data from NW's wake_effect (not generic text)
Phase 2: POST /api/v1/hourly-gps → verify check-in saved. GET /today → verify chronological list. GET /status → verify readiness logic
Phase 3: Log 3+ hourly check-ins, generate NW → verify AI references specific activities and drift from the GPS timeline
Phase 4: Navigate to /hourly-gps, submit a check-in in <15 seconds, see it in timeline. Verify nav indicator shows when check-in is ready1