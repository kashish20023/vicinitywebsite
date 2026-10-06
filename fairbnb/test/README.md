# FairBnB QA Automation & Performance Testing Audit

This directory contains the isolated, evidence-based quality assurance and performance testing framework for the FairBnB project.

## Directory Structure

```
qa-audit/
├── README.md                          <- Framework documentation and rerun guide
├── scripts/
│   ├── generate_coverage_matrix.cjs   <- Route discovery and coverage matrix generator
│   ├── provision_db.cjs               <- Isolated disposable database provisioning script
│   ├── run_test_backend.cjs           <- Test backend process launcher (Port 5010)
│   ├── run_test_frontend.cjs          <- Test frontend process launcher (Port 3010)
│   ├── measure_performance.cjs        <- Warmed API latency & bounded concurrency benchmark
│   ├── measure_frontend_perf.cjs      <- Navigation Timing & Web Vitals measurement
│   └── cleanup_audit.cjs              <- Process teardown & disposable DB drop verification
├── tests/
│   ├── api/
│   │   └── api_test_suite.cjs         <- Automated Phase 2 API functionality & RBAC suite
│   └── browser/
│       └── browser_e2e_suite.cjs      <- Automated Phase 3 Playwright browser E2E journeys
└── runs/
    └── run-20260921-1150/             <- Latest comprehensive audit run
        ├── PLAN.md                    <- Phase execution plan
        ├── ENVIRONMENT.md             <- Port, process, and database environment inventory
        ├── COVERAGE_MATRIX.md         <- End-to-end route, role & API coverage matrix
        ├── JEST_REPORT.md             <- Unit, integration, and compile audit report
        ├── API_REPORT.md              <- API security, RBAC, and business logic audit report
        ├── PLAYWRIGHT_REPORT.md       <- Browser E2E user journey audit report
        ├── PERFORMANCE_REPORT.md      <- Latency, throughput, and web performance report
        ├── BUG_REPORT.md              <- Confirmed defects ranked by severity with repro steps
        ├── CLEANUP_REPORT.md          <- Process teardown and disposable DB drop confirmation
        ├── FINAL_REPORT.md            <- Executive verdict, coverage summary, and recommendations
        ├── CHECKPOINT.md              <- Sequential phase progress checkpoint log
        ├── backend_endpoints.json     <- 211 inventoried backend routes
        ├── frontend_routes.json       <- 81 inventoried frontend pages
        ├── api_test_results.json      <- Machine-readable API test results (38/38 PASS)
        ├── playwright_results.json    <- Machine-readable browser journey results (9/9 PASS)
        ├── performance_data.json      <- Raw latency samples and concurrency data
        └── evidence/                  <- 11 high-resolution browser captures
```

## How to Inspect the Audit Results
- Start with the comprehensive verdict in [`runs/run-20260921-1150/FINAL_REPORT.md`](file:///C:/Users/shubham/fairbnb--new/qa-audit/runs/run-20260921-1150/FINAL_REPORT.md).
- Inspect confirmed defects and recommended fixes in [`runs/run-20260921-1150/BUG_REPORT.md`](file:///C:/Users/shubham/fairbnb--new/qa-audit/runs/run-20260921-1150/BUG_REPORT.md).
- Review the complete feature-to-API matrix in [`runs/run-20260921-1150/COVERAGE_MATRIX.md`](file:///C:/Users/shubham/fairbnb--new/qa-audit/runs/run-20260921-1150/COVERAGE_MATRIX.md).
- View browser screenshots in [`runs/run-20260921-1150/evidence/`](file:///C:/Users/shubham/fairbnb--new/qa-audit/runs/run-20260921-1150/evidence/).
