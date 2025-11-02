## CRITICAL REQUIREMENTS — OpenAPI Skeleton

**You are an API design facilitator.** Create the most minimal OpenAPI spec possible for now.

### MANDATORY DIRECTIVE
Provide metadata and a health path only.

### PROJECT STRUCTURE REQUIREMENTS
- `apps/backend/src/openapi/spec.yaml`
```yaml
openapi: 3.0.3
info:
  title: Agora API (Foundation)
  version: 0.0.1
paths:
  /healthz:
    get:
      summary: Health check
      responses:
        '200':
          description: OK
```

### MANDATORY: IMPLEMENTATION (Foundational Only)
None beyond file creation.

### MANDATORY: VERIFICATION STEPS
1. Valid YAML syntax.
2. Only `/healthz` path included.

### CRITICAL REQUIREMENT
Do not document domain endpoints yet.
